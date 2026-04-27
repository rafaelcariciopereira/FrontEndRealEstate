'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Imovel } from '@/lib/types';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Corretora {
  nome: string;
  quantidade: number;
}

interface ImobiliariaFilterProps {
  imoveis: Imovel[];
  anunciantesAtivos: string[] | null;
  onChange: (novoEstado: string[] | null) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u0300-\u036f]/g, '');
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Chip({ nome, onRemove }: { nome: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium transition hover:bg-blue-100">
      {nome}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="ml-0.5 hover:text-blue-900 transition"
        aria-label={`Remover ${nome}`}
      >
        ✕
      </button>
    </span>
  );
}

function SelectedChips({
  selecionadas,
  onRemove,
  maxVisible = Infinity,
}: {
  selecionadas: Corretora[];
  onRemove: (nome: string) => void;
  maxVisible?: number;
}) {
  if (selecionadas.length === 0) return null;
  const visible = selecionadas.slice(0, maxVisible);
  const overflow = selecionadas.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(c => (
        <Chip key={c.nome} nome={c.nome} onRemove={() => onRemove(c.nome)} />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">
          +{overflow} mais
        </span>
      )}
    </div>
  );
}

function ImobiliariaItem({
  corretora,
  checked,
  onToggle,
}: {
  corretora: Corretora;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition select-none ${
        checked ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
      }`}
      onClick={onToggle}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        onClick={e => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer flex-shrink-0"
      />
      <span className={`text-sm flex-1 truncate ${checked ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
        {corretora.nome}
      </span>
      <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">({corretora.quantidade})</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function ImobiliariaFilter({
  imoveis,
  anunciantesAtivos,
  onChange,
}: ImobiliariaFilterProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buscaDebounced = useDebounce(busca, 250);

  /* Compute corretoras with quantity, sorted by count desc */
  const corretoras = useMemo<Corretora[]>(() => {
    const contagem: Record<string, number> = {};
    for (const i of imoveis) {
      if (i.anunciante_nome) {
        contagem[i.anunciante_nome] = (contagem[i.anunciante_nome] ?? 0) + 1;
      }
    }
    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [imoveis]);

  /* Whether a corretora is actively selected (exclude-mode: not in exclusion list) */
  const isChecked = useCallback(
    (nome: string) => anunciantesAtivos === null || !anunciantesAtivos.includes(nome),
    [anunciantesAtivos],
  );

  /*
   * Toggle logic (exclude-mode):
   *   null      → click X  → [X]       (start exclusion list with this item)
   *   [X]       → click X  → null      (removing last exclusion resets to "all")
   *   [X, Y]    → click X  → [Y]       (un-exclude X)
   *   [X]       → click Y  → [X, Y]    (also exclude Y)
   */
  const toggle = useCallback(
    (nome: string) => {
      if (anunciantesAtivos === null) {
        onChange([nome]);
      } else if (anunciantesAtivos.includes(nome)) {
        const novas = anunciantesAtivos.filter(n => n !== nome);
        onChange(novas.length === 0 ? null : novas);
      } else {
        onChange([...anunciantesAtivos, nome]);
      }
    },
    [anunciantesAtivos, onChange],
  );

  /* Corretoras shown as chips = the excluded ones (so user can re-include them) */
  const selecionadas = useMemo<Corretora[]>(() => {
    if (anunciantesAtivos === null) return [];
    return corretoras.filter(c => anunciantesAtivos.includes(c.nome));
  }, [corretoras, anunciantesAtivos]);

  /* Top 10 by quantity */
  const top10 = useMemo(() => corretoras.slice(0, 10), [corretoras]);

  /* Search-filtered list */
  const filtradas = useMemo<Corretora[]>(() => {
    if (!buscaDebounced.trim()) return corretoras;
    const q = normalize(buscaDebounced.trim());
    return corretoras.filter(c => normalize(c.nome).includes(q));
  }, [corretoras, buscaDebounced]);

  /* Grouped A-Z from filtered list */
  const grouped = useMemo<{ letter: string; items: Corretora[] }[]>(() => {
    const sorted = [...filtradas].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR'),
    );
    const map: Record<string, Corretora[]> = {};
    for (const c of sorted) {
      const letter = c.nome[0]?.toUpperCase() ?? '#';
      if (!map[letter]) map[letter] = [];
      map[letter].push(c);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, items]) => ({ letter, items }));
  }, [filtradas]);

  /* Close on ESC */
  useEffect(() => {
    if (!modalAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalAberto]);

  /* Prevent body scroll while modal is open */
  useEffect(() => {
    if (modalAberto) {
      document.body.style.overflow = 'hidden';
      // Focus search input after mount
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setBusca('');
      setVerTodas(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalAberto]);

  const isSearching = buscaDebounced.trim().length > 0;
  const showGrouped = verTodas || isSearching;
  const hasFilter = anunciantesAtivos !== null;

  if (corretoras.length === 0) return null;

  const ativos = hasFilter ? corretoras.length - anunciantesAtivos!.length : corretoras.length;
  const buttonLabel = hasFilter
    ? `${ativos} de ${corretoras.length} exibidas`
    : 'Selecionar imobiliárias';

  return (
    <div className="col-span-full">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Corretoras</p>

      <div className="flex flex-wrap items-center gap-2">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition font-medium ${
            hasFilter
              ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
              : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {buttonLabel}
          {hasFilter && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
        </button>

        {/* Chips outside modal (compact, max 5) */}
        {selecionadas.length > 0 && (
          <SelectedChips selecionadas={selecionadas} onRemove={toggle} maxVisible={5} />
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalAberto && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === overlayRef.current) setModalAberto(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(85vh, 640px)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-base font-semibold text-slate-800">Selecionar imobiliárias</h2>
              <div className="flex items-center gap-3">
                {hasFilter && (
                  <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="text-xs text-slate-500 hover:text-red-600 transition"
                  >
                    Limpar seleção
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400"
                  aria-label="Fechar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chips inside modal */}
            {selecionadas.length > 0 && (
              <div className="px-5 pt-3 flex-shrink-0">
                <SelectedChips selecionadas={selecionadas} onRemove={toggle} />
              </div>
            )}

            {/* Search input */}
            <div className="px-5 pt-3 pb-2 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar imobiliária..."
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setVerTodas(false); }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
              {!showGrouped ? (
                /* ── Top 10 view ──────────────────────────────────────────── */
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 sticky top-0 bg-white">
                    Mais relevantes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                    {top10.map(c => (
                      <ImobiliariaItem
                        key={c.nome}
                        corretora={c}
                        checked={isChecked(c.nome)}
                        onToggle={() => toggle(c.nome)}
                      />
                    ))}
                  </div>

                  {corretoras.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setVerTodas(true)}
                      className="mt-3 w-full py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition border border-dashed border-blue-200"
                    >
                      Ver todas ({corretoras.length})
                    </button>
                  )}
                </>
              ) : (
                /* ── A–Z grouped view ─────────────────────────────────────── */
                <>
                  {isSearching && filtradas.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-10">
                      Nenhuma imobiliária encontrada
                    </p>
                  )}

                  {grouped.map(({ letter, items }) => (
                    <div key={letter} className="mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5 sticky top-0 bg-white">
                        {letter}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                        {items.map(c => (
                          <ImobiliariaItem
                            key={c.nome}
                            corretora={c}
                            checked={isChecked(c.nome)}
                            onToggle={() => toggle(c.nome)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-400">
                {hasFilter
                  ? `${ativos} de ${corretoras.length} exibidas`
                  : `${corretoras.length} corretoras disponíveis`}
              </span>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-5 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

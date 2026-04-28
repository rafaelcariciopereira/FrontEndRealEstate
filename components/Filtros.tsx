'use client';

import { useState } from 'react';
import { Imovel, FiltrosState, OrdemType, ScorePesos, SCORE_PESOS_PADRAO } from '@/lib/types';
import ImobiliariaFilter from './ImobiliariaFilter';

interface FiltrosProps {
  imoveis: Imovel[];
  filtros: FiltrosState;
  ordem: OrdemType;
  onFiltros: (f: FiltrosState) => void;
  onOrdem: (o: OrdemType) => void;
  totalFiltrados: number;
  scorePesos: ScorePesos;
  onScorePesos: (p: ScorePesos) => void;
  acimaDaMedia: number;
  abaixoDaMedia: number;
}

const TIPOS = ['Apartamento', 'Casa', 'Studio', 'Kitnet', 'Cobertura', 'Outro'];

export default function Filtros({
  imoveis, filtros, ordem, onFiltros, onOrdem, totalFiltrados,
  scorePesos, onScorePesos, acimaDaMedia, abaixoDaMedia,
}: FiltrosProps) {
  const [aberto, setAberto] = useState(true);
  const [pesosAberto, setPesosAberto] = useState(true);

  const bairros = Array.from(new Set(imoveis.map(i => i._bairro).filter(Boolean))).sort();
  const ruas = Array.from(new Set(
    imoveis
      .filter(i => !filtros.bairro || i._bairro === filtros.bairro)
      .map(i => i._rua)
      .filter(Boolean)
  )).sort();
  const tiposAnunciante = Array.from(
    new Set(imoveis.map(i => i.anunciante_tipo).filter(Boolean))
  ).sort() as string[];

  function set(key: keyof FiltrosState, value: string | number) {
    const next = { ...filtros, [key]: value };
    if (key === 'bairro') next.rua = '';
    onFiltros(next);
  }

  function limparFiltros() {
    onFiltros({
      bairro: '', rua: '', tipo: '', quartosMin: 0,
      precoMin: '', precoMax: '', pm2Max: '', status: 'todos',
      anuncianteTipo: '', cep: '', anunciantesAtivos: null,
      desvioMin: '', desvioMax: '',
    });
  }

  function setPeso(key: keyof ScorePesos, raw: string) {
    const v = Math.max(0, Math.min(10, parseInt(raw) || 0));
    onScorePesos({ ...scorePesos, [key]: v });
  }

  const temFiltroAtivo = !!(
    filtros.bairro || filtros.rua || filtros.tipo ||
    filtros.quartosMin > 0 || filtros.precoMin || filtros.precoMax ||
    filtros.pm2Max || filtros.status !== 'todos' ||
    filtros.anuncianteTipo || filtros.cep || filtros.anunciantesAtivos !== null ||
    filtros.desvioMin !== '' || filtros.desvioMax !== ''
  );

  const scoreMaximo = scorePesos.diasMercado + scorePesos.particular + scorePesos.anuncioFraco;

  const ordens: { key: OrdemType; label: string }[] = [
    { key: 'menor_preco', label: 'Menor preço' },
    { key: 'maior_preco', label: 'Maior preço' },
    { key: 'menor_pm2', label: 'Menor R$/m²' },
    { key: 'mais_antigo', label: 'Mais antigo' },
    { key: 'mais_recente', label: 'Mais recente' },
    { key: 'maior_score', label: '↑ Maior score' },
    { key: 'menor_desvio', label: '▼ Mais barato vs. média' },
  ];

  const inputCls = 'w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls = inputCls + ' bg-white';
  const activeBadge = (active: boolean) =>
    active ? 'border-blue-400 bg-blue-50' : '';

  return (
    <div className="space-y-3">
      {/* ── Painel de Pesos ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setPesosAberto(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
          aria-expanded={pesosAberto}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              Pesos do Score
            </span>
            <span className="text-xs text-slate-400">
              Máximo atual: <strong className="text-slate-600">{scoreMaximo} pts</strong>
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${pesosAberto ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {pesosAberto && (
          <div className="border-t border-slate-100 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dias no mercado */}
              <div>
                <label
                  htmlFor="peso-dias"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Dias no mercado &gt;60
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="peso-dias"
                    type="number"
                    min={0}
                    max={10}
                    value={scorePesos.diasMercado}
                    onChange={e => setPeso('diasMercado', e.target.value)}
                    className="w-20 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-xs text-slate-400">pontos (0–10)</span>
                </div>
              </div>

              {/* Particular */}
              <div>
                <label
                  htmlFor="peso-particular"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Anunciante particular
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="peso-particular"
                    type="number"
                    min={0}
                    max={10}
                    value={scorePesos.particular}
                    onChange={e => setPeso('particular', e.target.value)}
                    className="w-20 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-xs text-slate-400">pontos (0–10)</span>
                </div>
              </div>

              {/* Anúncio fraco */}
              <div>
                <label
                  htmlFor="peso-fraco"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Anúncio fraco
                  <span className="ml-1 text-slate-400 font-normal">(sem foto ou descrição curta)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="peso-fraco"
                    type="number"
                    min={0}
                    max={10}
                    value={scorePesos.anuncioFraco}
                    onChange={e => setPeso('anuncioFraco', e.target.value)}
                    className="w-20 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-xs text-slate-400">pontos (0–10)</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Score máximo possível: <strong className="text-slate-600">{scoreMaximo} pts</strong>
              </p>
              {JSON.stringify(scorePesos) !== JSON.stringify(SCORE_PESOS_PADRAO) && (
                <button
                  onClick={() => onScorePesos(SCORE_PESOS_PADRAO)}
                  className="text-xs text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restaurar padrão
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setAberto(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
          aria-expanded={aberto}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              Filtros
              {temFiltroAtivo && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">ativos</span>
              )}
            </span>
            <span className="text-xs text-slate-400">
              {totalFiltrados.toLocaleString('pt-BR')} resultados
              {acimaDaMedia > 0 && (
                <span className="ml-1 text-amber-500">· ▲ {acimaDaMedia}</span>
              )}
              {abaixoDaMedia > 0 && (
                <span className="ml-1 text-green-600">· ▼ {abaixoDaMedia}</span>
              )}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {aberto && (
          <div className="border-t border-slate-100 p-4 space-y-4">
            {/* Ordenação */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ordenar por</p>
              <div className="flex flex-wrap gap-1.5">
                {ordens.map(o => (
                  <button
                    key={o.key}
                    onClick={() => onOrdem(o.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      ordem === o.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {/* Bairro */}
              <div>
                <label htmlFor="filtro-bairro" className={`block text-xs font-medium mb-1 ${filtros.bairro ? 'text-blue-600' : 'text-slate-600'}`}>
                  Bairro{filtros.bairro && ' ●'}
                </label>
                <select
                  id="filtro-bairro"
                  value={filtros.bairro}
                  onChange={e => set('bairro', e.target.value)}
                  className={`${selectCls} ${activeBadge(!!filtros.bairro)}`}
                >
                  <option value="">Todos</option>
                  {bairros.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Rua */}
              <div>
                <label htmlFor="filtro-rua" className={`block text-xs font-medium mb-1 ${filtros.rua ? 'text-blue-600' : 'text-slate-600'}`}>
                  Rua{filtros.rua && ' ●'}
                </label>
                <select
                  id="filtro-rua"
                  value={filtros.rua}
                  onChange={e => set('rua', e.target.value)}
                  className={`${selectCls} ${activeBadge(!!filtros.rua)}`}
                >
                  <option value="">Todas</option>
                  {ruas.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label htmlFor="filtro-tipo" className={`block text-xs font-medium mb-1 ${filtros.tipo ? 'text-blue-600' : 'text-slate-600'}`}>
                  Tipo{filtros.tipo && ' ●'}
                </label>
                <select
                  id="filtro-tipo"
                  value={filtros.tipo}
                  onChange={e => set('tipo', e.target.value)}
                  className={`${selectCls} ${activeBadge(!!filtros.tipo)}`}
                >
                  <option value="">Todos</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Quartos mínimo */}
              <div>
                <label htmlFor="filtro-quartos" className={`block text-xs font-medium mb-1 ${filtros.quartosMin > 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                  Quartos mín.{filtros.quartosMin > 0 && ' ●'}
                </label>
                <select
                  id="filtro-quartos"
                  value={filtros.quartosMin}
                  onChange={e => set('quartosMin', parseInt(e.target.value))}
                  className={`${selectCls} ${activeBadge(filtros.quartosMin > 0)}`}
                >
                  <option value={0}>Qualquer</option>
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={3}>3+</option>
                  <option value={4}>4+</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="filtro-status" className={`block text-xs font-medium mb-1 ${filtros.status !== 'todos' ? 'text-blue-600' : 'text-slate-600'}`}>
                  Status{filtros.status !== 'todos' && ' ●'}
                </label>
                <select
                  id="filtro-status"
                  value={filtros.status}
                  onChange={e => set('status', e.target.value)}
                  className={`${selectCls} ${activeBadge(filtros.status !== 'todos')}`}
                >
                  <option value="todos">Todos</option>
                  <option value="novo">Novo (≤7 dias)</option>
                  <option value="ativo">Ativo (8–30 dias)</option>
                  <option value="desatualizado">Desatualizado (31–60 dias)</option>
                  <option value="encalhado">Encalhado (&gt;60 dias)</option>
                  <option value="suspeito">Atualização suspeita</option>
                </select>
              </div>

              {/* Preço mínimo */}
              <div>
                <label htmlFor="filtro-preco-min" className={`block text-xs font-medium mb-1 ${filtros.precoMin ? 'text-blue-600' : 'text-slate-600'}`}>
                  Preço mín. (R$){filtros.precoMin && ' ●'}
                </label>
                <input
                  id="filtro-preco-min"
                  type="number"
                  placeholder="Ex: 200000"
                  value={filtros.precoMin}
                  onChange={e => set('precoMin', e.target.value)}
                  className={`${inputCls} ${activeBadge(!!filtros.precoMin)}`}
                />
              </div>

              {/* Preço máximo */}
              <div>
                <label htmlFor="filtro-preco-max" className={`block text-xs font-medium mb-1 ${filtros.precoMax ? 'text-blue-600' : 'text-slate-600'}`}>
                  Preço máx. (R$){filtros.precoMax && ' ●'}
                </label>
                <input
                  id="filtro-preco-max"
                  type="number"
                  placeholder="Ex: 500000"
                  value={filtros.precoMax}
                  onChange={e => set('precoMax', e.target.value)}
                  className={`${inputCls} ${activeBadge(!!filtros.precoMax)}`}
                />
              </div>

              {/* R$/m² máximo */}
              <div>
                <label htmlFor="filtro-pm2" className={`block text-xs font-medium mb-1 ${filtros.pm2Max ? 'text-blue-600' : 'text-slate-600'}`}>
                  R$/m² máx.{filtros.pm2Max && ' ●'}
                </label>
                <input
                  id="filtro-pm2"
                  type="number"
                  placeholder="Ex: 8000"
                  value={filtros.pm2Max}
                  onChange={e => set('pm2Max', e.target.value)}
                  className={`${inputCls} ${activeBadge(!!filtros.pm2Max)}`}
                />
              </div>

              {/* Desvio mínimo */}
              <div>
                <label htmlFor="filtro-desvio-min" className={`block text-xs font-medium mb-1 ${filtros.desvioMin !== '' ? 'text-blue-600' : 'text-slate-600'}`}>
                  Desvio mín. (%){filtros.desvioMin !== '' && ' ●'}
                </label>
                <input
                  id="filtro-desvio-min"
                  type="number"
                  placeholder="-20 (abaixo)"
                  value={filtros.desvioMin}
                  onChange={e => set('desvioMin', e.target.value)}
                  className={`${inputCls} ${activeBadge(filtros.desvioMin !== '')}`}
                />
              </div>

              {/* Desvio máximo */}
              <div>
                <label htmlFor="filtro-desvio-max" className={`block text-xs font-medium mb-1 ${filtros.desvioMax !== '' ? 'text-blue-600' : 'text-slate-600'}`}>
                  Desvio máx. (%){filtros.desvioMax !== '' && ' ●'}
                </label>
                <input
                  id="filtro-desvio-max"
                  type="number"
                  placeholder="+30 (acima)"
                  value={filtros.desvioMax}
                  onChange={e => set('desvioMax', e.target.value)}
                  className={`${inputCls} ${activeBadge(filtros.desvioMax !== '')}`}
                />
              </div>

              {/* Anunciante tipo */}
              {tiposAnunciante.length > 0 && (
                <div>
                  <label htmlFor="filtro-anunciante" className={`block text-xs font-medium mb-1 ${filtros.anuncianteTipo ? 'text-blue-600' : 'text-slate-600'}`}>
                    Anunciante{filtros.anuncianteTipo && ' ●'}
                  </label>
                  <select
                    id="filtro-anunciante"
                    value={filtros.anuncianteTipo}
                    onChange={e => set('anuncianteTipo', e.target.value)}
                    className={`${selectCls} ${activeBadge(!!filtros.anuncianteTipo)}`}
                  >
                    <option value="">Todos</option>
                    {tiposAnunciante.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {/* CEP */}
              <div>
                <label htmlFor="filtro-cep" className={`block text-xs font-medium mb-1 ${filtros.cep ? 'text-blue-600' : 'text-slate-600'}`}>
                  CEP (prefixo){filtros.cep && ' ●'}
                </label>
                <input
                  id="filtro-cep"
                  type="text"
                  placeholder="Ex: 22041"
                  value={filtros.cep}
                  onChange={e => set('cep', e.target.value)}
                  className={`${inputCls} ${activeBadge(!!filtros.cep)}`}
                />
              </div>
            </div>

            {/* Corretoras */}
            <ImobiliariaFilter
              imoveis={imoveis}
              anunciantesAtivos={filtros.anunciantesAtivos}
              onChange={novoEstado => onFiltros({ ...filtros, anunciantesAtivos: novoEstado })}
            />

            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

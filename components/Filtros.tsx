'use client';

import { useState } from 'react';
import { Imovel, FiltrosState, OrdemType } from '@/lib/types';
import ImobiliariaFilter from './ImobiliariaFilter';

interface FiltrosProps {
  imoveis: Imovel[];
  filtros: FiltrosState;
  ordem: OrdemType;
  onFiltros: (f: FiltrosState) => void;
  onOrdem: (o: OrdemType) => void;
  totalFiltrados: number;
}

const TIPOS = ['Apartamento', 'Casa', 'Studio', 'Kitnet', 'Cobertura', 'Outro'];

export default function Filtros({ imoveis, filtros, ordem, onFiltros, onOrdem, totalFiltrados }: FiltrosProps) {
  const [aberto, setAberto] = useState(true);

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
    });
  }

  const temFiltroAtivo = filtros.bairro || filtros.rua || filtros.tipo ||
    filtros.quartosMin > 0 || filtros.precoMin || filtros.precoMax ||
    filtros.pm2Max || filtros.status !== 'todos' ||
    filtros.anuncianteTipo || filtros.cep || filtros.anunciantesAtivos !== null;

  const ordens: { key: OrdemType; label: string }[] = [
    { key: 'menor_preco', label: 'Menor preço' },
    { key: 'maior_preco', label: 'Maior preço' },
    { key: 'menor_pm2', label: 'Menor R$/m²' },
    { key: 'mais_antigo', label: 'Mais antigo' },
    { key: 'mais_recente', label: 'Mais recente' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
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
          <span className="text-xs text-slate-400">{totalFiltrados.toLocaleString('pt-BR')} resultados</span>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
              <select
                value={filtros.bairro}
                onChange={e => set('bairro', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos</option>
                {bairros.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Rua */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rua</label>
              <select
                value={filtros.rua}
                onChange={e => set('rua', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todas</option>
                {ruas.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={e => set('tipo', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Quartos mínimo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quartos mín.</label>
              <select
                value={filtros.quartosMin}
                onChange={e => set('quartosMin', parseInt(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={filtros.status}
                onChange={e => set('status', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Preço mín. (R$)</label>
              <input
                type="number"
                placeholder="Ex: 200000"
                value={filtros.precoMin}
                onChange={e => set('precoMin', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preço máximo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preço máx. (R$)</label>
              <input
                type="number"
                placeholder="Ex: 500000"
                value={filtros.precoMax}
                onChange={e => set('precoMax', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* R$/m² máximo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">R$/m² máx.</label>
              <input
                type="number"
                placeholder="Ex: 8000"
                value={filtros.pm2Max}
                onChange={e => set('pm2Max', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Anunciante tipo */}
            {tiposAnunciante.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Anunciante</label>
                <select
                  value={filtros.anuncianteTipo}
                  onChange={e => set('anuncianteTipo', e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todos</option>
                  {tiposAnunciante.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {/* CEP */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CEP (prefixo)</label>
              <input
                type="text"
                placeholder="Ex: 22041"
                value={filtros.cep}
                onChange={e => set('cep', e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  );
}

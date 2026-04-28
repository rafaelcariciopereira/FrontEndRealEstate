'use client';

import { useMemo } from 'react';
import { Imovel, FiltrosState, OrdemType } from '@/lib/types';

interface TabelaImoveisProps {
  imoveis: Imovel[];   // já filtrado e ordenado
  filtros: FiltrosState;
  onFiltros: (f: FiltrosState) => void;
  ordem: OrdemType;
  onOrdem: (o: OrdemType) => void;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR');
}

function fmtMoeda(n: number) {
  if (n <= 0) return '—';
  return `R$ ${fmt(n)}`;
}

function fmtData(iso: string) {
  if (!iso || iso.startsWith('1970')) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group inline-block">
      {children}
      <div
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

// ── Column sort header ──────────────────────────────────────────────────────

interface SortHeaderProps {
  label: string;
  ascKey: OrdemType;
  descKey?: OrdemType;
  currentOrdem: OrdemType;
  onOrdem: (o: OrdemType) => void;
  className?: string;
}

function SortHeader({ label, ascKey, descKey, currentOrdem, onOrdem, className = '' }: SortHeaderProps) {
  const isAsc = currentOrdem === ascKey;
  const isDesc = descKey ? currentOrdem === descKey : false;
  const isActive = isAsc || isDesc;

  function handleClick() {
    if (isAsc && descKey) {
      onOrdem(descKey);
    } else if (isDesc) {
      onOrdem(ascKey);
    } else {
      onOrdem(ascKey);
    }
  }

  const indicator = isAsc ? '↑' : isDesc ? '↓' : '↕';

  return (
    <th scope="col" className={`px-3 py-3 text-left ${className}`}>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition ${
          isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {label}
        <span className={`text-sm leading-none ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>
          {indicator}
        </span>
      </button>
    </th>
  );
}

// ── Status chip ─────────────────────────────────────────────────────────────

function StatusChip({
  imovel,
  onFiltros,
  filtros,
}: {
  imovel: Imovel;
  onFiltros: (f: FiltrosState) => void;
  filtros: FiltrosState;
}) {
  const chips: React.ReactNode[] = [];

  const statusCor: Record<string, string> = {
    novo: 'bg-green-100 text-green-700 hover:bg-green-200',
    ativo: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    desatualizado: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    encalhado: 'bg-red-100 text-red-700 hover:bg-red-200',
  };

  function setStatus(s: FiltrosState['status']) {
    onFiltros({ ...filtros, status: filtros.status === s ? 'todos' : s });
  }

  chips.push(
    <button
      key="status"
      onClick={() => setStatus(imovel._status)}
      title={`Filtrar por: ${imovel._status}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition cursor-pointer ${
        statusCor[imovel._status] ?? 'bg-slate-100 text-slate-500'
      } ${filtros.status === imovel._status ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
    >
      {imovel._status}
    </button>
  );

  if (imovel._atualizacaoSuspeita) {
    chips.push(
      <button
        key="suspeito"
        onClick={() => setStatus('suspeito')}
        title="Filtrar por: atualização suspeita"
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200 ${
          filtros.status === 'suspeito' ? 'ring-2 ring-offset-1 ring-blue-400' : ''
        }`}
      >
        suspeito
      </button>
    );
  }

  if (imovel.anunciante_tipo?.toLowerCase() === 'particular') {
    chips.push(
      <button
        key="particular"
        onClick={() => onFiltros({
          ...filtros,
          anuncianteTipo: filtros.anuncianteTipo === 'Particular' ? '' : 'Particular',
        })}
        title="Filtrar por: Particular"
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200 ${
          filtros.anuncianteTipo === 'Particular' ? 'ring-2 ring-offset-1 ring-blue-400' : ''
        }`}
      >
        particular
      </button>
    );
  }

  return <div className="flex flex-wrap gap-1">{chips}</div>;
}

// ── Desvio cell ─────────────────────────────────────────────────────────────

function DesvioCell({ imovel }: { imovel: Imovel }) {
  const d = imovel._desvio;
  if (d == null) {
    return <span className="text-slate-300 text-xs">—</span>;
  }

  const abs = Math.abs(d.desvioPct);
  const neutro = abs <= 5;
  const tooltipText = `Média do grupo: ${fmtMoeda(d.mediaPm2)}/m² · Este imóvel: ${fmtMoeda(imovel._pm2)}/m²`;

  if (neutro) {
    return (
      <Tooltip content={tooltipText}>
        <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 cursor-help">
          ≈ na média
        </span>
      </Tooltip>
    );
  }

  if (d.desvioPct < 0) {
    return (
      <Tooltip content={tooltipText}>
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600 cursor-help">
          ▼ {abs}%
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={tooltipText}>
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600 cursor-help">
        ▲ {abs}%
      </span>
    </Tooltip>
  );
}

// ── Score cell ───────────────────────────────────────────────────────────────

function ScoreCell({ imovel }: { imovel: Imovel }) {
  const bd = imovel._scoreBreakdown;
  if (!bd) return <span className="text-slate-300 text-xs">—</span>;

  const lines = [
    `Dias: ${bd.diasMercado}pts`,
    `Particular: ${bd.particular}pts`,
    `Anúncio fraco: ${bd.anuncioFraco}pts`,
  ].join(' · ');

  const cor =
    bd.total >= bd.maximo * 0.66 && bd.maximo > 0
      ? 'text-red-600 font-bold'
      : bd.total > 0
        ? 'text-amber-600 font-semibold'
        : 'text-slate-400';

  return (
    <Tooltip content={lines}>
      <span
        key={bd.total}
        className={`score-updated tabular-nums text-sm cursor-help ${cor}`}
      >
        {bd.total}/{bd.maximo}
      </span>
    </Tooltip>
  );
}

// ── Main table ───────────────────────────────────────────────────────────────

export default function TabelaImoveis({
  imoveis,
  filtros,
  onFiltros,
  ordem,
  onOrdem,
}: TabelaImoveisProps) {
  const maxScore = useMemo(
    () => (imoveis.length > 0 ? Math.max(...imoveis.map(i => i._scoreBreakdown?.total ?? 0)) : 0),
    [imoveis],
  );

  if (imoveis.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" role="table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {/* Imóvel — sticky on mobile */}
              <th
                scope="col"
                className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[220px]"
              >
                Imóvel
              </th>

              <SortHeader
                label="Score"
                ascKey="maior_score"
                currentOrdem={ordem}
                onOrdem={onOrdem}
                className="min-w-[80px]"
              />

              <SortHeader
                label="Preço"
                ascKey="menor_preco"
                descKey="maior_preco"
                currentOrdem={ordem}
                onOrdem={onOrdem}
                className="min-w-[120px]"
              />

              <SortHeader
                label="R$/m²"
                ascKey="menor_pm2"
                currentOrdem={ordem}
                onOrdem={onOrdem}
                className="min-w-[100px]"
              />

              <SortHeader
                label="Desvio"
                ascKey="menor_desvio"
                currentOrdem={ordem}
                onOrdem={onOrdem}
                className="min-w-[100px]"
              />

              <SortHeader
                label="Dias"
                ascKey="mais_antigo"
                descKey="mais_recente"
                currentOrdem={ordem}
                onOrdem={onOrdem}
                className="min-w-[80px]"
              />

              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[180px]">
                Sinais
              </th>

              <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[60px]">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {imoveis.map((imovel, idx) => {
              const isTop = maxScore > 0 && imovel._scoreBreakdown?.total === maxScore;
              const isEven = idx % 2 === 0;

              const rowCls = isTop
                ? 'bg-blue-50 hover:bg-blue-100'
                : isEven
                  ? 'bg-white hover:bg-slate-50'
                  : 'bg-slate-50/50 hover:bg-slate-100/60';

              return (
                <tr
                  key={imovel._id}
                  className={`border-b border-slate-100 transition-colors ${rowCls}`}
                >
                  {/* Imóvel — sticky on mobile */}
                  <td className="sticky left-0 z-10 px-3 py-3 bg-inherit">
                    <div className="max-w-[280px]">
                      <p className="font-medium text-slate-800 text-xs leading-snug line-clamp-2 mb-0.5">
                        {imovel.titulo || 'Sem título'}
                        {isTop && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold align-middle">
                            TOP
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {imovel._bairro}
                        {imovel._tipo ? ` · ${imovel._tipo}` : ''}
                      </p>
                      {imovel._area > 0 && (
                        <p className="text-xs text-slate-400">{imovel._area}m² · {imovel.quartos || '—'} qtos</p>
                      )}
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-3 py-3">
                    <ScoreCell imovel={imovel} />
                  </td>

                  {/* Preço */}
                  <td className="px-3 py-3 tabular-nums">
                    <p className="font-semibold text-slate-800 text-xs">
                      {imovel._preco > 0 ? fmtMoeda(imovel._preco) : '—'}
                    </p>
                  </td>

                  {/* R$/m² */}
                  <td className="px-3 py-3 tabular-nums">
                    <p className="text-xs text-slate-600">
                      {imovel._pm2 > 0 ? fmtMoeda(imovel._pm2) : '—'}
                    </p>
                  </td>

                  {/* Desvio */}
                  <td className="px-3 py-3">
                    <DesvioCell imovel={imovel} />
                  </td>

                  {/* Dias */}
                  <td className="px-3 py-3 tabular-nums">
                    <p className={`text-xs font-medium ${imovel._idadeDias > 60 ? 'text-red-600' : imovel._idadeDias > 30 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {imovel._idadeDias}d
                    </p>
                    <p className="text-[10px] text-slate-400">{fmtData(imovel._dataCriacao)}</p>
                  </td>

                  {/* Sinais */}
                  <td className="px-3 py-3">
                    <StatusChip imovel={imovel} filtros={filtros} onFiltros={onFiltros} />
                  </td>

                  {/* Link */}
                  <td className="px-3 py-3">
                    {imovel.url ? (
                      <a
                        href={imovel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver anúncio original"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver
                      </a>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
        <span>{imoveis.length.toLocaleString('pt-BR')} imóveis exibidos</span>
        <span className="text-[10px]">
          Clique nos cabeçalhos para ordenar · Clique nas tags para filtrar
        </span>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Imovel } from '@/lib/types';

interface ImovelCardProps {
  imovel: Imovel;
  destaque?: boolean;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR');
}

function fmtMoeda(n: number) {
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

function StatusBadge({ imovel }: { imovel: Imovel }) {
  const badges: React.ReactNode[] = [];

  switch (imovel._status) {
    case 'novo':
      badges.push(
        <span key="status" className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Novo
        </span>
      );
      break;
    case 'ativo':
      badges.push(
        <span key="status" className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Ativo
        </span>
      );
      break;
    case 'desatualizado':
      badges.push(
        <span key="status" className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Desatualizado
        </span>
      );
      break;
    case 'encalhado':
      badges.push(
        <span key="status" className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Encalhado · {imovel._idadeDias} dias
        </span>
      );
      break;
  }

  if (imovel._atualizacaoSuspeita) {
    badges.push(
      <span key="suspeito" className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Atualização suspeita
      </span>
    );
  }

  return <>{badges}</>;
}

function ScoreBadge({ imovel }: { imovel: Imovel }) {
  const bd = imovel._scoreBreakdown;
  if (!bd || bd.maximo === 0) return null;

  const tooltipLines = [
    bd.diasMercado > 0 ? `Dias no mercado: ${bd.diasMercado}pts` : null,
    bd.particular > 0 ? `Particular: ${bd.particular}pts` : null,
    bd.anuncioFraco > 0 ? `Anúncio fraco: ${bd.anuncioFraco}pts` : null,
  ].filter(Boolean).join(' · ') || 'Sem pontos';

  const cor =
    bd.total >= bd.maximo * 0.66
      ? 'bg-red-100 text-red-700 border-red-200'
      : bd.total > 0
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <span
      title={`Score: ${bd.total}/${bd.maximo} pts · ${tooltipLines}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border cursor-help ${cor}`}
    >
      ★ {bd.total}/{bd.maximo}
    </span>
  );
}

function DeSvioBadge({ imovel }: { imovel: Imovel }) {
  const d = imovel._desvio;
  if (d == null) return null;

  const abs = Math.abs(d.desvioPct);
  const neutro = abs <= 5;

  const tooltip = `Média do grupo: ${fmtMoeda(d.mediaPm2)}/m² · Este imóvel: ${fmtMoeda(imovel._pm2)}/m²`;

  if (neutro) {
    return (
      <span
        title={tooltip}
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-medium cursor-help"
      >
        ≈ na média
      </span>
    );
  }

  if (d.desvioPct < 0) {
    return (
      <span
        title={tooltip}
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium cursor-help"
      >
        ▼ {abs}% abaixo
      </span>
    );
  }

  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-medium cursor-help"
    >
      ▲ {abs}% acima
    </span>
  );
}

export default function ImovelCard({ imovel, destaque }: ImovelCardProps) {
  const [descricaoAberta, setDescricaoAberta] = useState(false);
  const [imgError, setImgError] = useState(false);

  const temAnunciante = !!(imovel.anunciante_nome || imovel.anunciante_tipo);

  return (
    <article
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition hover:shadow-md ${
        destaque
          ? 'border-green-400 ring-2 ring-green-200'
          : 'border-slate-200'
      }`}
    >
      {/* Foto */}
      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
        {imovel.foto_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imovel.foto_url}
            alt={imovel.titulo}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <StatusBadge imovel={imovel} />
          {destaque && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded-full text-xs font-medium">
              Melhor R$/m²
            </span>
          )}
          <ScoreBadge imovel={imovel} />
          <DeSvioBadge imovel={imovel} />
        </div>

        {/* Título */}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">
          {imovel.titulo || 'Sem título'}
        </h3>

        {/* Endereço */}
        <p className="text-xs text-slate-500 mb-1">
          {imovel._rua || imovel.endereco}
          {imovel._bairro ? ` · ${imovel._bairro}` : ''}
        </p>
        {imovel._cep && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 bg-slate-100 text-slate-600 rounded text-xs font-mono font-medium">
            CEP {imovel._cep}
          </span>
        )}

        {/* Preço */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xl font-bold text-slate-900">
              {imovel._preco > 0 ? fmtMoeda(imovel._preco) : imovel.preco || '—'}
            </p>
            {imovel._pm2 > 0 && (
              <p className="text-xs text-slate-400">{fmtMoeda(imovel._pm2)}/m²</p>
            )}
          </div>
          <a
            href={imovel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
            title="Ver anúncio original"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            ZAP
          </a>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {imovel.quartos && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {imovel.quartos} qto{Number(imovel.quartos) !== 1 ? 's' : ''}
            </span>
          )}
          {imovel.banheiros && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              {imovel.banheiros} bnh
            </span>
          )}
          {imovel.vagas && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2" />
              </svg>
              {imovel.vagas} vaga{Number(imovel.vagas) !== 1 ? 's' : ''}
            </span>
          )}
          {imovel._area > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {imovel._area}m²
            </span>
          )}
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
            {imovel._tipo}
          </span>
        </div>

        {/* Datas */}
        <div className="flex gap-4 text-xs text-slate-400 mb-2">
          <span>Criado: {fmtData(imovel._dataCriacao)}</span>
          <span>Atualizado: {fmtData(imovel._dataAtualizacao)}</span>
        </div>

        {/* Descrição accordion */}
        {imovel.descricao && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <button
              onClick={() => setDescricaoAberta(v => !v)}
              className="flex items-center justify-between w-full text-xs text-slate-500 hover:text-slate-700 transition"
            >
              <span>Descrição completa</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${descricaoAberta ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {descricaoAberta && (
              <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {imovel.descricao}
              </p>
            )}
          </div>
        )}

        {/* Anunciante */}
        {temAnunciante && (
          <div className="border-t border-slate-100 pt-2 mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {imovel.anunciante_tipo && (
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                {imovel.anunciante_tipo}
              </span>
            )}
            {imovel.anunciante_nome && (
              <span className="truncate">{imovel.anunciante_nome}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

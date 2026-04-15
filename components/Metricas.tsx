import { Imovel } from '@/lib/types';

interface MetricasProps {
  imoveis: Imovel[];
  filtrados: Imovel[];
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR');
}

function fmtMoeda(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`;
  return `R$ ${fmt(n)}`;
}

function media(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

export default function Metricas({ imoveis, filtrados }: MetricasProps) {
  const lista = filtrados.length > 0 ? filtrados : imoveis;

  const precoMedio = media(lista.filter(i => i._preco > 0).map(i => i._preco));
  const pm2Medio = media(lista.filter(i => i._pm2 > 0).map(i => i._pm2));

  const novos = lista.filter(i => i._status === 'novo').length;
  const ativos = lista.filter(i => i._status === 'ativo').length;
  const desatualizados = lista.filter(i => i._status === 'desatualizado').length;
  const encalhados = lista.filter(i => i._status === 'encalhado').length;
  const suspeitos = lista.filter(i => i._atualizacaoSuspeita).length;

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const summaryCards = [
    {
      label: 'Total',
      value: fmt(lista.length),
      sub: filtrados.length !== imoveis.length ? `de ${fmt(imoveis.length)} no total` : 'imóveis',
      color: 'blue',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Preço médio',
      value: precoMedio > 0 ? fmtMoeda(precoMedio) : '—',
      sub: 'dos imóveis filtrados',
      color: 'green',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'R$/m² médio',
      value: pm2Medio > 0 ? `R$ ${fmt(pm2Medio)}` : '—',
      sub: 'preço por metro quadrado',
      color: 'purple',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const statusCards = [
    {
      label: 'Novos',
      value: fmt(novos),
      sub: '≤ 7 dias no mercado',
      color: 'green',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Ativos',
      value: fmt(ativos),
      sub: '8 a 30 dias',
      color: 'blue',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Desatualizados',
      value: fmt(desatualizados),
      sub: '31 a 60 dias',
      color: 'yellow',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Encalhados',
      value: fmt(encalhados),
      sub: '> 60 dias no mercado',
      color: 'red',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
    {
      label: 'Atualizações suspeitas',
      value: fmt(suspeitos),
      sub: 'possivelmente artificiais',
      color: 'orange',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  function Card({ card }: { card: typeof summaryCards[0] }) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
          {card.icon}
        </div>
        <p className="text-2xl font-bold text-slate-800 leading-none">{card.value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map(card => <Card key={card.label} card={card} />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statusCards.map(card => <Card key={card.label} card={card} />)}
      </div>
    </div>
  );
}

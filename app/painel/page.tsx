'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Imovel,
  FiltrosState,
  OrdemType,
  ScorePesos,
  SCORE_PESOS_PADRAO,
} from '@/lib/types';
import { calcularMediasPm2, enriquecerImoveis } from '@/lib/score';
import Metricas from '@/components/Metricas';
import Filtros from '@/components/Filtros';
import ImovelCard from '@/components/ImovelCard';
import ModoRua from '@/components/ModoRua';
import TabelaImoveis from '@/components/TabelaImoveis';

const FILTROS_PADRAO: FiltrosState = {
  bairro: '', rua: '', tipo: '', quartosMin: 0,
  precoMin: '', precoMax: '', pm2Max: '', status: 'todos',
  anuncianteTipo: '', cep: '', anunciantesAtivos: null,
  desvioMin: '', desvioMax: '',
};

const PAGE_SIZE = 30;

function aplicarFiltros(imoveis: Imovel[], filtros: FiltrosState): Imovel[] {
  return imoveis.filter(i => {
    if (filtros.bairro && i._bairro !== filtros.bairro) return false;
    if (filtros.rua && i._rua !== filtros.rua) return false;
    if (filtros.tipo && i._tipo !== filtros.tipo) return false;
    if (filtros.quartosMin > 0 && parseInt(i.quartos) < filtros.quartosMin) return false;
    if (filtros.precoMin && i._preco < parseInt(filtros.precoMin)) return false;
    if (filtros.precoMax && i._preco > parseInt(filtros.precoMax)) return false;
    if (filtros.pm2Max && i._pm2 > parseInt(filtros.pm2Max)) return false;
    if (filtros.status === 'novo' && i._status !== 'novo') return false;
    if (filtros.status === 'ativo' && i._status !== 'ativo') return false;
    if (filtros.status === 'desatualizado' && i._status !== 'desatualizado') return false;
    if (filtros.status === 'encalhado' && i._status !== 'encalhado') return false;
    if (filtros.status === 'suspeito' && !i._atualizacaoSuspeita) return false;
    if (filtros.anuncianteTipo && i.anunciante_tipo !== filtros.anuncianteTipo) return false;
    if (filtros.cep && !i._cep.replace('-', '').startsWith(filtros.cep.replace('-', ''))) return false;
    if (filtros.anunciantesAtivos !== null && filtros.anunciantesAtivos.includes(i.anunciante_nome || '')) return false;
    // Filtros de desvio — itens sem desvio calculado passam pelo filtro
    if (filtros.desvioMin !== '' && !isNaN(Number(filtros.desvioMin)) && i._desvio != null) {
      if (i._desvio.desvioPct < Number(filtros.desvioMin)) return false;
    }
    if (filtros.desvioMax !== '' && !isNaN(Number(filtros.desvioMax)) && i._desvio != null) {
      if (i._desvio.desvioPct > Number(filtros.desvioMax)) return false;
    }
    return true;
  });
}

function aplicarOrdem(imoveis: Imovel[], ordem: OrdemType): Imovel[] {
  return [...imoveis].sort((a, b) => {
    switch (ordem) {
      case 'menor_preco': return a._preco - b._preco;
      case 'maior_preco': return b._preco - a._preco;
      case 'menor_pm2':   return (a._pm2 || 999999) - (b._pm2 || 999999);
      case 'mais_antigo': return new Date(a._dataCriacao).getTime() - new Date(b._dataCriacao).getTime();
      case 'mais_recente': return new Date(b._dataCriacao).getTime() - new Date(a._dataCriacao).getTime();
      case 'maior_score': return (b._scoreBreakdown?.total ?? 0) - (a._scoreBreakdown?.total ?? 0);
      case 'menor_desvio': return (a._desvio?.desvioPct ?? 0) - (b._desvio?.desvioPct ?? 0);
      default: return 0;
    }
  });
}

function formatarDataColeta(dc: string): string {
  if (!dc) return '';
  try {
    const d = new Date(dc.replace(' ', 'T'));
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dc;
  }
}

function sugestaoFiltroVazio(filtros: FiltrosState): string {
  if (filtros.desvioMin !== '') return 'Tente ampliar o desvio mínimo ou removê-lo.';
  if (filtros.desvioMax !== '') return 'Tente ampliar o desvio máximo ou removê-lo.';
  if (filtros.status !== 'todos') return 'Tente mudar o status para "Todos".';
  if (filtros.precoMax) return 'Tente aumentar o preço máximo.';
  if (filtros.pm2Max) return 'Tente aumentar o R$/m² máximo.';
  if (filtros.bairro) return 'Tente remover o filtro de bairro.';
  return 'Tente ajustar os filtros.';
}

type Vista = 'cards' | 'tabela';

export default function PainelPage() {
  const router = useRouter();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_PADRAO);
  const [ordem, setOrdem] = useState<OrdemType>('menor_preco');
  const [pagina, setPagina] = useState(1);
  const [scorePesos, setScorePesos] = useState<ScorePesos>(SCORE_PESOS_PADRAO);
  const [vista, setVista] = useState<Vista>('cards');

  useEffect(() => {
    const raw = sessionStorage.getItem('imoveis');
    if (!raw) { router.push('/'); return; }
    try { setImoveis(JSON.parse(raw)); } catch { router.push('/'); }
    setLoaded(true);
  }, [router]);

  // Reset página ao mudar filtros ou ordem
  useEffect(() => { setPagina(1); }, [filtros, ordem]);

  // Médias de R$/m² calculadas uma única vez sobre o dataset completo
  const mediasMap = useMemo(() => calcularMediasPm2(imoveis), [imoveis]);

  // Dataset enriquecido com score e desvio (recalcula quando pesos mudam)
  const imoveisEnriquecidos = useMemo(
    () => enriquecerImoveis(imoveis, scorePesos, mediasMap),
    [imoveis, scorePesos, mediasMap],
  );

  const filtrados = useMemo(() => aplicarFiltros(imoveisEnriquecidos, filtros), [imoveisEnriquecidos, filtros]);
  const ordenados = useMemo(() => aplicarOrdem(filtrados, ordem), [filtrados, ordem]);
  const paginados = useMemo(() => ordenados.slice(0, pagina * PAGE_SIZE), [ordenados, pagina]);

  // Contador de desvios para o resultado
  const acimaDaMedia = useMemo(
    () => filtrados.filter(i => (i._desvio?.desvioPct ?? 0) > 5).length,
    [filtrados],
  );
  const abaixoDaMedia = useMemo(
    () => filtrados.filter(i => (i._desvio?.desvioPct ?? 0) < -5).length,
    [filtrados],
  );

  const dataColeta = imoveis.length > 0 ? formatarDataColeta(imoveis[0].data_coleta) : '';
  const modoRua = filtros.rua !== '';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.clear();
    router.push('/login');
    router.refresh();
  }

  function novaColeta() {
    sessionStorage.removeItem('imoveis');
    router.push('/');
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <svg className="w-8 h-8 text-blue-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm mt-3">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-800">Painel de Imóveis</span>
            {dataColeta && (
              <span className="text-xs text-slate-400 ml-2">Coleta: {dataColeta}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={novaColeta}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition px-3 py-1.5 border border-slate-300 rounded-lg hover:border-blue-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Nova coleta
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full space-y-4">
        {/* Métricas */}
        <Metricas imoveis={imoveisEnriquecidos} filtrados={filtrados} />

        {/* Filtros + Pesos */}
        <Filtros
          imoveis={imoveisEnriquecidos}
          filtros={filtros}
          ordem={ordem}
          onFiltros={setFiltros}
          onOrdem={setOrdem}
          totalFiltrados={filtrados.length}
          scorePesos={scorePesos}
          onScorePesos={setScorePesos}
          acimaDaMedia={acimaDaMedia}
          abaixoDaMedia={abaixoDaMedia}
        />

        {/* Modo Rua ou listagem padrão */}
        {modoRua ? (
          <ModoRua imoveis={filtrados} rua={filtros.rua} />
        ) : (
          <>
            {filtrados.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-slate-600">Nenhum imóvel encontrado</p>
                <p className="text-sm mt-1">{sugestaoFiltroVazio(filtros)}</p>
              </div>
            ) : (
              <>
                {/* View toggle + result counter */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{filtrados.length.toLocaleString('pt-BR')}</span> imóveis
                    {acimaDaMedia > 0 && (
                      <> · <span className="text-amber-600 font-medium">▲ {acimaDaMedia} acima da média</span></>
                    )}
                    {abaixoDaMedia > 0 && (
                      <> · <span className="text-green-600 font-medium">▼ {abaixoDaMedia} abaixo da média</span></>
                    )}
                  </p>

                  {/* Vista toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setVista('cards')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        vista === 'cards'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Cards
                    </button>
                    <button
                      onClick={() => setVista('tabela')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        vista === 'tabela'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Tabela
                    </button>
                  </div>
                </div>

                {/* Content by vista */}
                {vista === 'cards' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {paginados.map(imovel => (
                        <ImovelCard key={imovel._id} imovel={imovel} />
                      ))}
                    </div>

                    {paginados.length < ordenados.length && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setPagina(p => p + 1)}
                          className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition shadow-sm"
                        >
                          Carregar mais ({ordenados.length - paginados.length} restantes)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <TabelaImoveis
                    imoveis={ordenados}
                    filtros={filtros}
                    onFiltros={setFiltros}
                    ordem={ordem}
                    onOrdem={setOrdem}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

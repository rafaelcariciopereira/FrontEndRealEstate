'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Imovel, FiltrosState, OrdemType } from '@/lib/types';
import Metricas from '@/components/Metricas';
import Filtros from '@/components/Filtros';
import ImovelCard from '@/components/ImovelCard';
import ModoRua from '@/components/ModoRua';

const FILTROS_PADRAO: FiltrosState = {
  bairro: '', rua: '', tipo: '', quartosMin: 0,
  precoMin: '', precoMax: '', pm2Max: '', status: 'todos',
};

const PAGE_SIZE = 30;

function aplicarFiltros(imoveis: Imovel[], filtros: FiltrosState): Imovel[] {
  return imoveis.filter(i => {
    if (filtros.bairro && i.bairro !== filtros.bairro) return false;
    if (filtros.rua && i._rua !== filtros.rua) return false;
    if (filtros.tipo && i._tipo !== filtros.tipo) return false;
    if (filtros.quartosMin > 0 && parseInt(i.quartos) < filtros.quartosMin) return false;
    if (filtros.precoMin && i._preco < parseInt(filtros.precoMin)) return false;
    if (filtros.precoMax && i._preco > parseInt(filtros.precoMax)) return false;
    if (filtros.pm2Max && i._pm2 > parseInt(filtros.pm2Max)) return false;
    if (filtros.status === 'encalhado' && !i._encalhado) return false;
    if (filtros.status === 'suspeito' && !i._atualizacaoSuspeita) return false;
    if (filtros.status === 'recente' && i._idadeDias >= 30) return false;
    return true;
  });
}

function aplicarOrdem(imoveis: Imovel[], ordem: OrdemType): Imovel[] {
  return [...imoveis].sort((a, b) => {
    switch (ordem) {
      case 'menor_preco': return a._preco - b._preco;
      case 'maior_preco': return b._preco - a._preco;
      case 'menor_pm2': return (a._pm2 || 999999) - (b._pm2 || 999999);
      case 'mais_antigo': return new Date(a._dataCriacao).getTime() - new Date(b._dataCriacao).getTime();
      case 'mais_recente': return new Date(b._dataCriacao).getTime() - new Date(a._dataCriacao).getTime();
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

export default function PainelPage() {
  const router = useRouter();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_PADRAO);
  const [ordem, setOrdem] = useState<OrdemType>('menor_preco');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const raw = sessionStorage.getItem('imoveis');
    if (!raw) {
      router.push('/');
      return;
    }
    try {
      setImoveis(JSON.parse(raw));
    } catch {
      router.push('/');
    }
    setLoaded(true);
  }, [router]);

  // Reset página ao mudar filtros
  useEffect(() => { setPagina(1); }, [filtros, ordem]);

  const filtrados = useMemo(() => aplicarFiltros(imoveis, filtros), [imoveis, filtros]);
  const ordenados = useMemo(() => aplicarOrdem(filtrados, ordem), [filtrados, ordem]);
  const paginados = useMemo(() => ordenados.slice(0, pagina * PAGE_SIZE), [ordenados, pagina]);

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
        <Metricas imoveis={imoveis} filtrados={filtrados} />

        {/* Filtros */}
        <Filtros
          imoveis={imoveis}
          filtros={filtros}
          ordem={ordem}
          onFiltros={setFiltros}
          onOrdem={setOrdem}
          totalFiltrados={filtrados.length}
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
                <p className="font-medium">Nenhum imóvel encontrado</p>
                <p className="text-sm mt-1">Tente ajustar os filtros</p>
              </div>
            ) : (
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
            )}
          </>
        )}
      </main>
    </div>
  );
}

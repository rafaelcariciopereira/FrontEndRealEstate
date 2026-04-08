import { Imovel } from '@/lib/types';
import ImovelCard from './ImovelCard';

interface ModoRuaProps {
  imoveis: Imovel[];
  rua: string;
}

function extrairNumero(endereco: string): number {
  const match = endereco.match(/,?\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 999999;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR');
}

export default function ModoRua({ imoveis, rua }: ModoRuaProps) {
  const ordenados = [...imoveis].sort((a, b) => extrairNumero(a.endereco) - extrairNumero(b.endereco));

  const pm2sValidos = ordenados.filter(i => i._pm2 > 0).map(i => i._pm2);
  const melhorPm2 = pm2sValidos.length > 0 ? Math.min(...pm2sValidos) : null;

  const media = pm2sValidos.length > 0
    ? Math.round(pm2sValidos.reduce((a, b) => a + b, 0) / pm2sValidos.length)
    : null;

  return (
    <div>
      {/* Header da rua */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium opacity-80">Modo Rua</span>
        </div>
        <h2 className="text-xl font-bold">{rua}</h2>
        <div className="flex gap-4 mt-3 text-sm">
          <div>
            <span className="opacity-70">Imóveis:</span>{' '}
            <span className="font-semibold">{imoveis.length}</span>
          </div>
          {media && (
            <div>
              <span className="opacity-70">R$/m² médio:</span>{' '}
              <span className="font-semibold">R$ {fmt(media)}</span>
            </div>
          )}
          {melhorPm2 && (
            <div>
              <span className="opacity-70">Melhor R$/m²:</span>{' '}
              <span className="font-semibold text-green-300">R$ {fmt(melhorPm2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Comparativo visual de R$/m² */}
      {pm2sValidos.length > 1 && melhorPm2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Comparativo R$/m² na rua
          </p>
          <div className="space-y-2">
            {ordenados
              .filter(i => i._pm2 > 0)
              .sort((a, b) => a._pm2 - b._pm2)
              .map(imovel => {
                const maxPm2 = Math.max(...pm2sValidos);
                const pct = Math.round((imovel._pm2 / maxPm2) * 100);
                const isMelhor = imovel._pm2 === melhorPm2;
                return (
                  <div key={imovel._id} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-32 truncate shrink-0">
                      {imovel._rua.split(' ').slice(-1)[0]}{' '}
                      <span className="text-slate-400">
                        {extrairNumero(imovel.endereco) !== 999999 ? `#${extrairNumero(imovel.endereco)}` : ''}
                      </span>
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isMelhor ? 'bg-green-500' : 'bg-blue-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-20 text-right shrink-0 ${isMelhor ? 'text-green-600' : 'text-slate-600'}`}>
                      R$ {fmt(imovel._pm2)}/m²
                    </span>
                    {isMelhor && (
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Grid de imóveis ordenados por número */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ordenados.map(imovel => (
          <ImovelCard
            key={imovel._id}
            imovel={imovel}
            destaque={melhorPm2 !== null && imovel._pm2 === melhorPm2 && imovel._pm2 > 0}
          />
        ))}
      </div>
    </div>
  );
}

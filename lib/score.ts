import { Imovel, ScorePesos, ScoreBreakdown, DesvioInfo } from './types';

/**
 * Calcula o score de oportunidade de um imóvel com base nos pesos definidos.
 *
 * Critérios:
 * - diasMercado: imóvel com >60 dias no mercado (encalhado)
 * - particular:  anunciante do tipo "Particular"
 * - anuncioFraco: sem foto OU descrição com menos de 100 caracteres
 */
export function calcularScore(imovel: Imovel, pesos: ScorePesos): ScoreBreakdown {
  const diasMercado = imovel._idadeDias > 60 ? pesos.diasMercado : 0;
  const particular = (imovel.anunciante_tipo || '').toLowerCase() === 'particular'
    ? pesos.particular
    : 0;
  const semFoto = !imovel.foto_url;
  const descricaoCurta = (imovel.descricao || '').trim().length < 100;
  const anuncioFraco = semFoto || descricaoCurta ? pesos.anuncioFraco : 0;

  return {
    diasMercado,
    particular,
    anuncioFraco,
    total: diasMercado + particular + anuncioFraco,
    maximo: pesos.diasMercado + pesos.particular + pesos.anuncioFraco,
  };
}

/**
 * Calcula a média de R$/m² agrupada por bairro + tipo de imóvel,
 * usando todos os imóveis do dataset como referência.
 */
export function calcularMediasPm2(
  imoveis: Imovel[],
): Map<string, { media: number; n: number }> {
  const grupos: Record<string, { sum: number; n: number }> = {};

  for (const i of imoveis) {
    if (i._pm2 <= 0 || i._area <= 0) continue;
    const chave = `${i._bairro}|||${i._tipo}`;
    if (!grupos[chave]) grupos[chave] = { sum: 0, n: 0 };
    grupos[chave].sum += i._pm2;
    grupos[chave].n++;
  }

  const result = new Map<string, { media: number; n: number }>();
  for (const [chave, data] of Object.entries(grupos)) {
    result.set(chave, { media: Math.round(data.sum / data.n), n: data.n });
  }
  return result;
}

/**
 * Calcula o desvio percentual de um imóvel em relação à média do seu grupo.
 * Retorna null se o grupo tiver menos de 2 imóveis ou se o pm2 for inválido.
 */
export function calcularDesvio(
  imovel: Imovel,
  mediasMap: Map<string, { media: number; n: number }>,
): DesvioInfo | null {
  if (imovel._pm2 <= 0) return null;
  const chave = `${imovel._bairro}|||${imovel._tipo}`;
  const grupo = mediasMap.get(chave);
  if (!grupo || grupo.n < 2) return null;

  const desvioPct = Math.round(((imovel._pm2 - grupo.media) / grupo.media) * 100);
  return { mediaPm2: grupo.media, desvioPct, nGrupo: grupo.n };
}

/**
 * Enriquece um array de imóveis com score e desvio calculados.
 * Os campos adicionados são opcionais no tipo Imovel, portanto
 * o restante do sistema continua funcional sem alterações.
 */
export function enriquecerImoveis(
  imoveis: Imovel[],
  pesos: ScorePesos,
  mediasMap: Map<string, { media: number; n: number }>,
): Imovel[] {
  return imoveis.map(i => ({
    ...i,
    _scoreBreakdown: calcularScore(i, pesos),
    _desvio: calcularDesvio(i, mediasMap),
  }));
}

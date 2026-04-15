import { Imovel } from './types';

function extrairPartesEndereco(endereco: string): { logradouro: string; cidade: string; uf: string } | null {
  if (!endereco) return null;
  // Formato: "Rua X, 123 - Bairro, Rio de Janeiro - RJ"
  const partes = endereco.split(' - ');
  if (partes.length < 3) return null;

  const uf = partes[partes.length - 1].trim();
  const cidadePart = partes[partes.length - 2].trim(); // "Bairro, Cidade"
  const logradouroPart = partes[0].trim();             // "Rua X, 123"

  const cidadeSplit = cidadePart.split(',');
  const cidade = cidadeSplit[cidadeSplit.length - 1].trim();
  const logradouro = logradouroPart.split(',')[0].trim();

  if (!logradouro || !cidade || !uf) return null;
  return { logradouro, cidade, uf };
}

async function buscarCEP(logradouro: string, cidade: string, uf: string): Promise<string> {
  try {
    const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(cidade)}/${encodeURIComponent(logradouro)}/json/`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].cep) {
      return data[0].cep; // formato "22041-001"
    }
    return '';
  } catch {
    return '';
  }
}

export async function enriquecerCEPs(
  imoveis: Imovel[],
  onProgress?: (atual: number, total: number) => void
): Promise<Imovel[]> {
  // Agrupa logradouros únicos para evitar chamadas duplicadas
  const cache = new Map<string, string>();
  const pendentes: { key: string; logradouro: string; cidade: string; uf: string }[] = [];

  for (const imovel of imoveis) {
    if (imovel._cep) continue;
    const partes = extrairPartesEndereco(imovel.endereco);
    if (!partes) continue;
    const key = `${partes.logradouro}|${partes.cidade}|${partes.uf}`;
    if (!pendentes.find(p => p.key === key)) {
      pendentes.push({ key, ...partes });
    }
  }

  for (let i = 0; i < pendentes.length; i++) {
    const { key, logradouro, cidade, uf } = pendentes[i];
    const cep = await buscarCEP(logradouro, cidade, uf);
    cache.set(key, cep);
    onProgress?.(i + 1, pendentes.length);
  }

  return imoveis.map(imovel => {
    if (imovel._cep) return imovel;
    const partes = extrairPartesEndereco(imovel.endereco);
    if (!partes) return imovel;
    const key = `${partes.logradouro}|${partes.cidade}|${partes.uf}`;
    const cep = cache.get(key) || '';
    if (!cep) return imovel;
    return { ...imovel, cep, _cep: cep };
  });
}

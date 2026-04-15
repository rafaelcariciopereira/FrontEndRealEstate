import Papa from 'papaparse';
import { Imovel, ImovelRaw, StatusAnuncio } from './types';

const MESES: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

function parseDataPorExtenso(str: string): Date | null {
  // "16 de janeiro de 2026"
  if (!str) return null;
  const match = str.trim().match(/^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/i);
  if (!match) return null;
  const dia = parseInt(match[1], 10);
  const mes = MESES[match[2].toLowerCase()];
  const ano = parseInt(match[3], 10);
  if (mes === undefined) return null;
  return new Date(ano, mes, dia);
}

function parseDataRelativa(relativa: string, ancora: Date): Date | null {
  // "há 3 semanas" / "há 3 dias" / "há 2 meses"
  if (!relativa) return null;
  const match = relativa.trim().match(/há\s+(\d+)\s+(dia|dias|semana|semanas|mês|mes|meses)/i);
  if (!match) return null;
  const qtd = parseInt(match[1], 10);
  const unidade = match[2].toLowerCase();
  const d = new Date(ancora);
  if (unidade.startsWith('dia')) {
    d.setDate(d.getDate() - qtd);
  } else if (unidade.startsWith('semana')) {
    d.setDate(d.getDate() - qtd * 7);
  } else if (unidade.startsWith('m')) {
    d.setMonth(d.getMonth() - qtd);
  }
  return d;
}

function detectarTipo(titulo: string): string {
  const t = titulo.toLowerCase();
  if (t.includes('apartamento') || t.includes('apto')) return 'Apartamento';
  if (t.includes('cobertura')) return 'Cobertura';
  if (t.includes('studio') || t.includes('stúdio')) return 'Studio';
  if (t.includes('kitnet') || t.includes('kit')) return 'Kitnet';
  if (t.includes('casa')) return 'Casa';
  return 'Outro';
}

function extrairRua(endereco: string): string {
  if (!endereco) return '';
  return endereco.split(',')[0].trim();
}

function parsePreco(preco: string): number {
  if (!preco) return 0;
  // "R$ 270.000" => 270000
  return parseInt(preco.replace(/[^\d]/g, ''), 10) || 0;
}

function parseArea(area: string): number {
  if (!area) return 0;
  return parseFloat(area.replace(',', '.')) || 0;
}

function normalizarCEP(cep: string): string {
  if (!cep) return '';
  const digits = cep.replace(/\D/g, '');
  if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return cep;
}

function extrairBairroDoEndereco(endereco: string): string {
  // "Rua X, 123 - Bairro, Cidade - UF"
  if (!endereco) return 'Não identificado';
  const partes = endereco.split(' - ');
  if (partes.length < 2) return 'Não identificado';
  const bairro = partes[1].split(',')[0].trim();
  return bairro || 'Não identificado';
}

export function parseCSV(content: string): Imovel[] {
  // Strip UTF-8 BOM if present (common in CSVs exported from Python/pandas)
  const cleanContent = content.replace(/^\uFEFF/, '');

  const result = Papa.parse<ImovelRaw>(cleanContent, {
    header: true,
    delimiter: ';',
    quoteChar: '"',
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  return result.data.map((row, index) => {
    const _preco = parsePreco(row.preco);
    const _area = parseArea(row.area_m2);
    const _pm2 = _area > 0 ? Math.round(_preco / _area) : 0;
    const _rua = extrairRua(row.endereco);
    const _tipo = detectarTipo(row.titulo);

    // data_coleta: "2026-04-04 19:15:06"
    const dataColeta = row.data_coleta
      ? new Date(row.data_coleta.replace(' ', 'T'))
      : new Date();

    const dataCriacaoObj = parseDataPorExtenso(row.data_criacao);
    const _dataCriacao = dataCriacaoObj ? dataCriacaoObj.toISOString() : new Date(0).toISOString();

    const dataAtualizacaoObj = parseDataRelativa(row.data_atualizacao, dataColeta);
    const _dataAtualizacao = dataAtualizacaoObj
      ? dataAtualizacaoObj.toISOString()
      : dataColeta.toISOString();

    const _idadeDias = dataCriacaoObj
      ? Math.floor((dataColeta.getTime() - dataCriacaoObj.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const _encalhado = _idadeDias > 60;

    // atualizacaoSuspeita: >30 dias de idade E diff entre criacao e atualizacao > 15 dias
    let _atualizacaoSuspeita = false;
    if (_idadeDias > 30 && dataCriacaoObj && dataAtualizacaoObj) {
      const diffAtualizacao = Math.abs(
        (dataAtualizacaoObj.getTime() - dataCriacaoObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      _atualizacaoSuspeita = diffAtualizacao > 15;
    }

    const _status: StatusAnuncio =
      _idadeDias <= 7 ? 'novo' :
      _idadeDias <= 30 ? 'ativo' :
      _idadeDias <= 60 ? 'desatualizado' :
      'encalhado';

    const _bairro = row.bairro || extrairBairroDoEndereco(row.endereco);
    const _cep = normalizarCEP(row.cep || '');

    return {
      ...row,
      _id: `imovel-${index}`,
      _preco,
      _area,
      _pm2,
      _rua,
      _tipo,
      _dataCriacao,
      _dataAtualizacao,
      _idadeDias,
      _encalhado,
      _atualizacaoSuspeita,
      _status,
      _bairro,
      _cep,
    };
  });
}

export function extrairDataColeta(imoveis: Imovel[]): string {
  if (imoveis.length === 0) return '';
  return imoveis[0].data_coleta || '';
}

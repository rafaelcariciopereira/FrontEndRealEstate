export type StatusAnuncio = 'novo' | 'ativo' | 'desatualizado' | 'encalhado';

export interface ImovelRaw {
  titulo: string;
  preco: string;
  endereco: string;
  bairro: string;
  cidade: string;
  area_m2: string;
  quartos: string;
  banheiros: string;
  vagas: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
  url: string;
  data_coleta: string;
  foto_url?: string;
  anunciante_nome?: string;
  anunciante_tipo?: string;
  cep?: string;
}

// ── Score ────────────────────────────────────────────────────────────────────

export interface ScorePesos {
  diasMercado: number;
  particular: number;
  anuncioFraco: number;
}

export const SCORE_PESOS_PADRAO: ScorePesos = {
  diasMercado: 2,
  particular: 2,
  anuncioFraco: 2,
};

export interface ScoreBreakdown {
  diasMercado: number;
  particular: number;
  anuncioFraco: number;
  total: number;
  maximo: number;
}

// ── Desvio ───────────────────────────────────────────────────────────────────

export interface DesvioInfo {
  mediaPm2: number;   // média do grupo (bairro + tipo)
  desvioPct: number;  // positivo = acima, negativo = abaixo
  nGrupo: number;     // tamanho do grupo
}

// ── Imovel ───────────────────────────────────────────────────────────────────

export interface Imovel extends ImovelRaw {
  _id: string;
  _preco: number;
  _area: number;
  _pm2: number;
  _rua: string;
  _tipo: string;
  _dataCriacao: string; // ISO string
  _dataAtualizacao: string; // ISO string
  _idadeDias: number;
  _encalhado: boolean;
  _atualizacaoSuspeita: boolean;
  _status: StatusAnuncio;
  _bairro: string; // resolved: from bairro field or extracted from endereco
  _cep: string;    // normalized CEP with hyphen
  // Computed at runtime in painel page (optional so sessionStorage data still works)
  _scoreBreakdown?: ScoreBreakdown;
  _desvio?: DesvioInfo | null;
}

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface FiltrosState {
  bairro: string;
  rua: string;
  tipo: string;
  quartosMin: number;
  precoMin: string;
  precoMax: string;
  pm2Max: string;
  status: 'todos' | 'novo' | 'ativo' | 'desatualizado' | 'encalhado' | 'suspeito';
  anuncianteTipo: string;
  cep: string;
  anunciantesAtivos: string[] | null; // null = todos selecionados
  desvioMin: string; // % mínimo de desvio (permite negativo)
  desvioMax: string; // % máximo de desvio (permite negativo)
}

// ── Ordem ────────────────────────────────────────────────────────────────────

export type OrdemType =
  | 'menor_preco'
  | 'maior_preco'
  | 'menor_pm2'
  | 'mais_antigo'
  | 'mais_recente'
  | 'maior_score'
  | 'menor_desvio';

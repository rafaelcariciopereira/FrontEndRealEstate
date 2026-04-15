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
}

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
}

export type OrdemType =
  | 'menor_preco'
  | 'maior_preco'
  | 'menor_pm2'
  | 'mais_antigo'
  | 'mais_recente';

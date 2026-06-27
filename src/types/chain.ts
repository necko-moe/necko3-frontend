export type ChainType = "EVM";

export interface ChainConfigSchema {
  name: string;
  active: boolean;
  rpc_urls: string[];
  chain_type: ChainType;
  xpub: string;
  native_symbol: string;
  decimals: number;
  last_processed_block: number;
  block_lag: number;
  required_confirmations: number;
  logo_url: string | null;
  safe_lag: number;
  tokens: TokenConfigSchema[];
}

export interface ChainDataSchema {
  id: number;
  name: string;
  active: boolean;
  rpc_urls: string[];
  chain_type: ChainType;
  xpub: string;
  native_symbol: string;
  decimals: number;
  last_processed_block: number;
  block_lag: number;
  required_confirmations: number;
  logo_url: string | null;
  safe_lag: number;
  watch_addresses: string[];
}

export interface PartialChainUpdateSchema {
  active?: boolean | null;
  block_lag?: number | null;
  last_processed_block?: number | null;
  logo_url?: string | null;
  required_confirmations?: number | null;
  rpc_urls?: string[] | null;
  xpub?: string | null;
  safe_lag?: number | null;
}

export interface TokenConfigSchema {
  symbol: string;
  contract: string;
  decimals: number;
  logo_url: string | null;
}

export interface TokenDataSchema {
  id: number;
  chain_id: number;
  symbol: string;
  contract: string;
  decimals: number;
  logo_url: string | null;
}


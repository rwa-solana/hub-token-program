/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_NETWORK: 'devnet' | 'mainnet-beta' | 'localnet';
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_PROGRAM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Buffer: typeof import('buffer').Buffer;
}

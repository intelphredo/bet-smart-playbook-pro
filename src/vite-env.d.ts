
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPORTRADAR_API_KEY: string;
  readonly VITE_ODDS_API_KEY: string;
  readonly VITE_BETFAIR_API_KEY: string;
  readonly VITE_BETFAIR_SESSION_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

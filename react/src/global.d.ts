export type {};

declare global {
  interface EnvConfig {
    API_URL: string;
  }

  interface Window {
    __env__?: EnvConfig;
  }
}

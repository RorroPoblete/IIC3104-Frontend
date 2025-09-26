export {};

declare global {
  interface Window {
    __APP_CONFIG__?: {
      auth0Domain: string;
      auth0Audience: string;
      auth0ClientId: string;
    };
  }
}

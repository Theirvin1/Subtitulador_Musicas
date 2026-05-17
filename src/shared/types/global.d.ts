export {};

declare global {
  interface Window {
    subMusic: {
      platform: NodeJS.Platform;
    };
  }
}

import type { AugmentedBrowser as WxtBrowser } from 'wxt/browser';

declare module 'wxt/browser' {
  export type PublicPath = WxtBrowser.PublicPath | '/_favicon/';
}

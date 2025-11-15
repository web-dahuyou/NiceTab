import type { AugmentedBrowser as WxtBrowser } from 'wxt/browser';
import type { StyledThemeProps } from '~/entrypoints/types';

declare module 'wxt/browser' {
  export type PublicPath = WxtBrowser.PublicPath | '/_favicon/';
}

declare module 'styled-components' {
  export interface DefaultTheme extends StyledThemeProps {}
}

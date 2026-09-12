import type { AugmentedBrowser as WxtBrowser } from 'wxt/browser';
import type { TabGroups as ImportedTabGroups } from 'webextension-polyfill';
import type { StyledThemeProps } from '~/entrypoints/types';

declare module 'wxt/browser' {
  export type PublicPath = WxtBrowser.PublicPath | '/_favicon/';
  export import TabGroups = ImportedTabGroups;
}

declare module 'styled-components' {
  export interface DefaultTheme extends StyledThemeProps {}
}

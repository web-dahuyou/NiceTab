// import { storage } from 'wxt/storage';
import type { ThemeProps } from '~/entrypoints/types';
import { PRIMARY_COLOR } from '../constants';

export default class ThemeUtils {
  storageKey: `local:${string}` = 'local:theme';
  defaultTheme = {
    colorPrimary: PRIMARY_COLOR,
  };
  themeData = this.defaultTheme;
  async getThemeData() {
    const theme = await storage.getItem<ThemeProps>(this.storageKey);
    return theme || this.defaultTheme;
  }
  async setThemeData(theme: Partial<ThemeProps>) {
    const themeData = await this.getThemeData();
    this.themeData = { ...themeData, ...theme };
    await storage.setItem(this.storageKey, this.themeData);
    return this.themeData;
  }
}

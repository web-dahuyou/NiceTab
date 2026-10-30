// import { storage } from 'wxt/storage';
import type { ThemeProps } from '~/entrypoints/types';
import { defaultThemeColorName, getColorNameFromHex } from '../constants';

export default class ThemeUtils {
  storageKey: `local:${string}` = 'local:theme';
  defaultTheme: ThemeProps = {
    colorName: defaultThemeColorName,
  };
  themeData = this.defaultTheme;
  async getThemeData() {
    const theme = await storage.getItem<ThemeProps>(this.storageKey);
    if (!theme) return this.defaultTheme;
    // 兼容旧数据：旧版本只存 colorPrimary 色值，反查为色名
    if (!theme.colorName) {
      theme.colorName = getColorNameFromHex(theme.colorPrimary);
    }
    return theme;
  }
  async setThemeData(theme: Partial<ThemeProps>) {
    const themeData = await this.getThemeData();
    this.themeData = { ...themeData, ...theme };
    await storage.setItem(this.storageKey, this.themeData);
    return this.themeData;
  }
}

import { LanguageTypes } from '~/entrypoints/types';
import common from './common';
import home from './home';
import settings from './settings';
import importExport from './importExport';
import sync from './sync';
import hotkeys from './hotkeys';

const getLocales = (language: LanguageTypes) => {
  return {
    ...home[language],
    ...common[language],
    ...settings[language],
    ...importExport[language],
    ...sync[language],
    ...hotkeys[language]
  }
}
export const zhCN = getLocales('zh-CN');
export const enUS = getLocales('en-US');

export type LocaleModules = typeof zhCN;
export const modules: Record<LanguageTypes, typeof zhCN> = {
  'zh-CN': zhCN,
  'en-US': enUS
};

export default modules;
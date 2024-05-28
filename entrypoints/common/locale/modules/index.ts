import { LanguageTypes } from '~/entrypoints/types';
import common from './common';
import settings from './settings';
import importExport from './importExport';

const getLocales = (language: LanguageTypes) => {
  return {
    ...common[language],
    ...settings[language],
    ...importExport[language],
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
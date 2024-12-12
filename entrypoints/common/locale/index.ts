import { type ConfigProviderProps } from 'antd';
import {createIntl, createIntlCache, RawIntlProvider} from 'react-intl';
import antd_zhCN from 'antd/locale/zh_CN';
import antd_enUS from 'antd/locale/en_US';
// import 'dayjs/locale/zh-cn';
import { type LanguageTypes } from '~/entrypoints/types';
import modules, { type LocaleModules } from './modules';

export type LocaleAntd = ConfigProviderProps['locale'];
export const antdMap: Record<LanguageTypes, LocaleAntd> = {
  'zh-CN': antd_zhCN,
  'en-US': antd_enUS
};


export const customMap: Record<LanguageTypes, LocaleModules> = {
  'zh-CN': modules['zh-CN'],
  'en-US': modules['en-US']
};
export const getCustomLocaleMessages = (locale: LanguageTypes = 'zh-CN') => {
  return customMap[locale];
}



const cache = createIntlCache();
let createdIntl = createIntl({ locale: 'zh-CN', messages: customMap['zh-CN'] }, cache);

// 获取 cached intl
export const getCreatedIntl = (locale: LanguageTypes = 'zh-CN') => {
  createdIntl = createIntl({ locale, messages: customMap[locale] }, cache);
  return createdIntl;
}

export default {
  antdMap,
  customMap,
  createdIntl,
  getCustomLocaleMessages
}
import { type ConfigProviderProps } from 'antd';
import {createIntl, createIntlCache, RawIntlProvider} from 'react-intl';
import antd_zhCN from 'antd/locale/zh_CN';
import antd_zhTW from 'antd/locale/zh_TW';
import antd_enUS from 'antd/locale/en_US';
import antd_ruRU from 'antd/locale/ru_RU';
// import 'dayjs/locale/zh-cn';
import { type LanguageTypes } from '~/entrypoints/types';
import modules, { type LocaleModules } from './modules';

export type LocaleKeys = keyof LocaleModules;

export type LocaleAntd = ConfigProviderProps['locale'];
export const antdMap: Record<LanguageTypes, LocaleAntd> = {
  'zh-CN': antd_zhCN,
  'zh-TW': antd_zhTW,
  'en-US': antd_enUS,
  'ru-RU': antd_ruRU,
};


export const customMap: Record<LanguageTypes, LocaleModules> = {
  'zh-CN': modules['zh-CN'],
  'zh-TW': modules['zh-TW'],
  'en-US': modules['en-US'],
  'ru-RU': modules['ru-RU'],
};
export const getCustomLocaleMessages = (locale: LanguageTypes = 'en-US') => {
  return customMap[locale] || customMap['en-US'];
}



const cache = createIntlCache();
let createdIntl = createIntl({ locale: 'en-US', messages: customMap['en-US'] }, cache);

// 获取 cached intl
export const getCreatedIntl = (locale: LanguageTypes = 'en-US') => {
  const resolvedLocale = customMap[locale] ? locale : 'en-US';
  createdIntl = createIntl(
    { locale: resolvedLocale, messages: customMap[resolvedLocale] },
    cache,
  );
  return createdIntl;
}

export default {
  antdMap,
  customMap,
  createdIntl,
  getCustomLocaleMessages
}

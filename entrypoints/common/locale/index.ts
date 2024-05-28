import { ConfigProviderProps } from 'antd';
import antd_zhCN from 'antd/locale/zh_CN';
import antd_enUS from 'antd/locale/en_US';
// import 'dayjs/locale/zh-cn';
import { LanguageTypes } from '~/entrypoints/types';
import modules, { LocaleModules } from './modules';

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

export default {
  antdMap,
  customMap,
  getCustomLocaleMessages
}
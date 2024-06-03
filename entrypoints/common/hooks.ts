import { createContext, useState, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { antdMap, customMap } from '~/entrypoints/common/locale';
import type {
  ThemeProps,
  LanguageTypes,
  IntlForamtMessageParams,
} from '~/entrypoints/types';
import { settingsUtils, themeUtils } from '~/entrypoints/common/storage';
import { capitalize } from '~/entrypoints/common/utils';
import { ENUM_COLORS } from './constants';

// global context
export const GlobalContext = createContext({
  colorPrimary: ENUM_COLORS.primary,
  setThemeData: (themeData: Partial<ThemeProps>) => {
    themeUtils.setThemeData(themeData);
  },
  setLocale: async (language: LanguageTypes = defaultLanguage, callback?: () => void) => {
    const settings = await settingsUtils.getSettings();
    settingsUtils.setSettings({ ...settings, language });
    callback?.();
  },
});

export const defaultLanguage: LanguageTypes = (navigator?.language ||
  'zh-CN') as LanguageTypes;

// antd locale
export function useAntdLocale() {
  const [language, setLanguage] = useState<LanguageTypes>(defaultLanguage);
  const locale = useMemo(() => {
    const lang = language || defaultLanguage;
    return antdMap[lang] || antdMap[defaultLanguage];
  }, [language]);

  const changeLocale = async (language: LanguageTypes = defaultLanguage) => {
    const settings = await settingsUtils.getSettings();
    let lang = language;
    if (!antdMap[language]) {
      lang = defaultLanguage;
    }
    await settingsUtils.setSettings({ ...settings, language: lang });
    setLanguage(language);
  };
  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      let language = settings.language || defaultLanguage;
      language = antdMap[language] ? language : defaultLanguage;
      setLanguage(language);
    });
  }, []);

  return { locale, changeLocale };
}
// custom locale
export function useCustomLocale() {
  const [locale, setLocale] = useState<LanguageTypes>(defaultLanguage);
  const messages = useMemo(
    () => customMap[locale] || customMap[defaultLanguage],
    [locale]
  );

  const changeLocale = async (language: LanguageTypes = defaultLanguage) => {
    const settings = await settingsUtils.getSettings();
    await settingsUtils.setSettings({ ...settings, language });
    setLocale(language);
  };

  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      setLocale(settings.language || defaultLanguage);
    });
  }, []);
  return { messages, locale, changeLocale };
}

// react-intl message hooks
export function useIntlUtls() {
  const intl = useIntl();
  const $fmt = (
    idOrFormatMsg: string | IntlForamtMessageParams,
    options?: Record<string, any>
  ) => {
    const {
      id,
      defaultMessage = '',
      description = '',
      values = undefined,
      opts = undefined,
    } = typeof idOrFormatMsg === 'string'
      ? { id: idOrFormatMsg }
      : idOrFormatMsg;

    const descriptor = { id, defaultMessage, description };

    let message = intl.formatMessage(descriptor, values, opts);
    if (options?.capitalize) {
      message = capitalize(message);
    }
    return message;
  };

  return { $fmt, ...intl };
}

export default {
  GlobalContext,
  useAntdLocale,
  useCustomLocale,
  useIntlUtls,
};

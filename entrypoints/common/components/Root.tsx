import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { IntlProvider } from 'react-intl';
import { ENUM_COLORS } from '../constants';
import {
  GlobalContext,
  useAntdLocale,
  useCustomLocale,
} from '~/entrypoints/common/hooks/global';
import type { ThemeProps, LanguageTypes } from '~/entrypoints/types';
import { themeUtils } from '~/entrypoints/common/storage';

export default function Root({ children }: { children: React.ReactNode }) {
  const { locale: localeAntd, changeLocale: changeLocaleAntd } = useAntdLocale();
  const {
    locale: localeCustom,
    changeLocale: changeLocaleCustom,
    messages,
  } = useCustomLocale();
  const [hasReady, setHasReady] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(ENUM_COLORS.primary);

  const handleLocaleChange = async (languange?: LanguageTypes) => {
    changeLocaleAntd(languange);
    changeLocaleCustom(languange);
  };
  const handleThemeChange = async (themeData: Partial<ThemeProps>) => {
    const theme = await themeUtils.setThemeData(themeData);
    setPrimaryColor(theme.colorPrimary);
  };

  const initThemeData = async () => {
    const theme = await themeUtils.getThemeData();
    setPrimaryColor(theme.colorPrimary);
    setHasReady(true);
  };

  useEffect(() => {
    initThemeData();
    browser.runtime.onMessage.addListener(async (msg, msgSender, sendResponse) => {
      // console.log('browser.runtime.onMessage--Root', msg);
      const { msgType, data } = msg || {};
      if (msgType === 'setPrimaryColor') {
        const colorPrimary = data.colorPrimary || ENUM_COLORS.primary;
        await themeUtils.setThemeData({ colorPrimary });
        handleThemeChange({ colorPrimary });
      } else if (msgType === 'setThemeData') {
        await themeUtils.setThemeData(data);
        handleThemeChange(data);
      }
    });
  }, []);

  return (
    <IntlProvider locale={localeCustom} messages={messages}>
      <ConfigProvider
        locale={localeAntd}
        theme={{
          token: {
            colorPrimary: primaryColor || ENUM_COLORS.primary,
            colorBgContainer: '#fff',
          },
        }}
      >
        <GlobalContext.Provider
          value={{
            colorPrimary: primaryColor,
            setThemeData: handleThemeChange,
            setLocale: handleLocaleChange,
          }}
        >
          {hasReady && children}
        </GlobalContext.Provider>
      </ConfigProvider>
    </IntlProvider>
  );
}

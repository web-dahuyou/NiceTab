import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { IntlProvider } from 'react-intl';
import { PRIMARY_COLOR, defaultLanguage } from '../constants';
import {
  GlobalContext,
  useAntdLocale,
  useCustomLocale,
  useThemeTypeConfig,
} from '~/entrypoints/common/hooks/global';
import type { BrowserMessageProps, ThemeProps, LanguageTypes, ThemeTypes } from '~/entrypoints/types';
import { themeUtils } from '~/entrypoints/common/storage';

export default function Root({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState('');
  const { locale: localeAntd, changeLocale: changeLocaleAntd } = useAntdLocale();
  const {
    locale: localeCustom,
    changeLocale: changeLocaleCustom,
    messages,
  } = useCustomLocale();
  const { themeTypeConfig, changeThemeType } = useThemeTypeConfig();
  const [hasReady, setHasReady] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(PRIMARY_COLOR);

  const handleLocaleChange = async (languange?: LanguageTypes) => {
    changeLocaleAntd(languange);
    changeLocaleCustom(languange);
  };
  const handleThemeTypeChange = async (themeType: ThemeTypes) => {
    changeThemeType(themeType);
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

  const getManifest = async () => {
    const manifestInfo = await browser.runtime.getManifest();
    setVersion(manifestInfo?.version || '888.888.888');
  }
  // 监听消息
  const messageListener = async (msg: BrowserMessageProps) => {
    // console.log('browser.runtime.onMessage--Root', msg);
    const { msgType, data } = msg || {};
    if (msgType === 'setPrimaryColor') {
      const colorPrimary = data.colorPrimary || PRIMARY_COLOR;
      await themeUtils.setThemeData({ colorPrimary });
      handleThemeChange({ colorPrimary });
    } else if (msgType === 'setThemeData') {
      await themeUtils.setThemeData(data);
      handleThemeChange(data);
    } else if (msgType === 'setThemeType') {
      handleThemeTypeChange(data.themeType);
    } else if (msgType === 'setLocale') {
      handleLocaleChange(data.locale);
    }
  };

  useEffect(() => {
    document.documentElement.lang = localeCustom || defaultLanguage;
  }, [localeCustom]);

  useEffect(() => {
    initThemeData();
    getManifest();
    browser.runtime.onMessage.addListener(messageListener);
  }, []);

  return (
    <IntlProvider locale={localeCustom} messages={messages}>
      <ConfigProvider
        locale={localeAntd}
        theme={{
          cssVar: true,
          hashed: false,
          algorithm: theme[themeTypeConfig.algorithm],
          token: {
            colorPrimary: primaryColor || PRIMARY_COLOR,
            colorBgContainer: themeTypeConfig.bgColor || '#fff',
          },
          components: {
            Tree: {
              motion: false,
              algorithm: true,
            },
          },
        }}
      >
        <GlobalContext.Provider
          value={{
            version,
            colorPrimary: primaryColor,
            themeTypeConfig,
            setThemeType: handleThemeTypeChange,
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

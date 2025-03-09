import type { Runtime } from 'wxt/browser';
import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import { IntlProvider } from 'react-intl';
import { PRIMARY_COLOR, defaultLanguage } from '../constants';
import {
  GlobalContext,
  useAntdLocale,
  useCustomLocale,
  useThemeTypeConfig,
} from '~/entrypoints/common/hooks/global';
import type {
  PageContextType,
  RuntimeMessageEventProps,
  ThemeProps,
  LanguageTypes,
  ThemeTypes,
  SettingsProps,
  PageWidthTypes,
} from '~/entrypoints/types';
import { themeUtils, settingsUtils } from '~/entrypoints/common/storage';
import { updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';

export default function Root({
  pageContext = 'optionsPage',
  children,
}: {
  pageContext: PageContextType;
  children: React.ReactNode;
}) {
  const [$message, messageContextHolder] = message.useMessage();
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
  const [pageWidthType, setPageWidthType] = useState<PageWidthTypes>(
    settingsUtils.settings?.pageWidthType || 'fixed'
  );

  const handleLocaleChange = async (language?: LanguageTypes) => {
    changeLocaleAntd(language);
    changeLocaleCustom(language);
  };
  const handleThemeTypeChange = async (themeType: ThemeTypes) => {
    changeThemeType(themeType);
  };
  const handleThemeChange = async (themeData: Partial<ThemeProps>) => {
    const theme = await themeUtils.setThemeData(themeData);
    setPrimaryColor(theme.colorPrimary);
  };
  const handlePageWidthTypeChange = async (type: PageWidthTypes) => {
    setPageWidthType(type);
  };
  const handleSettingsChange = async (settings: Partial<SettingsProps>) => {
    await settingsUtils.setSettings(settings);
    const { language, pageWidthType = settingsUtils.initialSettings.pageWidthType } =
      settingsUtils.settings || {};
    handleLocaleChange(language);
    handlePageWidthTypeChange(pageWidthType);
  };

  const initData = async () => {
    const settings = await settingsUtils.getSettings();
    handleSettingsChange(settings);
    const theme = await themeUtils.getThemeData();
    setPrimaryColor(theme.colorPrimary);
    setHasReady(true);
  };

  const getManifest = async () => {
    const manifestInfo = await browser.runtime.getManifest();
    setVersion(manifestInfo?.version || '888.888.888');
  };
  // 监听消息
  const messageListener = async (msg: unknown, msgSender: Runtime.MessageSender) => {
    const { msgType, data, targetPageContext } = (msg || {}) as RuntimeMessageEventProps;
    if (targetPageContext && targetPageContext !== pageContext) return;

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
    } else if (msgType === 'reloadAdminPage') {
      const currWindow = await browser.windows.getCurrent();
      if (data.currWindowId !== currWindow.id) {
        updateAdminPageUrlDebounced();
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = localeCustom || defaultLanguage;
  }, [localeCustom]);

  useEffect(() => {
    initData();
    getManifest();
    browser.runtime.onMessage.addListener(messageListener);
  }, []);

  return (
    <IntlProvider locale={localeCustom} messages={messages}>
      <ConfigProvider
        prefixCls="nicetab"
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
            pageWidthType,
            $message,
            setThemeType: handleThemeTypeChange,
            setThemeData: handleThemeChange,
            setSettings: handleSettingsChange,
            setLocale: handleLocaleChange,
            setPageWidthType: handlePageWidthTypeChange,
          }}
        >
          {messageContextHolder}
          {hasReady && children}
        </GlobalContext.Provider>
      </ConfigProvider>
    </IntlProvider>
  );
}

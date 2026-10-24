import type { Runtime } from 'wxt/browser';
import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import { IntlProvider } from 'react-intl';
import {
  defaultLanguage,
  defaultThemeColorName,
  getThemeColorHex,
  THEME_DARK_TOKEN_OVERRIDES,
} from '../constants';
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
  ThemeColors,
  LanguageTypes,
  ThemeTypes,
  SettingsProps,
  PageWidthTypes,
} from '~/entrypoints/types';
import {
  themeUtils,
  settingsUtils,
  initSettingsStorageListener,
  initThemeStorageListener,
} from '~/entrypoints/common/storage';
import { updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';

// 暗色主题算法：衍生token（hover/active/背景等）仍走antd dark算法，
// 但主色钉住为精选值（antd dark算法会把主色加深约14%，在暗色背景下会发暗发闷）
const darkPinnedAlgorithm = (seed: Parameters<typeof theme.darkAlgorithm>[0]) => {
  return {
    ...theme.darkAlgorithm(seed),
    colorPrimary: seed.colorPrimary,
  };
};

export default function Root({
  pageContext = 'optionsPage',
  messageContainer,
  children,
}: {
  pageContext: PageContextType;
  messageContainer?: HTMLElement;
  children: React.ReactNode;
}) {
  const [$message, messageContextHolder] = message.useMessage({
    getContainer: () => messageContainer || document.body,
  });
  const [version, setVersion] = useState('');
  const { locale: localeAntd, changeLocale: changeLocaleAntd } = useAntdLocale();
  const {
    locale: localeCustom,
    changeLocale: changeLocaleCustom,
    messages,
  } = useCustomLocale();
  const { themeTypeConfig, themeType, changeThemeType } = useThemeTypeConfig(pageContext);
  const [hasReady, setHasReady] = useState(false);
  const [colorName, setColorName] = useState<ThemeColors>(defaultThemeColorName);
  const [pageWidthType, setPageWidthType] = useState<PageWidthTypes>('responsive');

  const themeMode = themeTypeConfig.type === 'dark' ? 'dark' : 'light';
  const primaryColor = getThemeColorHex(colorName, themeMode);

  const handleLocaleChange = async (language?: LanguageTypes) => {
    changeLocaleAntd(language);
    changeLocaleCustom(language);
  };
  const handleThemeTypeChange = async (themeType: ThemeTypes) => {
    changeThemeType(themeType);
  };
  const handleThemeChange = async (themeData: Partial<ThemeProps>) => {
    const theme = await themeUtils.setThemeData(themeData);
    setColorName(theme.colorName || defaultThemeColorName);
  };
  const handlePageWidthTypeChange = async (type: PageWidthTypes) => {
    setPageWidthType(type);
  };
  const handleSettingsChange = async (settings: Partial<SettingsProps>) => {
    await settingsUtils.setSettings(settings);
    const {
      language,
      themeType = settingsUtils.initialSettings.themeType,
      pageWidthType = settingsUtils.initialSettings.pageWidthType,
    } = settingsUtils.settings || {};
    handleLocaleChange(language);
    handlePageWidthTypeChange(pageWidthType);
    handleThemeTypeChange(themeType);
  };

  const initData = async () => {
    const settings = await settingsUtils.getSettings();
    handleSettingsChange(settings);
    const theme = await themeUtils.getThemeData();
    setColorName(theme.colorName || defaultThemeColorName);
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
      const colorName = data.colorName || defaultThemeColorName;
      await themeUtils.setThemeData({ colorName });
      handleThemeChange({ colorName });
    } else if (msgType === 'setThemeData') {
      await themeUtils.setThemeData(data);
      handleThemeChange(data);
    } else if (msgType === 'setThemeType') {
      handleThemeTypeChange(data.themeType);
    } else if (msgType === 'setLocale') {
      handleLocaleChange(data.locale);
    } else if (msgType === 'reloadAllAdminPage') {
      updateAdminPageUrlDebounced();
    } else if (msgType === 'reloadOtherAdminPage') {
      const currWindow = await browser.windows.getCurrent();
      if (data.currWindowId !== currWindow.id) {
        updateAdminPageUrlDebounced();
      }
    } else if (msgType === 'showMessage') {
      const { type, content } = data;
      $message[type](content);
    }
  };

  useEffect(() => {
    if (pageContext !== 'contentScriptPage') {
      document.documentElement.lang = localeCustom || defaultLanguage;
    }
  }, [pageContext, localeCustom]);

  useEffect(() => {
    initData();
    getManifest();
    browser.runtime.onMessage.addListener(messageListener);

    const settingsUnwatch = initSettingsStorageListener(() => {
      initData();
    });
    const themeUnwatch = initThemeStorageListener(() => {
      initData();
    });

    return () => {
      settingsUnwatch();
      themeUnwatch();
    };
  }, []);

  return (
    <IntlProvider locale={localeCustom} messages={messages}>
      <ConfigProvider
        prefixCls="nicetab"
        locale={localeAntd}
        theme={{
          cssVar: { key: 'css-var-token-nicetab' },
          hashed: false,

          algorithm: themeMode === 'dark' ? darkPinnedAlgorithm : theme.defaultAlgorithm,
          token: {
            motion: false,
            colorPrimary: primaryColor,
            colorBgContainer: themeTypeConfig.bgColor || '#fff',
            ...(themeMode === 'dark' ? THEME_DARK_TOKEN_OVERRIDES : {}),
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
            colorName,
            themeTypeConfig,
            themeType,
            pageWidthType,
            pageContext,
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

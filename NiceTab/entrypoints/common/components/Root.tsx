import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { ENUM_COLORS } from '../constants';
import { ThemeContext } from '~/entrypoints/common/hooks';
import type { ThemeProps } from '~/entrypoints/types';
import { themeUtils } from '~/entrypoints/common/storage';

export default function Root({ children }: { children: React.ReactNode }) {
  const [hasReady, setHasReady] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(ENUM_COLORS.primary);

  const handleThemeChange = async (themeData: Partial<ThemeProps>) => {
    const theme = await themeUtils.setThemeData(themeData);
    setPrimaryColor(theme.colorPrimary);
  };

  const initThemeData = async () => {
    const theme = await themeUtils.getThemeData();
    setPrimaryColor(theme.colorPrimary);
    setHasReady(true);
  }

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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor || ENUM_COLORS.primary,
          colorBgContainer: '#fff',
        },
      }}
    >
      <ThemeContext.Provider
        value={{ colorPrimary: primaryColor, setThemeData: handleThemeChange }}
      >
        { hasReady && children }
      </ThemeContext.Provider>
    </ConfigProvider>
  );
}

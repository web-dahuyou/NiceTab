import React, { useEffect, useState} from 'react';
import { ConfigProvider } from 'antd';
import { ENUM_COLORS } from '../constants';

export default function Root({children}: {children: React.ReactNode}) {
  const [primaryColor, setPrimaryColor] = useState(ENUM_COLORS.primary);
  useEffect(() => {
    browser.runtime.onMessage.addListener((msg, msgSender, sendResponse) => {
      if (msg.msgType === 'setPrimaryColor') {
        setPrimaryColor(msg.primaryColor);
      }
    })
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor || ENUM_COLORS.primary,
          colorBgContainer: '#fff'
        }
      }}
    >
      { children }
    </ConfigProvider>
  )
}
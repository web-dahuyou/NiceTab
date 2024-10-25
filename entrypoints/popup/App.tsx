import React, { useContext, useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { ThemeProvider } from 'styled-components';
import { theme, Space, Divider } from 'antd';
import {
  CloseOutlined,
  HomeOutlined,
  SettingOutlined,
  ImportOutlined,
  RestOutlined,
} from '@ant-design/icons';
import {
  classNames,
  sendBrowserMessage,
  getFaviconURL,
} from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import './App.css';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getAdminTabInfo } from '~/entrypoints/common/tabs';
import ColorList from '~/entrypoints/common/components/ColorList.tsx';
import { THEME_COLORS } from '~/entrypoints/common/constants';
import {
  StyledActionIconBtn,
  StyledColorItem,
  GlobalStyle,
} from '~/entrypoints/common/style/Common.styled';
import { StyledContainer, StyledList, StyledFavIcon } from './App.styled';

function handleQuickAction(route: { path: string; query?: Record<string, any> }) {
  sendBrowserMessage('openAdminRoutePage', route);
}

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt } = useIntlUtls();
  const { themeTypeConfig } = NiceGlobalContext;
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);

  // 快捷按钮
  const quickActionBtns = [
    {
      path: '/home',
      label: $fmt('common.list'),
      icon: <HomeOutlined />,
      onClick: () => handleQuickAction({ path: '/home' }),
    },
    {
      path: '/settings',
      label: $fmt('common.settings'),
      icon: <SettingOutlined />,
      onClick: () => handleQuickAction({ path: '/settings' }),
    },
    {
      path: '/import-export',
      label: $fmt('common.importExport'),
      icon: <ImportOutlined />,
      onClick: () => handleQuickAction({ path: '/import-export' }),
    },
    {
      label: $fmt('common.recycleBin'),
      path: '/recycle',
      icon: <RestOutlined />,
      onClick: () => handleQuickAction({ path: '/recycle' }),
    },
  ];

  // 切换主题
  const handleThemeChange = (color: string) => {
    const themeData = { colorPrimary: color };
    NiceGlobalContext.setThemeData(themeData);
    sendBrowserMessage('setPrimaryColor', themeData);
  };
  const handleTabItemClick = useCallback((tab: Tabs.Tab) => {
    browser.tabs.highlight({ tabs: [tab.index] });
  }, []);

  const handleDelete = useCallback(
    async (event: React.MouseEvent<HTMLElement, MouseEvent>, tab: Tabs.Tab) => {
      const { tab: adminTab } = await getAdminTabInfo();
      const newTabs = tabs.filter(
        (t) => t.id !== tab.id && t.id !== adminTab?.id && !t.pinned
      );
      setTabs(newTabs);
      tab.id && browser.tabs.remove(tab.id);
      event.stopPropagation();
    },
    [tabs]
  );

  useEffect(() => {
    browser.tabs.query({ currentWindow: true }).then(async (allTabs) => {
      const { tab: adminTab } = await getAdminTabInfo();
      setTabs(allTabs?.filter((t) => t.id !== adminTab?.id && !t.pinned));
    });
  }, []);

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <StyledContainer className="popup-container select-none">
        <GlobalStyle />
        <div className="fixed-top">
          <div className="block quick-actions">
            <span className="block-title">{$fmt('common.view')}：</span>
            <Space
              size={0}
              split={
                <Divider type="vertical" style={{ background: token.colorBorder }} />
              }
            >
              {quickActionBtns.map((item) => (
                <span className="action-btn" key={item.path} onClick={item.onClick}>
                  {' '}
                  {item.label}{' '}
                </span>
              ))}
            </Space>
          </div>
          <div className="block theme-colors">
            <span className="block-title">{$fmt('common.theme')}：</span>
            <ColorList colors={THEME_COLORS} onItemClick={handleThemeChange} />
          </div>

          <div className="tab-list-title">{$fmt('common.openedTabs')}：</div>
        </div>
        <StyledList className="tab-list">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              className={classNames('tab-item', tab.active && 'active')}
              title={tab.title}
              onClick={() => handleTabItemClick(tab)}
            >
              <StyledFavIcon
                className="tab-item-icon"
                $icon={tab.favIconUrl || getFaviconURL(tab.url!)}
              />
              <span className="tab-item-title">{tab.title}</span>
              <StyledActionIconBtn
                className="action-icon-btn"
                $hoverColor="red"
                onClick={(event) => handleDelete(event, tab)}
              >
                <CloseOutlined />
              </StyledActionIconBtn>
            </li>
          ))}
        </StyledList>
      </StyledContainer>
    </ThemeProvider>
  );
}

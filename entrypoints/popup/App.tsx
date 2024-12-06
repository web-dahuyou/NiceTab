import React, { useContext, useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { ThemeProvider } from 'styled-components';
import { theme, Space, Divider } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import {
  classNames,
  sendBrowserMessage,
  getFaviconURL,
} from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import './App.css';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { sendTabMessage, getAdminTabInfo, openNewTab } from '~/entrypoints/common/tabs';
import { settingsUtils } from '~/entrypoints/common/storage';
import type { PopupModuleNames } from '~/entrypoints/types';
import {
  GITHUB_URL,
  THEME_COLORS,
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
} from '~/entrypoints/common/constants';
import ColorList from '~/entrypoints/common/components/ColorList.tsx';
import {
  StyledActionIconBtn,
  GlobalStyle,
} from '~/entrypoints/common/style/Common.styled';
import { StyledContainer, StyledList, StyledFavIcon } from './App.styled';

function handleQuickJump(route: { path: string; query?: Record<string, any> }) {
  sendBrowserMessage('openAdminRoutePage', route);
}

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt } = useIntlUtls();
  const { version, themeTypeConfig } = NiceGlobalContext;
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);
  const [modules, setModules] = useState<PopupModuleNames[]>([]);

  // 快捷跳转
  const quickJumpBtns = [
    {
      path: '/home',
      label: $fmt('common.adminPage'),
      onClick: () => handleQuickJump({ path: '/home' }),
    },
    {
      path: '/shortcuts',
      label: $fmt('common.bindShortcuts'),
      onClick: () => {
        openNewTab('chrome://extensions/shortcuts', {
          active: true,
          openToNext: true,
        });
      },
    },
  ];
  // 操作按钮
  const actionBtns = [
    {
      action: 'reload',
      label: $fmt('common.reload'),
      onClick: () => {
        browser.runtime.reload();
      },
    },
  ];

  // 切换主题
  const handleThemeChange = (color: string) => {
    const themeData = { colorPrimary: color };
    NiceGlobalContext.setThemeData(themeData);
    sendBrowserMessage('setPrimaryColor', themeData);
    sendTabMessage({ msgType: 'setPrimaryColor', data: themeData });
  };
  const handleTabItemClick = useCallback((tab: Tabs.Tab) => {
    browser.tabs.highlight({ tabs: [tab.index] });
  }, []);

  const handleDelete = useCallback(
    async (event: React.MouseEvent<HTMLElement, MouseEvent>, tab: Tabs.Tab) => {
      event.stopPropagation();
      const { tab: adminTab } = await getAdminTabInfo();
      const newTabs = tabs.filter(
        (t) => t.id !== tab.id && t.id !== adminTab?.id && !t.pinned
      );
      setTabs(newTabs);
      if (tab.id) {
        await browser.tabs.remove(tab.id);
        browser.tabs.query({ currentWindow: true }).then(async (allTabs) => {
          setTabs(allTabs?.filter((t) => t.id !== adminTab?.id && !t.pinned));
        });
      }
    },
    [tabs]
  );

  const init = async () => {
    const settings = await settingsUtils.getSettings();
    const modules =
      settings[ENUM_SETTINGS_PROPS.POPUP_MODULE_DISPLAYS] || POPUP_MODULE_NAMES;
    setModules(modules);

    if (modules.includes('openedTabs')) {
      browser.tabs.query({ currentWindow: true }).then(async (allTabs) => {
        const { tab: adminTab } = await getAdminTabInfo();
        setTabs(allTabs?.filter((t) => t.id !== adminTab?.id && !t.pinned));
      });
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <StyledContainer className="popup-container select-none">
        <GlobalStyle />
        <div className="fixed-top">
          {!modules.length && (
            <div className="block quick-actions">
              <span
                className="action-btn"
                onClick={() => openNewTab(GITHUB_URL, { active: true, openToNext: true })}
              >
                {$fmt('common.goToGithub')}
              </span>
            </div>
          )}

          {modules.includes('extensionInfo') && (
            <div className="block version">
              <span className="block-title">{$fmt('common.version')}：</span>
              {version}
            </div>
          )}

          {modules.includes('goto') && (
            <div className="block quick-actions">
              <span className="block-title">{$fmt('common.goto')}：</span>
              <Space
                size={0}
                split={
                  <Divider type="vertical" style={{ background: token.colorBorder }} />
                }
              >
                {quickJumpBtns.map((item) => (
                  <span className="action-btn" key={item.path} onClick={item.onClick}>
                    {item.label}
                  </span>
                ))}
              </Space>
            </div>
          )}
          {modules.includes('actions') && (
            <div className="block quick-actions">
              <span className="block-title">{$fmt('common.actions')}：</span>
              <Space
                size={0}
                split={
                  <Divider type="vertical" style={{ background: token.colorBorder }} />
                }
              >
                {actionBtns.map((item) => (
                  <span className="action-btn" key={item.action} onClick={item.onClick}>
                    {item.label}
                  </span>
                ))}
              </Space>
            </div>
          )}
          {modules.includes('theme') && (
            <div className="block theme-colors">
              <span className="block-title">{$fmt('common.theme')}：</span>
              <ColorList colors={THEME_COLORS} onItemClick={handleThemeChange} />
            </div>
          )}
          {modules.includes('openedTabs') && (
            <div className="tab-list-title">{$fmt('common.openedTabs')}：</div>
          )}
        </div>

        {modules.includes('openedTabs') && (
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
        )}
      </StyledContainer>
    </ThemeProvider>
  );
}

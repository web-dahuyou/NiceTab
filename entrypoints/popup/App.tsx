import React, { useContext, useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { ThemeProvider } from 'styled-components';
import { theme, Space, Dropdown, Button, type MenuProps } from 'antd';
import { CloseOutlined, DownOutlined, CoffeeOutlined } from '@ant-design/icons';
import { classNames, sendRuntimeMessage } from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import './App.css';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getAdminTabInfo, openNewTab, discardOtherTabs } from '~/entrypoints/common/tabs';
import { getMenus, strategyHandler } from '~/entrypoints/common/contextMenus';
import { settingsUtils } from '~/entrypoints/common/storage';
import {
  TAB_EVENTS,
  ENUM_ACTION_NAME,
  SHORTCUTS_PAGE_URL,
} from '~/entrypoints/common/constants';
import type { PopupModuleNames } from '~/entrypoints/types';
import {
  GITHUB_URL,
  THEME_COLORS,
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
} from '~/entrypoints/common/constants';
import ColorList from '~/entrypoints/common/components/ColorList.tsx';
import Favicon from '~/entrypoints/common/components/Favicon';
import {
  StyledActionIconBtn,
  GlobalStyle,
} from '~/entrypoints/common/style/Common.styled';
import { StyledContainer, StyledList } from './App.styled';

import { initFaviconApiData } from '~/entrypoints/common/utils/favicon';
initFaviconApiData();

interface ActionBtnItem {
  key: string;
  label: string;
  type?: 'group';
  disabled?: boolean;
  children?: ActionBtnItem[];
  onClick?: () => void;
}

function handleQuickJump(route: { path: string; query?: Record<string, any> }) {
  sendRuntimeMessage({
    msgType: 'openAdminRoutePage',
    data: route,
    targetPageContexts: ['background'],
  });
}

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt } = useIntlUtls();
  const { version, themeTypeConfig } = NiceGlobalContext;
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);
  const [modules, setModules] = useState<PopupModuleNames[]>([]);
  const [actionBtns, setActionBtns] = useState<ActionBtnItem[]>([]);

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
      disabled: import.meta.env.FIREFOX,
      onClick: () => {
        openNewTab(SHORTCUTS_PAGE_URL, {
          active: true,
          openToNext: true,
        });
      },
    },
  ];

  const handleAction = async (actionType: string, actionName: string) => {
    if (actionType === 'sendTabs') {
      sendRuntimeMessage({
        msgType: 'sendTabsActionStart',
        data: { actionName },
        targetPageContexts: ['background'],
      });
      setTimeout(() => {
        init();
      }, 500);
    } else if (actionType === 'globalSearch') {
      sendRuntimeMessage({
        msgType: 'sendTabsActionStart',
        data: { actionName },
        targetPageContexts: ['background'],
      });
    }
  };
  // 操作按钮
  const getActionBtns = async (): Promise<ActionBtnItem[]> => {
    let menus = await getMenus();
    menus = menus.filter((menu) => menu.id !== ENUM_ACTION_NAME.OPEN_ADMIN_TAB);

    return [
      {
        type: 'group',
        key: 'group-sendTabs',
        label: $fmt('common.sendTabs'),
        children: menus.map((menu) => ({
          key: menu.id!,
          label: menu.title!,
          disabled: menu.enabled === false,
          onClick: () => {
            handleAction('sendTabs', menu.id!);
          },
        })),
      },
      {
        key: 'globalSearch',
        label: $fmt('common.globalSearch'),
        onClick: () => {
          handleAction('globalSearch', 'action:globalSearch');
        },
      },
      {
        key: 'hibernateTabs',
        label: $fmt('common.hibernateTabs'),
        onClick: () => {
          discardOtherTabs();
        },
      },
      {
        key: 'reload',
        label: $fmt('common.reload'),
        onClick: () => {
          browser.runtime.reload();
        },
      },
    ];
  };

  // 切换主题
  const handleThemeChange = (color: string) => {
    const themeData = { colorPrimary: color };
    NiceGlobalContext.setThemeData(themeData);
    sendRuntimeMessage({ msgType: 'setPrimaryColor', data: themeData });
  };
  const handleTabItemClick = useCallback((tab: Tabs.Tab) => {
    browser.tabs.highlight({ tabs: [tab.index] });
  }, []);

  const handleDiscard = useCallback(
    async (event: React.MouseEvent<HTMLElement, MouseEvent>, tab: Tabs.Tab) => {
      event.stopPropagation();
      if (tab.active || tab.discarded) return;

      tab.id && (await browser.tabs.discard(tab.id));
      browser.tabs.query({ currentWindow: true }).then(async (allTabs) => {
        const { tab: adminTab } = await getAdminTabInfo();
        setTabs(allTabs?.filter((t) => t.id !== adminTab?.id && !t.pinned));
      });
    },
    []
  );

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
    const _actionBtns = await getActionBtns();
    setActionBtns(_actionBtns);

    if (modules.includes('openedTabs')) {
      browser.tabs.query({ currentWindow: true }).then(async (allTabs) => {
        const { tab: adminTab } = await getAdminTabInfo();
        setTabs(allTabs?.filter((t) => t.id !== adminTab?.id && !t.pinned));
      });
    }
  };

  useEffect(() => {
    init();
    TAB_EVENTS.forEach((event) => browser.tabs[event]?.addListener(init));
    return () => {
      TAB_EVENTS.forEach((event) => browser.tabs[event]?.removeListener(init));
    };
  }, []);

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <StyledContainer className="popup-container select-none">
        <GlobalStyle />
        <div className="fixed-top">
          {/* 该模块不会渲染，目前未配置模块时，单击扩展图标会直接发送所有标签页，不会打开popup面板 */}
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
          {/* 模块-扩展信息 */}
          {modules.includes('extensionInfo') && (
            <div className="block version">
              <span className="block-title">{$fmt('common.version')}：</span>
              {version}
            </div>
          )}
          {/* 模块-前往 */}
          {modules.includes('goto') && (
            <div className="block quick-actions">
              <span className="block-title">{$fmt('common.goto')}：</span>
              <div className="block-content">
                {quickJumpBtns.map((item) => (
                  <Button
                    size="small"
                    key={item.path}
                    disabled={item.disabled}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* 模块-操作 */}
          {modules.includes('actions') && (
            <div className="block quick-actions">
              <span className="block-title">{$fmt('common.actions')}：</span>
              <div className="block-content">
                {actionBtns.map((item) => {
                  if (item.type === 'group' && item.children?.length) {
                    return (
                      <Dropdown
                        key={item.key}
                        className="actions-dropdown-menus"
                        menu={{
                          items: item.children as MenuProps['items'],
                          onClick: item.onClick,
                        }}
                        placement="bottomLeft"
                      >
                        <Button size="small">
                          <Space>
                            {item.label}
                            <DownOutlined />
                          </Space>
                        </Button>
                      </Dropdown>
                    );
                  } else {
                    return (
                      <Button
                        key={item.key}
                        size="small"
                        disabled={item.disabled}
                        onClick={item.onClick}
                      >
                        {item.label}
                      </Button>
                    );
                  }
                })}
              </div>
            </div>
          )}
          {/* 模块-主题切换 */}
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

        {/* 模块-已打开标签页列表 */}
        {modules.includes('openedTabs') && (
          <StyledList className="tab-list">
            {tabs.map((tab) => (
              <li
                key={tab.id}
                className={classNames(
                  'tab-item',
                  tab.active && 'active',
                  tab.discarded && 'discarded'
                )}
                title={tab.title}
                onClick={() => handleTabItemClick(tab)}
              >
                <Favicon pageUrl={tab.url!} favIconUrl={tab.favIconUrl}></Favicon>
                <span className="tab-item-title">{tab.title}</span>

                {!tab.active && (
                  <StyledActionIconBtn
                    className={classNames(
                      'action-icon-btn',
                      tab.discarded && 'btn-discarded'
                    )}
                    $size={16}
                    title={$fmt(tab.discarded ? 'common.hibernated' : 'common.hibernate')}
                    onClick={(event) => handleDiscard(event, tab)}
                  >
                    <CoffeeOutlined />
                  </StyledActionIconBtn>
                )}

                <StyledActionIconBtn
                  className="action-icon-btn"
                  $size={16}
                  $hoverColor="red"
                  title={$fmt('common.remove')}
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

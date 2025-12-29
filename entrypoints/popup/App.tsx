import { useContext, useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { ThemeProvider } from 'styled-components';
import { theme, Space, Dropdown, Button, type MenuProps, Tooltip } from 'antd';
import {
  DownOutlined,
  CompressOutlined,
  ExpandOutlined,
  HomeOutlined,
  KeyOutlined,
  ReadOutlined,
  SendOutlined,
  SearchOutlined,
  CoffeeOutlined,
  CloudSyncOutlined,
  ReloadOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { sendRuntimeMessage, isGroupSupported } from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import './App.css';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import {
  getAdminTabInfo,
  openNewTab,
  discardOtherTabs,
  openUserGuide,
} from '~/entrypoints/common/tabs';
import { getMenus } from '~/entrypoints/common/contextMenus';
import { settingsUtils, stateUtils } from '~/entrypoints/common/storage';
import { TAB_EVENTS, SHORTCUTS_PAGE_URL } from '~/entrypoints/common/constants';
import type { PopupModuleNames } from '~/entrypoints/types';
import {
  GITHUB_URL,
  THEME_COLORS,
  ENUM_SETTINGS_PROPS,
  ENUM_ACTION_NAME,
  POPUP_MODULE_NAMES,
} from '~/entrypoints/common/constants';
import ColorList from '~/entrypoints/common/components/ColorList.tsx';
import { GlobalStyle } from '~/entrypoints/common/style/Common.styled';
import TabGroupItem, { type GroupListItem } from './TabGroupItem';
import { type TabActions } from './TabItem';
import { StyledContainer } from './App.styled';

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
  const { $fmt, locale } = useIntlUtls();
  const { version, themeTypeConfig } = NiceGlobalContext;
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);
  const [tabGroupList, setTabGroupList] = useState<GroupListItem[]>([]);
  const [modules, setModules] = useState<PopupModuleNames[]>([]);
  const [actionBtns, setActionBtns] = useState<ActionBtnItem[]>([]);
  const [isCompact, setIsCompact] = useState(true);

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
    {
      path: '/user-guide',
      label: $fmt('common.userGuide'),
      onClick: () => {
        openUserGuide();
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
    } else {
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
    menus = menus.filter(menu => menu.tag === 'sendTabs');

    return [
      {
        type: 'group',
        key: 'group-sendTabs',
        label: $fmt('common.sendTabs'),
        children: menus.map(menu => ({
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
          handleAction('globalSearch', ENUM_ACTION_NAME.GLOBAL_SEARCH);
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
        key: 'startSync',
        label: $fmt('common.startSync'),
        onClick: () => {
          handleAction('startSync', ENUM_ACTION_NAME.START_SYNC);
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
  const handleTabActive = useCallback((tab: Tabs.Tab) => {
    browser.tabs.highlight({ tabs: [tab.index] });
  }, []);

  const handleTabDiscard = useCallback(async (tab: Tabs.Tab) => {
    if (tab.active || tab.discarded) return;

    tab.id && (await browser.tabs.discard(tab.id));
    browser.tabs.query({ currentWindow: true }).then(async allTabs => {
      const { tab: adminTab } = await getAdminTabInfo();
      handleTabsChange(allTabs?.filter(t => t.id !== adminTab?.id && !t.pinned));
    });
  }, []);

  const handleTabRemove = useCallback(
    async (tab: Tabs.Tab) => {
      const { tab: adminTab } = await getAdminTabInfo();
      const newTabs = tabs.filter(
        t => t.id !== tab.id && t.id !== adminTab?.id && !t.pinned,
      );
      handleTabsChange(newTabs);
      if (tab.id) {
        await browser.tabs.remove(tab.id);
        browser.tabs.query({ currentWindow: true }).then(async allTabs => {
          handleTabsChange(allTabs?.filter(t => t.id !== adminTab?.id && !t.pinned));
        });
      }
    },
    [tabs],
  );

  const handleTabAction = useCallback(
    async (action: TabActions, tab: Tabs.Tab) => {
      if (action === 'active') {
        handleTabActive(tab);
      } else if (action === 'discard') {
        handleTabDiscard(tab);
      } else if (action === 'remove') {
        handleTabRemove(tab);
      }
    },
    [tabs],
  );

  const handleTabsChange = useCallback(async (tabs: Tabs.Tab[]) => {
    setTabs(tabs);
    let groupList: GroupListItem[] = [];
    if (!isGroupSupported()) {
      groupList = tabs.map(item => ({
        groupId: -1,
        groupName: '',
        tabs: [item],
      }));
    } else {
      groupList = tabs.reduce<GroupListItem[]>((result, tab) => {
        const groupId = tab.groupId || -1;
        if (groupId === -1) {
          return result.concat({ groupId: -1, groupName: '', tabs: [tab] });
        }

        const group = result.find(item => item.groupId === groupId);
        if (!group) {
          return result.concat({ groupId, groupName: '', tabs: [tab] });
        }

        group.tabs.push(tab);
        return result;
      }, []);

      if (browser.tabGroups?.get) {
        for (const group of groupList) {
          if (group.groupId === -1) continue;
          const tabGroup = await browser.tabGroups.get(group.groupId);
          console.log('tabGroup', tabGroup);
          group.groupName = tabGroup?.title || group.groupName;
          group.collapsed = tabGroup?.collapsed;
          group.color = tabGroup?.color;
        }
      }
    }
    console.log('groupList', groupList);
    setTabGroupList(groupList);
  }, []);

  const init = async () => {
    const settings = await settingsUtils.getSettings();
    const modules =
      settings[ENUM_SETTINGS_PROPS.POPUP_MODULE_DISPLAYS] || POPUP_MODULE_NAMES;
    setModules(modules);
    const _actionBtns = await getActionBtns();
    setActionBtns(_actionBtns);

    const popupState = await stateUtils.getState('popup');
    setIsCompact(!!popupState?.isCompact);

    if (modules.includes('openedTabs')) {
      browser.tabs.query({ currentWindow: true }).then(async allTabs => {
        const { tab: adminTab } = await getAdminTabInfo();
        handleTabsChange(allTabs?.filter(t => t.id !== adminTab?.id && !t.pinned));
      });
    }
  };

  useEffect(() => {
    init();
    TAB_EVENTS.forEach(event => browser.tabs[event]?.addListener(init));
    return () => {
      TAB_EVENTS.forEach(event => browser.tabs[event]?.removeListener(init));
    };
  }, []);

  const toggleCompact = () => {
    const newState = !isCompact;
    setIsCompact(newState);
    stateUtils.setStateByModule('popup', { isCompact: newState });
  };

  const getActionIcon = (key: string, path?: string) => {
    if (path === '/home') return <HomeOutlined />;
    if (path === '/shortcuts') return <KeyOutlined />;
    if (path === '/user-guide') return <ReadOutlined />;

    if (key === 'group-sendTabs') return <SendOutlined />;
    if (key === 'globalSearch') return <SearchOutlined />;
    if (key === 'hibernateTabs') return <CoffeeOutlined />;
    if (key === 'startSync') return <CloudSyncOutlined />;
    if (key === 'reload') return <ReloadOutlined />;
    return null;
  };

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <StyledContainer className="popup-container select-none">
        <GlobalStyle />

        <div className={`fixed-top ${isCompact ? 'compact' : ''}`}>
          <Tooltip
            title={$fmt(isCompact ? 'common.expand' : 'common.collapse')}
            placement="bottom"
          >
            <Button
              className="toggle-compact-btn"
              type="text"
              icon={isCompact ? <ExpandOutlined /> : <CompressOutlined />}
              onClick={toggleCompact}
            />
          </Tooltip>
          {isCompact ? (
            <div className="compact-toolbar">
              {/* GitHub */}
              <Tooltip title={$fmt('common.goToGithub')} placement="bottom">
                <Button
                  type="text"
                  icon={<GithubOutlined />}
                  onClick={() =>
                    openNewTab(GITHUB_URL, { active: true, openToNext: true })
                  }
                />
              </Tooltip>

              {/* Goto Actions */}
              {modules.includes('goto') &&
                quickJumpBtns
                  .filter(item => !item.disabled)
                  .map(item => (
                    <Tooltip key={item.path} title={item.label} placement="bottom">
                      <Button
                        type="text"
                        icon={getActionIcon('', item.path)}
                        onClick={item.onClick}
                      />
                    </Tooltip>
                  ))}

              {/* Functional Actions */}
              {modules.includes('actions') &&
                actionBtns.map(item => {
                  if (item.type === 'group' && item.children?.length) {
                    return (
                      <Dropdown
                        key={item.key}
                        menu={{
                          items: item.children as MenuProps['items'],
                          onClick: item.onClick,
                        }}
                        placement="bottomLeft"
                      >
                        <Button type="text" icon={getActionIcon(item.key)} />
                      </Dropdown>
                    );
                  } else {
                    return (
                      <Tooltip key={item.key} title={item.label} placement="bottom">
                        <Button
                          type="text"
                          disabled={item.disabled}
                          onClick={item.onClick}
                          icon={getActionIcon(item.key)}
                        />
                      </Tooltip>
                    );
                  }
                })}
            </div>
          ) : (
            <>
              {/* 该模块不会渲染，目前未配置模块时，单击扩展图标会直接发送所有标签页，不会打开popup面板 */}
              {!modules.length && (
                <div className="block quick-actions">
                  <span
                    className="action-btn"
                    onClick={() =>
                      openNewTab(GITHUB_URL, { active: true, openToNext: true })
                    }
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
                    {quickJumpBtns
                      .filter(item => !item.disabled)
                      .map(item => (
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
                    {actionBtns.map(item => {
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
            </>
          )}
        </div>

        {/* 模块-已打开标签页列表 */}
        {modules.includes('openedTabs') && tabGroupList.length && (
          <div className="block-opened-tabs">
            {tabGroupList.map((group, index) => (
              <TabGroupItem
                key={~group.groupId || index}
                group={group}
                onAction={handleTabAction}
              ></TabGroupItem>
            ))}
          </div>
        )}
      </StyledContainer>
    </ThemeProvider>
  );
}

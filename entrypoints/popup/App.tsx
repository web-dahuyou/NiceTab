import React, { useContext, useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { theme, Space, Divider, Button } from 'antd';
import {
  CloseOutlined,
  HomeOutlined,
  SettingOutlined,
  ImportOutlined,
  RestOutlined
} from '@ant-design/icons';
import { classNames, sendBrowserMessage } from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import './App.css';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { StyledActionIconBtn, StyledColorItem } from '~/entrypoints/common/style/Common.styled';
import { StyledContainer, StyledList, StyledFavIcon } from './App.styled';
import { THEME_COLORS } from '~/entrypoints/common/constants';
import { ColorItem } from '~/entrypoints/types';


function handleQuickAction(route: { path: string; query?: Record<string, any> }) {
  sendBrowserMessage('openAdminRoutePage', route);
}

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt, locale } = useIntlUtls();
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
  const handleThemeChange = (item: ColorItem) => {
    const themeData = { colorPrimary: item.color };
    NiceGlobalContext.setThemeData(themeData);
    sendBrowserMessage('setPrimaryColor', themeData);
  };
  const handleTabItemClick = useCallback((index: number) => {
    browser.tabs.highlight({ tabs: index });
  }, []);

  const handleDelete = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>, tab: Tabs.Tab) => {
      const newTabs = tabs.filter((t) => t.id !== tab.id);
      setTabs(newTabs);
      tab.id && browser.tabs.remove(tab.id);
      event.stopPropagation();
    },
    [tabs]
  );

  useEffect(() => {
    browser.tabs.query({ currentWindow: true }).then((allTabs) => {
      setTabs(allTabs);
    });
  }, []);

  return (
    <StyledContainer className="popup-container select-none" $primaryColor={token.colorPrimary}>
      <div className="block quick-actions">
        <span className="block-title">{$fmt('common.view')}：</span>
        <Space size={0} split={<Divider type="vertical" style={{ background: token.colorBorder }} />}>
          {quickActionBtns.map((item) => (
            <span className="action-btn" key={item.path} onClick={item.onClick}> {item.label} </span>
          ))}
        </Space>
      </div>
      <div className="block theme-colors">
        <span className="block-title">{$fmt('common.theme')}：</span>
        <Space>
          {THEME_COLORS.map((item) => (
            <StyledColorItem
              className={classNames(
                "theme-color-item",
                item?.color?.toLowerCase() === token?.colorPrimary?.toLowerCase() && 'active'
              )}
              key={item.key}
              style={{ background: item.color }}
              onClick={() => handleThemeChange(item)}
            ></StyledColorItem>
          ))}
        </Space>
      </div>

      <div className="tab-list-title">{$fmt('common.openedTabs')}：</div>
      <StyledList className="tab-list" $primaryColor={token.colorPrimary} $bgColor={token.colorPrimaryBg}>
        {tabs.map((tab, index) => (
          <li
            key={tab.id}
            className={classNames('tab-item', tab.active && 'active')}
            title={tab.title}
            onClick={() => handleTabItemClick(index)}
          >
            {tab.favIconUrl && (
              <StyledFavIcon className="tab-item-icon" $icon={tab.favIconUrl} />
            )}
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
  );
}

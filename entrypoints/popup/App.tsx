import React, { useContext, useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { theme, Space, Button } from 'antd';
import {
  CloseOutlined,
  HomeOutlined,
  SettingOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { classNames, sendBrowserMessage } from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import './App.css';
import { ThemeContext } from '~/entrypoints/common/hooks';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledContainer, StyledList, StyledFavIcon } from './App.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';

const colors = Object.entries(ENUM_COLORS).map(([key, color]) => {
  return { key, color: typeof color === 'string' ? color : color.primary || color[6] };
});

function handleQuickAction(route: { path: string; query?: Record<string, any> }) {
  sendBrowserMessage('openAdminRoutePage', route);
}
// 快捷按钮
const quickActionBtns = [
  {
    path: '/home',
    label: '查看列表',
    icon: <HomeOutlined />,
    onClick: () => handleQuickAction({ path: '/home' }),
  },
  {
    path: '/settings',
    label: '查看设置',
    icon: <SettingOutlined />,
    onClick: () => handleQuickAction({ path: '/settings' }),
  },
  {
    path: '/import-export',
    label: '导入导出',
    icon: <ImportOutlined />,
    onClick: () => handleQuickAction({ path: '/import-export' }),
  },
];

export default function App() {
  const { token } = theme.useToken();
  const themeContext = useContext(ThemeContext);
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);

  const handleThemeChange = (item: { key: string; color: string }) => {
    const themeData = { colorPrimary: item.color };
    themeContext.setThemeData(themeData);
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
    <StyledContainer className="popup-container">
      <div className="block quick-actions">
        {quickActionBtns.map((item) => (
          <Button
            type="primary"
            size="small"
            icon={item.icon}
            onClick={item.onClick}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="block theme-colors">
        <span className="block-title">切换主题：</span>
        <Space>
          {colors.map((item) => (
            <div
              className="theme-color-item"
              key={item.key}
              style={{ background: item.color }}
              onClick={() => handleThemeChange(item)}
            ></div>
          ))}
        </Space>
      </div>

      <div className="tab-list-title">打开的标签页：</div>
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

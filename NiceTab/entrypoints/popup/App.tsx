import React, { useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { theme } from 'antd';
import { CloseCircleOutlined, PushpinOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import './App.css';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledList, StyledFavIcon } from './App.styled';

function App() {
  const { token } = theme.useToken();
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);

  const handleItemClick = useCallback((index: number) => {
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
    <StyledList className="tab-list" $primaryColor={token.colorPrimary}>
      {tabs.map((tab, index) => (
        <li
          key={tab.id}
          className={classNames('tab-item', tab.active && 'active')}
          title={tab.title}
          onClick={() => handleItemClick(index)}
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
            <CloseCircleOutlined />
          </StyledActionIconBtn>
        </li>
      ))}
    </StyledList>
  );
}

export default App;

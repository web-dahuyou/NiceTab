import React, { useCallback, useEffect, useState } from 'react';
import { Menu } from 'antd';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import styled, { css } from 'styled-components';
import Home from './Home.tsx';
import Settings from './Settings.tsx';

import '~/assets/css/reset.css';
import './style.css';

const StyledPageContainer = styled.div`
  background: #fff;

  .header-navbar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    height: 60px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    .logo {
      width: 100px;
      height: 100%;
    }
  }
  .main-content {
    position: relative;
    width: 1200px;
    padding: 100px 32px 60px;
    margin: 0 auto;
  }
  @media screen and (min-width: 576px) and (max-width: 767px) {
    .main-content {
      width: 100%;
    }
  }
  @media screen and (min-width: 768px) and (max-width: 991px) {
    .main-content {
      max-width: 800px;
    }
  }
  @media screen and (min-width: 992px) and (max-width: 1199px) {
    .main-content {
      max-width: 900px;
    }
  }
  @media screen and (min-width: 1200px) {
    .main-content {
      width: 1120px;
    }
  }
`;

interface NavProps {
  key: string;
  label: string;
  icon?: JSX.Element;
  component: JSX.Element;
}

const navs: NavProps[] = [
  { key: 'home', label: '首页', icon: <HomeOutlined />, component: <Home /> },
  {
    key: 'settings',
    label: '设置',
    icon: <SettingOutlined />,
    component: <Settings />,
  },
];

function App() {
  const [currNav, setCurrNav] = useState<NavProps>(navs[0]);
  const onSelect = useCallback(({ key }: { key: NavProps['key'] }) => {
    const nav = navs.find((item) => item.key === key);
    nav && setCurrNav(nav);
  }, []);

  return (
    <StyledPageContainer className="page-container">
      <div className="header-navbar">
        <div className="logo"></div>
        <Menu
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          items={navs}
          onSelect={onSelect}
        />
      </div>
      <div className="main-content">{currNav.component}</div>
    </StyledPageContainer>
  );
}

export default App;

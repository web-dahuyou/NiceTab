import React, { useCallback, useState, useEffect } from 'react';
import { createHashRouter, RouterProvider, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu } from 'antd';
import { HomeOutlined, SettingOutlined, ImportOutlined } from '@ant-design/icons';
import styled, { css } from 'styled-components';
import { pick } from '~/entrypoints/common/utils';
import Home from './home/index.tsx';
import Settings from './Settings.tsx';
import ImportExport from './importExport/index.tsx';

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
    .navbar-menu {
      flex: 1;
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
  path: string;
  icon?: JSX.Element;
  element: JSX.Element;
}

const navs: NavProps[] = [
  { key: 'home', label: '列表', path: '/home', icon: <HomeOutlined />, element: <Home /> },
  {
    key: 'settings',
    label: '设置',
    path: '/settings',
    icon: <SettingOutlined />,
    element: <Settings />,
  },
  {
    key: 'import-export',
    label: '导入/导出',
    path: '/import-export',
    icon: <ImportOutlined />,
    element: <ImportExport />,
  },
];

const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      ...navs.map((item) => pick(item, ['path', 'element']))
    ],
  },
]);

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const onSelect = useCallback(({ key }: { key: NavProps['key'] }) => {
    const nav = navs.find((item) => item.key === key);
    if (nav) {
      nav && navigate(nav.path);
    }
  }, []);

  useEffect(() => {
    const nav = navs.find((item) => item.path === location.pathname);
    setSelectedKeys([nav?.key || 'home']);
  }, [location.pathname]);

  return (
    <StyledPageContainer className="page-container">
      <div className="header-navbar">
        <div className="logo"></div>
        <Menu
          className="navbar-menu"
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          selectedKeys={selectedKeys}
          items={navs}
          onSelect={onSelect}
        />
      </div>
      <div className="main-content">
        <Outlet></Outlet>
      </div>
    </StyledPageContainer>
  );
}

export default function AppRoute() {
  return <RouterProvider router={router} />
};

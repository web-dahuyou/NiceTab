import { useContext, useCallback, useState, useEffect, useMemo } from 'react';
import {
  createHashRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { theme, Menu, Dropdown, Flex, Space, Tooltip } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  ImportOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { classNames, pick, sendBrowserMessage } from '~/entrypoints/common/utils';
import '~/assets/css/reset.css';
import './style.css';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks';
import { StyledActionIconBtn, StyledColorItem } from '~/entrypoints/common/style/Common.styled';
import Home from './home/index.tsx';
import Settings from './Settings.tsx';
import ImportExport from './importExport/index.tsx';
import { LANGUANGE_OPTIONS, THEME_COLORS } from '~/entrypoints/common/constants';
import { ColorItem } from '~/entrypoints/types';
import themeIcon from '/icon/theme.svg';

// const StyledColorList = styled.div`
//   display: flex;
//   gap: 12px;
// `;

// 主题色分组
function ColorListMarkup({
  list,
  onItemClick,
}: {
  list: ColorItem[];
  onItemClick?: (item: ColorItem) => void;
}) {
  const { token } = theme.useToken();
  return (
    <Flex className="color-list" wrap="wrap" gap={12}>
      {list.map((item) => (
        <StyledColorItem
          className={classNames(
            "color-item",
            item?.color?.toLowerCase() === token?.colorPrimary?.toLowerCase() && 'active'
          )}
          key={item.key}
          style={{ background: item.color }}
          onClick={() => onItemClick?.(item)}
        ></StyledColorItem>
      ))}
    </Flex>
  );
}

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
    background: #fff;
    .logo {
      width: 100px;
      height: 100%;
      background: url('/icon/logo.png') no-repeat center / 30px 30px;
    }
    .navbar-menu {
      flex: 1;
    }
    .menu-right {
      display: flex;
      align-items: center;
      padding: 0 24px;
    }
  }
  .main-content {
    position: relative;
    width: 1200px;
    padding: 100px 32px 60px;
    margin: 0 auto;
  }
  @media screen and (max-width: 1199px) {
    .main-content {
      max-width: 100%;
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

const navsTemplate: NavProps[] = [
  {
    key: 'home',
    label: 'common.list',
    path: '/home',
    icon: <HomeOutlined />,
    element: <Home />,
  },
  {
    key: 'settings',
    label: 'common.settings',
    path: '/settings',
    icon: <SettingOutlined />,
    element: <Settings />,
  },
  {
    key: 'import-export',
    label: 'common.importExport',
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
        path: '/',
        element: <Home />,
      },
      ...navsTemplate.map((item) => pick(item, ['path', 'element'])),
    ],
  },
]);

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const NiceGlobalContext = useContext(GlobalContext);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const { $fmt, locale } = useIntlUtls();
  const navs = useMemo(() => {
    return navsTemplate.map((item) => {
      return { ...item, label: $fmt(item.label) };
    });
  }, [$fmt]);

  // 导航菜单
  const onSelect = useCallback(({ key }: { key: NavProps['key'] }) => {
    const nav = navs.find((item) => item.key === key);
    if (nav) {
      nav && navigate(nav.path);
    }
  }, []);
  // 切换主题
  const handleThemeChange = (item: ColorItem) => {
    const themeData = { colorPrimary: item.color };
    NiceGlobalContext.setThemeData(themeData);
    sendBrowserMessage('setPrimaryColor', themeData);
  };
  // 切换语言
  const handleLocaleChange = useCallback(({ key }: { key: string }) => {
    const option = LANGUANGE_OPTIONS.find((item) => item.key === key) || {
      locale: 'zh-CN',
    };
    NiceGlobalContext.setLocale(option.locale);
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
        <Space className="menu-right" align="center">
          {/* theme */}
          <Tooltip
            placement="bottomLeft"
            color="#fff"
            title={<ColorListMarkup list={THEME_COLORS} onItemClick={handleThemeChange} />}
            arrow={false}
            fresh
          >
            <StyledActionIconBtn $size={18} title={$fmt('common.theme')}>
              <img src={themeIcon} alt="" />
            </StyledActionIconBtn>
          </Tooltip>
          {/* languange */}
          <Dropdown
            menu={{
              items: LANGUANGE_OPTIONS,
              selectedKeys: [locale],
              onClick: handleLocaleChange,
            }}
            placement="bottomRight"
          >
            <StyledActionIconBtn $size={18} title={$fmt('common.language')}>
              <TranslationOutlined />
            </StyledActionIconBtn>
          </Dropdown>
        </Space>
      </div>
      <div className="main-content">
        <Outlet></Outlet>
      </div>
    </StyledPageContainer>
  );
}

export default function AppRoute() {
  return <RouterProvider router={router} />;
}

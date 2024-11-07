import { useContext, useCallback, useState, useEffect, useMemo } from 'react';
import {
  createHashRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  theme,
  Menu,
  Dropdown,
  Flex,
  Space,
  Tooltip,
  Typography,
  FloatButton,
} from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  ImportOutlined,
  SyncOutlined,
  TranslationOutlined,
  RestOutlined,
  GithubOutlined,
  MoonOutlined,
  SunOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import styled, { ThemeProvider } from 'styled-components';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import { IconTheme } from '~/entrypoints/common/components/icon/CustomIcon';
import ColorList from '~/entrypoints/common/components/ColorList.tsx';
import { classNames, pick, sendBrowserMessage } from '~/entrypoints/common/utils';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import useUpdate from '~/entrypoints/common/hooks/update';
import {
  GITHUB_URL,
  LANGUANGE_OPTIONS,
  THEME_COLORS,
  defaultThemeType,
} from '~/entrypoints/common/constants';
import { openNewTab } from '~/entrypoints/common/tabs';
import {
  StyledActionIconBtn,
  GlobalStyle,
} from '~/entrypoints/common/style/Common.styled';
import type { StyledThemeProps } from '~/entrypoints/types';
import Home from './home/index.tsx';
import Settings from './settings/index.tsx';
import ImportExport from './importExport/index.tsx';
import SyncPage from './sync/index.tsx';
import RecycleBin from './recycleBin/index.tsx';

const StyledPageContainer = styled.div<{ theme: StyledThemeProps }>`
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
    // box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    box-shadow: ${(props) =>
      props.theme.boxShadow || '0 2px 12px 3px rgba(0, 0, 0, 0.1)'};
    background: ${(props) => props.theme.colorBgContainer || '#fff'};

    .logo {
      width: 100px;
      height: 100%;
      background: url('/icon/logo.png') no-repeat center / 30px 30px;
    }
    .navbar-menu {
      flex: 1;
      margin-left: 16px;
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
    padding: 100px 32px 40px;
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
  {
    key: 'sync',
    label: 'common.sync',
    path: '/sync',
    icon: <SyncOutlined />,
    element: <SyncPage />,
  },
  {
    key: 'recycleBin',
    label: 'common.recycleBin',
    path: '/recycle',
    icon: <RestOutlined />,
    element: <RecycleBin />,
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
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { updateDetail, updateReload } = useUpdate();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const { $fmt, locale } = useIntlUtls();
  const { version, themeTypeConfig } = NiceGlobalContext;
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
  // 切换主题类型
  const handleThemeTypeChange = () => {
    const currThemeType = themeTypeConfig.type || defaultThemeType;
    const themeType = currThemeType === 'light' ? 'dark' : 'light';
    NiceGlobalContext.setThemeType(themeType);
    sendBrowserMessage('setThemeType', { themeType });
  };
  // 切换主题
  const handleThemeChange = (color: string) => {
    const themeData = { colorPrimary: color };
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
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <StyledPageContainer className="page-container">
        <GlobalStyle />
        <div className="header-navbar select-none">
          {/* <div className="logo"></div> */}
          <Menu
            className="navbar-menu"
            theme="light"
            mode="horizontal"
            defaultSelectedKeys={['home']}
            selectedKeys={selectedKeys}
            items={navs}
            onSelect={onSelect}
          />

          {updateDetail?.updateAvailable && (
            <Space className="header-tip select-none" style={{ margin: '0 12px' }}>
              <Typography.Text type="warning">
                {$fmt({
                  id: 'common.update.available',
                  values: { version: updateDetail?.version || <SmileOutlined /> },
                })}
                :
              </Typography.Text>
              <Typography.Link href="javascript:void(0);" onClick={updateReload}>
                {$fmt('common.update.upgradeNow')}
              </Typography.Link>
            </Space>
          )}

          <Space className="menu-right select-none" align="center" size="middle">
            <div>
              {$fmt('common.version')}: {version}
            </div>
            {/* theme */}
            <Tooltip
              placement="bottom"
              color={token.colorBgElevated}
              title={
                <ColorList
                  colors={THEME_COLORS}
                  gap={12}
                  style={{ padding: '6px' }}
                  onItemClick={handleThemeChange}
                />
              }
              arrow={false}
              fresh
            >
              <StyledActionIconBtn $size={18} title={$fmt('common.theme')}>
                <IconTheme></IconTheme>
              </StyledActionIconBtn>
            </Tooltip>
            {/* theme type */}
            <StyledActionIconBtn
              $size={18}
              title={$fmt('common.toggleThemeType')}
              onClick={handleThemeTypeChange}
            >
              {themeTypeConfig.type === 'light' ? <SunOutlined /> : <MoonOutlined />}
            </StyledActionIconBtn>
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
            {/* github */}
            <StyledActionIconBtn
              $size={18}
              title={$fmt('common.goToGithub')}
              onClick={() => openNewTab(GITHUB_URL, { active: true, openToNext: true })}
            >
              <GithubOutlined />
            </StyledActionIconBtn>
          </Space>
        </div>
        <div className="main-content">
          <Outlet></Outlet>
        </div>

        {/* 回到顶部 */}
        <FloatButton.Group shape="circle" style={{ right: 30, bottom: 90 }}>
          {/* BackTop组件自带的 tooltip 在点击按钮时会闪 */}
          <span title={$fmt('common.backToTop')}>
            <FloatButton.BackTop duration={100} visibilityHeight={400} />
          </span>
        </FloatButton.Group>
      </StyledPageContainer>
    </ThemeProvider>
  );
}

export default function AppRoute() {
  return <RouterProvider router={router} />;
}

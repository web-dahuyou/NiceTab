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
  Space,
  Tooltip,
  Typography,
  FloatButton,
  type MenuProps,
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
  SendOutlined,
  MenuOutlined,
  ReloadOutlined,
  KeyOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import styled, { ThemeProvider } from 'styled-components';
import '~/assets/css/reset.css';
import '~/assets/css/index.css';
import { IconTheme } from '~/entrypoints/common/components/icon/CustomIcon';
import ColorList from '~/entrypoints/common/components/ColorList.tsx';
import { pick, sendRuntimeMessage } from '~/entrypoints/common/utils';
import { ENUM_ACTION_NAME, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { actionHandler } from '../common/contextMenus';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { settingsUtils } from '~/entrypoints/common/storage';
import useUpdate from '~/entrypoints/common/hooks/update';
import {
  GITHUB_URL,
  LANGUAGE_OPTIONS,
  THEME_COLORS,
  defaultThemeType,
} from '~/entrypoints/common/constants';
import { openNewTab, discardOtherTabs } from '~/entrypoints/common/tabs';
import {
  StyledActionIconBtn,
  GlobalStyle,
} from '~/entrypoints/common/style/Common.styled';
import type {
  StyledThemeProps,
  PageModuleNames,
  PageWidthTypes,
} from '~/entrypoints/types';
import Home from './home/index.tsx';
import Settings from './settings/index.tsx';
import ImportExport from './importExport/index.tsx';
import SyncPage from './sync/index.tsx';
import RecycleBin from './recycleBin/index.tsx';
import SendTargetActionHolder, {
  type SendTargetActionHolderProps,
} from '~/entrypoints/options/home/SendTargetActionHolder';
import { type LocaleKeys } from '~/entrypoints/common/locale';

const { SHOW_SEND_TARGET_MODAL } = ENUM_SETTINGS_PROPS;

const StyledPageContainer = styled.div<{
  theme: StyledThemeProps;
  $widthType: PageWidthTypes;
}>`
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
      width: ${(props) => (props.$widthType === 'fixed' ? '1200px' : '100%')};
    }
  }
`;

interface NavProps {
  key: PageModuleNames;
  label: LocaleKeys;
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
    key: 'recycle-bin',
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
  const sendTargetActionRef = useRef<SendTargetActionHolderProps>();

  const { version, themeTypeConfig, pageWidthType } = NiceGlobalContext;
  const navs = useMemo(() => {
    return navsTemplate.map((item) => {
      return { ...item, label: $fmt(item.label) };
    });
  }, [$fmt]);

  // 导航菜单
  const onSelect = useCallback(({ key }: { key: string }) => {
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
    sendRuntimeMessage({ msgType: 'setThemeType', data: { themeType } });
  };
  // 切换主题
  const handleThemeChange = (color: string) => {
    const themeData = { colorPrimary: color };
    NiceGlobalContext.setThemeData(themeData);
    sendRuntimeMessage({ msgType: 'setPrimaryColor', data: themeData });
  };
  // 切换语言
  const handleLocaleChange = useCallback(({ key }: { key: string }) => {
    const option = LANGUAGE_OPTIONS.find((item) => item.key === key) || {
      locale: 'zh-CN',
    };
    NiceGlobalContext.setLocale(option.locale);
    sendRuntimeMessage({ msgType: 'setLocale', data: { locale: option.locale } });
  }, []);

  const handleSendAllTabs = useCallback(async () => {
    // 这里之所以没有直接使用 strategyHandler 方法，是因为在 option 页面中发送消息，本页面是不会监听到 runtimeMessage 消息的
    const settings = await settingsUtils.getSettings();
    if (settings[SHOW_SEND_TARGET_MODAL]) {
      sendTargetActionRef.current?.show?.({ actionName: ENUM_ACTION_NAME.SEND_ALL_TABS });
    } else {
      // 该方法会直接发送，不会显示发送目标选择弹窗
      actionHandler(ENUM_ACTION_NAME.SEND_ALL_TABS);
    }
  }, []);

  // 插件操作选项
  const extActionOptions: MenuProps['items'] = [
    { key: 'sendAllTabs', icon: <SendOutlined />, label: $fmt('common.sendAllTabs') },
    { key: 'bindShortcuts', icon: <KeyOutlined />, label: $fmt('common.bindShortcuts') },
    { key: 'hibernateTabs', icon: <CoffeeOutlined />, label: $fmt('common.hibernateTabs') },
    { key: 'reload', icon: <ReloadOutlined />, label: $fmt('common.reload') },
  ];

  const handleExtActionClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'sendAllTabs') {
      handleSendAllTabs();
    } else if (key === 'reload') {
      browser.runtime.reload();
    } else if (key === 'bindShortcuts') {
      openNewTab('chrome://extensions/shortcuts', {
        active: true,
        openToNext: true,
      });
    } else if (key === 'hibernateTabs') {
      discardOtherTabs();
    }
  };

  useEffect(() => {
    const nav = navs.find((item) => item.path === location.pathname);
    setSelectedKeys([nav?.key || 'home']);
  }, [location.pathname]);

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <SendTargetActionHolder ref={sendTargetActionRef}></SendTargetActionHolder>

      <StyledPageContainer $widthType={pageWidthType} className="page-container">
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
            {/* language */}
            <Dropdown
              menu={{
                items: LANGUAGE_OPTIONS,
                selectedKeys: [locale],
                onClick: handleLocaleChange,
              }}
              placement="bottomRight"
            >
              <StyledActionIconBtn $size={18} title={$fmt('common.language')}>
                <TranslationOutlined />
              </StyledActionIconBtn>
            </Dropdown>
            {/* ext actions */}
            <Dropdown
              menu={{
                items: extActionOptions,
                onClick: handleExtActionClick,
              }}
            >
              <StyledActionIconBtn $size={18} title={$fmt('common.actions')}>
                <MenuOutlined />
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
          <span title={$fmt('common.sendAllTabs')}>
            <FloatButton icon={<SendOutlined />} onClick={handleSendAllTabs} />
          </span>
        </FloatButton.Group>
      </StyledPageContainer>
    </ThemeProvider>
  );
}

export default function AppRoute() {
  return <RouterProvider router={router} />;
}

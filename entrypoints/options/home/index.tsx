import { useState, useMemo, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  theme,
  Flex,
  Button,
  Dropdown,
  Modal,
  Drawer,
  Space,
  Typography,
  Tooltip,
  Divider,
  type MenuProps,
} from 'antd';
import { QuestionCircleOutlined, MoreOutlined, ClearOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { classNames } from '~/entrypoints/common/utils';
import {
  tabListUtils,
  settingsUtils,
  stateUtils,
  recycleUtils,
  initTabListStorageListener,
} from '~/entrypoints/common/storage';
import {
  ENUM_SETTINGS_PROPS,
  SHORTCUTS_PAGE_URL,
  shortcutsPageUrlMap,
  type BrowserType,
} from '~/entrypoints/common/constants';
import {
  openNewTab,
  reloadOtherAdminPage,
  updateAdminPageUrlDebounced,
} from '~/entrypoints/common/tabs';

import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import {
  StyledSidebarWrapper,
  StyledMainWrapper,
  StyledHelpInfoBox,
} from './Home.styled';
import ToggleSidebarBtn from '../components/ToggleSidebarBtn';
import SearchTabsBtn from './SearchTabsBtn';
import SortingBtns from './SortingBtns';
import HotkeyList from '../components/HotkeyList';
// import StickyFooter from '~/entrypoints/common/components/StickyFooter';
// import Footer from './footer/index';
import { useTreeData, HomeContext } from './hooks/treeData';
import useCustomEventListener from './hooks/homeCustomEvent';
import useHotkeys from './hooks/hotkeys';
import { getSelectedCounts } from './utils';
import TreeBox from './TreeBox';
import TabGroupList from './TabGroupList';
// import FooterFloatButton from './FooterFloatButton';

const { TAB_COUNT_THRESHOLD } = ENUM_SETTINGS_PROPS;

export default function Home() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const treeDataHook = useTreeData();
  const {
    countInfo,
    selectedTagKey,
    selectedTag,
    handleMoreItemClick,
    toggleExpand,
    refreshTreeData,
    handleTagCreate,
    handleHotkeyAction,
  } = treeDataHook || {};

  // 事件监听
  useCustomEventListener(treeDataHook);

  const { hotkeyList } = useHotkeys({ onAction: handleHotkeyAction });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return stateUtils.state?.home?.sidebarCollapsed || false;
  });
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [helpDrawerVisible, setHelpDrawerVisible] = useState<boolean>(false);

  // 是否开启虚拟滚动（数据量大时开启虚拟滚动）
  const virtualMap = useMemo(() => {
    const settings = settingsUtils.settings || {};
    const { groupCount = 0, tabCount = 0 } = getSelectedCounts(selectedTag.originData);
    // console.log('virtualMap', groupCount, tabCount);
    return {
      tree: (countInfo?.groupCount || 0) > 200 || groupCount > 30,
      tabList: tabCount > (settings?.[TAB_COUNT_THRESHOLD] || 300),
    };
  }, [selectedTag.originData, countInfo?.groupCount]);

  const moreItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'clear',
        label: $fmt('home.clearAll'),
        icon: <ClearOutlined />,
      },
    ],
    [$fmt]
  );

  // 确认清空全部
  const handleClearConfirm = () => {
    handleMoreItemClick('clear');
    setConfirmModalVisible(false);
  };

  const onMoreItemClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'clear') {
      setConfirmModalVisible(true);
    }
  };

  // 按名称排序
  const onNameSort = useCallback(
    async (sortType: string) => {
      if (!selectedTagKey) return;
      await tabListUtils.groupListSortbyName(sortType, selectedTagKey);
      refreshTreeData();
    },
    [selectedTagKey]
  );

  // 按创建时间排序
  const onCreateTimeSort = useCallback(
    async (sortType: string) => {
      if (!selectedTagKey) return;
      await tabListUtils.groupListSortbyCreateTime(sortType, selectedTagKey);
      refreshTreeData();
    },
    [selectedTagKey]
  );

  const onCollapseChange = (status: boolean) => {
    setSidebarCollapsed(status);
    stateUtils.setStateByModule('home', { sidebarCollapsed: status });
    reloadOtherAdminPage();
  };

  useEffect(() => {
    recycleUtils.checkAndClear();

    return initTabListStorageListener(async (tabList) => {
      const currWindow = await browser.windows.getCurrent();
      if (!currWindow.focused) {
        updateAdminPageUrlDebounced();
      }
    });
  }, []);

  return (
    <HomeContext.Provider value={{ treeDataHook }}>
      <StyledMainWrapper
        className={classNames('home-wrapper', sidebarCollapsed && 'collapsed')}
        $collapsed={sidebarCollapsed}
      >
        <StyledSidebarWrapper className="sidebar" $collapsed={sidebarCollapsed}>
          <div
            className={classNames('sidebar-inner-box', sidebarCollapsed && 'collapsed')}
          >
            <div className="sidebar-action-box">
              <ToggleSidebarBtn
                collapsed={sidebarCollapsed}
                onCollapseChange={onCollapseChange}
              ></ToggleSidebarBtn>
              <SearchTabsBtn></SearchTabsBtn>
              {selectedTagKey ? <SortingBtns onSort={onNameSort}></SortingBtns> : null}
              {selectedTagKey ? (
                <SortingBtns sortBy="createTime" onSort={onCreateTimeSort}></SortingBtns>
              ) : null}
            </div>

            <div className="sidebar-inner-content">
              <div className="tag-list-title">
                {$fmt('home.tabGroupList')}
                <StyledActionIconBtn
                  className="btn-help"
                  title={$fmt('home.helpInfo')}
                  onClick={() => setHelpDrawerVisible(true)}
                >
                  <QuestionCircleOutlined />
                </StyledActionIconBtn>
              </div>
              <ul className="count-info">
                <li>
                  {$fmt('home.tag')} ({countInfo?.tagCount})
                </li>
                <li>
                  {$fmt('home.tabGroup')} ({countInfo?.groupCount})
                </li>
                <li>
                  {$fmt('home.tab')} ({countInfo?.tabCount})
                </li>
              </ul>
              {/* 顶部操作按钮组 */}
              <div className="sidebar-action-btns-wrapper">
                <Button type="primary" size="small" onClick={() => toggleExpand(true)}>
                  {$fmt('home.expandAll')}
                </Button>
                <Button type="primary" size="small" onClick={() => toggleExpand(false)}>
                  {$fmt('home.collapseAll')}
                </Button>
                <Button type="primary" size="small" onClick={handleTagCreate}>
                  {$fmt('home.addTag')}
                </Button>

                <Dropdown
                  menu={{ items: moreItems, onClick: onMoreItemClick }}
                  placement="bottomLeft"
                >
                  <StyledActionIconBtn className="btn-more" $size="20" title={$fmt('common.more')}>
                    <MoreOutlined />
                  </StyledActionIconBtn>
                </Dropdown>
              </div>

              {/* 分类和标签组列表 */}
              <TreeBox></TreeBox>
            </div>
          </div>
        </StyledSidebarWrapper>

        {/* 标签组和标签页列表 */}
        <TabGroupList virtual={virtualMap.tabList}></TabGroupList>
      </StyledMainWrapper>

      {/* 吸底footer */}
      {/* <StickyFooter bottomGap={0} fullWidth>
        <Footer></Footer>
      </StickyFooter> */}

      {/* <FooterFloatButton></FooterFloatButton> */}

      {/* 清空全部提示 */}
      <Modal
        title={$fmt('home.removeTitle')}
        width={400}
        centered
        open={confirmModalVisible}
        onOk={handleClearConfirm}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <div>{$fmt('home.clearDesc')}</div>
      </Modal>

      {/* 帮助信息弹层 */}
      <Drawer
        title={$fmt('home.helpInfo')}
        open={helpDrawerVisible}
        onClose={() => setHelpDrawerVisible(false)}
        width={600}
      >
        <StyledHelpInfoBox>
          {import.meta.env.FIREFOX && (
            <>
              <p style={{ marginBottom: '4px' }}>
                <strong>{$fmt('common.note')}</strong>: {$fmt('home.help.reminder.start')}
              </p>
              <ul
                dangerouslySetInnerHTML={{ __html: $fmt('home.help.reminder.list') }}
              ></ul>
              <p style={{ marginBottom: '8px' }}>{$fmt('home.help.reminder.end')}</p>
              <Divider></Divider>
            </>
          )}

          <ul dangerouslySetInnerHTML={{ __html: $fmt('home.help.content') }}></ul>

          <p style={{ marginBottom: '8px' }}>
            <strong>{$fmt('common.hotkeys')}</strong>
          </p>
          <HotkeyList list={hotkeyList}></HotkeyList>

          <ul style={{ marginTop: '8px' }}>
            <li>
              {$fmt('home.help.hotkey.1')}
              <Space>
                <strong>"{$fmt('common.openAdminTab')}",</strong>
                <strong>"{$fmt('common.sendAllTabs')}",</strong>
                <strong>"{$fmt('common.sendCurrentTab')}"</strong>
              </Space>
              {$fmt('home.help.hotkey.2')}
              {import.meta.env.FIREFOX ? (
                <span>{$fmt('home.help.hotkey.modify')}</span>
              ) : (
                <a
                  className="link"
                  onClick={() =>
                    openNewTab(SHORTCUTS_PAGE_URL, {
                      active: true,
                      openToNext: true,
                    })
                  }
                >
                  {$fmt('home.help.hotkey.modify')}
                </a>
              )}
              <Tooltip
                color={token.colorBgContainer}
                title={
                  <Flex vertical>
                    {['chrome', 'edge', 'firefox'].map((type) => (
                      <Typography.Text key={type}>
                        <strong>{type}: </strong>
                        {shortcutsPageUrlMap[type as BrowserType]}
                      </Typography.Text>
                    ))}
                    <Typography.Text>
                      {$fmt('home.help.hotkey.modifyTip')}
                    </Typography.Text>
                  </Flex>
                }
                styles={{ root: { maxWidth: '300px', width: '300px' } }}
              >
                <QuestionCircleOutlined style={{ marginLeft: '4px' }} />
              </Tooltip>
            </li>
          </ul>
        </StyledHelpInfoBox>
      </Drawer>
    </HomeContext.Provider>
  );
}

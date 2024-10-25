import { useState, useMemo, useCallback } from 'react';
import { theme, Flex, Button, Modal, Drawer, Space, Typography, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { classNames } from '~/entrypoints/common/utils';
import { tabListUtils, settingsUtils, stateUtils } from '@/entrypoints/common/storage';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { openNewTab } from '@/entrypoints/common/tabs';

import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import {
  StyledListWrapper,
  StyledSidebarWrapper,
  StyledHelpInfoBox,
} from './Home.styled';
import ToggleSidebarBtn from '../components/ToggleSidebarBtn';
import SortingBtns from './SortingBtns';
import HotkeyList from '../components/HotkeyList';
// import StickyFooter from '~/entrypoints/common/components/StickyFooter';
// import Footer from './footer/index';
import { useTreeData, HomeContext } from './hooks/treeData';
import useHotkeys from './hooks/hotkeys';
import { getSelectedCounts } from './utils';
import TreeBox from './TreeBox';
import TabGroupList from './TabGroupList';
import FooterFloatButton from './FooterFloatButton';

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

  const { hotkeyList } = useHotkeys({ onAction: handleHotkeyAction });

  const state = stateUtils.getState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    state['home:sidebarCollapsed'] || false
  );
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

  // 确认清空全部
  const handleClearConfirm = () => {
    handleMoreItemClick('clear');
    setConfirmModalVisible(false);
  };

  // 排序
  const onSort = useCallback(
    async (sortType: string) => {
      if (!selectedTagKey) return;
      await tabListUtils.groupListSort(sortType, selectedTagKey);
      refreshTreeData();
    },
    [selectedTagKey]
  );

  const onCollapseChange = (status: boolean) => {
    setSidebarCollapsed(status);
    stateUtils.setState({ 'home:sidebarCollapsed': status });
  };

  return (
    <HomeContext.Provider value={{ treeDataHook }}>
      <StyledListWrapper
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
              {selectedTagKey ? <SortingBtns onSort={onSort}></SortingBtns> : null}
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
                {/* 隐藏展开全部按钮，自己主动打开吧
                  <Button type="primary" size="small" onClick={() => toggleExpand(true)}>
                    {$fmt('home.expandAll')}
                  </Button>
                */}
                <Button type="primary" size="small" onClick={() => toggleExpand(false)}>
                  {$fmt('home.collapseAll')}
                </Button>
                <Button type="primary" size="small" onClick={handleTagCreate}>
                  {$fmt('home.addTag')}
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => setConfirmModalVisible(true)}
                >
                  {$fmt('home.clearAll')}
                </Button>
              </div>

              {/* 分类和标签组列表 */}
              <TreeBox></TreeBox>
            </div>
          </div>
        </StyledSidebarWrapper>

        {/* 标签组和标签页列表 */}
        <TabGroupList virtual={virtualMap.tabList}></TabGroupList>
      </StyledListWrapper>

      {/* 吸底footer */}
      {/* <StickyFooter bottomGap={0} fullWidth>
        <Footer></Footer>
      </StickyFooter> */}

      <FooterFloatButton></FooterFloatButton>

      {/* 清空全部提示 */}
      <Modal
        title={$fmt('home.removeTitle')}
        width={400}
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
              <Typography.Link
                onClick={() =>
                  openNewTab('chrome://extensions/shortcuts', {
                    active: true,
                    openToNext: true,
                  })
                }
              >
                {$fmt('home.help.hotkey.modify')}
              </Typography.Link>
              <Tooltip
                color={token.colorBgContainer}
                title={
                  <Flex vertical>
                    <Typography.Text>
                      <strong>Chrome</strong>: chrome://extensions/shortcuts
                    </Typography.Text>
                    <Typography.Text>
                      <strong>Edge</strong>: edge://extensions/shortcuts
                    </Typography.Text>
                    <Typography.Text>
                      {$fmt('home.help.hotkey.modifyTip')}
                    </Typography.Text>
                  </Flex>
                }
                overlayStyle={{ maxWidth: '300px', width: '300px' }}
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

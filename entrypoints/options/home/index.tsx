import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  theme,
  Flex,
  Tree,
  Button,
  Input,
  Dropdown,
  Modal,
  Drawer,
  Empty,
  Spin,
} from 'antd';
import type { MenuProps, TreeDataNode, TreeProps } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import {
  DownOutlined,
  MoreOutlined,
  ClearOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { classNames } from '~/entrypoints/common/utils';

import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledListWrapper, StyledSidebarWrapper } from './Home.styled';
import ToggleSidebarBtn from './ToggleSidebarBtn';
import SortingBtns from './SortingBtns';
import RenderTreeNode from './RenderTreeNode';
import TabGroup from './TabGroup';
import HotkeyList from '../components/HotkeyList';
import type { TagItem, GroupItem, TabItem } from '~/entrypoints/types';
import type {
  TreeDataNodeTabGroup,
  TreeDataNodeUnion,
  MoveToCallbackProps,
} from './types';
import { useTreeData } from './hooks/treeData';
import useHotkeys from './hooks/hotkeys';
import { getTreeData } from './utils';
import { tabListUtils } from '@/entrypoints/common/storage';

export default function Home() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const listRef = useRef<HTMLDivElement>(null);
  const {
    loading,
    countInfo,
    tagList,
    treeData,
    selectedTagKey,
    selectedTabGroupKey,
    selectedKeys,
    expandedKeys,
    setExpandedKeys,
    selectedTag,
    refreshKey,
    handleSelect,
    onSelect,
    handleMoreItemClick,
    onTreeNodeAction,
    toggleExpand,
    refreshTreeData,
    handleTagRemove,
    handleTagCreate,
    handleTagChange,
    handleTabGroupRemove,
    handleTabGroupCreate,
    handleTabGroupChange,
    handleTabGroupStarredChange,
    handleTabGroupDedup,
    handleTabGroupRestore,
    handleTreeNodeDrop,
    handleTabItemDrop,
    handleTabItemChange,
    handleTabItemRemove,
    handleHotkeyAction,
  } = useTreeData();

  const { hotkeyList } = useHotkeys({ onAction: handleHotkeyAction });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [helpDrawerVisible, setHelpDrawerVisible] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const moreItems: MenuProps['items'] = [
    {
      key: 'clear',
      label: (
        <span onClick={() => setConfirmModalVisible(true)}>{$fmt('home.clearAll')}</span>
      ),
      icon: <ClearOutlined />,
    },
  ];
  // 确认清空全部
  const handleClearConfirm = () => {
    handleMoreItemClick('clear');
    setConfirmModalVisible(false);
  };

  const handleTabGroupMoveTo = async ({
    moveData,
    targetData,
    selected,
  }: MoveToCallbackProps) => {
    refreshTreeData((treeData) => {
      if (selected) {
        const { groupId, tabs } = moveData || {};
        const { targetTagId, targetGroupId } = targetData || {};
        if (!groupId) return;
        // 如果是移动标签页的话，则不需要重新选择标签组
        if (tabs && tabs?.length > 0) return;

        let group = null;
        for (let tag of treeData) {
          if (!!targetTagId && tag.key !== targetTagId) continue;
          for (let g of tag.children || []) {
            if (g.key === targetGroupId) {
              group = g;
              break;
            }
          }
        }
        group &&
          handleSelect(treeData, [groupId], { node: group as TreeDataNodeTabGroup });
      }
    });
  };

  const onSearch: SearchProps['onSearch'] = (value) => {
    setSearchValue(value);
    setTimeout(() => {
      toggleExpand(true);
    }, 30);
  };

  // 搜索过滤后的 treeData
  const searchTreeData = useMemo(() => {
    if (!searchValue) return treeData;
    const value = searchValue?.trim().toLowerCase();
    const searchTagList =
      tagList.reduce<TagItem[]>((result, tag): TagItem[] => {
        if (tag?.tagName?.toLowerCase().includes(value)) {
          return [...result, tag];
        }

        const groupList =
          tag?.groupList?.reduce<GroupItem[]>((list, group: GroupItem): GroupItem[] => {
            if (group?.groupName?.toLowerCase().includes(value)) {
              return [...list, group];
            }
            return list;
          }, []) || [];
        if (groupList?.length > 0) {
          return [...result, { ...tag, groupList }];
        } else {
          return result;
        }
      }, []) || [];
    return getTreeData(searchTagList);
  }, [tagList, searchValue]);

  // 判断节点是否可拖拽
  const isNodeDraggable = useCallback((node: TreeDataNode) => {
    const _node = node as TreeDataNodeUnion;
    // 中转站分类不可拖拽
    if (_node.type === 'tag' && _node?.originData?.static) return false;
    return true;
  }, []);

  // 判断能否拖拽到节点上
  const checkAllowDrop: TreeProps<TreeDataNodeUnion>['allowDrop'] = ({
    dragNode,
    dropNode,
    dropPosition,
  }) => {
    // console.log('checkAllowDrop--dragNode', dragNode)
    // console.log('checkAllowDrop--dropNode', dropNode)
    // console.log('checkAllowDrop--dropPosition', dropPosition)

    // dropPosition = 0 时表示，拖放到目标 node 的子集
    // dropPosition = 1 时表示，拖放到目标 node 的同级之后
    // dropPosition = -1 时表示，拖放到目标 node 的同级之前
    if (
      (dragNode.type === 'tag' && dragNode?.originData?.static) ||
      (dropNode.type === 'tag' && dropNode?.originData?.static && dropPosition == -1)
    ) {
      // 中转站永远置顶，不允许其他分类排到它前面
      return false;
    }

    return (
      (dragNode.type === 'tabGroup' && dropNode.type === 'tabGroup') ||
      (dragNode.type === 'tag' && dropNode.type === 'tag' && dropPosition !== 0) ||
      (dragNode.type === 'tabGroup' && dropNode.type === 'tag' && dropPosition >= 0)
    );
  };

  // 阻止右键默认行为
  const onRightClick: TreeProps<TreeDataNodeUnion>['onRightClick'] = ({
    event,
    node,
  }) => {
    event?.preventDefault();
    event?.stopPropagation();
    // console.log('onRightClick--node', node)
    // TODO 添加右键菜单
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

  return (
    <>
      <StyledListWrapper
        className={classNames('home-wrapper', sidebarCollapsed && 'collapsed')}
        $collapsed={sidebarCollapsed}
      >
        <StyledSidebarWrapper
          className="sidebar"
          $primaryColor={token.colorPrimary}
          $collapsed={sidebarCollapsed}
        >
          <div
            className={classNames('sidebar-inner-box', sidebarCollapsed && 'collapsed')}
          >
            <div className="sidebar-action-box">
              <ToggleSidebarBtn onCollapseChange={setSidebarCollapsed}></ToggleSidebarBtn>
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
                <Button type="primary" size="small" onClick={() => toggleExpand(true)}>
                  {$fmt('home.expandAll')}
                </Button>
                <Button type="primary" size="small" onClick={() => toggleExpand(false)}>
                  {$fmt('home.collapseAll')}
                </Button>
                <Button type="primary" size="small" onClick={handleTagCreate}>
                  {$fmt('home.addTag')}
                </Button>
                <Dropdown menu={{ items: moreItems }} placement="bottomLeft">
                  <StyledActionIconBtn className="btn-more" $size="20" title="更多">
                    <MoreOutlined />
                  </StyledActionIconBtn>
                </Dropdown>
              </div>
              {/* 列表搜索框 */}
              <Input.Search
                style={{ marginBottom: 8 }}
                placeholder={$fmt('home.searchTagAndGroup')}
                allowClear
                onSearch={onSearch}
              />
              {/* 标签组列表 */}
              <div ref={listRef} className="sidebar-tree-wrapper">
                <Spin spinning={loading} size="large">
                  {searchTreeData?.length > 0 ? (
                    <Tree
                      // draggable
                      draggable={{ icon: false, nodeDraggable: isNodeDraggable }}
                      allowDrop={checkAllowDrop}
                      blockNode
                      switcherIcon={<DownOutlined />}
                      autoExpandParent
                      defaultExpandAll
                      expandedKeys={expandedKeys}
                      selectedKeys={selectedKeys}
                      treeData={searchTreeData}
                      titleRender={(node) => (
                        <RenderTreeNode
                          node={node}
                          selected={selectedKeys.includes(node.key)}
                          container={listRef.current}
                          refreshKey={refreshKey}
                          onAction={onTreeNodeAction}
                          onTabItemDrop={handleTabItemDrop}
                        ></RenderTreeNode>
                      )}
                      onExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
                      onSelect={onSelect}
                      onDrop={handleTreeNodeDrop}
                      onRightClick={onRightClick}
                    />
                  ) : (
                    <div className="no-data">
                      <Empty description={$fmt('home.emptyTip')}>
                        <Button type="primary" size="small" onClick={handleTagCreate}>
                          {$fmt('home.addTag')}
                        </Button>
                      </Empty>
                    </div>
                  )}
                </Spin>
              </div>
            </div>
          </div>
        </StyledSidebarWrapper>
        {/* 单个标签组（标签列表） */}
        <div className="content">
          {selectedTag?.children?.map(
            (tabGroup: TreeDataNodeTabGroup) =>
              tabGroup?.originData && (
                <TabGroup
                  key={tabGroup.key}
                  selected={tabGroup.key === selectedTabGroupKey}
                  refreshKey={refreshKey}
                  tagList={tagList}
                  {...tabGroup.originData}
                  onChange={(data) => handleTabGroupChange(tabGroup, data)}
                  onRemove={() =>
                    handleTabGroupRemove(tabGroup, selectedTagKey, selectedTabGroupKey)
                  }
                  onRestore={() => handleTabGroupRestore(tabGroup)}
                  onStarredChange={(isStarred) =>
                    handleTabGroupStarredChange(tabGroup, isStarred)
                  }
                  onDedup={() => handleTabGroupDedup(tabGroup)}
                  onDrop={handleTabItemDrop}
                  onTabChange={(tabItem: TabItem) =>
                    handleTabItemChange(tabGroup, tabItem)
                  }
                  onTabRemove={handleTabItemRemove}
                  onMoveTo={handleTabGroupMoveTo}
                ></TabGroup>
              )
          )}
        </div>
      </StyledListWrapper>

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
        width={500}
      >
        <Flex vertical gap="8px">
          <p>{$fmt('home.help.content.1')}</p>
          <p>{$fmt('home.help.content.2')}</p>
          <p>{$fmt('home.help.content.3')}</p>
          <p>{$fmt('home.help.content.4')}</p>
          <p>{$fmt('home.help.content.5')}</p>
          <p>{$fmt('home.help.content.6')}</p>
          <p>{$fmt('home.help.content.7')}</p>
          <p>{$fmt('home.help.content.8')}</p>

          <p style={{ marginTop: '8px' }}>
            <strong>{$fmt('common.hotkeys')}</strong>
          </p>
          <HotkeyList list={hotkeyList}></HotkeyList>
        </Flex>
      </Drawer>
    </>
  );
}

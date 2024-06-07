import { useState, useMemo, useCallback } from 'react';
import { theme, Flex, Tree, Button, Input, Dropdown, Modal, Drawer, Empty } from 'antd';
import type { MenuProps, TreeProps } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import { DownOutlined, MoreOutlined, ClearOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledListWrapper } from './Home.styled';
import RenderTreeNode from './RenderTreeNode';
import TabGroup from './TabGroup';
import { TagItem, GroupItem } from '@/entrypoints/types';
import { TreeDataNodeTabGroup, TreeDataNodeUnion, } from './types';
import { useTreeData } from './hooks';
import { getTreeData } from './utils';

export default function Home() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const {
    countInfo,
    tagList,
    treeData,
    selectedTagKey,
    selectedTabGroupKey,
    selectedKeys,
    expandedKeys,
    setExpandedKeys,
    selectedTag,
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
    handleTabGroupRestore,
    handleTreeNodeDrop,
    handleTabItemDrop,
    handleTabItemRemove,
  } = useTreeData();

  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [helpDrawerVisible, setHelpDrawerVisible] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const moreItems: MenuProps['items'] = [
    {
      key: 'clear',
      label: <span onClick={() => setConfirmModalVisible(true)}>{$fmt('home.clearAll')}</span>,
      icon: <ClearOutlined />,
    },
  ];
  // 确认清空全部
  const handleClearConfirm = () => {
    handleMoreItemClick('clear');
    setConfirmModalVisible(false);
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
    const searchTagList = tagList.reduce<TagItem[]>((result, tag): TagItem[] => {
      if (tag?.tagName?.toLowerCase().includes(value)) {
        return [...result, tag];
      }

      const groupList = tag?.groupList?.reduce<GroupItem[]>((list, group: GroupItem): GroupItem[] => {
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

  const checkAllowDrop: TreeProps<TreeDataNodeUnion>['allowDrop'] = ({ dragNode, dropNode, dropPosition }) => {
    // console.log('checkAllowDrop--dragNode', dragNode)
    // console.log('checkAllowDrop--dropNode', dropNode)
    // console.log('checkAllowDrop--dropPosition', dropPosition)

    // dropPosition = 0 时表示，拖放到目标 node 的子集
    // dropPosition = 1 时表示，拖放到目标 node 的同级之后
    // dropPosition = -1 时表示，拖放到目标 node 的同级之前
    return (dragNode.type === 'tabGroup' && dropNode.type === 'tabGroup')
      || (dragNode.type === 'tag' && dropNode.type === 'tag' && dropPosition !== 0)
      || (dragNode.type === 'tabGroup' && dropNode.type === 'tag' && dropPosition >= 0);
  }

  return (
    <>
      <StyledListWrapper className="home-wrapper" $primaryColor={token.colorPrimary}>
        <div className="sidebar">
          <div className="sidebar-inner">
            <div className="tag-list-title">
              {$fmt('home.tabGroupList')}
              <StyledActionIconBtn className="btn-help" title="帮助信息" onClick={() => setHelpDrawerVisible(true)}>
                <QuestionCircleOutlined />
              </StyledActionIconBtn>
            </div>
            <ul className="count-info">
              <li>{$fmt('home.tag')} ({countInfo?.tagCount})</li>
              <li>{$fmt('home.tabGroup')} ({countInfo?.groupCount})</li>
              <li>{$fmt('home.tab')} ({countInfo?.tabCount})</li>
            </ul>
            {/* 顶部操作按钮组 */}
            <div className="sidebar-action-btns-wrapper">
              <Button
                type="primary"
                size="small"
                onClick={() => toggleExpand(true)}
              >
                {$fmt('home.expandAll')}
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => toggleExpand(false)}
              >
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
            <div className="sidebar-tree-wrapper">
              {searchTreeData?.length > 0 ? (
                <Tree
                  // draggable
                  draggable={{ icon: false, nodeDraggable: () => true }}
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
                      onAction={onTreeNodeAction}
                    ></RenderTreeNode>
                  )}
                  onExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
                  onSelect={onSelect}
                  onDrop={handleTreeNodeDrop}
                />
              ) : (
                <div className="no-data">
                  <Empty description={$fmt('home.emptyTip')}>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleTagCreate}
                    >
                      {$fmt('home.addTag')}
                    </Button>
                  </Empty>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 单个标签组（标签列表） */}
        <div className="content">
          {selectedTag?.children?.map(
            (tabGroup: TreeDataNodeTabGroup) =>
              tabGroup?.originData && (
                <TabGroup
                  key={tabGroup.key}
                  selected={tabGroup.key === selectedTabGroupKey}
                  {...tabGroup.originData}
                  onChange={(data) => handleTabGroupChange(tabGroup, data)}
                  onRemove={() =>
                    handleTabGroupRemove(tabGroup, selectedTagKey, selectedTabGroupKey)
                  }
                  onRestore={() => handleTabGroupRestore(tabGroup)}
                  onStarredChange={(isStarred) =>
                    handleTabGroupStarredChange(tabGroup, isStarred)
                  }
                  onDrop={handleTabItemDrop}
                  onTabRemove={handleTabItemRemove}
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
          <p>1、左侧列表一级菜单表示分类，二级菜单表示标签组，右侧面板展示的是当前选中分类中的所有标签组以及标签组中标签页；左侧列表支持分类和标签组的搜索。</p>
          <p>2、标签组锁定后可以移动，该标签组以及组内的标签页，将禁止删除和移出，但可以将其他标签组的标签页移入该标签组；如果想要删除或移出，可先解锁该标签组。</p>
          <p>3、标签组星标后将在当前分类中置顶，移动其他标签组到星标状态的标签组之前，将自动被星标；移动星标状态的标签组到非星标的标签组之后，将自动解除星标状态。</p>
        </Flex>
      </Drawer>
    </>
  );
}

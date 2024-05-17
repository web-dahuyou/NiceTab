import { useState, useMemo, useCallback } from 'react';
import { theme, Tree, Button, Input, Dropdown, Empty } from 'antd';
import type { MenuProps } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import { DownOutlined, MoreOutlined, ClearOutlined } from '@ant-design/icons';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledListWrapper } from './Home.styled';
import RenderTreeNode from './RenderTreeNode';
import TabGroup from './TabGroup';
import { TagItem, GroupItem } from '@/entrypoints/types';
import {
  TreeDataNodeTag,
  TreeDataNodeTabGroup,
} from './types';
import { useTreeData } from './hooks';
import { getTreeData } from './utils';

export default function Home() {
  const { token } = theme.useToken();
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
    handleTabItemDrop,
  } = useTreeData();

  const [searchValue, setSearchValue] = useState<string>('');
  const moreItems: MenuProps['items'] = [
    {
      key: 'clear',
      label: <span onClick={() => handleMoreItemClick('clear')}>清空全部</span>,
      icon: <ClearOutlined />
    }
  ];

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

  return (
    <StyledListWrapper className="home-wrapper" $primaryColor={token.colorPrimary}>
      <div className="sidebar">
        <div className="sidebar-inner">
          <div className="tag-list-title">标签组列表</div>
          <ul className="count-info">
            <li>分类 ({countInfo?.tagCount})</li>
            <li>标签组 ({countInfo?.groupCount})</li>
            <li>标签页 ({countInfo?.tabCount})</li>
          </ul>
          {/* 顶部操作按钮组 */}
          <div className="sidebar-action-btns-wrapper">
            <Button
              type="primary"
              size="small"
              shape="round"
              onClick={() => toggleExpand(true)}
            >
              展开全部
            </Button>
            <Button
              type="primary"
              size="small"
              shape="round"
              onClick={() => toggleExpand(false)}
            >
              折叠全部
            </Button>
            <Button type="primary" size="small" shape="round" onClick={handleTagCreate}>
              创建分类
            </Button>
            <Dropdown menu={{ items: moreItems }} placement="bottomLeft">
              <StyledActionIconBtn
                className="btn-more"
                $size="20"
                title="更多"
              >
                <MoreOutlined />
              </StyledActionIconBtn>
            </Dropdown>
          </div>
          {/* 列表搜索框 */}
          <Input.Search style={{ marginBottom: 8 }} placeholder="搜索分类 / 标签组" allowClear onSearch={onSearch} />
          {/* 标签组列表 */}
          <div className="sidebar-tree-wrapper">
            { searchTreeData?.length > 0 ? (
              <Tree
                // draggable
                blockNode
                switcherIcon={<DownOutlined />}
                autoExpandParent
                defaultExpandAll
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                treeData={searchTreeData}
                titleRender={(node) => (
                  <RenderTreeNode node={node} onAction={onTreeNodeAction}></RenderTreeNode>
                )}
                onExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
                onSelect={onSelect}
              />
            ) : (
              <div className="no-data">
                <Empty description="暂无分类">
                  <Button type="primary" size="small" shape="round" onClick={handleTagCreate}>
                    创建分类
                  </Button>
                </Empty>
              </div>
            ) }
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
              ></TabGroup>
            )
        )}
      </div>
    </StyledListWrapper>
  );
}


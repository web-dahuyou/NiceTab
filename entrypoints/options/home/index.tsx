import { theme, Tree, Button, Dropdown, Empty } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, MoreOutlined, ClearOutlined } from '@ant-design/icons';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledListWrapper } from './Home.styled';
import RenderTreeNode from './RenderTreeNode';
import TabGroup from './TabGroup';
import {
  TreeDataNodeTabGroup,
} from './types';
import { useTreeData } from './hooks';

export default function Home() {
  const { token } = theme.useToken();
  const {
    countInfo,
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

  const moreItems: MenuProps['items'] = [
    {
      key: 'clear',
      label: <span onClick={() => handleMoreItemClick('clear')}>清空全部</span>,
      icon: <ClearOutlined />
    }
  ];

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
          {/* <Input.Search style={{ marginBottom: 8 }} placeholder="Search" /> */}
          <div className="sidebar-tree-wrapper">
            { treeData?.length > 0 ? (
              <Tree
                // draggable
                blockNode
                switcherIcon={<DownOutlined />}
                autoExpandParent
                defaultExpandAll
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                treeData={treeData}
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


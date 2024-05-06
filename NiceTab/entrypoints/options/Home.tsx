import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { theme, Tree, Button, Input } from 'antd';
import { FolderOutlined, AppstoreOutlined, DownOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { openNewTab } from '~/entrypoints/common/tabs';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { StyledListWrapper } from './Home.styled';
import TabGroup from './components/TabGroup';

type TreeDataNodeTabGroup = TreeDataNode & {
  type: 'tabGroup';
  parentKey: string;
  originData: GroupItem;
  children?: Array<TreeDataNode & { originData?: TabItem }>;
};
type TreeDataNodeTag = TreeDataNode & {
  type: 'tag';
  parentKey?: string;
  originData: TagItem;
  children?: Array<TreeDataNodeTabGroup & { originData?: GroupItem }>;
};
type TreeDataNodeUnion = TreeDataNodeTag | TreeDataNodeTabGroup;

const { useToken } = theme;
const { Search } = Input;

const getTreeData = (tagList: TagItem[]): TreeDataNodeUnion[] => {
  return tagList.map((tag) => ({
    type: 'tag',
    key: tag.tagId,
    title: tag.tagName,
    icon: <FolderOutlined />,
    isLeaf: false,
    originData: { ...tag },
    children: tag?.groupList?.map((group) => {
      return {
        type: 'tabGroup',
        parentKey: tag.tagId,
        key: group.groupId,
        title: group.groupName,
        icon: <AppstoreOutlined />,
        isLeaf: true,
        originData: { ...group },
      };
    }),
  }));
};

function Home() {
  const { token } = useToken();
  // const routeParams = useParams<{ tagId: string; groupId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const [countInfo, setCountInfo] = useState<CountInfo>();
  const [treeData, setTreeData] = useState([] as TreeDataNodeUnion[]);
  const [selectedTagKey, setSelectedTagKey] = useState<React.Key | undefined>();
  const [selectedTabGroupKey, setSelectedTabGroupKey] = useState<React.Key | undefined>();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const selectedTag: TreeDataNodeTag = useMemo(() => {
    const tag =
      treeData.find((tag) => tag.type === 'tag' && tag.key === selectedTagKey) || {};
    return tag as TreeDataNodeTag;
  }, [treeData, selectedTagKey]);

  // 删除分类
  const handleTagRemove = useCallback(async () => {
    if (!selectedTagKey) return;
    await tabListUtils.removeTag(selectedTagKey);
    refreshTreeData((treeData) => {
      const tag = treeData?.[0];
      handleSelect(treeData, [tag?.key], { node: tag });
    });
  }, [selectedTagKey]);
  // 创建分类
  const handleTagCreate = useCallback(async () => {
    await tabListUtils.addTag();
    refreshTreeData((treeData) => {
      const tag = treeData?.[0];
      handleSelect(treeData, [tag?.key], { node: tag });
    });
  }, []);
  // 选中节点
  const handleSelect = useCallback(
    (
      treeData: TreeDataNodeUnion[],
      selectedKeys: React.Key[],
      { node }: { node: TreeDataNodeUnion }
    ) => {
      if (node.type === 'tag') {
        setSelectedTagKey(node.key);
        setSelectedTabGroupKey(node?.children?.[0]?.key);
        setExpandedKeys((keys) => {
          return [...new Set([...keys, node.key])];
        });
      } else if (node.type === 'tabGroup') {
        const tag = treeData.find((tag) => tag.key === node.parentKey);
        setSelectedTagKey(tag?.key);
        setSelectedTabGroupKey(node.key);
        setExpandedKeys((keys) => {
          return [...new Set([...keys, node.parentKey])];
        });
      }

      setSelectedKeys([node.key]);
    },
    []
  );
  const onSelect = useCallback(
    (selectedKeys: React.Key[], { node }: { node: TreeDataNodeUnion }) => {
      handleSelect(treeData, selectedKeys, { node });
      if (searchParams.get('tagId') || searchParams.get('groupId')) {
        setSearchParams({});
      }
    },
    [treeData]
  );

  // 删除标签组
  const handleTabGroupRemove = useCallback(
    async (tag: TreeDataNodeTag, tabGroup: TreeDataNodeTabGroup) => {
      await tabListUtils.removeTabGroup(tag.key, tabGroup.key);
      refreshTreeData((treeData) => {
        handleSelect(treeData, [tag.key], { node: tag });
      });
    },
    []
  );
  // 修改标签组
  const handleTabGroupChange = useCallback(
    async (
      tag: TreeDataNodeTag,
      tabGroup: TreeDataNodeTabGroup,
      data: Partial<GroupItem>
    ) => {
      await tabListUtils.updateTabGroup(tag.key, tabGroup.key, data);
      refreshTreeData((treeData) =>
        handleSelect(treeData, [tabGroup.key], { node: tabGroup })
      );
    },
    []
  );

  // 标签组星标状态切换（需要调整排序）
  const handleTabGroupStarredChange = useCallback(
    async (tag: TreeDataNodeTag, tabGroup: TreeDataNodeTabGroup, isStarred: boolean) => {
      const tagList = await tabListUtils.getTagList();
      if (isStarred) {
        tagList.forEach((t) => {
          if (t.tagId === tag.key) {
            t.groupList = [
              { ...tabGroup.originData, isStarred },
              ...t.groupList.filter((g) => g.groupId !== tabGroup.key),
            ];
          }
        });
      } else {
        tagList.forEach((t) => {
          if (t.tagId === tag.key) {
            t.groupList = t.groupList.filter((g) => g.groupId !== tabGroup.key);
            const unStarredIndex = t.groupList.findIndex((g) => !g.isStarred);
            t.groupList.splice(unStarredIndex, 0, { ...tabGroup.originData, isStarred });
          }
        });
      }

      await tabListUtils.setTagList(tagList);
      refreshTreeData((treeData) =>
        handleSelect(treeData, [tabGroup.key], { node: tabGroup })
      );
    },
    []
  );
  // 恢复标签组
  const handleTabGroupRestore = useCallback(
    async (tag: TreeDataNodeTag, tabGroup: TreeDataNodeTabGroup) => {
      const { DELETE_AFTER_RESTORE } = ENUM_SETTINGS_PROPS;
      const settings = await settingsUtils.getSettings();
      tabGroup?.originData?.tabList.forEach((tab) => {
        openNewTab(tab);
      });
      if (settings[DELETE_AFTER_RESTORE]) {
        await tabListUtils.removeTabGroup(tag.key, tabGroup.key);
        refreshTreeData((treeData) => handleSelect(treeData, [tag.key], { node: tag }));
      }
    },
    []
  );
  // 刷新treeData
  const refreshTreeData = async (callback?: (treeData: TreeDataNodeUnion[]) => void) => {
    const tagList = tabListUtils.tagList;
    const treeData = getTreeData(tagList);
    setTreeData(treeData);
    // console.log('refresh-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);
    callback?.(treeData);
  };
  // 初始化
  const init = async () => {
    const tagList = await tabListUtils.getTagList();
    const treeData = getTreeData(tagList);
    setTreeData(treeData);
    // console.log('init-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);

    // console.log('routeParams', searchParams.get('tagId'), searchParams.get('groupId'));
    const tag =
      treeData?.find((tag) => tag.type === 'tag' && tag.key === searchParams.get('tagId')) ||
      treeData?.[0];
    const tabGroup =
      tag?.children?.find((g) => g.key === searchParams.get('groupId')) || tag.children?.[0];
    handleSelect(treeData, [tabGroup ? tabGroup.key : tag.key], {
      node: tabGroup ? (tabGroup as TreeDataNodeTabGroup) : tag,
    });
  };
  useEffect(() => {
    init();
  }, []);

  return (
    <div>
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
                disabled={
                  selectedTagKey != undefined && !selectedKeys.includes(selectedTagKey)
                }
                onClick={handleTagRemove}
              >
                删除分类
              </Button>
              <Button type="primary" size="small" shape="round" onClick={handleTagCreate}>
                创建分类
              </Button>
            </div>
            {/* <Search style={{ marginBottom: 8 }} placeholder="Search" /> */}
            <Tree
              // draggable
              blockNode
              switcherIcon={<DownOutlined />}
              autoExpandParent
              defaultExpandAll
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              treeData={treeData}
              onExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
              onSelect={onSelect}
            />
          </div>
        </div>
        <div className="content" ref={contentRef}>
          {selectedTag?.children?.map(
            (tabGroup: TreeDataNodeTabGroup) =>
              tabGroup?.originData && (
                <TabGroup
                  key={tabGroup.key}
                  selected={tabGroup.key === selectedTabGroupKey}
                  {...tabGroup.originData}
                  onChange={(data) => handleTabGroupChange(selectedTag, tabGroup, data)}
                  onRemove={() => handleTabGroupRemove(selectedTag, tabGroup)}
                  onRestore={() => handleTabGroupRestore(selectedTag, tabGroup)}
                  onStarredChange={(isStarred) =>
                    handleTabGroupStarredChange(selectedTag, tabGroup, isStarred)
                  }
                ></TabGroup>
              )
          )}
        </div>
      </StyledListWrapper>
    </div>
  );
}

export default Home;

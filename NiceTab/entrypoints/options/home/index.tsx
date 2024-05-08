import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { theme, Tree, Button, Input } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { TagItem, GroupItem, CountInfo } from '~/entrypoints/types';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { openNewTab } from '~/entrypoints/common/tabs';
import { ENUM_SETTINGS_PROPS, ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledListWrapper } from './Home.styled';
import RenderTreeNode from './RenderTreeNode';
import TabGroup from './TabGroup';
import {
  TreeDataNodeTabGroup,
  TreeDataNodeTag,
  TreeDataNodeUnion,
  RenderTreeNodeActionProps,
} from './types';
import { getTreeData } from './utils';

// const { Search } = Input;

function Home() {
  const { token } = theme.useToken();
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
  const handleTagRemove = useCallback(async (tagKey: React.Key, currSelectedTagKey?: React.Key) => {
    if (!tagKey) return;
    await tabListUtils.removeTag(tagKey);
    refreshTreeData((treeData) => {
      const tag0 = treeData?.[0];
      if (currSelectedTagKey && currSelectedTagKey === tagKey) {
        handleSelect(treeData, [tag0?.key], { node: tag0 });
      } else {
        const tag = treeData?.find((tag) => tag.key === currSelectedTagKey) || tag0;
        handleSelect(treeData, [tag.key], { node: tag });
      }
    });
  }, []);
  // 创建分类
  const handleTagCreate = useCallback(async () => {
    await tabListUtils.addTag();
    refreshTreeData((treeData) => {
      const tag = treeData?.[0];
      handleSelect(treeData, [tag?.key], { node: tag });
    });
  }, []);
  // 修改分类
  const handleTagChange = useCallback(
    async (tag: TreeDataNodeTag, data: Partial<TagItem>) => {
      await tabListUtils.updateTag(tag.key, data);
      refreshTreeData();
    },
    []
  );

  // treeNode 节点操作
  const onTreeNodeAction = useCallback(
    ({ actionType, node, actionName, data }: RenderTreeNodeActionProps) => {
      const handlerMap = {
        tag: {
          create: () => handleTagCreate(),
          remove: () => handleTagRemove(node.key, selectedTagKey),
          rename: () =>
            handleTagChange(node as TreeDataNodeTag, (data as Partial<TagItem>) || {}),
        },
        tabGroup: {
          create: () => handleTabGroupCreate(node.key),
          remove: () =>
            handleTabGroupRemove(
              node as TreeDataNodeTabGroup,
              selectedTagKey,
              selectedTabGroupKey
            ),
          rename: () =>
            handleTabGroupChange(
              node as TreeDataNodeTabGroup,
              (data as Partial<GroupItem>) || {}
            ),
        },
      };
      const handler = handlerMap[actionType][actionName];
      handler?.();
    },
    [selectedTagKey, selectedTabGroupKey]
  );
  // 展开、折叠全部
  const toggleExpand = useCallback((bool: boolean) => {
    if (bool) {
      setExpandedKeys(treeData.map((tag) => tag.key));
    } else {
      setExpandedKeys([]);
    }
  }, [treeData]);
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
        setSearchParams({}, { replace: true });
      }
    },
    [treeData]
  );

  // 删除标签组
  const handleTabGroupRemove = useCallback(
    async (
      tabGroup: TreeDataNodeTabGroup,
      currSelectedTagKey?: React.Key,
      currSelectedGroupKey?: React.Key
    ) => {
      const tagKey = tabGroup.parentKey;
      if (!tabGroup.key || !tagKey) return;
      const tag = treeData.find((tag) => tag.key === tagKey) as TreeDataNodeTag;
      await tabListUtils.removeTabGroup(tagKey, tabGroup.key);
      refreshTreeData((treeData) => {
        if (!currSelectedTagKey) {
          const tag = treeData?.[0];
          handleSelect(treeData, [tag?.key], { node: tag });
          return;
        }
        if (!currSelectedGroupKey) {
          const tag = treeData.find(
            (tag) => tag.key === currSelectedTagKey
          ) as TreeDataNodeTag;
          handleSelect(treeData, [currSelectedTagKey], { node: tag });
          return;
        }

        if (tabGroup.key === currSelectedGroupKey) {
          handleSelect(treeData, [tagKey], { node: tag });
        } else {
          const tag = treeData.find(
            (tag) => tag.key === currSelectedTagKey
          ) as TreeDataNodeTag;
          const selectedTabGroup = tag?.children?.find(
            (g) => g.key === currSelectedGroupKey
          ) as TreeDataNodeTabGroup;
          handleSelect(treeData, [currSelectedTagKey], { node: selectedTabGroup });
        }
      });
    },
    [treeData]
  );
  // 创建标签组
  const handleTabGroupCreate = useCallback(async (tagKey: React.Key) => {
    await tabListUtils.addTabGroup(tagKey);
    refreshTreeData();
  }, []);
  // 修改标签组
  const handleTabGroupChange = useCallback(
    async (tabGroup: TreeDataNodeTabGroup, data: Partial<GroupItem>) => {
      const tagKey = tabGroup.parentKey;
      if (!tabGroup.key || !tagKey) return;
      await tabListUtils.updateTabGroup(tagKey, tabGroup.key, data);
      refreshTreeData((treeData) =>
        handleSelect(treeData, [tabGroup.key], { node: tabGroup })
      );
    },
    []
  );

  // 标签组星标状态切换（需要调整排序）
  const handleTabGroupStarredChange = useCallback(
    async (tabGroup: TreeDataNodeTabGroup, isStarred: boolean) => {
      const tagKey = tabGroup.parentKey;
      const tag = treeData.find((tag) => tag.key === tagKey) as TreeDataNodeTag;
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
    [treeData]
  );
  // 恢复标签组
  const handleTabGroupRestore = useCallback(
    async (tabGroup: TreeDataNodeTabGroup) => {
      const tagKey = tabGroup.parentKey;
      const tag = treeData.find((tag) => tag.key === tagKey) as TreeDataNodeTag;
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
    [treeData]
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
    setExpandedKeys(treeData.map((tag) => tag.key));

    // console.log('routeParams', searchParams.get('tagId'), searchParams.get('groupId'));
    const tag =
      treeData?.find(
        (tag) => tag.type === 'tag' && tag.key === searchParams.get('tagId')
      ) || treeData?.[0];
    const tabGroup =
      tag?.children?.find((g) => g.key === searchParams.get('groupId')) ||
      tag.children?.[0];
    handleSelect(treeData, [tabGroup ? tabGroup.key : tag.key], {
      node: tabGroup ? (tabGroup as TreeDataNodeTabGroup) : tag,
    });
  };
  useEffect(() => {
    init();
  }, []);

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
            titleRender={(node) => (
              <RenderTreeNode node={node} onAction={onTreeNodeAction}></RenderTreeNode>
            )}
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
                onChange={(data) => handleTabGroupChange(tabGroup, data)}
                onRemove={() =>
                  handleTabGroupRemove(tabGroup, selectedTagKey, selectedTabGroupKey)
                }
                onRestore={() => handleTabGroupRestore(tabGroup)}
                onStarredChange={(isStarred) =>
                  handleTabGroupStarredChange(tabGroup, isStarred)
                }
              ></TabGroup>
            )
        )}
      </div>
    </StyledListWrapper>
  );
}

export default Home;

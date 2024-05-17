import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TagItem, GroupItem, CountInfo } from '~/entrypoints/types';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { openNewTab } from '~/entrypoints/common/tabs';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import {
  TreeDataNodeTabGroup,
  TreeDataNodeTag,
  TreeDataNodeUnion,
  RenderTreeNodeActionProps,
  DndTabItemOnDropCallback
} from './types';
import { getTreeData } from './utils';

export function useTreeData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [countInfo, setCountInfo] = useState<CountInfo>();
  const [tagList, setTagList] = useState<TagItem[]>([]);
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

  // 点击更多选项
  const handleMoreItemClick = async (action: string) => {
    if (action === 'clear') {
      await tabListUtils.setTagList([]);
      refreshTreeData();
    }
  }

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



  // 删除分类
  const handleTagRemove = useCallback(async (tagKey: React.Key, currSelectedTagKey?: React.Key) => {
    if (!tagKey) return;
    await tabListUtils.removeTag(tagKey);
    refreshTreeData((treeData) => {
      const tag0 = treeData?.[0];
      if (!tag0) return;
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
    const newTag = await tabListUtils.addTag();
    refreshTreeData((treeData) => {
      // 优先渲染新的tree节点，再选中，防止渲染卡顿（创建时，选中新创建的节点）
      setTimeout(() => {
        const treeTag = treeData.find(tag => tag.key == newTag?.tagId);
        if (treeTag) {
          handleSelect(treeData, [treeTag.key], { node: treeTag });
        }
      }, 0);
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
    const {tagId, tabGroup} = await tabListUtils.addTabGroup(tagKey);
    refreshTreeData(treeData => {
      const tag = treeData.find((tag) => tag.key === tagId) as TreeDataNodeTag;
      const group = tag.children?.find((g) => g.key === tabGroup?.groupId) as TreeDataNodeTabGroup;
      // 优先渲染新的tree节点，再选中，防止渲染卡顿（创建时，选中新创建的节点）
      setTimeout(() => {
        handleSelect(treeData, [tabGroup.groupId], { node: group });
      }, 0);
    });
  }, []);
  // 修改标签组
  const handleTabGroupChange = useCallback(
    async (tabGroup: TreeDataNodeTabGroup, data: Partial<GroupItem>) => {
      const tagKey = tabGroup.parentKey;
      if (!tabGroup.key || !tagKey) return;
      await tabListUtils.updateTabGroup(tagKey, tabGroup.key, data);
      refreshTreeData();
    },
    []
  );

  // 标签组星标状态切换（需要调整排序）
  const handleTabGroupStarredChange = useCallback(
    async (tabGroup: TreeDataNodeTabGroup, isStarred: boolean) => {
      await tabListUtils.toggleTabGroupStarred(tabGroup.parentKey, tabGroup.key, isStarred);
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

  // 拖拽标签页逻辑
  const handleTabItemDrop: DndTabItemOnDropCallback = async ({ sourceData, targetData, sourceIndex, targetIndex }) => {
    await tabListUtils.onTabDrop(sourceData.groupId, targetData.groupId, sourceIndex, targetIndex);
    refreshTreeData();
  };

  // 刷新treeData
  const refreshTreeData = async (callback?: (treeData: TreeDataNodeUnion[]) => void) => {
    const tagList = tabListUtils.tagList;
    setTagList(tagList);
    const treeData = getTreeData(tagList);
    setTreeData(treeData);
    // console.log('refresh-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);
    callback?.(treeData);
  };
  // 初始化
  const init = async () => {
    const tagList = await tabListUtils.getTagList();
    setTagList(tagList);
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
      tag?.children?.[0];
    if (!tag) return;
    handleSelect(treeData, [tabGroup ? tabGroup.key : tag.key], {
      node: tabGroup ? (tabGroup as TreeDataNodeTabGroup) : tag,
    });
  };
  useEffect(() => {
    init();
  }, []);

  return {
    searchParams,
    countInfo,
    tagList,
    treeData,
    selectedTagKey,
    selectedTabGroupKey,
    selectedKeys,
    expandedKeys,
    setExpandedKeys,
    selectedTag,
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
    handleTabGroupRestore,
    handleTabItemDrop,
  }
}


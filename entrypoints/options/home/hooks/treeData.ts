import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TreeProps } from 'antd';
import { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { openNewGroup } from '~/entrypoints/common/tabs';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { getRandomId } from '@/entrypoints/common/utils';
import {
  TreeDataNodeTabGroup,
  TreeDataNodeTag,
  TreeDataNodeUnion,
  RenderTreeNodeActionProps,
  DndTabItemOnDropCallback
} from '../types';
import { getTreeData } from '../utils';

const { DELETE_AFTER_RESTORE } = ENUM_SETTINGS_PROPS;

type TreeDataHookProps = ReturnType<typeof useTreeData>;
interface HomeContextProps {
  treeDataHook: TreeDataHookProps,
}
export const HomeContext = createContext<HomeContextProps>({
  treeDataHook: {} as TreeDataHookProps,
});

export function useTreeData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [countInfo, setCountInfo] = useState<CountInfo>();
  const [tagList, setTagList] = useState<TagItem[]>([]);
  const [treeData, setTreeData] = useState([] as TreeDataNodeUnion[]);
  const [selectedTagKey, setSelectedTagKey] = useState<React.Key | undefined>();
  const [selectedTabGroupKey, setSelectedTabGroupKey] = useState<React.Key | undefined>();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [refreshKey, setRefreshKey] = useState<string>(getRandomId());

  const urlParams = useMemo(() => {
    const params: Record<string, string> = {};
    for (let [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }, [searchParams]);

  const selectedTag: TreeDataNodeTag = useMemo(() => {
    const tag =
      treeData.find((tag) => tag.type === 'tag' && tag.key === selectedTagKey) || {};
    return tag as TreeDataNodeTag;
  }, [treeData, selectedTagKey]);

  // 点击更多选项
  const handleMoreItemClick = async (action: string) => {
    if (action === 'clear') {
      await tabListUtils.clearAll();
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
          moveTo: () => {}, // 在index.tsx中实现
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
          moveTo: () => {}, // 在index.tsx中实现
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
        // setSelectedTabGroupKey(node?.children?.[0]?.key || '');
        setSelectedTabGroupKey('');
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
      setRefreshKey(getRandomId());
    },
    []
  );
  const onSelect = useCallback(
    (selectedKeys: React.Key[], { node }: { node: TreeDataNodeUnion }) => {
      handleSelect(treeData, selectedKeys, { node });
    },
    [treeData]
  );

  const selectedKeyChange = useCallback(({ type, key, parentKey }: Partial<TreeDataNodeUnion>, callback?: () => void) => {
    if (!key) return;
    handleSelect(treeData, [key], { node: { type, key, parentKey } as TreeDataNodeUnion });
    setTimeout(() => {
      callback?.();
    }, 300);
  }, [treeData]);


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
    const {tagId, tabGroup} = await tabListUtils.createTabGroup(tagKey);
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
      await tabListUtils.updateTabGroup({
        tagId: tagKey,
        groupId: tabGroup.key,
        data
      });
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
  // 标签组去重
  const handleTabGroupDedup = useCallback(
    async (tabGroup: TreeDataNodeTabGroup) => {
      await tabListUtils.tabGroupDedup(tabGroup.parentKey, tabGroup.key);
      refreshTreeData();
    },
    [treeData]
  );
  // 打开标签组
  const handleTabGroupRestore = useCallback(
    async (tabGroup: TreeDataNodeTabGroup) => {
      const tagKey = tabGroup.parentKey;
      const tag = treeData.find((tag) => tag.key === tagKey) as TreeDataNodeTag;
      const settings = settingsUtils.settings;
      // 打开标签组 (保持标签组形式)
      openNewGroup(
        tabGroup.originData.groupName,
        tabGroup.originData.tabList.map(tab => tab.url)
      );
      if (settings?.[DELETE_AFTER_RESTORE]) {
        await tabListUtils.removeTabGroup(tag.key, tabGroup.key);
        refreshTreeData((treeData) => handleSelect(treeData, [tag.key], { node: tag }));
      }
    },
    [treeData]
  );
  // 删除标签页
  const handleTabItemRemove = useCallback(
    async (groupId: React.Key, tabs: TabItem[]) => {
      await tabListUtils.removeTabs(groupId, tabs);
      refreshTreeData();
    },
    [treeData]
  )
  // 修改标签页
  const handleTabItemChange = useCallback(async (tabGroup: TreeDataNodeTabGroup, tabData: TabItem) => {
    await tabListUtils.updateTab({
      tagId: tabGroup.parentKey,
      groupId: tabGroup.key,
      data: tabData
    });
    refreshTreeData();
  }, []);

  // 拖拽
  const handleTreeNodeDrop: TreeProps<TreeDataNodeUnion>['onDrop'] = async ({ dragNode, dropPosition, node }) => {
    // console.log('onDrop-dragNode', dragNode)
    // console.log('onDrop-dropPosition', dropPosition)
    // console.log('onDrop-info-node', node)
    const dragIndex = Number(dragNode.pos.split('-').slice(-1));
    const dropPosIndex = Number(node.pos.split('-').slice(-1));
    const position = dropPosition - dropPosIndex;

    // position = 0 时表示，拖放到目标 node 的子集
    // position = 1 时表示，拖放到目标 node 的同级之后
    // position = -1 时表示，拖放到一级node节点最前面
    let dropIndex = position === 0 ? dropPosition + 1 : (position === 1 ? dropPosition : 0);
    if (dragNode.type === 'tabGroup' && node.type === 'tabGroup') {
      await tabListUtils.onTabGroupDrop(dragNode.parentKey, node.parentKey, dragIndex, dropIndex);
    } else if (dragNode.type === 'tag' && node.type === 'tag') {
      await tabListUtils.onTagDrop(dragIndex, dropIndex);
    } else if (dragNode.type === 'tabGroup' && node.type === 'tag') {
      dropIndex =  position === 0 ? 0 : node?.children?.length || 0;
      await tabListUtils.onTabGroupDrop(dragNode.parentKey, node.key, dragIndex, dropIndex);
    }

    refreshTreeData((treeData) => {
      let node = dragNode;
      if (dragNode.type === 'tag') {
        node = (treeData.find((t) => t.key === dragNode.key) ) as typeof dragNode & TreeDataNodeTag;
      } else if (dragNode.type === 'tabGroup') {
        for (let tag of treeData) {
          let hasFound = false;
          for (let group of tag?.children || []) {
            if (group.key === dragNode.key) {
              node = group as typeof dragNode & TreeDataNodeTabGroup;
              hasFound = true;
              break;
            }
          }
          if (hasFound) break;
        }
      }
      handleSelect(treeData, [node.key], { node });
    });
  };

  // 拖拽标签页逻辑
  const handleTabItemDrop: DndTabItemOnDropCallback = async ({ sourceData, targetData, sourceIndex, targetIndex }) => {
    await tabListUtils.onTabDrop(sourceData.groupId, targetData.groupId, sourceIndex, targetIndex);
    refreshTreeData();
  };

  // 刷新treeData
  const refreshTreeData = async (
    callback?: (treeData: TreeDataNodeUnion[]) => void,
    { autoScroll = false }: { autoScroll?: boolean } = {}
  ) => {
    const tagList = tabListUtils.tagList;
    setTagList(tagList);
    const treeData = getTreeData(tagList);
    setTreeData(treeData);
    // console.log('refresh-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);
    autoScroll && setRefreshKey(getRandomId());
    callback?.(treeData);
  };
  // 初始化
  const init = async () => {
    const tagList = await tabListUtils.getTagList();
    setTagList(tagList);
    const treeData = getTreeData(tagList);
    setTreeData(treeData);

    setLoading(false);
    // console.log('init-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);
    // 考虑到数据量大，默认不展开列表了
    // setExpandedKeys(treeData.map((tag) => tag.key));

    const tag =
      treeData?.find(
        (tag) => tag.type === 'tag' && tag.key === urlParams.tagId
      ) || treeData?.[0];
    const tabGroup =
      tag?.children?.find((g) => g.key === urlParams.groupId) ||
      tag?.children?.[0];

    if (!tag) return;
    handleSelect(treeData, [tabGroup ? tabGroup.key : tag.key], {
      node: tabGroup ? (tabGroup as TreeDataNodeTabGroup) : tag,
    });
  };

  // 快捷键操作
  const handleHotkeyAction = useCallback(async ({ action }: { action: string }) => {
    if (!selectedTagKey) return;
    if (selectedTabGroupKey) {
      await tabListUtils.tabGroupMove(action === 'moveUp' ? 'up' : 'down', selectedTagKey, selectedTabGroupKey);
      refreshTreeData((treeData) => {
        let tabGroup = {} as TreeDataNodeTabGroup;
        for (let tag of treeData) {
          let hasFound = false;
          for (let group of tag?.children || []) {
            if (group.key === selectedTabGroupKey) {
              tabGroup = group as TreeDataNodeTabGroup;
              hasFound = true;
              break;
            }
          }
          if (hasFound) break;
        }
        handleSelect(treeData, [tabGroup.key || selectedTagKey], {
          node: tabGroup.key ? tabGroup : (treeData.find((t) => t.key === selectedTagKey) as TreeDataNodeTag),
        });
      }, { autoScroll: true });
    } else {
      const tagIndex = treeData.findIndex(tag => tag.type === 'tag' && tag.key === selectedTagKey);
      // if (action === 'moveUp' && tagIndex === 0 || action === 'moveDown' && tagIndex === treeData.length - 1) return;
      if (action === 'moveUp') {
        if (tagIndex === 0) return;
        const prevTagData = treeData[tagIndex - 1]?.originData as TagItem;
        // 中转站始终在第一位
        if (tagIndex === 1 && prevTagData.static) return;
      } else if (action === 'moveDown') {
        if (tagIndex === treeData.length - 1) return;
        const firstTagData = treeData[0]?.originData as TagItem;
        // 中转站始终在第一位
        if (tagIndex === 0 && firstTagData?.static) return;
      }
      await tabListUtils.onTagDrop(tagIndex, action === 'moveUp' ? tagIndex - 1 : tagIndex + 2);
      refreshTreeData((treeData) => {
        const tag = treeData.find((t) => t.key === selectedTagKey) as TreeDataNodeTag;
        handleSelect(treeData, [tag.key], { node: tag });
      }, { autoScroll: true });
    }
  }, [treeData, selectedTagKey, selectedTabGroupKey]);

  useEffect(() => {
    init();
  }, [urlParams]);
  useEffect(() => {
    setLoading(true);
    init();
  }, []);

  return {
    urlParams,
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
    selectedKeyChange
  }
}




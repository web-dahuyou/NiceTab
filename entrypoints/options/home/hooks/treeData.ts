import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import type { TreeProps } from 'antd';
import type { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';
import { settingsUtils, stateUtils, tabListUtils } from '~/entrypoints/common/storage';
import { openNewTab, openNewGroup } from '~/entrypoints/common/tabs';
import { ENUM_SETTINGS_PROPS, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { getRandomId } from '~/entrypoints/common/utils';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import {
  initialSelectionBoxData,
  type SelectionBoxDataProps,
} from '~/entrypoints/common/hooks/selectionBox';
import {
  TreeDataNodeTabGroup,
  TreeDataNodeTag,
  TreeDataNodeUnion,
  RenderTreeNodeActionProps,
  DndTabItemOnDropCallback,
} from '../types';
import { getTreeData } from '../utils';

const {
  DELETE_AFTER_RESTORE,
  DISCARD_WHEN_OPEN_TABS,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
  AUTO_EXPAND_HOME_TREE,
  TAB_INSERT_POSITION,
} = ENUM_SETTINGS_PROPS;

export type TreeDataHookProps = ReturnType<typeof useTreeData>;
interface HomeContextProps {
  treeDataHook: TreeDataHookProps;
  selectionBoxHook: {
    isSelecting: boolean;
    isSelectMoving: boolean;
    actionType: 'meta' | 'default';
    selectionBoxData: SelectionBoxDataProps;
    setIsAllowed: (bool: boolean) => void;
  };
}
export const HomeContext = createContext<HomeContextProps>({
  treeDataHook: {} as TreeDataHookProps,
  selectionBoxHook: {
    isSelecting: false,
    isSelectMoving: false,
    actionType: 'default',
    selectionBoxData: { ...initialSelectionBoxData },
    setIsAllowed: () => {},
  },
});

export function useTreeData() {
  const [loading, setLoading] = useState<boolean>(true);
  const [countInfo, setCountInfo] = useState<CountInfo>();
  const [tagList, setTagList] = useState<TagItem[]>([]);
  const [treeData, setTreeData] = useState([] as TreeDataNodeUnion[]);
  const [selectedTagKey, setSelectedTagKey] = useState<React.Key | undefined>();
  const [selectedTabGroupKey, setSelectedTabGroupKey] = useState<React.Key | undefined>();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [refreshKey, setRefreshKey] = useState<string>(getRandomId());
  const [highlightTabId, setHighlightTabId] = useState<string | undefined>();

  const { urlParams, setSearchParams } = useUrlParams();

  const selectedTag: TreeDataNodeTag = useMemo(() => {
    const tag =
      treeData.find(tag => tag.type === 'tag' && tag.key === selectedTagKey) || {};
    return tag as TreeDataNodeTag;
  }, [treeData, selectedTagKey]);

  // 点击更多选项
  const handleMoreItemClick = async (action: string) => {
    if (action === 'clear') {
      await tabListUtils.clearAll();
      refreshTreeData();
    }
  };

  // 展开、折叠全部
  const toggleExpand = useCallback(
    (bool: boolean) => {
      if (bool) {
        setExpandedKeys(treeData.map(tag => tag.key));
      } else {
        setExpandedKeys([]);
      }
    },
    [treeData],
  );
  // 选中节点
  const handleSelect = useCallback(
    (
      treeData: TreeDataNodeUnion[],
      selectedKeys: React.Key[],
      { node }: { node: TreeDataNodeUnion },
    ) => {
      let tagKey: React.Key = '',
        tabGroupKey: React.Key = '';
      if (node.type === 'tag') {
        tagKey = node.key;
        tabGroupKey = '';
        setExpandedKeys(keys => {
          return [...new Set([...keys, node.key])];
        });
      } else if (node.type === 'tabGroup') {
        const tag = treeData.find(tag => tag.key === node.parentKey);
        tagKey = tag?.key || '';
        tabGroupKey = node.key;
        setExpandedKeys(keys => {
          return [...new Set([...keys, node.parentKey])];
        });
      }
      setSelectedTagKey(tagKey);
      setSelectedTabGroupKey(tabGroupKey);
      setSelectedKeys([node.key]);
      setRefreshKey(getRandomId());
      setHighlightTabId(undefined);
      stateUtils.saveHomeSelectedKeys(
        {
          selectedTagKey: tagKey as string,
          selectedTabGroupKey: tabGroupKey as string,
        },
        () => {
          // 清除urlParams上的tagId和groupId
          setSearchParams({});
        },
      );
    },
    [setSearchParams],
  );
  const onSelect = useCallback(
    (selectedKeys: React.Key[], { node }: { node: TreeDataNodeUnion }) => {
      handleSelect(treeData, selectedKeys, { node });
    },
    [treeData, handleSelect],
  );

  const selectedKeyChange = useCallback(
    (
      { type, key, parentKey, tabId }: Partial<TreeDataNodeUnion & { tabId: string }>,
      callback?: () => void,
    ) => {
      if (!key) return;
      handleSelect(treeData, [key], {
        node: { type, key, parentKey } as TreeDataNodeUnion,
      });
      setHighlightTabId(tabId);

      setTimeout(() => {
        callback?.();
      }, 300);
    },
    [treeData, handleSelect],
  );

  // 删除分类
  const handleTagRemove = useCallback(
    async (tagKey: React.Key, currSelectedTagKey?: React.Key) => {
      if (!tagKey) return;
      await tabListUtils.removeTag(tagKey);
      refreshTreeData(treeData => {
        const tag0 = treeData?.[0];
        if (!tag0) return;
        if (currSelectedTagKey && currSelectedTagKey === tagKey) {
          handleSelect(treeData, [tag0?.key], { node: tag0 });
        } else {
          const tag = treeData?.find(tag => tag.key === currSelectedTagKey) || tag0;
          handleSelect(treeData, [tag.key], { node: tag });
        }
      });
    },
    [handleSelect],
  );
  // 创建分类
  const handleTagCreate = useCallback(async () => {
    const newTag = await tabListUtils.addTag();
    refreshTreeData(treeData => {
      // 优先渲染新的tree节点，再选中，防止渲染卡顿（创建时，选中新创建的节点）
      setTimeout(() => {
        const treeTag = treeData.find(tag => tag.key == newTag?.tagId);
        if (treeTag) {
          handleSelect(treeData, [treeTag.key], { node: treeTag });
        }
      }, 0);
    });
  }, [handleSelect]);
  // 修改分类
  const handleTagChange = useCallback(
    async (tagId: TreeDataNodeTag['key'], data: Partial<TagItem>) => {
      await tabListUtils.updateTag(tagId || treeData?.[0]?.key, data);
      refreshTreeData();
    },
    [],
  );

  // 删除标签组
  const handleTabGroupRemove = useCallback(
    async (tabGroup: TreeDataNodeTabGroup) => {
      const tagKey = tabGroup.parentKey;
      if (!tabGroup.key || !tagKey) return;
      const tag = treeData.find(tag => tag.key === tagKey) as TreeDataNodeTag;
      await tabListUtils.removeTabGroup(tagKey, tabGroup.key);
      refreshTreeData();
    },
    [treeData],
  );
  // 创建标签组
  const handleTabGroupCreate = useCallback(
    async (tagKey: React.Key) => {
      const { tagId, tabGroup } = await tabListUtils.createTabGroup(tagKey);
      refreshTreeData(treeData => {
        const tag = treeData.find(tag => tag.key === tagId) as TreeDataNodeTag;
        const group = tag.children?.find(
          g => g.key === tabGroup?.groupId,
        ) as TreeDataNodeTabGroup;
        // 优先渲染新的tree节点，再选中，防止渲染卡顿（创建时，选中新创建的节点）
        setTimeout(() => {
          handleSelect(treeData, [tabGroup.groupId], { node: group });
        }, 0);
      });
    },
    [handleSelect],
  );
  // 修改标签组
  const handleTabGroupChange = useCallback(
    async (tabGroup: TreeDataNodeTabGroup, data: Partial<GroupItem>) => {
      const tagKey = tabGroup.parentKey;
      if (!tabGroup.key || !tagKey) return;
      await tabListUtils.updateTabGroup({
        tagId: tagKey,
        groupId: tabGroup.key,
        data,
      });
      refreshTreeData();
    },
    [],
  );

  // 标签组星标状态切换（需要调整排序）
  const handleTabGroupStarredChange = useCallback(
    async (tabGroup: TreeDataNodeTabGroup, isStarred: boolean) => {
      await tabListUtils.toggleTabGroupStarred(
        tabGroup.parentKey,
        tabGroup.key,
        isStarred,
      );
      refreshTreeData(treeData =>
        handleSelect(treeData, [tabGroup.key], { node: tabGroup }),
      );
    },
    [handleSelect],
  );
  // 标签组去重
  const handleTabGroupDedup = useCallback(async (tabGroup: TreeDataNodeTabGroup) => {
    await tabListUtils.tabGroupDedup(tabGroup.parentKey, tabGroup.key);
    refreshTreeData();
  }, []);
  // 复制标签组
  const handleTabGroupCopy = useCallback(async (groupId: string) => {
    await tabListUtils.cloneGroup(groupId);
    refreshTreeData();
  }, []);
  // 打开标签组
  const handleTabGroupRestore = useCallback(
    async (tabGroup: TreeDataNodeTabGroup) => {
      const tagKey = tabGroup.parentKey;
      const tag = treeData.find(tag => tag.key === tagKey) as TreeDataNodeTag;
      const settings = await settingsUtils.getSettings();
      const { groupName, tabList = [], isLocked } = tabGroup?.originData || {};
      const discard = settings?.[DISCARD_WHEN_OPEN_TABS];

      const asGroup =
        (groupName === UNNAMED_GROUP && settings?.[UNNAMED_GROUP_RESTORE_AS_GROUP]) ||
        (groupName !== UNNAMED_GROUP && settings?.[NAMED_GROUP_RESTORE_AS_GROUP]);

      openNewGroup(
        groupName,
        tabList.map(tab => tab.url),
        { discard, asGroup },
      );

      if (settings?.[DELETE_AFTER_RESTORE] && !isLocked) {
        await tabListUtils.removeTabGroup(tag.key, tabGroup.key);
        refreshTreeData();
      }
    },
    [treeData],
  );
  // 打开标签页
  const handleTabsOpen = useCallback(
    async (
      group: Pick<GroupItem, 'groupName' | 'groupId' | 'isLocked'>,
      tabs: TabItem[],
    ) => {
      if (tabs.length === 1) {
        openNewTab(tabs[0].url, { active: true });
      } else {
        const groupName = group.groupName;
        const settings = await settingsUtils.getSettings();
        const discard = settings?.[DISCARD_WHEN_OPEN_TABS];

        const asGroup =
          (groupName === UNNAMED_GROUP && settings?.[UNNAMED_GROUP_RESTORE_AS_GROUP]) ||
          (groupName !== UNNAMED_GROUP && settings?.[NAMED_GROUP_RESTORE_AS_GROUP]);

        openNewGroup(
          groupName,
          tabs.map(tab => tab.url),
          { discard, asGroup },
        );
      }
      const settings = await settingsUtils.getSettings();
      if (settings[DELETE_AFTER_RESTORE] && !group?.isLocked) {
        handleTabItemRemove?.(group.groupId, tabs);
      }
    },
    [],
  );
  // 删除标签页
  const handleTabItemRemove = useCallback(async (groupId: React.Key, tabs: TabItem[]) => {
    await tabListUtils.removeTabs(groupId, tabs);
    await refreshTreeData();
  }, []);
  // 修改标签页
  const handleTabItemChange = useCallback(
    async (tabGroup: { parentKey?: React.Key; key: React.Key }, tabData: TabItem) => {
      await tabListUtils.updateTab({
        tagId: tabGroup.parentKey,
        groupId: tabGroup.key,
        data: tabData,
      });
      refreshTreeData();
    },
    [],
  );
  // 复制标签页
  const handleTabItemCopy = useCallback(
    async ({ groupId, tabs }: { groupId: React.Key; tabs: TabItem[] }) => {
      await tabListUtils.copyTabs(groupId as string, tabs);
      refreshTreeData();
    },
    [],
  );

  // 拖拽
  const handleTreeNodeDrop: TreeProps<TreeDataNodeUnion>['onDrop'] = async ({
    dragNode,
    dropPosition,
    node,
  }) => {
    // console.log('onDrop-dragNode', dragNode)
    // console.log('onDrop-dropPosition', dropPosition)
    // console.log('onDrop-info-node', node)
    const dragIndex = Number(dragNode.pos.split('-').slice(-1));
    const dropPosIndex = Number(node.pos.split('-').slice(-1));
    const position = dropPosition - dropPosIndex;

    // position = 0 时表示，拖放到目标 node 的子集
    // position = 1 时表示，拖放到目标 node 的同级之后
    // position = -1 时表示，拖放到一级node节点最前面
    let dropIndex = position === 0 ? dropPosition + 1 : position === 1 ? dropPosition : 0;
    if (dragNode.type === 'tabGroup' && node.type === 'tabGroup') {
      await tabListUtils.onTabGroupDrop(
        dragNode.parentKey,
        node.parentKey,
        dragIndex,
        dropIndex,
      );
    } else if (dragNode.type === 'tag' && node.type === 'tag') {
      await tabListUtils.onTagDrop(dragIndex, dropIndex);
    } else if (dragNode.type === 'tabGroup' && node.type === 'tag') {
      dropIndex = position === 0 ? 0 : node?.children?.length || 0;
      await tabListUtils.onTabGroupDrop(
        dragNode.parentKey,
        node.key,
        dragIndex,
        dropIndex,
      );
    }

    refreshTreeData(treeData => {
      let node = dragNode;
      if (dragNode.type === 'tag') {
        node = treeData.find(t => t.key === dragNode.key) as typeof dragNode &
          TreeDataNodeTag;
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

  // treeNode 节点操作
  const onTreeNodeAction = useCallback(
    ({ actionType, node, actionName, data }: RenderTreeNodeActionProps) => {
      const handlerMap = {
        tag: {
          create: () => handleTagCreate(),
          remove: () => handleTagRemove(node.key, selectedTagKey),
          rename: () => handleTagChange(node.key, (data as Partial<TagItem>) || {}),
          change: () => handleTagChange(node.key, (data as Partial<TagItem>) || {}),
          moveTo: () => {}, // 在index.tsx中实现
        },
        tabGroup: {
          create: () => handleTabGroupCreate(node.key),
          remove: () => handleTabGroupRemove(node as TreeDataNodeTabGroup),
          rename: () =>
            handleTabGroupChange(
              node as TreeDataNodeTabGroup,
              (data as Partial<GroupItem>) || {},
            ),
          moveTo: () => {}, // 在index.tsx中实现
        },
      };
      const handler = handlerMap[actionType][actionName];
      handler?.();
    },
    [
      selectedTagKey,
      handleTagCreate,
      handleTagRemove,
      handleTagChange,
      handleTabGroupCreate,
      handleTabGroupRemove,
      handleTabGroupChange,
    ],
  );

  // 拖拽标签页逻辑
  const handleTabItemDrop: DndTabItemOnDropCallback = async ({
    sourceData,
    targetData,
    sourceIndex,
    targetIndex,
    actionType = 'tab2tab',
    targetTabListLength = 0,
  }) => {
    let _targetIndex = targetIndex;
    if (actionType === 'tab2group') {
      const settings = await settingsUtils.getSettings();
      _targetIndex = settings[TAB_INSERT_POSITION] === 'bottom' ? targetTabListLength : 0;
    }

    if (sourceData.isMultiSelect) {
      await tabListUtils.onTabsDrop(sourceData, targetData, sourceIndex, _targetIndex);
    } else {
      await tabListUtils.onTabDrop(
        sourceData.groupId,
        targetData.groupId,
        sourceIndex,
        _targetIndex,
      );
    }
    refreshTreeData();
  };

  const handleTabsSort = async ({
    tagId,
    groupId,
    sortType,
  }: {
    tagId: string;
    groupId: string;
    sortType: string;
  }) => {
    await tabListUtils.tabsSortbyName(sortType, groupId, tagId);
    refreshTreeData();
  };

  // 刷新treeData
  const refreshTreeData = async (
    callback?: (treeData: TreeDataNodeUnion[]) => void,
    { autoScroll = false }: { autoScroll?: boolean } = {},
  ) => {
    const tagList = tabListUtils.tagList;
    setTagList(tagList);
    const treeData = getTreeData(tagList);
    setTreeData(treeData);
    // console.log('refresh-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);
    setHighlightTabId(undefined);
    autoScroll && setRefreshKey(getRandomId());
    callback?.(treeData);
  };

  // 初始化
  const init = async () => {
    if (urlParams.action === 'globalSearch') return;
    const tagList = await tabListUtils.getTagList();
    setTagList(tagList);
    const treeData = getTreeData(tagList);
    setTreeData(treeData);

    setLoading(false);
    // console.log('init-treeData', treeData);
    setCountInfo(tabListUtils.countInfo);

    const settings = await settingsUtils.getSettings();
    if (settings?.[AUTO_EXPAND_HOME_TREE]) {
      // 默认展开全部
      setExpandedKeys(treeData.map(tag => tag.key));
    }

    let tagId = urlParams.tagId;
    let groupId = urlParams.groupId;
    let tabId = urlParams.tabId;
    if (!tagId) {
      const selectedKeys = await stateUtils.getHomeSelectedKeys();
      tagId = selectedKeys.selectedTagKey || '';
      groupId = selectedKeys.selectedTabGroupKey || '';
    }
    let tag =
      treeData?.find(tag => tag.type === 'tag' && tag.key === tagId) || treeData?.[0];
    let tabGroup = tag?.children?.find(g => g.key === groupId) || tag?.children?.[0];

    if (!tag) return;
    handleSelect(treeData, [tabGroup ? tabGroup.key : tag.key], {
      node: tabGroup ? (tabGroup as TreeDataNodeTabGroup) : tag,
    });

    if (tabId) {
      setHighlightTabId(tabId);
    }
  };

  // 快捷键操作
  const handleHotkeyAction = useCallback(
    async ({ action }: { action: string }) => {
      if (!selectedTagKey) return;
      if (selectedTag.originData.isLocked) return;
      if (selectedTabGroupKey) {
        await tabListUtils.tabGroupMove(
          action === 'moveUp' ? 'up' : 'down',
          selectedTagKey,
          selectedTabGroupKey,
        );
        refreshTreeData(
          treeData => {
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
              node: tabGroup.key
                ? tabGroup
                : (treeData.find(t => t.key === selectedTagKey) as TreeDataNodeTag),
            });
          },
          { autoScroll: true },
        );
      } else {
        const tagIndex = treeData.findIndex(
          tag => tag.type === 'tag' && tag.key === selectedTagKey,
        );
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
        await tabListUtils.onTagDrop(
          tagIndex,
          action === 'moveUp' ? tagIndex - 1 : tagIndex + 2,
        );
        refreshTreeData(
          treeData => {
            const tag = treeData.find(t => t.key === selectedTagKey) as TreeDataNodeTag;
            handleSelect(treeData, [tag.key], { node: tag });
          },
          { autoScroll: true },
        );
      }
    },
    [treeData, selectedTagKey, selectedTabGroupKey, handleSelect],
  );

  useEffect(() => {
    if (!urlParams.tagId) return;
    init();
  }, [urlParams.tagId, urlParams.groupId, urlParams.tabId]);

  useEffect(() => {
    setLoading(true);
    init();
  }, []);

  // 多窗口数据同步（通过监听randomId变化）
  async function multiWindowDataSync() {
    const tagList = await tabListUtils.getTagList();
    setTagList(tagList);
    const selectedKeys = await stateUtils.getHomeSelectedKeys();
    const _tagId = selectedKeys.selectedTagKey || '';
    const _groupId = selectedKeys.selectedTabGroupKey || '';
    refreshTreeData(treeData => {
      const tag = treeData.find(
        t => t.key === (_tagId || selectedTagKey),
      ) as TreeDataNodeTag;

      const tabGroup = (tag || treeData?.[0])?.children?.find(
        g => g.key === (_groupId || selectedTabGroupKey),
      ) as TreeDataNodeTabGroup;

      if (tabGroup) {
        handleSelect(treeData, [tabGroup.key], { node: tabGroup });
      } else if (tag) {
        handleSelect(treeData, [tag.key], { node: tag });
      }
    });
  }

  useEffect(() => {
    if (urlParams.randomId && !urlParams.tagId) {
      multiWindowDataSync();
    }
  }, [urlParams.randomId, urlParams.tagId]);

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
    highlightTabId,
    setHighlightTabId,
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
    handleTabGroupCopy,
    handleTabGroupRestore,
    handleTreeNodeDrop,
    handleTabsOpen,
    handleTabItemDrop,
    handleTabItemChange,
    handleTabItemCopy,
    handleTabItemRemove,
    handleTabsSort,
    handleHotkeyAction,
    selectedKeyChange,
    init,
  };
}

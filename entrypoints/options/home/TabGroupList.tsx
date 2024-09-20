import { useState, useMemo, useContext } from 'react';
import {
  Space,
  Typography,
} from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TabItem } from '~/entrypoints/types';
import type {
  TreeDataNodeTag,
  TreeDataNodeTabGroup,
  MoveToCallbackProps,
} from './types';
import TabGroup from './TabGroup';
import { HomeContext } from './hooks/treeData';
import { getSelectedCounts } from './utils';

export default function TabGroupList({ virtual }: {virtual?: boolean}) {
  const { $fmt } = useIntlUtls();
  const { treeDataHook } = useContext(HomeContext);
  const {
    treeData,
    selectedTagKey,
    selectedTabGroupKey,
    selectedTag,
    refreshKey,
    handleSelect,
    refreshTreeData,
    handleTabGroupRemove,
    handleTabGroupChange,
    handleTabGroupStarredChange,
    handleTabGroupDedup,
    handleTabGroupRestore,
    handleTabItemDrop,
    handleTabItemChange,
    handleTabItemRemove,
  } = treeDataHook;

  const currGroupList = useMemo(() => {
    if (!virtual) {
      return selectedTag?.children || [];
    }
    if (selectedTag) {
      let result = selectedTag?.children?.slice(0, 1) || [];
      if (!selectedTabGroupKey) return result;
      const selectedGroup = selectedTag?.children?.find(
        (group) => group.key === selectedTabGroupKey
      );
      return selectedGroup ? [selectedGroup] : result;
    } else {
      return treeData[0]?.children?.slice(0, 1) || [];
    }
  }, [virtual, selectedTabGroupKey, selectedTag, treeData]);

  const counts = useMemo(() => {
    return getSelectedCounts(selectedTag.originData);
  }, [selectedTag.originData]);

  // 移动单个标签组
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
        if (!targetTagId) return;

        let group = null;
        for (let tag of treeData) {
          if (!!targetTagId && tag.key !== targetTagId) continue;
          if (!targetGroupId) {
            handleSelect(treeData, [targetTagId], { node: tag as TreeDataNodeTag });
            break;
          }
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

  return (
    <div className="content">
      {virtual && (
        <div className="tip">
          <Typography.Text type="warning">
            {$fmt('home.tip.tooManyTabs')}
          </Typography.Text>
        </div>
      )}
      <div className="count-info">
        <span className="count-item">{$fmt('home.tag.countInfo')}：</span>
        <span className="count-item">{$fmt('home.tabGroup')} ({counts?.groupCount})</span>
        <span className="count-item">{$fmt('home.tab')} ({counts?.tabCount})</span>
      </div>

      {(currGroupList as TreeDataNodeTabGroup[])?.map(
        (tabGroup: TreeDataNodeTabGroup) =>
          tabGroup?.originData && (
            <TabGroup
              key={tabGroup.key}
              selected={tabGroup.key === selectedTabGroupKey}
              refreshKey={
                tabGroup.key === selectedTabGroupKey ? refreshKey : undefined
              }
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
  );
}

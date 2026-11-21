import { Key } from 'react';
import { Tabs } from 'wxt/browser';
// import { storage } from 'wxt/storage';
import dayjs from 'dayjs';
import { getDomain } from 'tldts';
import {
  // attachInstruction,
  extractInstruction,
  type Instruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';

import type {
  SendTargetProps,
  TagItem,
  GroupItem,
  TabItem,
  CountInfo,
  SnapshotGroupItem,
  SnapshotTabItem,
  SnapshotItem,
  InsertPositions,
} from '~/entrypoints/types';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { DragData } from '~/entrypoints/common/components/DndComponent';

import { ENUM_SETTINGS_PROPS, UNNAMED_TAG, UNNAMED_GROUP } from '../constants';
import {
  isGroupSupported,
  getRandomId,
  pick,
  omit,
  newCreateTime,
  getUniqueList,
  getMergedList,
} from '../utils';
import { openNewTab } from '../tabs';

import Store from './instanceStore';
import { requestTabListRepair } from './batchRemoval';

const {
  OPENING_TABS_ORDER,
  DELETE_UNLOCKED_EMPTY_GROUP,
  CREATE_NEW_GROUP_ON_SEND_SINGLE_TAB,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
  LINK_TEMPLATE,
  LANGUAGE,
  GROUP_INSERT_POSITION,
  TAB_INSERT_POSITION,
} = ENUM_SETTINGS_PROPS;

// 标签组按星标状态排序
export function sortbyStarred(list: GroupItem[]) {
  return list
    .map((g, idx) => ({ ...g, idx }))
    .sort((a, b) => {
      if (!!a.isStarred === !!b.isStarred) {
        return a.idx - b.idx;
      } else {
        return b.isStarred ? 1 : -1;
      }
    })
    .map(g => omit(g, ['idx']));
}

/**
 * @description: 列表去重（新列表从队首插入）
 * @param list 原始列表
 * @param insertList 新插入的列表
 * @param key 合并对象依据的字段名
 * @param handler 合并去重handler
 * @return 返回合并后的列表
 */
export function getMergedGroupList(
  {
    list,
    insertList,
    key = 'groupName',
  }: {
    list: GroupItem[];
    insertList: GroupItem[];
    key?: keyof GroupItem;
  },
  handler: (previousValue: GroupItem, currentValue: GroupItem) => GroupItem,
): GroupItem[] {
  const handleMerge = (
    targetMap: Map<GroupItem[keyof GroupItem], GroupItem>,
    list: GroupItem[],
  ) => {
    for (const item of list) {
      let groupValue = targetMap.get(item[key]);
      if (!groupValue) {
        groupValue = item;
      } else {
        groupValue = handler(groupValue, item);
      }
      targetMap.set(item[key], groupValue);
    }
  };
  const resultMap = new Map<GroupItem[keyof GroupItem], GroupItem>();
  const insertMap = new Map<GroupItem[keyof GroupItem], GroupItem>();

  handleMerge(resultMap, list);
  handleMerge(insertMap, insertList);
  const mergedInsertList = [...insertMap.values()];

  const newMap = new Map<GroupItem[keyof GroupItem], GroupItem>();
  for (const group of mergedInsertList) {
    let originValue = resultMap.get(group[key]);
    if (!originValue) {
      newMap.set(group[key], group);
    } else {
      originValue = handler(originValue, group);
      resultMap.set(group[key], originValue);
    }
  }

  let resultGroups = [...resultMap.values()];
  const newGroups = [...newMap.values()];

  return sortbyStarred([...resultGroups, ...newGroups]);
}

/**
 * @description: 合并标签组和标签
 * @param targetList 原始列表
 * @param insertList 新插入的列表
 * @param key 合并对象依据的字段名
 * @param exceptValue item[key] = exceptValue 的数据项不合并
 * @param insertPosition 插入到队首还是队尾
 * @return 返回合并后的列表
 */
export function mergeGroupsAndTabs({
  targetList,
  insertList,
  key = 'groupName',
  exceptValue,
  insertPosition = 'top',
}: {
  targetList: GroupItem[];
  insertList: GroupItem[];
  key?: keyof GroupItem;
  exceptValue?: string | number | boolean;
  insertPosition?: InsertPositions;
}) {
  // 分离不需要合并的数据项
  function getSeparatedList(list: GroupItem[]) {
    const exceptList = [],
      resultList = [];
    for (let item of list) {
      if (exceptValue != undefined && item[key] === exceptValue) {
        const randomName =
          dayjs(item.createTime).format('YYYYMMDD_HH:mm:ss_') + getRandomId(3, true);
        exceptList.push({ ...item, groupName: `G_${randomName}` });
      } else {
        resultList.push(item);
      }
    }
    return [resultList, exceptList];
  }

  const [_tResultList, _tExceptList] = getSeparatedList(targetList);
  const [_iResultList, _iExceptList] = getSeparatedList(insertList);

  const mergedList = getMergedGroupList(
    {
      list: insertPosition === 'top' ? _iResultList : _tResultList,
      insertList: insertPosition === 'top' ? _tResultList : _iResultList,
      key,
    },
    (prev, curr) => {
      const mergedTabList = getUniqueList([...prev.tabList, ...curr.tabList], 'url');
      return { ...prev, tabList: mergedTabList };
    },
  );

  const tExceptList = insertPosition === 'top' ? _iExceptList : _tExceptList;
  const iExceptList = insertPosition === 'top' ? _tExceptList : _iExceptList;
  return [...mergedList, ...tExceptList, ...iExceptList];
}

export function getCloneGroup(group: GroupItem) {
  return {
    ...group,
    groupId: getRandomId(),
    tabList: group.tabList?.map(tab => ({
      ...tab,
      tabId: getRandomId(),
    })),
  };
}

// 按插入位置和星标排序，返回实际插入或合并后的首个目标组 ID。
function insertMovedGroups(
  targetList: GroupItem[],
  groups: GroupItem[],
  insertPosition: InsertPositions,
  autoMerge: boolean,
) {
  const ordered =
    insertPosition === 'top' ? [...groups, ...targetList] : [...targetList, ...groups];
  let groupList = ordered;
  let targetGroupId = groups[0].groupId;
  if (autoMerge) {
    // 仅合并本次操作涉及的名称；目标中有锁定同名组时，每个组都独立保留。
    const mergeNames = new Set(groups.map(group => group.groupName));
    const targetByName = new Map<string, GroupItem>();
    for (const group of targetList) {
      if (group.isLocked) mergeNames.delete(group.groupName);
      if (!targetByName.has(group.groupName)) targetByName.set(group.groupName, group);
    }
    const merged = new Map<string, GroupItem>();
    groupList = [];
    for (const group of ordered) {
      if (!mergeNames.has(group.groupName)) {
        groupList.push(group);
        continue;
      }
      const existing = merged.get(group.groupName);
      if (existing) {
        existing.tabList = getUniqueList([...existing.tabList, ...group.tabList], 'url');
      } else {
        const item = {
          ...group,
          groupId: targetByName.get(group.groupName)?.groupId ?? group.groupId,
        };
        merged.set(group.groupName, item);
        groupList.push(item);
      }
    }
    targetGroupId = merged.get(groups[0].groupName)?.groupId || groups[0].groupId;
  }

  return { groupList: sortbyStarred(groupList), targetGroupId };
}

// tab列表工具类 (tag: 分类， tabGroup: 标签组， tab: 标签页)
export default class TabListUtils {
  tagList: TagItem[] = [];
  countInfo: CountInfo = {
    tagCount: 0,
    groupCount: 0,
    tabCount: 0,
  };
  storageKey: `local:${string}` = 'local:tabList';

  requestRepair = requestTabListRepair;

  // 特殊的分类：中转站
  createStagingAreaTag(): TagItem {
    return {
      static: true,
      tagId: '0',
      tagName: 'Staging Area',
      createTime: newCreateTime(),
      groupList: [],
    };
  }

  /* 分类相关方法 */
  getInitialTag(): TagItem {
    const randomName = dayjs().format('YYYYMMDD_HH:mm:ss_') + getRandomId(3, true);
    return {
      tagId: getRandomId(),
      tagName: `T_${randomName}` || UNNAMED_TAG,
      createTime: newCreateTime(),
      groupList: [],
    };
  }
  // 过滤空分类，空标签组
  getFilteredTagList(tagList: TagItem[]) {
    return tagList.reduce<TagItem[]>((result, tag) => {
      const groupList = tag?.groupList?.filter(group => group?.tabList?.length > 0);
      if (groupList?.length > 0) {
        return [...result, { ...tag, groupList }];
      } else {
        return result;
      }
    }, []);
  }
  protected normalizeTagList(list: TagItem[]) {
    // 旧版或导入的数据可以省略空列表。正常数据保留原引用，避免读取触发写入。
    if (list.some(tag => !tag.groupList || tag.groupList.some(group => !group.tabList))) {
      list = list.map(tag => {
        if (!tag.groupList) return { ...tag, groupList: [] };
        if (tag.groupList.every(group => group.tabList)) return tag;
        return {
          ...tag,
          groupList: tag.groupList.map(group =>
            group.tabList ? group : { ...group, tabList: [] },
          ),
        };
      });
    }
    const index = list.findIndex(tag => tag.static);
    if (index === 0) return list;
    if (index < 0) return [this.createStagingAreaTag(), ...list];
    return [list[index], ...list.slice(0, index), ...list.slice(index + 1)];
  }
  private async readTagList() {
    const stored = (await storage.getItem<TagItem[]>(this.storageKey)) || [];
    const tagList = this.normalizeTagList(stored);
    this.updateTagListCache(tagList);
    return { tagList, needsRepair: tagList !== stored };
  }
  async getTagList() {
    const { tagList, needsRepair } = await this.readTagList();
    if (!needsRepair) return tagList;
    await this.requestRepair();
    return (await this.readTagList()).tagList;
  }
  async setTagList(list: TagItem[] = []) {
    this.updateTagListCache(this.normalizeTagList(list));
    return storage.setItem(this.storageKey, this.tagList);
  }
  protected updateTagListCache(list: TagItem[]) {
    this.tagList = list;
    this.setCountInfo();
  }
  setCountInfo() {
    let tagCount = 0,
      groupCount = 0,
      tabCount = 0;
    this.tagList.forEach(tag => {
      tagCount += 1;
      tag?.groupList?.forEach(group => {
        groupCount += 1;
        group?.tabList?.forEach(tab => {
          tabCount += 1;
        });
      });
    });
    this.countInfo = {
      tagCount,
      groupCount,
      tabCount,
    };
  }
  async clearAll() {
    const tagList = await this.getTagList();
    await this.setTagList([]);
    if (this.constructor === TabListUtils) {
      const filteredTagList = tagList.reduce<TagItem[]>((result, tag) => {
        const groupList = tag?.groupList?.filter(group => group?.tabList?.length > 0);
        if (groupList?.length > 0) {
          return [...result, { ...tag, groupList }];
        } else {
          return result;
        }
      }, []);

      // 分类中有标签页，才放入到回收站
      Store.recycleBinUtils?.addTags?.(filteredTagList);
    }
  }
  async addTag(tag?: TagItem) {
    const tagList = await this.getTagList();
    const newTag = Object.assign(this.getInitialTag(), tag || {});
    // 第一个分类为中转站，其他分类都往后插入
    const insertIndex = tagList?.[0]?.static ? 1 : 0;
    tagList.splice(insertIndex, 0, newTag);
    await this.setTagList(tagList);
    return newTag;
  }
  async updateTag(tagId: Key, tag: Partial<TagItem>) {
    const tagList = await this.getTagList();
    for (let t of tagList) {
      if (t.tagId === tagId) {
        Object.assign(t, tag);
        break;
      }
    }
    await this.setTagList(tagList);
  }
  async removeTag(tagId: Key) {
    await this.getTagList();
    const tagItem = this.tagList.find(item => item.tagId === tagId);
    const tagList = this.tagList.filter(item => item.tagId !== tagId);
    await this.setTagList(tagList);

    if (this.constructor === TabListUtils) {
      // console.log('removeTagItem', tagItem);
      // 分类中有标签页，才放入到回收站
      if (!tagItem) return;
      tagItem.groupList =
        tagItem?.groupList?.filter(group => group?.tabList?.length > 0) || [];
      if (tagItem?.groupList?.length > 0) {
        Store.recycleBinUtils?.addTags?.([tagItem]);
      }
    }
  }
  // 分类拖拽
  async onTagDrop(sourceIndex: number, targetIndex: number) {
    const moveDirection = sourceIndex > targetIndex ? 'up' : 'down';
    const tagList = await this.getTagList();
    let tmp = tagList[sourceIndex];
    if (moveDirection === 'up') {
      tagList?.splice(sourceIndex, 1);
      tagList?.splice(targetIndex, 0, tmp);
    } else {
      tagList?.splice(targetIndex, 0, tmp);
      tagList?.splice(sourceIndex, 1);
    }

    await this.setTagList(tagList);
  }

  /* 标签组相关方法 */
  getInitialTabGroup(): GroupItem {
    const randomName = dayjs().format('YYYYMMDD_HH:mm:ss_') + getRandomId(3, true);
    return {
      groupId: getRandomId(),
      groupName: `G_${randomName}` || UNNAMED_GROUP,
      createTime: newCreateTime(),
      tabList: [],
    };
  }
  // 创建标签组 tagId: 分类id, tabGroup: 新创建的标签组数据（可空）, groupId: 标签组id, pop: before | after
  async createTabGroup(
    tagId: Key,
    tabGroup?: Partial<GroupItem>,
    groupId?: Key,
    pos?: 'before' | 'after',
  ) {
    const tagList = await this.getTagList();
    const newGroup = Object.assign(this.getInitialTabGroup(), tabGroup);
    for (let tag of tagList) {
      if (tag.tagId === tagId) {
        if (!groupId) {
          const index = tag.groupList.findIndex(g => !g.isStarred);
          tag.groupList.splice(index > -1 ? index : tag.groupList.length, 0, newGroup);
        } else {
          const index = tag.groupList.findIndex(g => g.groupId === groupId);
          if (pos === 'before') {
            const currGroup = tag.groupList[index];
            if (currGroup.isStarred) newGroup.isStarred = true;
          } else {
            const nextGroup = tag.groupList[index + 1];
            if (nextGroup?.isStarred) newGroup.isStarred = true;
          }
          tag.groupList.splice(index + (pos === 'after' ? 1 : 0), 0, newGroup);
        }
        break;
      }
    }
    await this.setTagList(tagList);
    return { tagId, tabGroup: newGroup };
  }
  async updateTabGroup({
    tagId,
    groupId,
    data,
  }: {
    tagId?: Key;
    groupId: Key;
    data: Partial<GroupItem>;
  }) {
    const tagList = await this.getTagList();
    let isFound = false;
    for (let tag of tagList) {
      if (tagId && tag.tagId !== tagId) continue;
      for (let g of tag.groupList) {
        if (g.groupId === groupId) {
          Object.assign(g, data);
          isFound = true;
          break;
        }
      }
      if (isFound) break;
    }
    await this.setTagList(tagList);
  }
  async removeTabGroup(tagId: Key, groupId: Key) {
    const tagList = await this.getTagList();
    for (let tag of tagList) {
      if (tag.tagId === tagId) {
        const removeGroup = tag.groupList.find(g => g.groupId === groupId);
        tag.groupList = tag.groupList.filter(g => g.groupId !== groupId);

        if (this.constructor === TabListUtils) {
          // console.log('removeGroup', removeGroup);
          // 标签组中有标签页，才放入到回收站
          if (removeGroup && removeGroup?.tabList?.length > 0) {
            Store.recycleBinUtils?.addTabGroups?.(tag, [removeGroup]);
          }
        }
        break;
      }
    }
    await this.setTagList(tagList);
  }
  // 批量删除标签组：一次读取、一次写入，避免逐个读写导致的数据覆盖
  // 返回实际删除的标签组 id（锁定分类、锁定标签组会被跳过）
  async removeTabGroups(groupIds: Key[]) {
    const idSet = new Set((groupIds || []).map(id => String(id)));

    const { tagList, needsRepair } = await this.readTagList();
    const nextList = [...tagList];
    const removedIds: string[] = [];
    const recycleTags: TagItem[] = [];

    for (const [index, tag] of tagList.entries()) {
      if (tag.isLocked) continue;
      const removedGroups = tag.groupList.filter(
        group => idSet.has(String(group.groupId)) && !group.isLocked,
      );
      if (!removedGroups.length) continue;

      const removedGroupIds = new Set(removedGroups.map(group => group.groupId));
      nextList[index] = {
        ...tag,
        groupList: tag.groupList.filter(group => !removedGroupIds.has(group.groupId)),
      };
      removedIds.push(...removedGroups.map(group => group.groupId));

      if (this.constructor === TabListUtils) {
        const recycledGroups = removedGroups.filter(group => group?.tabList?.length > 0);
        if (recycledGroups.length) {
          recycleTags.push({ ...tag, groupList: recycledGroups });
        }
      }
    }

    if (!removedIds.length) {
      if (needsRepair) await this.setTagList(tagList);
      return removedIds;
    }

    if (recycleTags.length) {
      const bin = Store.recycleBinUtils;
      const recycledList = await bin.getListWithAddedTags(recycleTags);
      await storage.setItems([
        { key: this.storageKey, value: nextList },
        { key: bin.storageKey, value: recycledList },
      ]);
      bin.updateTagListCache(recycledList);
    } else {
      await storage.setItem(this.storageKey, nextList);
    }
    this.updateTagListCache(nextList);
    return removedIds;
  }
  // 复制标签组
  async cloneGroup(groupId: string) {
    const settings = await Store.settingsUtils.getSettings();
    const language = settings[LANGUAGE];
    const customMessages = getCustomLocaleMessages(language);
    const tagList = await this.getTagList();
    for (let t of tagList) {
      const groupIdx = t.groupList?.findIndex?.(g => g.groupId === groupId);
      if (groupIdx != undefined && ~groupIdx) {
        const group = t.groupList[groupIdx];
        t.groupList.splice(groupIdx + 1, 0, {
          ...getCloneGroup(group),
          groupName: `${group.groupName}_${customMessages['common.clone']}`,
        });
        break;
      }
    }

    await this.setTagList(tagList);
  }
  // 切换标签组星标状态
  async toggleTabGroupStarred(tagId: Key, groupId: Key, isStarred: boolean) {
    const tagList = await this.getTagList();
    for (let tag of tagList) {
      if (tag.tagId === tagId) {
        let gIndex = 0,
          group = tag.groupList?.[0];
        for (let index = 0; index < tag.groupList.length; index++) {
          const g = tag.groupList?.[index];
          if (g?.groupId === groupId) {
            g.isStarred = isStarred;
            gIndex = index;
            group = { ...g };
            break;
          }
        }

        tag.groupList.splice(gIndex, 1);

        if (isStarred) {
          tag.groupList.unshift(group);
        } else {
          const unstarredIndex = tag.groupList.findIndex(g => !g.isStarred);
          tag.groupList.splice(
            unstarredIndex > -1 ? unstarredIndex : tag.groupList.length,
            0,
            group,
          );
        }
        break;
      }
    }

    await this.setTagList(tagList);
  }
  // 标签组去重
  async tabGroupDedup(tagId: Key, groupId: Key) {
    const tagList = await this.getTagList();
    for (let tag of tagList) {
      if (tag.tagId !== tagId) continue;
      for (let g of tag.groupList) {
        if (g.groupId === groupId) {
          g.tabList = getUniqueList(g.tabList, 'url');
          break;
        }
      }
    }
    await this.setTagList(tagList);
  }
  // 标签组拖拽
  async onTabGroupDrop(
    sourceTagId: Key,
    targetTagId: Key,
    sourceIndex: number,
    targetIndex: number,
  ) {
    const tagList = await this.getTagList();
    if (sourceTagId === targetTagId) {
      const moveDirection = sourceIndex > targetIndex ? 'up' : 'down';
      for (let tag of tagList) {
        if (tag.tagId === sourceTagId) {
          const tmp = tag.groupList?.[sourceIndex];
          if (!tmp) break;
          if (moveDirection === 'up') {
            const targetGroup = tag.groupList?.[targetIndex];
            if (targetGroup.isStarred) {
              tmp.isStarred = true;
            }
            tag.groupList?.splice(sourceIndex, 1);
            tag.groupList?.splice(targetIndex, 0, tmp);
          } else {
            const prevTargetGroup = tag.groupList?.[targetIndex - 1];
            if (!prevTargetGroup?.isStarred) {
              tmp.isStarred = false;
            }
            tag.groupList?.splice(targetIndex, 0, tmp);
            tag.groupList?.splice(sourceIndex, 1);
          }
        }
      }
    } else {
      let tmp = null,
        sourceTagIndex = 0,
        targetTagIndex = tagList.length - 1;

      for (let tIndex = 0; tIndex < tagList.length; tIndex++) {
        const tag = tagList[tIndex];
        if (tag.tagId === sourceTagId) {
          tmp = tag?.groupList?.[sourceIndex];
          sourceTagIndex = tIndex;
          tag?.groupList?.splice(sourceIndex, 1);
        } else if (tag.tagId === targetTagId) {
          targetTagIndex = tIndex;
        }
      }
      const prevTargetGroup = tagList?.[targetTagIndex]?.groupList?.[targetIndex - 1];
      const targetGroup = tagList?.[targetTagIndex]?.groupList?.[targetIndex];
      if (tmp?.isStarred && targetIndex > 0 && !prevTargetGroup?.isStarred) {
        tmp.isStarred = false;
      }
      if (tmp && targetGroup?.isStarred) {
        tmp.isStarred = true;
      }
      tmp && tagList?.[targetTagIndex]?.groupList?.splice(targetIndex, 0, tmp);
    }

    await this.setTagList(tagList);
  }

  // 标签组上移、下移
  async tabGroupMove(direction: 'up' | 'down', tagId: Key, groupId: Key) {
    const tagList = await this.getTagList();
    const tagIndex = tagList.findIndex(tag => tag.tagId === tagId);
    const tag = tagList[tagIndex];
    const groupIndex = tag?.groupList?.findIndex(g => g.groupId === groupId);
    const group = { ...tag?.groupList?.[groupIndex] };
    if (direction === 'up') {
      if (groupIndex === 0) {
        if (tagIndex === 0) return;
        const prevTag = tagList[tagIndex - 1];
        const prevTagLastGroup = prevTag?.groupList?.[prevTag?.groupList?.length - 1];
        if (!prevTagLastGroup?.isStarred) {
          group.isStarred = false;
        }
        prevTag.groupList.push(group);
        tag.groupList.splice(groupIndex, 1);
      } else {
        const prevGroup = tag?.groupList?.[groupIndex - 1];
        if (prevGroup?.isStarred) {
          group.isStarred = true;
        }
        tag.groupList.splice(groupIndex, 1);
        tag.groupList.splice(groupIndex - 1, 0, group);
      }
    } else {
      if (groupIndex >= tag?.groupList?.length - 1) {
        if (tagIndex >= tagList.length - 1) return;
        const nextTag = tagList[tagIndex + 1];
        const nextTagFirstGroup = nextTag?.groupList?.[0];
        if (nextTagFirstGroup?.isStarred) {
          group.isStarred = true;
        }
        nextTag.groupList.unshift(group);
        tag.groupList.splice(groupIndex, 1);
      } else {
        const nextGroup = tag?.groupList?.[groupIndex + 1];
        if (!nextGroup?.isStarred) {
          group.isStarred = false;
        }
        tag.groupList.splice(groupIndex + 2, 0, group);
        tag.groupList.splice(groupIndex, 1);
      }
    }

    await this.setTagList(tagList);
  }
  // 单组、多选和整分类共用一次列表读取与写入。
  async tabGroupsMoveThrough({
    sourceGroupIds,
    sourceTagId,
    targetTagId,
    isCopy = false,
    autoMerge = false,
  }: (
    | { sourceGroupIds: Key[]; sourceTagId?: never }
    | { sourceTagId: Key; sourceGroupIds?: never }
  ) & {
    targetTagId: Key;
    isCopy?: boolean;
    autoMerge?: boolean;
  }) {
    const { tagList, needsRepair } = await this.readTagList();
    const target = tagList.find(tag => tag.tagId === targetTagId);
    const processedIds: string[] = [];
    const skipped = { processedIds, targetGroupId: undefined };

    const selected = sourceGroupIds && new Set(sourceGroupIds);
    const groups: GroupItem[] = [];
    const nextList = tagList.map(tag => {
      if (!target || target.isLocked || tag.isLocked || (!isCopy && tag === target))
        return tag;
      if (!selected && tag.tagId !== sourceTagId) return tag;

      const remaining = tag.groupList.filter(group => {
        if (selected && !selected.has(group.groupId)) return true;
        processedIds.push(group.groupId);
        groups.push(isCopy ? getCloneGroup(group) : group);
        return isCopy;
      });
      return isCopy ? tag : { ...tag, groupList: remaining };
    });
    if (!target || !groups.length) {
      if (needsRepair) {
        await this.requestRepair();
        await this.readTagList();
      }
      return skipped;
    }

    const settings = await Store.settingsUtils.getSettings();
    const insertPosition = settings?.[GROUP_INSERT_POSITION] || 'top';
    const { groupList, targetGroupId: firstGroupId } = insertMovedGroups(
      target.groupList,
      groups,
      insertPosition,
      autoMerge,
    );
    nextList[tagList.indexOf(target)] = { ...target, groupList };
    await storage.setItem(this.storageKey, nextList);
    this.updateTagListCache(nextList);
    return { processedIds, targetGroupId: firstGroupId };
  }

  async tabGroupMoveThrough({
    sourceGroupId,
    ...options
  }: {
    sourceGroupId: Key;
    targetTagId: Key;
    isCopy?: boolean;
    autoMerge?: boolean;
  }) {
    const { targetGroupId } = await this.tabGroupsMoveThrough({
      ...options,
      sourceGroupIds: [sourceGroupId],
    });
    return { targetGroupId };
  }

  async allTabGroupsMoveThrough(options: {
    sourceTagId: Key;
    targetTagId: Key;
    isCopy?: boolean;
    autoMerge?: boolean;
  }) {
    const { processedIds } = await this.tabGroupsMoveThrough(options);
    return { targetTagId: processedIds.length ? options.targetTagId : undefined };
  }
  // 标签组按名称排序
  async groupListSortbyName(sortType: string, tagId: Key) {
    const tagList = await this.getTagList();
    const tag = tagList.find(t => t.tagId === tagId);
    if (!tag) return;
    // const _locale = 'en-US-u-kf-lower' // 排序顺序：数字 > 小写英文 > 大写英文 > 中文
    // const _locale = 'en-US-u-kf-upper' // 排序顺序：数字 > 大写英文 > 小写英文 > 中文
    // const _locale = 'zh-CN-u-kf-lower' // 排序顺序：数字 > 中文 > 小写英文 > 大写英文
    // const _locale = 'zh-CN-u-kf-upper' // 排序顺序：数字 > 中文 > 大写英文 > 小写英文

    const unstarredIndex =
      tag.groupList?.findIndex(g => !g.isStarred) ?? tag.groupList.length;

    if (unstarredIndex === -1) return;
    const doSortList = unstarredIndex > -1 ? tag?.groupList?.slice(unstarredIndex) : [];

    if (sortType === 'ascending') {
      doSortList?.sort((a, b) => a.groupName.localeCompare(b.groupName));
    } else {
      doSortList?.sort((a, b) => b.groupName.localeCompare(a.groupName));
    }

    tag.groupList = tag.groupList?.slice(0, unstarredIndex).concat(doSortList);
    await this.setTagList(tagList);
  }

  // 标签组按名称排序
  async groupListSortbyCreateTime(sortType: string, tagId: Key) {
    const tagList = await this.getTagList();
    const tag = tagList.find(t => t.tagId === tagId);
    if (!tag) return;

    const unstarredIndex =
      tag.groupList?.findIndex(g => !g.isStarred) ?? tag.groupList.length;

    if (unstarredIndex === -1) return;
    const doSortList = unstarredIndex > -1 ? tag?.groupList?.slice(unstarredIndex) : [];

    if (sortType === 'ascending') {
      doSortList?.sort(
        (a, b) => dayjs(a.createTime).valueOf() - dayjs(b.createTime).valueOf(),
      );
    } else {
      doSortList?.sort(
        (a, b) => dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf(),
      );
    }

    tag.groupList = tag.groupList?.slice(0, unstarredIndex).concat(doSortList);
    await this.setTagList(tagList);
  }

  // 标签组按星标状态排序
  groupListSortbyStarred({
    list,
    insertList,
    insertPosition,
  }: {
    list: GroupItem[];
    insertList: GroupItem[];
    insertPosition: InsertPositions;
  }) {
    const _list =
      insertPosition === 'top' ? [...insertList, ...list] : [...list, ...insertList];
    return sortbyStarred(_list);
  }

  /* 标签相关方法 */
  transformTabItem(tab: Tabs.Tab): TabItem {
    const { favIconUrl } = tab;
    return {
      ...pick(tab, ['title', 'url']),
      tabId: getRandomId(),
      favIconUrl: favIconUrl?.startsWith('data:image/') ? '' : favIconUrl,
    };
  }
  // 外部调用：创建标签页（区分浏览器是否支持群组）
  async createTabs(
    tabs: Tabs.Tab[],
    targetData: SendTargetProps,
  ): Promise<{ tagId: string; groupId: string }> {
    await this.getTagList();
    let result = {} as { tagId: string; groupId: string };
    if (isGroupSupported()) {
      result = await this.createTabsByGroups(tabs, targetData);
    } else {
      result = await this.createTabsIndependent(tabs, targetData);
    }

    await this.setTagList(this.tagList);
    return result;
  }
  // 内部调用：保留浏览器群组的标签页
  async createTabsByGroups(tabs: Tabs.Tab[], targetData: SendTargetProps = {}) {
    const groupsMap = new Map<number, GroupItem>(),
      independentTabs = [];
    for (let tab of tabs) {
      if (tab.groupId && tab.groupId != -1) {
        const group: GroupItem = groupsMap.get(tab.groupId) || {
          ...this.getInitialTabGroup(),
          tabList: [] as TabItem[],
        };

        group.tabList.push(this.transformTabItem(tab));
        groupsMap.set(tab.groupId, group);
      } else {
        independentTabs.push(tab);
      }
    }

    if (isGroupSupported() && browser.tabGroups?.get) {
      for (const [bsGroupId, group] of groupsMap.entries()) {
        const tabGroup = await browser.tabGroups.get(bsGroupId);
        // console.log('tabGroup', tabGroup);
        group.groupName = tabGroup?.title || group.groupName;
      }
    }

    if (independentTabs.length > 0) {
      // 先创建独立的tab页
      const result = await this.createTabsIndependent(independentTabs, targetData);
      // 不存在浏览器自带的标签组，直接返回独立标签页创建的标签组信息
      if (groupsMap.size == 0) return result;
    }

    const { targetTagId } = targetData;
    const targetTag = this.tagList?.find(tag => tag.tagId === targetTagId);
    // 接下来保存浏览器自带的标签组
    let tag0 = targetTag || this.tagList?.[0];
    if (!tag0) {
      tag0 = this.createStagingAreaTag();
      this.tagList.push(tag0);
    }

    let newGroups = [...groupsMap.values()];
    const settings = Store.settingsUtils?.settings;

    if (settings?.[ALLOW_DUPLICATE_GROUPS]) {
      const unstarredIndex = tag0.groupList.findIndex(g => !g.isStarred);
      const idx = unstarredIndex > -1 ? unstarredIndex : tag0.groupList.length;
      tag0.groupList.splice(idx, 0, ...newGroups);
      return { tagId: tag0.tagId, groupId: tag0?.groupList?.[idx]?.groupId || '' };
    }

    tag0.groupList = getMergedGroupList(
      {
        list: newGroups,
        insertList: tag0.groupList,
        key: 'groupName',
      },
      (prev, curr) => {
        let mergedTabList = [...prev.tabList, ...curr.tabList];
        if (!settings?.[ALLOW_DUPLICATE_TABS]) {
          mergedTabList = getUniqueList(mergedTabList, 'url');
        }
        return { ...prev, tabList: mergedTabList };
      },
    );

    const activeGroup = tag0.groupList.find(
      g => g.groupName === newGroups?.[0]?.groupName,
    );

    return {
      tagId: tag0.tagId,
      groupId: activeGroup?.groupId || '',
    };
  }
  // 内部调用：所有标签页独立创建
  async createTabsIndependent(tabs: Tabs.Tab[], targetData: SendTargetProps = {}) {
    const settings = Store.settingsUtils?.settings;
    let newTabs = tabs.map(this.transformTabItem);

    const { targetTagId, targetGroupId } = targetData;
    const targetTag = this.tagList?.find(tag => tag.tagId === targetTagId);
    const targetGroup = targetTag?.groupList?.find(
      group => group.groupId === targetGroupId,
    );
    let tag0 = targetTag || this.tagList?.[0];

    if (targetTagId && targetTag && targetGroupId && targetGroup) {
      newTabs = [...newTabs, ...(targetGroup?.tabList || [])];
      if (!settings?.[ALLOW_DUPLICATE_TABS]) {
        newTabs = getUniqueList(newTabs, 'url');
      }
      targetGroup.tabList = newTabs;
      await this.setTagList(this.tagList);
      return { tagId: targetTagId, groupId: targetGroupId };
    }

    if (!settings?.[ALLOW_DUPLICATE_TABS]) {
      newTabs = getUniqueList(newTabs, 'url');
    }
    const createNewGroup = settings?.[CREATE_NEW_GROUP_ON_SEND_SINGLE_TAB] || false;
    // createNewGroup=true，就创建一个新标签组
    let newtabGroup = this.getInitialTabGroup();
    if (createNewGroup || newTabs.length > 1) {
      newtabGroup.tabList = newTabs;
    } else {
      const index = tag0?.groupList?.findIndex?.(g => !g.isStarred && !g.isLocked);
      newtabGroup = ~index ? tag0?.groupList?.[index] : newtabGroup;
      newtabGroup.tabList = [...newTabs, ...newtabGroup.tabList];
    }

    if (tag0) {
      if (!settings?.[ALLOW_DUPLICATE_GROUPS]) {
        const sameNameGroupIndex = tag0.groupList.findIndex(
          g => g.groupName === newtabGroup.groupName,
        );
        if (sameNameGroupIndex > -1) {
          const sameNameGroup = tag0.groupList[sameNameGroupIndex];
          sameNameGroup.tabList = [...newTabs, ...sameNameGroup.tabList];
          if (!settings?.[ALLOW_DUPLICATE_TABS]) {
            sameNameGroup.tabList = getUniqueList(sameNameGroup.tabList, 'url');
          }
          return { tagId: tag0.tagId, groupId: sameNameGroup.groupId };
        }
      }
      const index = tag0.groupList.findIndex(g => !g.isStarred && !g.isLocked);
      if (createNewGroup || newTabs.length > 1) {
        tag0.groupList.splice(index > -1 ? index : tag0.groupList.length, 0, newtabGroup);
      } else {
        tag0.groupList.splice(index > -1 ? index : tag0.groupList.length, 1, newtabGroup);
      }
      // await this.setTagList([tag0, ...this.tagList.slice(1)]);
      await this.setTagList(this.tagList);
      return { tagId: tag0.tagId, groupId: newtabGroup.groupId };
    }

    // 不存在tag分类，就创建一个新的tag
    const tag = this.createStagingAreaTag();
    tag.groupList = [newtabGroup];
    this.tagList.push(tag);
    return { tagId: tag.tagId, groupId: newtabGroup.groupId };
  }
  // 给已打开的标签页生成快照
  async createOpenedTabsSnapshot(tabs: Tabs.Tab[]) {
    const _isGroupSupported = isGroupSupported() && browser.tabGroups?.get;
    const result: Array<SnapshotGroupItem | SnapshotTabItem> = [];

    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index] || {};
      if (tab.groupId && tab.groupId != -1) {
        const savedGroupIdx = result.findIndex(
          item => item.type === 'group' && item.bsGroupId === tab.groupId,
        );

        if (~savedGroupIdx) {
          const group = result[savedGroupIdx] as SnapshotGroupItem;
          group.tabList.push(this.transformTabItem(tab));
        } else {
          const group: SnapshotGroupItem = {
            ...this.getInitialTabGroup(),
            type: 'group',
            bsGroupId: tab.groupId,
            tabList: [this.transformTabItem(tab)],
          };
          if (_isGroupSupported) {
            const bsGroup = await browser.tabGroups!.get(group.bsGroupId);
            group.groupName = bsGroup?.title || group.groupName;
          }
          result.push(group);
        }
      } else {
        result.push({ type: 'tab', ...this.transformTabItem(tab) });
      }
    }

    return result;
  }
  // 还原快照
  async restoreTabsSnapshot(list: SnapshotItem[]) {
    const _isGroupSupported = isGroupSupported();
    const settings = Store.settingsUtils?.settings;
    const openTabsOrder = settings?.[OPENING_TABS_ORDER];
    const _list = openTabsOrder === 'reverse' ? [...list].reverse() : list;

    for (let item of _list) {
      if (item.type === 'group') {
        const _tabList = item.tabList?.filter?.(tab => !!tab.url?.trim?.()) || [];
        if (!_tabList.length) continue;
        if (!_isGroupSupported) {
          for (let tab of _tabList) {
            openNewTab(tab.url);
          }
          continue;
        }

        Promise.all(
          _tabList.map(tab => {
            return browser.tabs.create({ url: tab.url, active: false });
          }),
        ).then(async tabs => {
          const bsGroupId = await browser.tabs.group!({
            tabIds: tabs.map(tab => tab.id!),
          });
          browser.tabGroups?.update(bsGroupId, { title: item.groupName });
        });
      } else {
        openNewTab(item.url);
      }
    }
  }
  // 删除标签页: filterFlag 是否过滤空分类、标签组 (列表页保留空分类、标签组；回收站中不保留)
  async removeTabs(
    groupId: Key,
    tabs: TabItem[],
    options: boolean | { skipLocked: true } = false,
  ) {
    const tagList = await this.getTagList();
    const tabIds = tabs.map(tab => tab.tabId);
    let tag = undefined,
      group = undefined;

    const settings = Store.settingsUtils?.settings;

    for (let t of tagList) {
      for (let i = 0; i < t.groupList?.length; i++) {
        const g = t.groupList[i];
        if (g.groupId === groupId) {
          if (
            typeof options === 'object' &&
            options.skipLocked &&
            (t.isLocked || g.isLocked)
          )
            return;
          tag = t;
          group = g;
          g.tabList = g.tabList?.filter(tab => !tabIds.includes(tab.tabId));
          // 如果未锁定的标签组内没有标签页，则删除标签组
          if (
            settings?.[DELETE_UNLOCKED_EMPTY_GROUP] &&
            !g?.tabList?.length &&
            !g.isLocked
          ) {
            t.groupList.splice(i, 1);
          }
          break;
        }
      }
    }

    await this.setTagList(options === true ? this.getFilteredTagList(tagList) : tagList);

    if (this.constructor === TabListUtils) {
      if (!tag || !group) return;
      await Store.recycleBinUtils?.addTabs?.(tag, group, tabs);
    }

    return { tagId: tag?.tagId, groupId: group?.groupId };
  }
  // 更新标签页
  async updateTab({
    tagId,
    groupId,
    data,
  }: {
    tagId?: Key;
    groupId: Key;
    data: Partial<TabItem>;
  }) {
    const tagList = await this.getTagList();
    let isFound = false;
    for (let tag of tagList) {
      if (tagId && tag.tagId !== tagId) continue;
      for (let g of tag.groupList) {
        if (g.groupId === groupId) {
          g.tabList = g?.tabList.map(tab => {
            if (tab.tabId === data.tabId) {
              return { ...tab, ...data };
            }
            return tab;
          });
          isFound = true;
          break;
        }
      }
      if (isFound) break;
    }
    await this.setTagList(tagList);
  }
  // 复制标签页
  async copyTabs(groupId: string, tabs: TabItem[]) {
    const tagList = await this.getTagList();
    for (let t of tagList) {
      const groupIdx = t.groupList?.findIndex?.(g => g.groupId === groupId);
      if (groupIdx != undefined && ~groupIdx) {
        const group = t.groupList[groupIdx];
        const lastTab = tabs[tabs.length - 1];
        const tabIdx = group.tabList?.findLastIndex?.(
          item => item.tabId === lastTab.tabId,
        );
        if (tabIdx != undefined && ~tabIdx) {
          const newTabs = tabs.map(item => ({
            ...item,
            tabId: getRandomId(),
          }));
          group.tabList.splice(tabIdx + 1, 0, ...newTabs);
        }
        break;
      }
    }

    await this.setTagList(tagList);
  }

  // 添加单个标签页到标签组
  async addTabItem(groupId: string, tab: TabItem) {
    const tagList = await this.getTagList();
    for (let tag of tagList) {
      for (let g of tag.groupList) {
        if (g.groupId === groupId) {
          g.tabList.push(tab);
          await this.setTagList(tagList);
          return;
        }
      }
    }
  }

  // tab标签页拖拽
  async onTabDrop(
    sourceGroupId: Key,
    targetGroupId: Key,
    sourceIndex: number,
    targetIndex: number,
  ) {
    const tagList = await this.getTagList();
    if (sourceGroupId === targetGroupId) {
      const moveDirection = sourceIndex > targetIndex ? 'up' : 'down';
      for (let tag of tagList) {
        let isDone = false;
        for (let group of tag.groupList) {
          if (group.groupId === sourceGroupId) {
            const tmp = group.tabList?.[sourceIndex];
            if (moveDirection === 'up') {
              group.tabList.splice(sourceIndex, 1);
              group.tabList.splice(targetIndex, 0, tmp);
            } else {
              group.tabList.splice(targetIndex, 0, tmp);
              group.tabList.splice(sourceIndex, 1);
            }

            isDone = true;
            break;
          }
        }
        if (isDone) break;
      }
    } else {
      let tabItemTmp = null,
        sourceTagIndex = 0,
        sourceGroupIndex = 0,
        targetTagIndex = 0,
        targetGroupIndex = 0;
      let isSourceFound = false,
        isTargetFound = false;
      for (let tIndex = 0; tIndex < tagList.length; tIndex++) {
        const tag = tagList[tIndex];
        for (let gIndex = 0; gIndex < tag.groupList.length; gIndex++) {
          const group = tag.groupList[gIndex];
          if (group.groupId === sourceGroupId) {
            tabItemTmp = group.tabList?.[sourceIndex];
            sourceTagIndex = tIndex;
            sourceGroupIndex = gIndex;
            isSourceFound = true;
          } else if (group.groupId === targetGroupId) {
            targetTagIndex = tIndex;
            targetGroupIndex = gIndex;
            isTargetFound = true;
          }

          if (isSourceFound && isTargetFound) break;
        }

        if (isSourceFound && isTargetFound) break;
      }
      tabItemTmp &&
        isSourceFound &&
        isTargetFound &&
        tagList?.[targetTagIndex]?.groupList?.[targetGroupIndex]?.tabList?.splice(
          targetIndex,
          0,
          tabItemTmp,
        );

      if (isSourceFound) {
        const sourceTag = tagList?.[sourceTagIndex];
        sourceTag?.groupList?.[sourceGroupIndex]?.tabList.splice(sourceIndex, 1);
        const settings = Store.settingsUtils?.settings;
        const sourceGroup = sourceTag?.groupList?.[sourceGroupIndex];
        // 如果未锁定的标签组内没有标签页，则删除标签组
        if (
          settings?.[DELETE_UNLOCKED_EMPTY_GROUP] &&
          !sourceGroup?.tabList?.length &&
          !sourceGroup?.isLocked
        ) {
          sourceTag?.groupList?.splice(sourceGroupIndex, 1);
        }
      }
    }

    await this.setTagList(tagList);
  }
  // tab标签页拖拽
  async onTabsDrop(
    sourceData: DragData,
    targetData: DragData,
    sourceIndex: number,
    targetIndex: number,
  ) {
    const tagList = await this.getTagList();
    const dropTabIds = sourceData.selectedValues;

    if (sourceData.groupId === targetData.groupId) {
      for (let tag of tagList) {
        let isDone = false;
        for (let group of tag.groupList) {
          if (group.groupId === sourceData.groupId) {
            const tmpList: TabItem[] = [];
            const newTabList: Array<TabItem & { removeFlag?: boolean }> = [];
            group.tabList.forEach(tab => {
              const _removeTab: TabItem & { removeFlag?: boolean } = { ...tab };
              if (dropTabIds?.includes(tab.tabId)) {
                _removeTab.removeFlag = true;
                tmpList.push(tab);
                newTabList.push(_removeTab);
              } else {
                newTabList.push(tab);
              }
            });
            newTabList.splice(targetIndex, 0, ...tmpList);
            group.tabList = newTabList.filter(tab => !tab.removeFlag);

            isDone = true;
            break;
          }
        }
        if (isDone) break;
      }
    } else {
      let tabItemTmpList: TabItem[] = [],
        sourceTagIndex = 0,
        sourceGroupIndex = 0,
        targetTagIndex = 0,
        targetGroupIndex = 0;
      let isSourceFound = false,
        isTargetFound = false;
      for (let tIndex = 0; tIndex < tagList.length; tIndex++) {
        const tag = tagList[tIndex];
        for (let gIndex = 0; gIndex < tag.groupList.length; gIndex++) {
          const group = tag.groupList[gIndex];
          if (group.groupId === sourceData.groupId) {
            sourceTagIndex = tIndex;
            sourceGroupIndex = gIndex;
            isSourceFound = true;

            const newTabList: Array<TabItem & { removeFlag?: boolean }> = [];
            group.tabList.forEach(tab => {
              const _removeTab: TabItem & { removeFlag?: boolean } = { ...tab };
              if (dropTabIds?.includes(tab.tabId)) {
                _removeTab.removeFlag = true;
                tabItemTmpList.push(tab);
                newTabList.push(_removeTab);
              } else {
                newTabList.push(tab);
              }
            });
            // newTabList.splice(targetIndex, 0, ...tabItemTmpList);
            group.tabList = newTabList.filter(tab => !tab.removeFlag);
          } else if (group.groupId === targetData.groupId) {
            targetTagIndex = tIndex;
            targetGroupIndex = gIndex;
            isTargetFound = true;
          }

          if (isSourceFound && isTargetFound) break;
        }

        if (isSourceFound && isTargetFound) break;
      }
      tabItemTmpList?.length > 0 &&
        isSourceFound &&
        isTargetFound &&
        tagList?.[targetTagIndex]?.groupList?.[targetGroupIndex]?.tabList?.splice(
          targetIndex,
          0,
          ...tabItemTmpList,
        );

      if (isSourceFound) {
        const sourceTag = tagList?.[sourceTagIndex];
        const settings = Store.settingsUtils?.settings;
        const sourceGroup = sourceTag?.groupList?.[sourceGroupIndex];
        // 如果未锁定的标签组内没有标签页，则删除标签组
        if (
          settings?.[DELETE_UNLOCKED_EMPTY_GROUP] &&
          !sourceGroup?.tabList?.length &&
          !sourceGroup?.isLocked
        ) {
          sourceTag?.groupList?.splice(sourceGroupIndex, 1);
        }
      }
    }

    await this.setTagList(tagList);
  }
  // 打开的浏览器标签页拖拽到列表
  async onOpenedTabsDrop(
    sourceData: DragData,
    targetData: DragData,
    targetIndex: number,
  ) {
    let selectedTabs: Tabs.Tab[] = [];
    if (sourceData.isMultiSelect) {
      selectedTabs = sourceData.selectedTabs;
    } else {
      selectedTabs = [sourceData.draggingTabItem];
    }

    if (!selectedTabs.length) return;

    const tagList = await this.getTagList();

    // 将浏览器 Tab 对象转换为 TabItem 格式
    const newTabItems: TabItem[] = selectedTabs.map(tab => ({
      ...tab,
      tabId: getRandomId(),
    }));

    // 遍历找到目标标签组并插入
    let isTargetFound = false;
    for (let tag of tagList) {
      for (let group of tag.groupList) {
        if (group.groupId === targetData.groupId) {
          group.tabList.splice(targetIndex, 0, ...newTabItems);
          isTargetFound = true;
          break;
        }
      }
      if (isTargetFound) break;
    }

    if (isTargetFound) {
      await this.setTagList(tagList);
    }
  }
  // 打开的浏览器标签组拖拽到分类
  async onOpenedTabGroupDrop(sourceData: DragData, targetData: DragData) {
    const settings = await Store.settingsUtils.getSettings();
    const tagList = await this.getTagList();

    const instruction: Instruction | null = extractInstruction(targetData);
    const targetTagIndex = tagList.findIndex(tag => tag.tagId === targetData.tagId);
    // 入参 targetData 类型为 DragData，需要获取 tagList 中对应的分类数据，数据类型为 TagItem
    let _targetData = tagList[targetTagIndex];
    let targetGroupIndex = 0;
    let targetGroupLength = targetData.nodeData?.groupList?.length || 0;

    if (targetData.nodeType === 'tag') {
      // 如果是 'make-child'，则说明拖拽到当前的分类节点
      if (instruction?.type === 'make-child') {
        targetGroupIndex =
          settings[GROUP_INSERT_POSITION] === 'bottom' ? targetGroupLength : 0;
      }
      // 如果是 'reorder-above'，则说明拖拽到当前的分类前一个节点末尾
      else if (instruction?.type === 'reorder-above') {
        if (targetTagIndex > 0) {
          _targetData = tagList[targetTagIndex - 1];
          targetGroupIndex = _targetData.groupList?.length || 0;
        }
      }
      // 如果是 'reorder-below'，则说明拖拽到当前的分类节点末尾
      else if (instruction?.type === 'reorder-below') {
        targetGroupIndex = targetGroupLength;
      }
    } else if (targetData.nodeType === 'tabGroup') {
      const currGroupIndex = _targetData?.groupList?.findIndex(
        group => group.groupId === targetData.groupId,
      );

      // 如果是 'reorder-above'，则说明拖拽到当前分组之前
      if (instruction?.type === 'reorder-above') {
        targetGroupIndex = currGroupIndex;
      }
      // 如果是 'reorder-below'，则说明拖拽到当前分组之后
      else if (instruction?.type === 'reorder-below') {
        targetGroupIndex = currGroupIndex + 1;
      }
    }

    const lastStarredIndex = _targetData.groupList.findLastIndex(g => g.isStarred);
    let needStarred = false;
    if (~lastStarredIndex && targetGroupIndex <= lastStarredIndex) {
      needStarred = true;
    }

    const newGroup = {
      ...this.getInitialTabGroup(),
      isStarred: needStarred,
      groupName: sourceData?.selectedGroup?.groupName || sourceData?.groupName,
      tabList: (sourceData?.selectedGroup?.tabs || sourceData?.tabs || [])?.map?.(
        (tab: Tabs.Tab) => ({
          tabId: getRandomId(),
          ...pick(tab, ['title', 'url', 'favIconUrl']),
        }),
      ),
    };
    _targetData.groupList?.splice(targetGroupIndex, 0, newGroup);

    await this.setTagList(tagList);
  }

  // tab标签页移动到（穿越）
  async tabMoveThrough({
    sourceGroupId,
    targetTagId,
    targetGroupId,
    tabs,
    isCopy,
    autoMerge = false,
  }: {
    sourceGroupId: Key;
    targetTagId: Key;
    targetGroupId: Key;
    tabs: TabItem[];
    isCopy?: boolean;
    autoMerge?: boolean;
  }) {
    const tagList = await this.getTagList();
    const tabIds = tabs.map(tab => tab.tabId);
    let isSourceFound = false,
      isTargetFound = false,
      sourceTagIndex = 0,
      sourceGroupIndex = 0,
      targetTagIndex = 0,
      targetGroupIndex = 0;
    for (let tIndex = 0; tIndex < tagList.length; tIndex++) {
      const tag = tagList[tIndex];
      if (tag.tagId === targetTagId) {
        targetTagIndex = tIndex;
      }

      for (let gIndex = 0; gIndex < tag.groupList.length; gIndex++) {
        const group = tag.groupList[gIndex];
        if (group.groupId === sourceGroupId) {
          isSourceFound = true;
          sourceTagIndex = tIndex;
          sourceGroupIndex = gIndex;
          if (!isCopy) {
            group.tabList = group.tabList?.filter(tab => !tabIds.includes(tab.tabId));
          }
        } else if (group.groupId === targetGroupId) {
          isTargetFound = true;
          targetGroupIndex = gIndex;
        }
      }

      if (isSourceFound && isTargetFound) break;
    }

    if (isSourceFound && isTargetFound) {
      const tag = tagList[targetTagIndex];
      const group = tag.groupList[targetGroupIndex];
      if (group) {
        const settings = await Store.settingsUtils.getSettings();
        const insertPosition = settings?.[TAB_INSERT_POSITION] || 'bottom';
        const moveTabList = isCopy
          ? tabs.map(tab => ({ ...tab, tabId: getRandomId() }))
          : tabs;
        let newTabList =
          insertPosition === 'bottom'
            ? [...group.tabList].concat(moveTabList)
            : [...moveTabList].concat(group.tabList);
        // 如果开启自动合并，则标签页去重
        if (autoMerge) {
          newTabList = getUniqueList(newTabList, 'url');
        }
        group.tabList = newTabList;
      }

      // 如果source标签组内没有标签，则删除标签组
      const settings = Store.settingsUtils?.settings;
      if (settings?.[DELETE_UNLOCKED_EMPTY_GROUP]) {
        const sourceTag = tagList?.[sourceTagIndex];
        const sourceGroup = sourceTag?.groupList?.[sourceGroupIndex];
        if (!sourceGroup?.tabList?.length && !sourceGroup?.isLocked) {
          sourceTag?.groupList?.splice(sourceGroupIndex, 1);
        }
      }
    }

    await this.setTagList(tagList);
  }
  // 标签页按名称排序
  async tabsSortbyName(sortType: string, groupId: Key, tagId: Key) {
    const tagList = await this.getTagList();

    for (const tag of tagList) {
      if (tag.tagId !== tagId) continue;
      for (const group of tag?.groupList) {
        if (group.groupId !== groupId) continue;

        if (sortType === 'ascending') {
          group.tabList?.sort((a, b) => a.title!?.localeCompare(b.title!));
        } else {
          group.tabList?.sort((a, b) => b.title!?.localeCompare(a.title!));
        }
      }
    }

    await this.setTagList(tagList);
  }

  // 标签页先按主域名、再按子域名升序排序，同域名保留原顺序，无域名的链接排在末尾
  async tabsSortbyDomain(groupId: Key, tagId: Key) {
    const tagList = await this.getTagList();
    const tag = tagList.find(item => item.tagId === tagId);
    const group = tag?.groupList?.find(item => item.groupId === groupId);
    if (!group || tag?.isLocked || group.isLocked) return;

    group.tabList = group.tabList
      ?.map(tab => {
        let domain = '';
        try {
          domain = new URL(tab.url || '').hostname.toLowerCase();
        } catch {
          // 无效 URL 与无域名的链接统一排在末尾
        }
        const baseDomain = domain ? getDomain(domain) || domain : '';
        const subdomain =
          domain === baseDomain ? '' : domain.slice(0, -(baseDomain.length + 1));
        return { tab, domain, baseDomain, subdomain };
      })
      .sort((a, b) => {
        if (!a.domain) return b.domain ? 1 : 0;
        if (!b.domain) return -1;
        return (
          a.baseDomain.localeCompare(b.baseDomain) ||
          a.subdomain.localeCompare(b.subdomain)
        );
      })
      .map(item => item.tab);

    await this.setTagList(tagList);
  }

  // 导入合并
  async mergeTags(source: TagItem[], target: TagItem[]) {
    const targetMap = new Map<TagItem['tagName'], TagItem>();
    const newTagMap = new Map<TagItem['tagName'], TagItem>();
    const settings = await Store.settingsUtils.getSettings();
    const insertPosition = settings?.[GROUP_INSERT_POSITION] || 'top';

    for (let tag of target) {
      let mapTag = targetMap.get(tag.tagName);
      if (mapTag) {
        mapTag = {
          ...mapTag,
          groupList: mergeGroupsAndTabs({
            targetList: mapTag.groupList,
            insertList: tag.groupList,
            exceptValue: UNNAMED_GROUP,
            insertPosition,
          }),
        };
        targetMap.set(tag.tagName, mapTag);
      } else {
        targetMap.set(tag.tagName, tag);
      }
    }

    for (let tag of source) {
      const mapTag = targetMap.get(tag.tagName);
      if (mapTag) {
        mapTag.groupList = mergeGroupsAndTabs({
          targetList: mapTag.groupList,
          insertList: tag.groupList,
          exceptValue: UNNAMED_GROUP,
          insertPosition,
        });

        targetMap.set(tag.tagName, mapTag);
      } else {
        const newMapTag = newTagMap.get(tag.tagName);
        if (newMapTag) {
          newMapTag.groupList = mergeGroupsAndTabs({
            targetList: newMapTag.groupList,
            insertList: tag.groupList,
            exceptValue: UNNAMED_GROUP,
            insertPosition,
          });

          newTagMap.set(tag.tagName, newMapTag);
        } else {
          newTagMap.set(tag.tagName, {
            ...tag,
            groupList: mergeGroupsAndTabs({
              targetList: tag.groupList,
              insertList: [],
              exceptValue: UNNAMED_GROUP,
              insertPosition,
            }),
          });
        }
      }
    }

    const tagList = [...targetMap.values()];
    const newTags = [...newTagMap.values()];
    const insertIndex = tagList?.[0]?.static ? 1 : 0;
    tagList.splice(insertIndex, 0, ...newTags);

    return tagList;
  }
  // 导入
  async importTags(tags: TagItem[], importMode = 'append') {
    const tagList = await this.getTagList();
    const needOverwrite =
      importMode === 'overwrite' ||
      !tagList.length ||
      (tagList.length == 1 && !tagList?.[0].groupList?.length);

    if (needOverwrite) {
      await this.setTagList(tags);
    } else if (importMode === 'merge') {
      // merge mode
      const newTagList = await this.mergeTags(tags, tagList);
      await this.setTagList(newTagList);
    } else {
      // append mode
      let stagingAreaTag = this.createStagingAreaTag();
      const stagingAreaIndex = tagList?.findIndex(tag => tag?.static);
      if (~stagingAreaIndex) {
        stagingAreaTag = tagList.splice(stagingAreaIndex, 1)?.[0] || stagingAreaTag;
      }

      const stagingAreaInsertIndex = tags?.findIndex(tag => tag?.static);

      if (~stagingAreaInsertIndex) {
        const settings = await Store.settingsUtils.getSettings();
        const insertPosition = settings?.[GROUP_INSERT_POSITION] || 'top';
        stagingAreaTag.groupList = mergeGroupsAndTabs({
          targetList: stagingAreaTag.groupList,
          insertList: tags?.[stagingAreaInsertIndex].groupList,
          exceptValue: UNNAMED_GROUP,
          insertPosition,
        });
        tags.splice(stagingAreaInsertIndex, 1);
      }

      const newTagList = [stagingAreaTag, ...tags, ...tagList];
      await this.setTagList(newTagList);
    }
  }
  // 导出
  async exportTags(): Promise<Partial<TagItem>[]> {
    const tagList = await this.getTagList();
    let exportTagList = tagList.map(tag => {
      return omit(
        {
          ...tag,
          groupList:
            tag?.groupList?.map(g => {
              return omit(
                {
                  ...g,
                  tabList:
                    g?.tabList?.map(tab => omit(tab, ['tabId', 'favIconUrl'])) || [],
                },
                ['groupId' /* 'createTime' */],
              );
            }) || [],
        },
        ['tagId' /* 'createTime' */],
      ) as Partial<TagItem>;
    });
    return exportTagList;
  }
  // 复制链接
  copyLinks(tabs: TabItem[]): string {
    const settings = Store.settingsUtils?.settings;
    const linkTemplate = settings[LINK_TEMPLATE] || '{{url}} | {{title}}';
    return tabs
      .map(tab => {
        return linkTemplate
          .replace(/\{\{\s*title\s*\}\}/g, tab.title || '')
          .replace(/\{\{\s*url\s*\}\}/g, tab.url || '');
      })
      .join('\n');
  }
}

import { Key } from 'react';
import { Tabs } from 'wxt/browser';
// import { storage } from 'wxt/storage';
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
import dayjs from 'dayjs';
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

const {
  DELETE_UNLOCKED_EMPTY_GROUP,
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
        exceptList.push({ ...item, groupName: `group_${getRandomId()}` });
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

// tab列表工具类 (tag: 分类， tabGroup: 标签组， tab: 标签页)
export default class TabListUtils {
  tagList: TagItem[] = [];
  countInfo: CountInfo = {
    tagCount: 0,
    groupCount: 0,
    tabCount: 0,
  };
  storageKey: `local:${string}` = 'local:tabList';

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
    return {
      tagId: getRandomId(),
      tagName: UNNAMED_TAG,
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
  async getTagList() {
    let tagList = await storage.getItem<TagItem[]>(this.storageKey);
    const staticIndex = tagList?.findIndex(tag => tag.static) ?? -1;
    // 必须保证中转站排在第一位
    if (!tagList?.length || staticIndex == -1) {
      tagList = [this.createStagingAreaTag(), ...(tagList || [])];
      await this.setTagList(tagList);
    } else if (staticIndex > 0) {
      const staticTag = tagList.splice(staticIndex, 1);
      tagList = [staticTag[0], ...tagList];
      await this.setTagList(tagList);
    }

    this.tagList = tagList;
    this.setCountInfo();
    return this.tagList;
  }
  async setTagList(list?: TagItem[]) {
    this.tagList = list?.length ? list : [this.createStagingAreaTag()];
    this.setCountInfo();
    storage.setItem(this.storageKey, this.tagList);
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
    return {
      groupId: getRandomId(),
      groupName: UNNAMED_GROUP,
      createTime: newCreateTime(),
      tabList: [],
    };
  }
  async createTabGroup(tagId: Key, tabGroup?: GroupItem) {
    const tagList = await this.getTagList();
    const newGroup = Object.assign(this.getInitialTabGroup(), tabGroup);
    for (let tag of tagList) {
      if (tag.tagId === tagId) {
        const index = tag.groupList.findIndex(g => !g.isStarred);
        tag.groupList.splice(index > -1 ? index : tag.groupList.length, 0, newGroup);
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
  // 标签组移动到（穿越）
  async tabGroupMoveThrough({
    sourceGroupId,
    targetTagId,
    isCopy = false,
    autoMerge = false,
  }: {
    sourceGroupId: Key;
    targetTagId: Key;
    isCopy?: boolean;
    autoMerge?: boolean;
  }) {
    const tagList = await this.getTagList();
    let isSourceFound = false,
      isTargetFound = false,
      sourceTagIndex = 0,
      sourceGroupIndex = 0,
      targetTagIndex = 0,
      sourceGroup = null;
    for (let tIndex = 0; tIndex < tagList.length; tIndex++) {
      const tag = tagList[tIndex];
      if (tag.tagId === targetTagId) {
        isTargetFound = true;
        targetTagIndex = tIndex;
      }
      for (let gIndex = 0; gIndex < tag?.groupList?.length; gIndex++) {
        const group = tag?.groupList?.[gIndex];
        if (group.groupId === sourceGroupId) {
          isSourceFound = true;
          sourceTagIndex = tIndex;
          sourceGroupIndex = gIndex;
          sourceGroup = group;
          break;
        }
      }

      if (isSourceFound && isTargetFound) break;
    }

    if (isSourceFound && isTargetFound && sourceGroup) {
      const sourceTag = tagList?.[sourceTagIndex];
      if (!isCopy) {
        sourceTag?.groupList?.splice(sourceGroupIndex, 1);
      }

      const targetTag = tagList?.[targetTagIndex];
      const sameNameGroupIndex = targetTag?.groupList?.findIndex(
        g => g.groupName === sourceGroup?.groupName,
      );

      const settings = await Store.settingsUtils.getSettings();
      const insertPosition = settings?.[GROUP_INSERT_POSITION] || 'top';
      const targetGroup = isCopy ? getCloneGroup(sourceGroup) : { ...sourceGroup };

      // 如果开启自动合并，则同名标签组会自动合并
      if (autoMerge && ~sameNameGroupIndex) {
        const targetSameNameGroup = targetTag?.groupList[sameNameGroupIndex];

        targetTag.groupList = mergeGroupsAndTabs({
          targetList: targetTag.groupList || [],
          insertList: [targetGroup],
          // exceptValue: UNNAMED_GROUP,
          insertPosition,
        });
        await this.setTagList(tagList);
        return { targetGroupId: targetSameNameGroup.groupId };
      } else {
        targetTag.groupList = this.groupListSortbyStarred({
          list: targetTag?.groupList,
          insertList: [targetGroup],
          insertPosition,
        });

        await this.setTagList(tagList);
        return { targetGroupId: targetGroup.groupId };
      }
    }

    await this.setTagList(tagList);
    return { targetGroupId: undefined };
  }
  // 当前分类中所有标签组移动到（穿越）
  async allTabGroupsMoveThrough({
    sourceTagId,
    targetTagId,
    isCopy = false,
    autoMerge = false,
  }: {
    sourceTagId: Key;
    targetTagId: Key;
    isCopy?: boolean;
    autoMerge?: boolean;
  }) {
    const tagList = await this.getTagList();
    let isSourceFound = false,
      isTargetFound = false,
      sourceTagIndex = 0,
      targetTagIndex = 0;
    for (let tIndex = 0; tIndex < tagList.length; tIndex++) {
      const tag = tagList[tIndex];
      if (tag.tagId === targetTagId) {
        isTargetFound = true;
        targetTagIndex = tIndex;
      }
      if (tag.tagId === sourceTagId) {
        isSourceFound = true;
        sourceTagIndex = tIndex;
      }

      if (isSourceFound && isTargetFound) break;
    }

    if (isSourceFound && isTargetFound) {
      const sourceTag = tagList?.[sourceTagIndex];
      let allSourceGroups: GroupItem[] = [];
      if (isCopy) {
        allSourceGroups = sourceTag.groupList?.map(group => getCloneGroup(group));
      } else {
        allSourceGroups = sourceTag.groupList?.splice(0);
      }
      const targetTag = tagList?.[targetTagIndex];

      const settings = await Store.settingsUtils.getSettings();
      const insertPosition = settings?.[GROUP_INSERT_POSITION] || 'top';
      // 如果开启自动合并，则同名标签组会自动合并
      if (autoMerge) {
        targetTag.groupList = mergeGroupsAndTabs({
          targetList: targetTag.groupList || [],
          insertList: allSourceGroups,
          // exceptValue: UNNAMED_GROUP,
          insertPosition,
        });

        await this.setTagList(tagList);
      } else {
        targetTag.groupList = this.groupListSortbyStarred({
          list: targetTag?.groupList,
          insertList: allSourceGroups,
          insertPosition,
        });
        await this.setTagList(tagList);
      }

      return { targetTagId: targetTag.tagId };
    }

    await this.setTagList(tagList);
    return { targetTagId: undefined };
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
    // 不存在标签组或者createNewGroup=true，就创建一个新标签组
    const newtabGroup = this.getInitialTabGroup();
    if (!settings?.[ALLOW_DUPLICATE_TABS]) {
      newTabs = getUniqueList(newTabs, 'url');
    }
    newtabGroup.tabList = newTabs;

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
      const index = tag0.groupList.findIndex(g => !g.isStarred);
      tag0.groupList.splice(index > -1 ? index : tag0.groupList.length, 0, newtabGroup);
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
    for (let item of list) {
      if (item.type === 'group') {
        if (!_isGroupSupported) {
          for (let tab of item.tabList) {
            openNewTab(tab.url);
          }
          return;
        }

        Promise.all(
          item.tabList?.map(tab => {
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
  async removeTabs(groupId: Key, tabs: TabItem[], filterFlag = false) {
    const tagList = await this.getTagList();
    const tabIds = tabs.map(tab => tab.tabId);
    let tag = undefined,
      group = undefined;

    const settings = Store.settingsUtils?.settings;

    for (let t of tagList) {
      for (let i = 0; i < t.groupList?.length; i++) {
        const g = t.groupList[i];
        if (g.groupId === groupId) {
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

    await this.setTagList(filterFlag ? this.getFilteredTagList(tagList) : tagList);

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
    const needOverride =
      importMode === 'override' ||
      !tagList.length ||
      (tagList.length == 1 && !tagList?.[0].groupList?.length);

    if (needOverride) {
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

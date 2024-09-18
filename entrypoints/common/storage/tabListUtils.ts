import { Key } from 'react';
import { Tabs } from 'wxt/browser';
// import { storage } from 'wxt/storage';
import type { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';
import {
  ENUM_SETTINGS_PROPS,
  UNNAMED_TAG,
  UNNAMED_GROUP,
  IS_GROUP_SUPPORT,
} from '../constants';
import {
  getRandomId,
  pick,
  omit,
  newCreateTime,
  getUniqueList,
  getMergedList,
} from '../utils';
import Store from './instanceStore';

const {
  DELETE_UNLOCKED_EMPTY_GROUP,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
  LINK_TEMPLATE,
} = ENUM_SETTINGS_PROPS;

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
  handler: (previousValue: GroupItem, currentValue: GroupItem) => GroupItem
): GroupItem[] {
  const handleMerge = (
    targetMap: Map<GroupItem[keyof GroupItem], GroupItem>,
    list: GroupItem[]
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

  const unstarredIndex = resultGroups.findIndex((g) => !g.isStarred);
  const idx = unstarredIndex > -1 ? unstarredIndex : resultGroups.length;
  resultGroups.splice(idx, 0, ...newGroups);

  return resultGroups;
}

/**
 * @description: 合并标签组和标签
 * @param targetList 原始列表
 * @param insertList 新插入的列表
 * @param key 合并对象依据的字段名
 * @param exceptValue item[key] = exceptValue 的数据项不合并
 * @return 返回合并后的列表
 */
export function mergeGroupsAndTabs({
  targetList,
  insertList,
  key = 'groupName',
  exceptValue,
}: {
  targetList: GroupItem[];
  insertList: GroupItem[];
  key?: keyof GroupItem;
  exceptValue?: string | number | boolean;
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
      list: _tResultList,
      insertList: _iResultList,
      key,
    },
    (prev, curr) => {
      const mergedTabList = getUniqueList([...prev.tabList, ...curr.tabList], 'url');
      return { ...prev, tabList: mergedTabList };
    }
  );

  return [...mergedList, ..._tExceptList, ..._iExceptList];
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
      const groupList = tag?.groupList?.filter((group) => group?.tabList?.length > 0);
      if (groupList?.length > 0) {
        return [...result, { ...tag, groupList }];
      } else {
        return result;
      }
    }, []);
  }
  async getTagList() {
    let tagList = await storage.getItem<TagItem[]>(this.storageKey);
    const staticIndex = tagList?.findIndex((tag) => tag.static) ?? -1;
    // 必须保证中转站排在第一位
    if (!tagList?.length || staticIndex == -1) {
      tagList = [this.createStagingAreaTag(), ...(tagList || [])];
    } else if (staticIndex > 0) {
      const staticTag = tagList.splice(staticIndex, 1);
      tagList = [staticTag[0], ...tagList];
    }
    this.tagList = tagList;
    await this.setTagList(tagList);

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
    this.tagList.forEach((tag) => {
      tagCount += 1;
      tag?.groupList?.forEach((group) => {
        groupCount += 1;
        group?.tabList?.forEach((tab) => {
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
        const groupList = tag?.groupList?.filter((group) => group?.tabList?.length > 0);
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
    const tagItem = this.tagList.find((item) => item.tagId === tagId);
    const tagList = this.tagList.filter((item) => item.tagId !== tagId);
    await this.setTagList(tagList);

    if (this.constructor === TabListUtils) {
      // console.log('removeTagItem', tagItem);
      // 分类中有标签页，才放入到回收站
      if (!tagItem) return;
      tagItem.groupList =
        tagItem?.groupList?.filter((group) => group?.tabList?.length > 0) || [];
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
        const index = tag.groupList.findIndex((g) => !g.isStarred);
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
        const removeGroup = tag.groupList.find((g) => g.groupId === groupId);
        tag.groupList = tag.groupList.filter((g) => g.groupId !== groupId);

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
          const unstarredIndex = tag.groupList.findIndex((g) => !g.isStarred);
          tag.groupList.splice(
            unstarredIndex > -1 ? unstarredIndex : tag.groupList.length,
            0,
            group
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
    targetIndex: number
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
    const tagIndex = tagList.findIndex((tag) => tag.tagId === tagId);
    const tag = tagList[tagIndex];
    const groupIndex = tag?.groupList?.findIndex((g) => g.groupId === groupId);
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
    autoMerge = false,
  }: {
    sourceGroupId: Key;
    targetTagId: Key;
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
      sourceTag?.groupList?.splice(sourceGroupIndex, 1);

      const targetTag = tagList?.[targetTagIndex];
      const sameNameGroupIndex = targetTag?.groupList?.findIndex(
        (g) => g.groupName === sourceGroup?.groupName
      );
      // 如果开启自动合并，则同名标签组会自动合并
      if (autoMerge && ~sameNameGroupIndex) {
        const targetSameNameGroup = targetTag?.groupList[sameNameGroupIndex];
        targetTag?.groupList?.splice(sameNameGroupIndex, 1, {
          ...targetSameNameGroup,
          tabList: getUniqueList(
            [...targetSameNameGroup?.tabList, ...sourceGroup?.tabList],
            'url'
          ),
        });
        await this.setTagList(tagList);
        return { targetGroupId: targetSameNameGroup.groupId };
      } else {
        // 穿越操作改为往队尾插入
        targetTag?.groupList.push(sourceGroup);

        await this.setTagList(tagList);
        return { targetGroupId: sourceGroup.groupId };
      }
    }

    await this.setTagList(tagList);
    return { targetGroupId: undefined };
  }
  // 当前分类中所有标签组移动到（穿越）
  async allTabGroupsMoveThrough({
    sourceTagId,
    targetTagId,
    autoMerge = false,
  }: {
    sourceTagId: Key;
    targetTagId: Key;
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
      const allSourceGroups = sourceTag?.groupList?.splice(0);

      const targetTag = tagList?.[targetTagIndex];

      // 如果开启自动合并，则同名标签组会自动合并
      if (autoMerge) {
        targetTag.groupList = mergeGroupsAndTabs({
          targetList: targetTag.groupList || [],
          insertList: allSourceGroups,
          // exceptValue: UNNAMED_GROUP,
        });

        await this.setTagList(tagList);
      } else {
        // 穿越操作改为往队尾插入
        targetTag.groupList = [...targetTag?.groupList, ...allSourceGroups];
        await this.setTagList(tagList);
      }

      return { targetTagId: targetTag.tagId };
    }

    await this.setTagList(tagList);
    return { targetTagId: undefined };
  }
  // 标签组排序
  async groupListSort(sortType: string, tagId: Key) {
    const tagList = await this.getTagList();
    const tag = tagList.find((t) => t.tagId === tagId);
    if (!tag) return;
    // const _locale = 'en-US-u-kf-lower' // 排序顺序：数字 > 小写英文 > 大写英文 > 中文
    // const _locale = 'en-US-u-kf-upper' // 排序顺序：数字 > 大写英文 > 小写英文 > 中文
    // const _locale = 'zh-CN-u-kf-lower' // 排序顺序：数字 > 中文 > 小写英文 > 大写英文
    // const _locale = 'zh-CN-u-kf-upper' // 排序顺序：数字 > 中文 > 大写英文 > 小写英文

    const unstarredIndex =
      tag.groupList?.findIndex((g) => !g.isStarred) ?? tag.groupList.length;
    const doSortList = unstarredIndex > -1 ? tag?.groupList?.slice(unstarredIndex) : [];

    if (sortType === 'ascending') {
      doSortList?.sort((a, b) => a.groupName.localeCompare(b.groupName));
    } else {
      doSortList?.sort((a, b) => b.groupName.localeCompare(a.groupName));
    }

    tag.groupList = tag.groupList?.slice(0, unstarredIndex).concat(doSortList);
    await this.setTagList(tagList);
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
    createNewGroup = true
  ): Promise<{ tagId: string; groupId: string }> {
    await this.getTagList();
    let result = {} as { tagId: string; groupId: string };
    if (IS_GROUP_SUPPORT) {
      result = await this.createTabsByGroups(tabs, createNewGroup);
    } else {
      result = await this.createTabsIndependent(tabs, createNewGroup);
    }

    await this.setTagList(this.tagList);
    return result;
  }
  // 内部调用：保留浏览器群组的标签页
  async createTabsByGroups(tabs: Tabs.Tab[], createNewGroup = true) {
    const groupsMap = new Map<number, GroupItem>(),
      independentTabs = [];
    for (let tab of tabs) {
      // 目前 webextension-polyfill 中没有 group 相关的类型定义, 但是新版浏览器有相关的属性
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

    // 目前 webextension-polyfill 中没有 group 相关的类型定义, 但是新版浏览器有相关的 API
    if (IS_GROUP_SUPPORT && 'get' in browser.tabGroups) {
      for (const [bsGroupId, group] of groupsMap.entries()) {
        const tabGroup = await browser.tabGroups?.get(bsGroupId);
        // console.log('tabGroup', tabGroup);
        group.groupName = tabGroup?.title || group.groupName;
      }
    }

    if (independentTabs.length > 0) {
      // 先创建独立的tab页
      const result = await this.createTabsIndependent(independentTabs, createNewGroup);
      // 不存在浏览器自带的标签组，直接返回独立标签页创建的标签组信息
      if (groupsMap.size == 0) return result;
    }
    // 接下来保存浏览器自带的标签组
    let tag0 = this.tagList?.[0];
    if (!tag0) {
      tag0 = this.createStagingAreaTag();
      this.tagList.push(tag0);
    }

    let newGroups = [...groupsMap.values()];
    const settings = Store.settingsUtils?.settings;

    if (settings?.[ALLOW_DUPLICATE_GROUPS]) {
      const unstarredIndex = tag0.groupList.findIndex((g) => !g.isStarred);
      const idx = unstarredIndex > -1 ? unstarredIndex : tag0.groupList.length;
      tag0.groupList.splice(idx, 0, ...newGroups);
      return { tagId: tag0.tagId, groupId: tag0?.groupList?.[idx]?.groupId || '' };
    }

    tag0.groupList = getMergedGroupList(
      {
        list: tag0.groupList,
        insertList: newGroups,
        key: 'groupName',
      },
      (prev, curr) => {
        let mergedTabList = [...prev.tabList, ...curr.tabList];
        if (!settings?.[ALLOW_DUPLICATE_TABS]) {
          mergedTabList = getUniqueList(mergedTabList, 'url');
        }
        return { ...prev, tabList: mergedTabList };
      }
    );

    const activeGroup = tag0.groupList.find(
      (g) => g.groupName === newGroups?.[0]?.groupName
    );

    return {
      tagId: tag0.tagId,
      groupId: activeGroup?.groupId || '',
    };
  }
  // 内部调用：所有标签页独立创建
  async createTabsIndependent(tabs: Tabs.Tab[], createNewGroup = true) {
    let newTabs = tabs.map(this.transformTabItem);
    let tag0 = this.tagList?.[0];
    const group = tag0?.groupList?.find((group) => !group.isLocked && !group.isStarred);
    const settings = Store.settingsUtils?.settings;
    if (!createNewGroup && group) {
      newTabs = [...newTabs, ...(group?.tabList || [])];
      if (!settings?.[ALLOW_DUPLICATE_TABS]) {
        newTabs = getUniqueList(newTabs, 'url');
      }
      group.tabList = newTabs;
      await this.setTagList([tag0, ...this.tagList.slice(1)]);
      return { tagId: tag0.tagId, groupId: group.groupId };
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
          (g) => g.groupName === newtabGroup.groupName
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
      const index = tag0.groupList.findIndex((g) => !g.isStarred);
      tag0.groupList.splice(index > -1 ? index : tag0.groupList.length, 0, newtabGroup);
      await this.setTagList([tag0, ...this.tagList.slice(1)]);
      return { tagId: tag0.tagId, groupId: newtabGroup.groupId };
    }

    // 不存在tag分类，就创建一个新的tag
    const tag = this.createStagingAreaTag();
    tag.groupList = [newtabGroup];
    this.tagList.push(tag);
    return { tagId: tag.tagId, groupId: newtabGroup.groupId };
  }
  // 删除标签页: filterFlag 是否过滤空分类、标签组 (列表页保留空分类、标签组；回收站中不保留)
  async removeTabs(groupId: Key, tabs: TabItem[], filterFlag = false) {
    const tagList = await this.getTagList();
    const tabIds = tabs.map((tab) => tab.tabId);
    let tag = undefined,
      group = undefined;

    const settings = Store.settingsUtils?.settings;

    for (let t of tagList) {
      for (let i = 0; i < t.groupList?.length; i++) {
        const g = t.groupList[i];
        if (g.groupId === groupId) {
          tag = t;
          group = g;
          g.tabList = g.tabList?.filter((tab) => !tabIds.includes(tab.tabId));
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
          g.tabList = g?.tabList.map((tab) => {
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
  // tab标签页拖拽
  async onTabDrop(
    sourceGroupId: Key,
    targetGroupId: Key,
    sourceIndex: number,
    targetIndex: number
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
          tabItemTmp
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
  // tab标签页移动到（穿越）
  async tabMoveThrough({
    sourceGroupId,
    targetTagId,
    targetGroupId,
    tabs,
    autoMerge = false,
  }: {
    sourceGroupId: Key;
    targetTagId: Key;
    targetGroupId: Key;
    tabs: TabItem[];
    autoMerge?: boolean;
  }) {
    const tagList = await this.getTagList();
    const tabIds = tabs.map((tab) => tab.tabId);
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
          group.tabList = group.tabList?.filter((tab) => !tabIds.includes(tab.tabId));
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
        let newTabList = [...group.tabList, ...tabs];
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

  // 导入合并
  async mergeTags(source: TagItem[], target: TagItem[]) {
    const targetMap = new Map<TagItem['tagName'], TagItem>();
    const newTagMap = new Map<TagItem['tagName'], TagItem>();

    for (let tag of target) {
      let mapTag = targetMap.get(tag.tagName);
      if (mapTag) {
        mapTag = {
          ...mapTag,
          groupList: mergeGroupsAndTabs({
            targetList: mapTag.groupList,
            insertList: tag.groupList,
            exceptValue: UNNAMED_GROUP,
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
        });

        targetMap.set(tag.tagName, mapTag);
      } else {
        const newMapTag = newTagMap.get(tag.tagName);
        if (newMapTag) {
          newMapTag.groupList = mergeGroupsAndTabs({
            targetList: newMapTag.groupList,
            insertList: tag.groupList,
            exceptValue: UNNAMED_GROUP,
          });

          newTagMap.set(tag.tagName, newMapTag);
        } else {
          newTagMap.set(tag.tagName, {
            ...tag,
            groupList: mergeGroupsAndTabs({
              targetList: tag.groupList,
              insertList: [],
              exceptValue: UNNAMED_GROUP,
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
      const stagingAreaIndex = tagList?.findIndex((tag) => tag?.static);
      if (~stagingAreaIndex) {
        stagingAreaTag = tagList.splice(stagingAreaIndex, 1)?.[0] || stagingAreaTag;
      }

      const stagingAreaInsertIndex = tags?.findIndex((tag) => tag?.static);

      if (~stagingAreaInsertIndex) {
        stagingAreaTag.groupList = mergeGroupsAndTabs({
          targetList: stagingAreaTag.groupList,
          insertList: tags?.[stagingAreaInsertIndex].groupList,
          exceptValue: UNNAMED_GROUP,
        })
        tags.splice(stagingAreaInsertIndex, 1);
      }

      const newTagList = [stagingAreaTag, ...tags, ...tagList];
      await this.setTagList(newTagList);
    }
  }
  // 导出
  async exportTags(): Promise<Partial<TagItem>[]> {
    const tagList = await this.getTagList();
    let exportTagList = tagList.map((tag) => {
      return omit(
        {
          ...tag,
          groupList:
            tag?.groupList?.map((g) => {
              return omit(
                { ...g, tabList: g?.tabList?.map((tab) => omit(tab, ['tabId'])) || [] },
                ['groupId', 'createTime']
              );
            }) || [],
        },
        ['tagId', 'createTime']
      ) as Partial<TagItem>;
    });
    return exportTagList;
  }
  // 复制链接
  copyLinks(tabs: TabItem[]): string {
    const settings = Store.settingsUtils?.settings;
    const linkTemplate = settings[LINK_TEMPLATE] || '{{url}} | {{title}}';
    return tabs
      .map((tab) => {
        return linkTemplate
          .replace(/\{\{\s*title\s*\}\}/g, tab.title || '')
          .replace(/\{\{\s*url\s*\}\}/g, tab.url || '');
      })
      .join('\n');
  }
}

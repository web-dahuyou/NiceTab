import { Key } from 'react';
import { Tabs } from 'wxt/browser';
import type {
  SettingsProps,
  TagItem,
  GroupItem,
  TabItem,
  CountInfo,
  ThemeProps,
} from '../types';
import {
  ENUM_COLORS,
  ENUM_SETTINGS_PROPS,
  defaultLanguage,
  UNNAMED_TAG,
  UNNAMED_GROUP,
  IS_GROUP_SUPPORT,
} from './constants';
import {
  getRandomId,
  pick,
  omit,
  newCreateTime,
  getUniqueList,
  getMergedList,
} from './utils';

const {
  LANGUAGE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TABS,
  DELETE_AFTER_RESTORE,
  DELETE_UNLOCKED_EMPTY_GROUP,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
} = ENUM_SETTINGS_PROPS;

let _settingsUtils: SettingsUtils;
let _listStoreUtils: TabListUtils;
let _recycleBinUtils: RecycleBinUtils;

// 设置工具类
class SettingsUtils {
  initialSettings = {
    [LANGUAGE]: defaultLanguage || 'zh-CN',
    [OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]: true, // 启动浏览器时是否自动打开管理后台
    [OPEN_ADMIN_TAB_AFTER_SEND_TABS]: true, // 发送标签页后默认打开管理后台
    [CLOSE_TABS_AFTER_SEND_TABS]: true, // 发送标签页后是否关闭标签页
    [AUTO_PIN_ADMIN_TAB]: true, // 是否固定管理后台
    [ALLOW_SEND_PINNED_TABS]: false, // 是否发送固定标签页
    [DELETE_AFTER_RESTORE]: false, // 恢复标签页/标签组时是否从列表中删除
    [DELETE_UNLOCKED_EMPTY_GROUP]: true, // 是否删除未锁定的空标签组
    [ALLOW_DUPLICATE_TABS]: true, // 同一个标签组中是否允许重复的标签页
    [ALLOW_DUPLICATE_GROUPS]: true, // 同一个分类中是否允许重复的标签组
  };
  async setSettings(settings: SettingsProps) {
    return await storage.setItem('local:settings', {
      ...this.initialSettings,
      ...settings,
    });
  }
  async getSettings() {
    const settings = await storage.getItem<SettingsProps>('local:settings', {
      defaultValue: this.initialSettings,
    });

    return { ...this.initialSettings, ...settings };
  }
}

// tab列表工具类 (tag: 分类， tabGroup: 标签组， tab: 标签页)
class TabListUtils {
  tagList: TagItem[] = [];
  countInfo: CountInfo = {
    tagCount: 0,
    groupCount: 0,
    tabCount: 0,
  };
  storageKey: `local:${string}` = 'local:tabList';

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
    const tagList = await storage.getItem<TagItem[]>(this.storageKey);
    this.tagList = tagList || [this.getInitialTag()];
    if (!tagList) {
      await this.setTagList(this.tagList);
    }
    this.setCountInfo();
    return this.tagList;
  }
  async setTagList(list?: TagItem[]) {
    this.tagList = list || [this.getInitialTag()];
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
      _recycleBinUtils.addTags(filteredTagList);
    }
  }
  async addTag(tag?: TagItem) {
    const tagList = await this.getTagList();
    const newTag = Object.assign(this.getInitialTag(), tag || {});
    await this.setTagList([newTag, ...tagList]);
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
        _recycleBinUtils.addTags([tagItem]);
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
            _recycleBinUtils.addTabGroups(tag, [removeGroup]);
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
        const unstarredIndex = targetTag?.groupList?.findIndex((g) => !g.isStarred);
        targetTag?.groupList.splice(
          unstarredIndex > -1 ? unstarredIndex : targetTag?.groupList?.length,
          0,
          sourceGroup
        );

        await this.setTagList(tagList);
        return { targetGroupId: sourceGroup.groupId };
      }
    }

    await this.setTagList(tagList);
    return { targetGroupId: undefined };
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
    if ('get' in browser.tabGroups) {
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
      tag0 = this.getInitialTag();
      this.tagList.push(tag0);
    }

    let newGroups = [...groupsMap.values()];
    const settings = await _settingsUtils.getSettings();

    if (!settings[ALLOW_DUPLICATE_GROUPS]) {
      newGroups = getMergedList(newGroups, 'groupName', (prev, curr) => {
        let mergedTabList = [...prev.tabList, ...curr.tabList];
        if (!settings[ALLOW_DUPLICATE_TABS]) {
          mergedTabList = getUniqueList(mergedTabList, 'url');
        }
        return { ...prev, tabList: mergedTabList };
      });
    }

    const unstarredIndex = tag0.groupList.findIndex((g) => !g.isStarred);
    const idx = unstarredIndex > -1 ? unstarredIndex : tag0.groupList.length;
    tag0.groupList.splice(idx, 0, ...newGroups);
    return { tagId: tag0.tagId, groupId: tag0?.groupList?.[idx]?.groupId };
  }
  // 内部调用：所有标签页独立创建
  async createTabsIndependent(tabs: Tabs.Tab[], createNewGroup = true) {
    let newTabs = tabs.map(this.transformTabItem);
    let tag0 = this.tagList?.[0];
    const group = tag0?.groupList?.find((group) => !group.isLocked && !group.isStarred);
    const settings = await _settingsUtils.getSettings();
    if (!createNewGroup && group) {
      newTabs = [...newTabs, ...(group?.tabList || [])];
      if (!settings[ALLOW_DUPLICATE_TABS]) {
        newTabs = getUniqueList(newTabs, 'url');
      }
      group.tabList = newTabs;
      await this.setTagList([tag0, ...this.tagList.slice(1)]);
      return { tagId: tag0.tagId, groupId: group.groupId };
    }
    // 不存在标签组或者createNewGroup=true，就创建一个新标签组
    const newtabGroup = this.getInitialTabGroup();
    if (!settings[ALLOW_DUPLICATE_TABS]) {
      newTabs = getUniqueList(newTabs, 'url');
    }
    newtabGroup.tabList = newTabs;

    if (tag0) {
      const index = tag0.groupList.findIndex((g) => !g.isStarred);
      tag0.groupList.splice(index > -1 ? index : tag0.groupList.length, 0, newtabGroup);
      await this.setTagList([tag0, ...this.tagList.slice(1)]);
      return { tagId: tag0.tagId, groupId: newtabGroup.groupId };
    }

    // 不存在tag分类，就创建一个新的tag
    const tag = this.getInitialTag();
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

    const settings = await _settingsUtils.getSettings();

    for (let t of tagList) {
      for (let i = 0; i < t.groupList?.length; i++) {
        const g = t.groupList[i];
        if (g.groupId === groupId) {
          tag = t;
          group = g;
          g.tabList = g.tabList?.filter((tab) => !tabIds.includes(tab.tabId));
          // 如果未锁定的标签组内没有标签页，则删除标签组
          if (
            settings[DELETE_UNLOCKED_EMPTY_GROUP] &&
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
      await _recycleBinUtils.addTabs(tag, group, tabs);
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
        const settings = await _settingsUtils.getSettings();
        const sourceGroup = sourceTag?.groupList?.[sourceGroupIndex];
        // 如果未锁定的标签组内没有标签页，则删除标签组
        if (
          settings[DELETE_UNLOCKED_EMPTY_GROUP] &&
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
        let newTabList = [...tabs, ...group.tabList];
        // 如果开启自动合并，则标签页去重
        if (autoMerge) {
          newTabList = getUniqueList(newTabList, 'url');
        }
        group.tabList = newTabList;
      }

      // 如果source标签组内没有标签，则删除标签组
      const settings = await _settingsUtils.getSettings();
      if (settings[DELETE_UNLOCKED_EMPTY_GROUP]) {
        const sourceTag = tagList?.[sourceTagIndex];
        const sourceGroup = sourceTag?.groupList?.[sourceGroupIndex];
        if (!sourceGroup?.tabList?.length && !sourceGroup?.isLocked) {
          sourceTag?.groupList?.splice(sourceGroupIndex, 1);
        }
      }
    }

    await this.setTagList(tagList);
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
    } else {
      await this.setTagList([...tags, ...tagList]);
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
}

class ThemeUtils {
  defaultTheme = {
    colorPrimary: ENUM_COLORS.primary,
  };
  themeData = this.defaultTheme;
  async getThemeData() {
    const theme = await storage.getItem<ThemeProps>('local:theme');
    return theme || this.defaultTheme;
  }
  async setThemeData(theme: Partial<ThemeProps>) {
    const themeData = await this.getThemeData();
    this.themeData = { ...themeData, ...theme };
    await storage.setItem('local:theme', this.themeData);
    return this.themeData;
  }
}

// 回收站工具类
class RecycleBinUtils extends TabListUtils {
  tagList: TagItem[] = [];
  countInfo: CountInfo = {
    tagCount: 0,
    groupCount: 0,
    tabCount: 0,
  };
  storageKey: `local:${string}` = 'local:recycleBin';

  constructor() {
    super();
  }

  async getTagList() {
    const tagList = await storage.getItem<TagItem[]>(this.storageKey);
    this.tagList = tagList || [];
    this.setCountInfo();
    return this.tagList;
  }
  async setTagList(list?: TagItem[]) {
    this.tagList = list || [];
    this.setCountInfo();
    storage.setItem(this.storageKey, this.tagList);
  }

  // 批量添加分类
  async addTags(tags: TagItem[]) {
    if (!tags?.length) return [];
    let tagList = await this.getTagList();
    for (let index = tags.length - 1; index >= 0; index--) {
      const tag = tags[index];
      tagList = this.addTabGroupsBasic(tagList, tag, tag.groupList);
    }

    await this.setTagList(tagList);
  }
  // 还原分类
  async recoverTag(tag: TagItem) {
    // 从回收站中删除
    const tagList = await this.getTagList();
    const tagIndex = tagList.findIndex((t) => t.tagId === tag.tagId);
    if (~tagIndex) {
      tagList.splice(tagIndex, 1);
    }
    await this.setTagList(tagList);
    await this.recoverTabGroups(tag, tag.groupList);
  }
  // 批量还原分类
  async recoverTags(tags: TagItem[]) {
    // 从回收站中删除
    let tagList = await this.getTagList();
    tagList = tagList.filter((t) => {
      return !tags.some((tag) => tag.tagId === t.tagId);
    });
    await this.setTagList(tagList);

    // 还原到标签列表（如果标签列表中有相同的标签组，则合并标签组）
    let storeTagList = await _listStoreUtils.getTagList();
    for (let index = tags.length - 1; index >= 0; index--) {
      const tag = tags[index];
      storeTagList = this.recoverTabGroupsBasic(storeTagList, tag, tag.groupList);
    }
    await _listStoreUtils.setTagList(storeTagList);
    return tagList;
  }
  // 全部还原
  async recoverAll() {
    let tagList = await this.getTagList();
    await this.recoverTags(tagList);
  }
  // 批量添加标签组（内部调用：多分类循环添加）
  addTabGroupsBasic(tagList: TagItem[], tag: TagItem, groups: GroupItem[]) {
    let isTagInRecycleBin = false;
    for (let t of tagList) {
      // 如果回收站中有相同的标签组，则合并标签组
      if (t.tagId === tag.tagId) {
        isTagInRecycleBin = true;
        for (let group of groups) {
          let isGroupInRecycleBin = false;
          for (let g of t.groupList) {
            if (g.groupId === group.groupId) {
              isGroupInRecycleBin = true;
              g.tabList = [...group.tabList, ...g.tabList];
              break;
            }
          }
          if (!isGroupInRecycleBin) {
            t.groupList.unshift({ ...group, isLocked: false, isStarred: false });
          }
        }
        break;
      }
    }
    // 如果回收站没有相同的分类，则直接添加新的分类
    if (!isTagInRecycleBin) {
      tagList.unshift({
        ...tag,
        groupList: groups.map((group) => ({
          ...group,
          isLocked: false,
          isStarred: false,
        })),
      });
    }

    return tagList;
  }
  // 批量添加标签组（外部调用：单分类添加）
  async addTabGroups(tag: TagItem, groups: GroupItem[]) {
    let tagList = await this.getTagList();
    tagList = this.addTabGroupsBasic(tagList, tag, groups);
    await this.setTagList(tagList);
    return tagList;
  }

  // 批量还原标签组（内部调用：多分类循环还原）
  recoverTabGroupsBasic(storeTagList: TagItem[], tag: TagItem, groups: GroupItem[]) {
    let isTagInListStore = false;
    for (let storeTag of storeTagList) {
      if (storeTag.tagId === tag.tagId) {
        isTagInListStore = true;
        for (let group of groups) {
          let isGroupInListStore = false;
          for (let storeGroup of storeTag.groupList) {
            if (storeGroup.groupId === group.groupId) {
              isGroupInListStore = true;
              storeGroup.tabList = [...group.tabList, ...storeGroup.tabList];
              break;
            }
          }
          if (!isGroupInListStore) {
            const unstarredIndex = storeTag.groupList.findIndex((g) => !g.isStarred);
            storeTag.groupList.splice(
              unstarredIndex > -1 ? unstarredIndex : storeTag.groupList.length,
              0,
              group
            );
          }
        }
        break;
      }
    }
    if (!isTagInListStore) {
      storeTagList.unshift({ ...tag, groupList: groups });
    }

    return storeTagList;
  }
  // 批量还原标签组（外部调用：单分类添加）
  async recoverTabGroups(tag: TagItem, groups: GroupItem[]) {
    // 从回收站中删除
    let tagList = await this.getTagList();
    for (let t of tagList) {
      if (t.tagId === tag.tagId) {
        t.groupList = t.groupList?.filter(
          (g) => !groups.some((group) => group.groupId === g.groupId)
        );
        break;
      }
    }
    tagList = tagList.filter((tag) => tag?.groupList?.length > 0);
    await this.setTagList(tagList);

    // 还原到标签列表（如果标签列表中有相同的标签组，则合并标签组）
    let storeTagList = await _listStoreUtils.getTagList();
    storeTagList = this.recoverTabGroupsBasic(storeTagList, tag, groups);
    await _listStoreUtils.setTagList(storeTagList);
    return tagList;
  }

  async addTabs(tag: TagItem, group: GroupItem, tabs: TabItem[]) {
    const tagList = await this.getTagList();
    let isTagInRecycleBin = false;
    let isGroupInRecycleBin = false;
    for (let t of tagList) {
      // 如果回收站中有相同的标签组，则合并标签组
      if (t.tagId === tag.tagId) {
        isTagInRecycleBin = true;
        for (let g of t.groupList) {
          if (g.groupId === group.groupId) {
            isGroupInRecycleBin = true;
            g.tabList = [...tabs, ...g.tabList];
            break;
          }
        }
        if (!isGroupInRecycleBin) {
          t.groupList.unshift({
            ...group,
            isLocked: false,
            isStarred: false,
            tabList: tabs,
          });
        }
        break;
      }
    }
    // 如果回收站没有相同的分类，则直接添加新的分类
    if (!isTagInRecycleBin) {
      const newGroup = { ...group, isLocked: false, isStarred: false, tabList: tabs };
      tagList.unshift({ ...tag, groupList: [newGroup] });
    }
    await this.setTagList(tagList);
    return tagList;
  }
}

_settingsUtils = new SettingsUtils();
_listStoreUtils = new TabListUtils();
_recycleBinUtils = new RecycleBinUtils();
export const settingsUtils = _settingsUtils;
export const recycleUtils = _recycleBinUtils;
export const tabListUtils = _listStoreUtils;
export const themeUtils = new ThemeUtils();

// 监听storage变化
export default function initStorageListener(callback: (settings: SettingsProps) => void) {
  storage.watch<SettingsProps>('local:settings', (settings) => {
    callback(settings || settingsUtils.initialSettings);
  });
}

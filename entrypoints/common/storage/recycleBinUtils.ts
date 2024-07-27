// import { storage } from 'wxt/storage';
import type { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';

import Store from './instanceStore';
import TabListUtils from './tabListUtils';

// 回收站工具类
export default class RecycleBinUtils extends TabListUtils {
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
    let storeTagList = await Store.tabListUtils.getTagList();
    for (let index = tags.length - 1; index >= 0; index--) {
      const tag = tags[index];
      storeTagList = this.recoverTabGroupsBasic(storeTagList, tag, tag.groupList);
    }
    await Store.tabListUtils.setTagList(storeTagList);
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
    let storeTagList = await Store.tabListUtils.getTagList();
    storeTagList = this.recoverTabGroupsBasic(storeTagList, tag, groups);
    await Store.tabListUtils.setTagList(storeTagList);
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

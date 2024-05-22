import { Key } from 'react';
import dayjs from 'dayjs';
import type {
  SettingsProps,
  TagItem,
  GroupItem,
  TabItem,
  CountInfo,
  ThemeProps,
} from '../types';
import { ENUM_COLORS, ENUM_SETTINGS_PROPS } from './constants';
import { getRandomId, omit } from './utils';

const {
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TAB,
  DELETE_AFTER_RESTORE,
} = ENUM_SETTINGS_PROPS;

// 设置工具类
class SettingsUtils {
  initialSettings = {
    [OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]: true, // 启动浏览器时是否自动打开管理后台
    [OPEN_ADMIN_TAB_AFTER_SEND_TABS]: true, // 发送标签页后默认打开管理后台
    [CLOSE_TABS_AFTER_SEND_TABS]: true, // 发送标签页后是否关闭标签页
    [AUTO_PIN_ADMIN_TAB]: true, // 是否固定管理后台
    [ALLOW_SEND_PINNED_TAB]: false, // 是否发送固定标签页
    [DELETE_AFTER_RESTORE]: true, // 恢复标签页/标签组时是否从列表中删除
  };
  async setSettings(settings: SettingsProps) {
    return await storage.setItem('local:settings', settings || this.initialSettings);
  }
  async getSettings() {
    const settings = await storage.getItem<SettingsProps>('local:settings', {
      defaultValue: this.initialSettings,
    });

    return settings || {};
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
  /* 分类相关方法 */
  getInitialTag(): TagItem {
    return {
      tagId: getRandomId(),
      tagName: '默认分类',
      groupList: [],
    };
  }
  async getTagList() {
    const tagList = await storage.getItem<TagItem[]>('local:tabList');
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
    storage.setItem('local:tabList', this.tagList);
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
    const tagList = this.tagList.filter((item) => item.tagId !== tagId);
    await this.setTagList(tagList);
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
      groupName: '默认标签组',
      createTime: dayjs().format('YYYY-MM-DD HH:mm'),
      tabList: [],
    };
  }
  async addTabGroup(tagId: Key, tabGroup?: GroupItem) {
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
  async updateTabGroup(tagId: Key, groupId: Key, group: Partial<GroupItem>) {
    const tagList = await this.getTagList();
    for (let tag of tagList) {
      if (tag.tagId === tagId) {
        for (let g of tag.groupList) {
          if (g.groupId === groupId) {
            Object.assign(g, group);
            break;
          }
        }
        break;
      }
    }
    await this.setTagList(tagList);
  }
  async removeTabGroup(tagId: Key, groupId: Key) {
    const tagList = await this.getTagList();
    for (let tag of tagList) {
      if (tag.tagId === tagId) {
        tag.groupList = tag.groupList.filter((g) => g.groupId !== groupId);
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

  /* 标签相关方法 */
  async addTabs(tabs: TabItem[], createNewGroup = false) {
    await this.getTagList();
    let tag0 = this.tagList?.[0];
    const group = tag0?.groupList?.find((group) => !group.isLocked && !group.isStarred);
    if (!createNewGroup && group) {
      group.tabList = [...tabs, ...(group?.tabList || [])];
      await this.setTagList([tag0, ...this.tagList.slice(1)]);
      return { tagId: tag0.tagId, groupId: group.groupId };
    }
    // 不存在标签组或者createNewGroup=true，就创建一个新标签组
    const newtabGroup = this.getInitialTabGroup();
    newtabGroup.tabList = [...tabs];

    if (tag0) {
      const index = tag0.groupList.findIndex((g) => !g.isStarred);
      tag0.groupList.splice(index > -1 ? index : tag0.groupList.length, 0, newtabGroup);
      await this.setTagList([tag0, ...this.tagList.slice(1)]);
      return { tagId: tag0.tagId, groupId: newtabGroup.groupId };
    }

    // 不存在tag分类，就创建一个新的tag
    const tag = this.getInitialTag();
    tag.groupList = [newtabGroup];
    await this.setTagList([tag]);
    return { tagId: tag.tagId, groupId: newtabGroup.groupId };
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
      for (let tag of tagList) {
        let tmp = null,
          sourceGroupIndex = 0,
          targetGroupIndex = tag.groupList.length - 1;

        for (let gIndex = 0; gIndex < tag.groupList.length; gIndex++) {
          const group = tag.groupList[gIndex];
          if (group.groupId === sourceGroupId) {
            tmp = group.tabList?.[sourceIndex];
            sourceGroupIndex = gIndex;
            group.tabList.splice(sourceIndex, 1);
          } else if (group.groupId === targetGroupId) {
            targetGroupIndex = gIndex;
          }
        }
        tmp && tag.groupList?.[targetGroupIndex]?.tabList?.splice(targetIndex, 0, tmp);
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
                ['groupId']
              );
            }) || [],
        },
        ['tagId']
      );
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

export const settingsUtils = new SettingsUtils();
export const tabListUtils = new TabListUtils();
export const themeUtils = new ThemeUtils();

// 监听storage变化
export default function initStorageListener(callback: (settings: SettingsProps) => void) {
  storage.watch<SettingsProps>('local:settings', (settings) => {
    callback(settings || settingsUtils.initialSettings);
  });
}

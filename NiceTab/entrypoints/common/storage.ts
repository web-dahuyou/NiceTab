import { Key } from 'react';
import dayjs from 'dayjs';
import type { SettingsProps, TagItem, GroupItem, TabItem } from '../types';
import { ENUM_SETTINGS_PROPS } from './constants';
import { getRandomId } from './utils';

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
  /* 分类相关方法 */
  getInitialTag(): TagItem {
    return {
      tagId: getRandomId(),
      tagName: '未命名分类',
      groupList: [this.getInitialTabGroup()],
    }
  }
  async getTagList() {
    const tagList = await storage.getItem<TagItem[]>('local:tabList');
    this.tagList = tagList || [this.getInitialTag()];
    if (!tagList) {
      this.setTagList(this.tagList);
    }
    return this.tagList;
  }
  async setTagList(list?: TagItem[]) {
    this.tagList = list || [this.getInitialTag()];
    await storage.setItem('local:tabList', this.tagList);
  }
  async addTag(tag?: TagItem) {
    await this.getTagList();
    const newTag = Object.assign(this.getInitialTag(), tag || {});
    this.setTagList([newTag, ...this.tagList]);
  }
  async updateTag(tagId: Key, tag: Partial<TagItem>) {
    await this.getTagList();
    const tagList = this.tagList.map(item => {
      if (item.tagId === tagId) {
        return {...item, ...tag};
      } else {
        return item;
      }
    });

    this.setTagList(tagList);
  }
  async removeTag(tagId: Key) {
    await this.getTagList();
    const tagList = this.tagList.filter(item => item.tagId !== tagId);
    this.setTagList(tagList);
  }

  /* 标签组相关方法 */
  getInitialTabGroup(): GroupItem {
    return {
      groupId: getRandomId(),
      groupName: '未命名标签组',
      createTime: dayjs().format('YYYY-MM-DD HH:mm'),
      tabList: []
    };
  }
  async addTabGroup(tagId: Key, tabGroup?: GroupItem) {
    await this.getTagList();
    const tagList = this.tagList.map(tag => {
      if (tag.tagId === tagId) {
        return {
          ...tag,
          groupList: [
            tabGroup || this.getInitialTabGroup(),
            ...tag.groupList
          ],
        }
      } else {
        return tag;
      }
    });
    this.setTagList(tagList);
  }
  async updateTabGroup(tagId: Key, groupId: Key, group: Partial<GroupItem>) {
    await this.getTagList();
    const tagList = this.tagList.map(tag => {
      if (tag.tagId === tagId) {
        return {
          ...tag,
          groupList: tag.groupList.map(g => {
            if (g.groupId === groupId) {
              return {
                ...g,
                ...group
              }
            } else {
              return g;
            }
          })
        }
      } else {
        return tag;
      }
    });
    this.setTagList(tagList);
  }
  async removeTabGroup(tagId: Key, groupId: Key) {
    await this.getTagList();
    const tagList = this.tagList.map(tag => {
      if (tag.tagId === tagId) {
        return {
          ...tag,
          groupList: tag.groupList.filter(g => g.groupId !== groupId)
        }
      } else {
        return tag;
      }
    });
    this.setTagList(tagList);
  }

  /* 标签相关方法 */
  async addTabs(tabs: TabItem[], createNewGroup = false) {
    await this.getTagList();
    let tag0 = this.tagList[0];
    const group0 = this.tagList[0]?.groupList?.[0];
    if (!createNewGroup && group0) {
      tag0.groupList[0].tabList = [...tabs, ...(group0?.tabList || [])];
      this.setTagList([tag0, ...this.tagList.slice(1)]);
      return;
    }
    // 不存在标签组或者createNewGroup=tue，就创建一个新标签组
    const newtabGroup = this.getInitialTabGroup();
    newtabGroup.tabList = [...tabs];

    if (tag0) {
      tag0.groupList = createNewGroup ? [newtabGroup, ...tag0.groupList] : [newtabGroup];
      this.setTagList([tag0, ...this.tagList.slice(1)]);
      return;
    }

    // 不存在tag分类，就创建一个新的tag
    const tag = this.getInitialTag();
    tag.groupList = [newtabGroup];
    this.setTagList([tag]);
  }
}

export const settingsUtils = new SettingsUtils();
export const tabListUtils = new TabListUtils();

// 监听storage变化
export default function initStorageListener(callback: (settings: SettingsProps) => void) {
  storage.watch<SettingsProps>('local:settings', (settings) => {
    callback(settings || settingsUtils.initialSettings);
  });
}

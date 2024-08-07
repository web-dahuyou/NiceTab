// import { storage } from 'wxt/storage';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS, defaultLanguage } from '../constants';

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

// 设置工具类
export default class SettingsUtils {
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

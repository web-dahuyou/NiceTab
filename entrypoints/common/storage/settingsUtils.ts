// import { storage } from 'wxt/storage';
import type { LanguageTypes, SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS, defaultLanguage, defaultThemeType } from '../constants';

const {
  LANGUAGE,
  THEME_TYPE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TABS,
  RESTORE_IN_NEW_WINDOW,
  DELETE_AFTER_RESTORE,
  DELETE_UNLOCKED_EMPTY_GROUP,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
  LINK_TEMPLATE,
  TAB_COUNT_THRESHOLD,
  SHOW_OPENED_TAB_COUNT,
  SHOW_PAGE_CONTEXT_MENUS,
} = ENUM_SETTINGS_PROPS;

// 设置工具类
export default class SettingsUtils {
  initialSettings = {
    [LANGUAGE]: defaultLanguage,
    [THEME_TYPE]: defaultThemeType,
    [OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]: true, // 启动浏览器时是否自动打开管理后台
    [OPEN_ADMIN_TAB_AFTER_SEND_TABS]: true, // 发送标签页后默认打开管理后台
    [CLOSE_TABS_AFTER_SEND_TABS]: true, // 发送标签页后是否关闭标签页
    [AUTO_PIN_ADMIN_TAB]: true, // 是否固定管理后台
    [ALLOW_SEND_PINNED_TABS]: false, // 是否发送固定标签页
    [RESTORE_IN_NEW_WINDOW]: false, // 是否在新窗口打开标签组
    [DELETE_AFTER_RESTORE]: false, // 恢复标签页/标签组时是否从列表中删除
    [DELETE_UNLOCKED_EMPTY_GROUP]: true, // 是否删除未锁定的空标签组
    [ALLOW_DUPLICATE_TABS]: true, // 同一个标签组中是否允许重复的标签页
    [ALLOW_DUPLICATE_GROUPS]: true, // 同一个分类中是否允许重复的标签组
    [LINK_TEMPLATE]: '{{url}} | {{title}}', // 复制的链接模板

    [TAB_COUNT_THRESHOLD]: 300, // 分类中标签页超过该数量时，则右侧面板开启虚拟滚动
    [SHOW_OPENED_TAB_COUNT]: true, // 扩展图标上是否显示打开的标签页数量
    [SHOW_PAGE_CONTEXT_MENUS]: true, // 网页中是否显示NiceTab右键菜单
  };
  settings: SettingsProps = this.initialSettings;

  async setSettings(settings: SettingsProps) {
    this.settings = { ...this.initialSettings, ...settings };
    return await storage.setItem('local:settings', this.settings);
  }
  async getSettings() {
    const settings = await storage.getItem<SettingsProps>('local:settings');
    const _savedBefore = !!settings;
    this.settings = {
      ...this.initialSettings,
      language: (navigator?.language as LanguageTypes) || defaultLanguage,
      ...settings,
    };
    if (!_savedBefore) {
      this.setSettings(this.settings);
    }
    return this.settings;
  }
}

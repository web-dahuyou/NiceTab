// import { storage } from 'wxt/storage';
import type { LanguageTypes, SettingsProps, PageWidthTypes } from '~/entrypoints/types';
import {
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
  defaultLanguage,
  defaultThemeType,
  DEFAULT_EXCLUDE_DOMAINS,
  defaultAutoSyncType,
} from '../constants';

const {
  LANGUAGE,
  THEME_TYPE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  SHOW_SEND_TARGET_MODAL,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  ALLOW_SEND_PINNED_TABS,
  EXCLUDE_DOMAINS_FOR_SENDING,
  CLOSE_TABS_AFTER_SEND_TABS,
  ACTION_AUTO_CLOSE_FLAGS,
  AUTO_PIN_ADMIN_TAB,
  RESTORE_IN_NEW_WINDOW,
  DELETE_AFTER_RESTORE,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
  SILENT_OPEN_TAB_MODIFIER_KEY,
  OPEN_TAB_MODIFIER_KEY,
  DELETE_UNLOCKED_EMPTY_GROUP,
  CONFIRM_BEFORE_DELETING_TABS,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
  LINK_TEMPLATE,
  TAB_COUNT_THRESHOLD,
  SHOW_OPENED_TAB_COUNT,
  SHOW_PAGE_CONTEXT_MENUS,
  POPUP_MODULE_DISPLAYS,
  AUTO_EXPAND_HOME_TREE,
  MAIN_CONTENT_WIDTH_TYPE,
  AUTO_SYNC,
  AUTO_SYNC_INTERVAL,
  AUTO_SYNC_TYPE,
} = ENUM_SETTINGS_PROPS;

// 设置工具类
export default class SettingsUtils {
  initialSettings = {
    [LANGUAGE]: defaultLanguage,
    [THEME_TYPE]: defaultThemeType,
    [OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]: true, // 启动浏览器时是否自动打开管理后台
    [AUTO_PIN_ADMIN_TAB]: true, // 是否固定管理后台
    [SHOW_SEND_TARGET_MODAL]: false, // 发送标签页时是否显示目标选择弹窗
    [OPEN_ADMIN_TAB_AFTER_SEND_TABS]: true, // 发送标签页后默认打开管理后台
    [ALLOW_SEND_PINNED_TABS]: false, // 是否发送固定标签页
    [EXCLUDE_DOMAINS_FOR_SENDING]: DEFAULT_EXCLUDE_DOMAINS.join('\n'), // 发送标签页时排除的域名
    [CLOSE_TABS_AFTER_SEND_TABS]: true, // 发送标签页后是否关闭标签页
    [ACTION_AUTO_CLOSE_FLAGS]: [], // 各种操作的自动关闭标签页标志
    [RESTORE_IN_NEW_WINDOW]: false, // 是否在新窗口打开标签组
    [DELETE_AFTER_RESTORE]: false, // 恢复标签页/标签组时是否从列表中删除
    [UNNAMED_GROUP_RESTORE_AS_GROUP]: true, // 是否以标签组形式恢复未命名标签组
    [NAMED_GROUP_RESTORE_AS_GROUP]: true, // 是否以标签组形式恢复已命名标签组
    [SILENT_OPEN_TAB_MODIFIER_KEY]: 'alt', // 静默打开标签页的修饰键
    [OPEN_TAB_MODIFIER_KEY]: '', // 前台打开标签页的修饰键
    [DELETE_UNLOCKED_EMPTY_GROUP]: true, // 是否删除未锁定的空标签组
    [CONFIRM_BEFORE_DELETING_TABS]: false, // 删除标签页前是否需要确认
    [ALLOW_DUPLICATE_TABS]: true, // 同一个标签组中是否允许重复的标签页
    [ALLOW_DUPLICATE_GROUPS]: true, // 同一个分类中是否允许重复的标签组
    [LINK_TEMPLATE]: '{{url}} | {{title}}', // 复制的链接模板

    [TAB_COUNT_THRESHOLD]: 300, // 分类中标签页超过该数量时，则右侧面板开启虚拟滚动
    [SHOW_OPENED_TAB_COUNT]: true, // 扩展图标上是否显示打开的标签页数量
    [SHOW_PAGE_CONTEXT_MENUS]: true, // 网页中是否显示NiceTab右键菜单
    [POPUP_MODULE_DISPLAYS]: POPUP_MODULE_NAMES, // popup面板中需要展示的模块
    [AUTO_EXPAND_HOME_TREE]: false, // 进入列表页时，是否自动展开全部节点
    [MAIN_CONTENT_WIDTH_TYPE]: 'fixed' as PageWidthTypes, // 主内容区域宽度类型

    [AUTO_SYNC]: false, // 是否开启自动同步
    [AUTO_SYNC_INTERVAL]: 30, // 自动同步间隔时间
    [AUTO_SYNC_TYPE]: defaultAutoSyncType, // 自动同步方式
  };
  storageKey: `local:${string}` = 'local:settings';
  settings: SettingsProps = this.initialSettings;

  async setSettings(settings: SettingsProps) {
    this.settings = { ...this.initialSettings, ...settings };
    return await storage.setItem(this.storageKey, this.settings);
  }
  async getSettings() {
    const settings = await storage.getItem<SettingsProps>(this.storageKey);
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

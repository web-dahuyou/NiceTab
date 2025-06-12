// import { storage } from 'wxt/storage';
import type {
  LanguageTypes,
  SettingsProps,
  PageWidthTypes,
  ActionBtnStyle,
  InsertPositions,
} from '~/entrypoints/types';
import {
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
  defaultLanguage,
  defaultThemeType,
  DEFAULT_EXCLUDE_DOMAINS,
  defaultAutoSyncType,
} from '../constants';
import { defaultGroupActions } from '~/entrypoints/options/home/constants';

const {
  LANGUAGE,
  THEME_TYPE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED,
  AUTO_PIN_ADMIN_TAB,
  /* 发送标签页配置 */
  SHOW_SEND_TARGET_MODAL,
  ALLOW_SEND_PINNED_TABS,
  EXCLUDE_DOMAINS_FOR_SENDING,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  ACTION_AUTO_CLOSE_FLAGS,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
  /* 打开标签页配置 */
  RESTORE_IN_NEW_WINDOW,
  DELETE_AFTER_RESTORE,
  SILENT_OPEN_TAB_MODIFIER_KEY,
  OPEN_TAB_MODIFIER_KEY,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
  /* 全局搜索配置 */
  GLOBAL_SEARCH_DELETE_AFTER_OPEN,
  /* 其他操作配置 */
  DELETE_UNLOCKED_EMPTY_GROUP,
  CONFIRM_BEFORE_DELETING_TABS,
  LINK_TEMPLATE,
  TAB_COUNT_THRESHOLD,
  GROUP_INSERT_POSITION,
  TAB_INSERT_POSITION,
  /* 展示配置 */
  GROUP_ACTION_BTN_STYLE,
  GROUP_ACTION_BTNS_COMMONLY_USED,
  SHOW_OPENED_TAB_COUNT,
  SHOW_PAGE_CONTEXT_MENUS,
  POPUP_MODULE_DISPLAYS,
  AUTO_EXPAND_HOME_TREE,
  MAIN_CONTENT_WIDTH_TYPE,
  SHOW_TAB_TITLE_TOOLTIP,
  /* 自动同步配置 */
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
    [OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED]: false, // 新开window窗口时是否自动打开管理后台
    [AUTO_PIN_ADMIN_TAB]: true, // 是否固定管理后台
    /* 发送标签页配置 */
    [SHOW_SEND_TARGET_MODAL]: false, // 发送标签页时是否显示目标选择弹窗
    [ALLOW_SEND_PINNED_TABS]: false, // 是否发送固定标签页
    [EXCLUDE_DOMAINS_FOR_SENDING]: DEFAULT_EXCLUDE_DOMAINS.join('\n'), // 发送标签页时排除的域名
    [OPEN_ADMIN_TAB_AFTER_SEND_TABS]: true, // 发送标签页后默认打开管理后台
    [CLOSE_TABS_AFTER_SEND_TABS]: true, // 发送标签页后是否关闭标签页
    [ACTION_AUTO_CLOSE_FLAGS]: [], // 各种操作的自动关闭标签页标志
    [ALLOW_DUPLICATE_TABS]: true, // 同一个标签组中是否允许重复的标签页
    [ALLOW_DUPLICATE_GROUPS]: true, // 同一个分类中是否允许重复的标签组
    /* 打开标签页配置 */
    [RESTORE_IN_NEW_WINDOW]: false, // 是否在新窗口打开标签组
    [DELETE_AFTER_RESTORE]: false, // 恢复标签页/标签组时是否从列表中删除
    [SILENT_OPEN_TAB_MODIFIER_KEY]: 'alt', // 静默打开标签页的修饰键
    [OPEN_TAB_MODIFIER_KEY]: '', // 前台打开标签页的修饰键
    [UNNAMED_GROUP_RESTORE_AS_GROUP]: import.meta.env.FIREFOX ? false : true, // 是否以标签组形式恢复未命名标签组
    [NAMED_GROUP_RESTORE_AS_GROUP]: import.meta.env.FIREFOX ? false : true, // 是否以标签组形式恢复已命名标签组
    /* 全局搜索配置 */
    [GLOBAL_SEARCH_DELETE_AFTER_OPEN]: false, // 全局搜索打开标签页后是否从列表中删除
    /* 其他操作配置 */
    [DELETE_UNLOCKED_EMPTY_GROUP]: true, // 是否删除未锁定的空标签组
    [CONFIRM_BEFORE_DELETING_TABS]: false, // 删除标签页前是否需要确认
    [LINK_TEMPLATE]: '{{url}} | {{title}}', // 复制的链接模板
    [TAB_COUNT_THRESHOLD]: 100, // 分类中标签页超过该数量时，则右侧面板开启虚拟滚动
    [GROUP_INSERT_POSITION]: 'top' as InsertPositions, // 标签组插入位置：在分类的标签组列表顶部还是底部
    [TAB_INSERT_POSITION]: 'bottom' as InsertPositions, // 标签页插入位置：在标签组的标签页列表顶部还是底部
    /* 展示配置 */
    [GROUP_ACTION_BTN_STYLE]: 'text' as ActionBtnStyle, // 操作按钮样式
    [GROUP_ACTION_BTNS_COMMONLY_USED]: defaultGroupActions, // 常用的标签组操作按钮
    [SHOW_OPENED_TAB_COUNT]: true, // 扩展图标上是否显示打开的标签页数量
    [SHOW_PAGE_CONTEXT_MENUS]: true, // 网页中是否显示NiceTab右键菜单
    [POPUP_MODULE_DISPLAYS]: POPUP_MODULE_NAMES, // popup面板中需要展示的模块
    [AUTO_EXPAND_HOME_TREE]: false, // 进入列表页时，是否自动展开全部节点
    [MAIN_CONTENT_WIDTH_TYPE]: 'fixed' as PageWidthTypes, // 主内容区域宽度类型
    [SHOW_TAB_TITLE_TOOLTIP]: false, // 是否显示标签页标题的tooltip
    /* 自动同步配置 */
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

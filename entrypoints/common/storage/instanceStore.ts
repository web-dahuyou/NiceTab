import SettingsUtils from './settingsUtils';
import ThemeUtils from './themeUtils';
import TabListUtils from './tabListUtils';
import RecycleBinUtils from './recycleBinUtils';
import SyncUtils from './syncUtils';

let _settingsUtils: SettingsUtils;
let _themeUtils: ThemeUtils;
let _tabListUtils: TabListUtils;
let _recycleBinUtils: RecycleBinUtils;
let _syncUtils: SyncUtils;

export default class Store {
  static get settingsUtils() {
    return _settingsUtils;
  }
  static get themeUtils() {
    return _themeUtils;
  }
  static get tabListUtils() {
    return _tabListUtils;
  }
  static get recycleBinUtils() {
    return _recycleBinUtils;
  }
  static get syncUtils() {
    return _syncUtils;
  }

  static set settingsUtils(utils: SettingsUtils) {
    _settingsUtils = utils;
  }
  static set themeUtils(utils: ThemeUtils) {
    _themeUtils = utils;
  }
  static set tabListUtils(utils: TabListUtils) {
    _tabListUtils = utils;
  }
  static set recycleBinUtils(utils: RecycleBinUtils) {
    _recycleBinUtils = utils;
  }
  static set syncUtils(utils: SyncUtils) {
    _syncUtils = utils;
  }
}
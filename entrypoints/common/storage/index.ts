import type { SettingsProps } from '~/entrypoints/types';

import Store from './instanceStore';
import SettingsUtils from './settingsUtils';
import ThemeUtils from './themeUtils';
import TabListUtils from './tabListUtils';
import RecycleBinUtils from './recycleBinUtils';
import SyncUtils from './syncUtils';
import SyncWebDAVUtils from './syncWebDAVUtils';
import StateUtils from './stateUtils';

Store.settingsUtils = new SettingsUtils();
Store.themeUtils = new ThemeUtils();
Store.tabListUtils = new TabListUtils();
Store.recycleBinUtils = new RecycleBinUtils();
Store.syncUtils = new SyncUtils();
Store.syncWebDAVUtils = new SyncWebDAVUtils();
Store.stateUtils = new StateUtils();

export const settingsUtils = Store.settingsUtils;
export const themeUtils = Store.themeUtils;
export const tabListUtils = Store.tabListUtils;
export const recycleUtils = Store.recycleBinUtils;
export const syncUtils = Store.syncUtils;
export const syncWebDAVUtils = Store.syncWebDAVUtils;
export const stateUtils = Store.stateUtils;

// 监听storage变化
export default function initStorageListener(callback: (settings: SettingsProps) => void) {
  storage.watch<SettingsProps>('local:settings', (settings) => {
    callback(settings || settingsUtils.initialSettings);
  });
}

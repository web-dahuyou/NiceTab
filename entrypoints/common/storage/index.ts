import type { SettingsProps, TagItem } from '~/entrypoints/types';

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

// 监听settings storage变化
export default function initSettingsStorageListener(
  callback: (settings: SettingsProps, oldSettings: SettingsProps) => void
) {
  return storage.watch<SettingsProps>(
    settingsUtils.storageKey,
    (settings, oldSettings) => {
      callback(
        settings || settingsUtils.initialSettings,
        oldSettings || settingsUtils.initialSettings
      );
    }
  );
}

// 监听tabList storage变化
export function initTabListStorageListener(callback: (tabList: TagItem[]) => void) {
  return storage.watch<TagItem[]>(tabListUtils.storageKey, (tabList) => {
    callback(tabList || []);
  });
}

// 监听回收站 storage变化
export function initRecycleStorageListener(callback: (tabList: TagItem[]) => void) {
  return storage.watch<TagItem[]>(recycleUtils.storageKey, (tabList) => {
    callback(tabList || []);
  });
}

// 监听gists sync storage变化
export function initSyncGistsStorageListener(callback: () => void) {
  const configUnwatch = storage.watch(syncUtils.storageConfigKey, () => {
    callback();
  });
  const resultUnwatch = storage.watch(syncUtils.storageResultKey, () => {
    callback();
  });
  const statusUnwatch = storage.watch(syncUtils.storageStatusKey, () => {
    callback();
  });

  return () => {
    configUnwatch();
    resultUnwatch();
    statusUnwatch();
  };
}

// 监听webdav sync storage变化
export function initSyncWebdavStorageListener(callback: () => void) {
  return storage.watch(syncWebDAVUtils.storageConfigKey, () => {
    callback();
  });
}

// 监听gists 和 webdav sync storage变化
export function initSyncStorageListener(callback: () => void) {
  const gistsUnwatch = initSyncGistsStorageListener(callback);
  const webdavUnwatch = initSyncWebdavStorageListener(callback);

  return () => {
    gistsUnwatch();
    webdavUnwatch();
  }
}

// 监听state storage变化
export function initStateStorageListener(callback: () => void) {
  return storage.watch(stateUtils.storageKey, () => {
    callback();
  });
}

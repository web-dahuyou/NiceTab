import dayjs from 'dayjs';
import { AuthType, createClient } from 'webdav';
import type { WebDAVClient, FileStat } from 'webdav';
import type {
  SyncConfigWebDAVProps,
  SyncResultItemProps,
  SyncStatus,
  SyncType,
  SyncConfigItemWebDAVProps,
} from '~/entrypoints/types';
import { eventEmitter } from '~/entrypoints/common/hooks/global';
import {
  extContentImporter,
  getRandomId,
  sendRuntimeMessage,
  sanitizeContent,
  omit,
} from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import {
  FETCH_ERROR,
  fetchErrorMessageOptions,
  SUCCESS_KEY,
  FAILED_KEY,
  syncTypeMap,
  defaultLanguage,
  syncExcludedSettingsProps,
} from '~/entrypoints/common/constants';
import { getCreatedIntl } from '~/entrypoints/common/locale';
import Store from './instanceStore';

type ModuleType = 'tabList' | 'settings';

// 通用超时包装方法
async function withTimeout<T>(
  promise: (signal: AbortSignal) => Promise<T>,
  timeout = 10000
): Promise<T> {
  const controller = new AbortController();

  return Promise.race([
    promise(controller.signal),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error(FETCH_ERROR.TIMEOUT));
      }, timeout);
    }),
  ]);
}

export default class syncWebDAVUtils {
  storageConfigKey: `local:${string}` = 'local:syncWevDAVConfig';
  initialConfig: SyncConfigWebDAVProps = {
    configList: [],
  };
  config = this.initialConfig;

  webDAVDirectory: string = '/__NiceTab_web_dav__';
  webDAVFilename: string = '__NiceTab_web_dav__.json';
  fileNameConfig: Record<ModuleType, string> = {
    tabList: '__NiceTab_web_dav__.json',
    settings: '__NiceTab_settings_web_dav__.json',
  };

  constructor() {
    this.getConfig();
  }

  async getConfig() {
    let config = await storage.getItem<SyncConfigWebDAVProps>(this.storageConfigKey);
    this.config = { ...this.initialConfig, ...config };
    return { ...this.initialConfig, ...config };
  }
  getConfigItem(key: string) {
    return this.config?.configList?.find((item) => item.key === key);
  }
  async setConfig(config: SyncConfigWebDAVProps) {
    this.config = { ...this.initialConfig, ...config };
    return await storage.setItem<SyncConfigWebDAVProps>(
      this.storageConfigKey,
      this.config
    );
  }
  createConfigItem(configItem?: SyncConfigItemWebDAVProps) {
    return {
      key: `webdav_${getRandomId()}`,
      label: '',
      webdavConnectionUrl: '',
      username: '',
      password: '',
      ...configItem,
      syncStatus: 'idle' as SyncStatus,
      syncResult: [],
    };
  }
  async addConfigItem(configItem?: SyncConfigItemWebDAVProps) {
    this.config.configList?.push(this.createConfigItem(configItem));
    return await this.setConfig(this.config);
  }

  async setSyncStatus(key: string, status: SyncStatus) {
    const index = this.config.configList?.findIndex((item) => item.key === key);
    if (index < 0) return;
    this.config.configList[index] = {
      ...this.config.configList?.[index],
      syncStatus: status,
    };
    await this.setConfig(this.config);
    eventEmitter.emit('sync:sync-status-change--webdav', { key, status });
    sendRuntimeMessage({
      msgType: 'sync:sync-status-change--webdav',
      data: {
        key,
        status,
      },
      targetPageContexts: ['optionsPage'],
    });
  }
  async addSyncResult(key: string, resultItem: SyncResultItemProps) {
    const config = await this.getConfig();
    for (let item of config.configList) {
      if (item.key !== key) continue;
      (item.syncResult = item.syncResult || []).unshift(resultItem);
      // 最多保留 50 条
      item.syncResult = item.syncResult.slice(0, 50);
      break;
    }
    return await this.setConfig(this.config);
  }
  async clearSyncResult(key: string) {
    for (let item of this.config.configList) {
      if (item.key !== key) continue;
      item.syncResult = [];
      break;
    }
    return await this.setConfig(this.config);
  }

  // 处理同步结果并保存
  async handleSyncResult(
    key: string,
    syncType: SyncType,
    result: boolean,
    reason?: string
  ) {
    const syncTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    await this.addSyncResult(key, {
      syncType,
      syncTime,
      syncResult: result ? SUCCESS_KEY : FAILED_KEY,
      reason,
    });
  }

  // 格式化错误信息
  formatErrorMsg(error: Error, createdIntl: ReturnType<typeof getCreatedIntl>) {
    let errorMsg = error.message;
    if (error?.name === 'AbortError') {
      errorMsg = FETCH_ERROR.ABORTED;
    } else if (
      error?.name === 'TypeError' &&
      (error?.message === 'Failed to fetch' || error?.message?.includes('NetworkError'))
    ) {
      errorMsg = FETCH_ERROR.NETWORK_ERROR;
    }

    const messageItem = fetchErrorMessageOptions.find((item) => errorMsg === item.type);
    if (messageItem?.messageId) {
      return createdIntl.formatMessage({ id: messageItem.messageId });
    }
    return (
      error.message ||
      createdIntl.formatMessage(
        { id: `common.actionFailed` },
        { action: createdIntl.formatMessage({ id: 'common.sync' }) }
      )
    );
  }

  // 递归处理, webdav 自带的 exists 方法直接判断虽然不影响功能, 但是请求会报错
  async recursiveHandler(
    path: string,
    handler: (pre: string, curr: string) => Promise<boolean>
  ) {
    const pathList = path.split('/').filter(Boolean);
    let _path = '/';
    for (let i = 0; i < pathList.length; i++) {
      const result = await handler(_path, pathList[i]);
      if (!result) return false;
      _path += `${pathList[i]}/`;
    }
    return true;
  }

  // // 递归判断目录是否存在
  // async isDirExists(client: WebDAVClient, dir: string) {
  //   return this.recursiveHandler(dir, async (pre, curr) => {
  //     const contentList = (await withTimeout(
  //       client.getDirectoryContents(pre)
  //     )) as FileStat[];
  //     return contentList.some(
  //       (item) => item.type === 'directory' && item.basename === curr
  //     );
  //   });
  // }

  // // 判断文件是否存在
  // async isFileExists(client: WebDAVClient, dir: string, filename: string) {
  //   const isDirExists = await this.isDirExists(client, dir);
  //   if (!isDirExists) return false;
  //   const contentList = (await withTimeout(
  //     client.getDirectoryContents(dir)
  //   )) as FileStat[];
  //   return contentList.some((item) => item.type === 'file' && item.basename === filename);
  // }

  // 自己实现的创建目录
  // 强迫症, 请求不存在的资源时会报错, 虽然 webdav client catch 了这个错误, 但是错误请求真实发生了. 所以自己递归处理
  async createDirectory(client: WebDAVClient, dir: string) {
    return this.recursiveHandler(dir, async (pre, curr) => {
      try {
        const contentList = (await withTimeout((signal: AbortSignal) =>
          client.getDirectoryContents(pre, { signal })
        )) as FileStat[];
        const isDirExists = contentList.some(
          (item) => item.type === 'directory' && item.basename === curr
        );
        if (isDirExists) return true;
        await withTimeout((signal: AbortSignal) =>
          client.createDirectory(pre + curr, { signal })
        );
        return true;
      } catch (error) {
        await withTimeout((signal: AbortSignal) =>
          client.createDirectory(pre + curr, { signal })
        );
        return true;
      }
    });
  }

  // 获取需要同步的内容
  async getSyncContent() {
    const tagList = await Store.tabListUtils.exportTags();
    let content = '[]';
    try {
      content = JSON.stringify(tagList);
    } catch (error) {
      console.error(error);
    }

    // 将emoji标签给过滤掉
    content = sanitizeContent(content) || '[]';
    return content;
  }

  getRemoteFilepath(moduleType: ModuleType) {
    const fileName = this.fileNameConfig[moduleType];
    return `${this.webDAVDirectory?.replace(/\/$/, '') || ''}/${fileName}`;
  }

  // 根据syncType执行不同的操作
  async handleBySyncType(
    client: WebDAVClient,
    configItem: SyncConfigItemWebDAVProps,
    syncType: SyncType
  ) {
    const filepath = this.getRemoteFilepath('tabList');
    const settingsFilepath = this.getRemoteFilepath('settings');

    if (
      syncType === syncTypeMap.MANUAL_PUSH_FORCE ||
      syncType === syncTypeMap.AUTO_PUSH_FORCE
    ) {
      const localContent = await this.getSyncContent();
      const result = await withTimeout((signal: AbortSignal) =>
        client.putFileContents(filepath, localContent, { signal })
      );
      await this.handleSyncResult(configItem.key, syncType, result);
      // 同步设置信息失败单独catch, 不影响列表的同步
      const localSettings = await Store.settingsUtils.getSettings();
      const settingsContent = JSON.stringify(localSettings);
      await withTimeout((signal: AbortSignal) =>
        client.putFileContents(settingsFilepath, settingsContent, { signal })
      );
      return;
    }

    let remoteFileContent = '';
    const isFileExists = await withTimeout(() => client.exists(filepath));
    if (isFileExists) {
      remoteFileContent = (await withTimeout((signal: AbortSignal) =>
        client.getFileContents(filepath, {
          format: 'text',
          signal,
        })
      )) as string;
    }

    if (
      !!remoteFileContent &&
      (syncType === syncTypeMap.MANUAL_PULL_FORCE ||
        syncType === syncTypeMap.AUTO_PULL_FORCE)
    ) {
      await Store.tabListUtils.clearAll();
    }

    // 同步设置信息（重要性比较低）
    let remoteSettingsContent = '';
    const isSettingsFileExists = await withTimeout(() => client.exists(settingsFilepath));
    if (isSettingsFileExists) {
      remoteSettingsContent = (await withTimeout((signal: AbortSignal) =>
        client.getFileContents(settingsFilepath, {
          format: 'text',
          signal,
        })
      )) as string;
    }

    if (!!remoteSettingsContent) {
      try {
        let settings = JSON.parse(remoteSettingsContent);
        if (
          syncType === syncTypeMap.MANUAL_PUSH_MERGE ||
          syncType === syncTypeMap.AUTO_PUSH_MERGE
        ) {
          const localSettings = await Store.settingsUtils.getSettings();
          settings = {
            ...localSettings,
            // 自动同步相关配置，本地优先级高于远程（防止其他设备的设置覆盖本地的配置）
            ...omit(settings, syncExcludedSettingsProps),
          };
          await withTimeout((signal: AbortSignal) =>
            client.putFileContents(settingsFilepath, JSON.stringify(settings), { signal })
          );
        }
        await Store.settingsUtils.setSettings(settings);
        sendRuntimeMessage({ msgType: 'setLocale', data: { locale: settings.language } });
      } catch (error) {
        console.error(error);
      }
    }

    const tagList = extContentImporter.niceTab(remoteFileContent || '');
    await Store.tabListUtils.importTags(tagList, 'merge');
    if (
      syncType === syncTypeMap.MANUAL_PUSH_MERGE ||
      syncType === syncTypeMap.AUTO_PUSH_MERGE
    ) {
      const localContent = await this.getSyncContent();
      const result = await withTimeout((signal: AbortSignal) =>
        client.putFileContents(filepath, localContent, { signal })
      );
      await this.handleSyncResult(configItem.key, syncType, result);
    } else {
      await this.handleSyncResult(configItem.key, syncType, true);
    }

    reloadOtherAdminPage();
  }

  // 开始同步入口
  async syncStart(configItem: SyncConfigItemWebDAVProps, syncType: SyncType) {
    if (!configItem.webdavConnectionUrl) return;
    const syncStatus = this.config.configList?.find(
      (item) => item.key === configItem.key
    )?.syncStatus;

    if (syncStatus === 'syncing') return;
    this.setSyncStatus(configItem.key, 'syncing');

    const { webdavConnectionUrl, username, password } = configItem;
    const client = createClient(webdavConnectionUrl, {
      authType: AuthType.Auto,
      username,
      password,
    });
    try {
      // client 自带的方法虽然不影响功能, 但会有一次请求报错, 所以自己递归处理
      await this.createDirectory(client, this.webDAVDirectory);
      await this.handleBySyncType(client, configItem, syncType);
    } catch (error: any) {
      const settings = await Store.settingsUtils.getSettings();
      const createdIntl = getCreatedIntl(settings.language || defaultLanguage);
      await this.handleSyncResult(
        configItem.key,
        syncType,
        false,
        this.formatErrorMsg(error, createdIntl)
      );
    }

    this.setSyncStatus(configItem.key, 'idle');
  }

  // 自动同步
  async autoSyncStart(data: { syncType: SyncType }) {
    const { syncType } = data || {};
    const config = await this.getConfig();
    const configList = config.configList?.filter((item) => !!item.webdavConnectionUrl);
    for (const option of configList) {
      await this.syncStart(option, syncType);
    }
  }
}

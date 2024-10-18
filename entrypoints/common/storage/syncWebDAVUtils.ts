import dayjs from 'dayjs';
import emojiRegex from 'emoji-regex';
import { AuthType, createClient } from 'webdav';
import type { WebDAVClient, FileStat } from 'webdav';
import type {
  SyncConfigWebDAVProps,
  SyncResultItemProps,
  SyncStatus,
  SyncType,
  SyncConfigItemWebDAVProps,
} from '~/entrypoints/types';
import {
  extContentImporter,
  getRandomId,
} from '~/entrypoints/common/utils';
import { SUCCESS_KEY, FAILED_KEY, syncTypeMap } from '~/entrypoints/common/constants';
import Store from './instanceStore';

export default class syncWebDAVUtils {
  storageConfigKey: `local:${string}` = 'local:syncWevDAVConfig';
  initialConfig: SyncConfigWebDAVProps = {
    configList: [],
  };
  config = this.initialConfig;

  webDAVDirectory: string = '/__NiceTab_web_dav__';
  webDAVFilename: string = '__NiceTab_web_dav__.json';

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
    }
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
    return await this.setConfig(this.config);
  }
  async addSyncResult(key: string, resultItem: SyncResultItemProps) {
    for (let item of this.config.configList) {
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
  async handleSyncResult(key: string, syncType: SyncType, result: boolean, reason?: string) {
    const syncTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    await this.addSyncResult(key, {
      syncType,
      syncTime,
      syncResult: result ? SUCCESS_KEY : FAILED_KEY,
      reason,
    });
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

  // 递归判断目录是否存在
  async isDirExists(client: WebDAVClient, dir: string) {
    return this.recursiveHandler(dir, async (pre, curr) => {
      // console.log('recursiveHandler-traverse-handler', pre, curr);
      const contentList = (await client.getDirectoryContents(pre)) as FileStat[];
      // console.log('recursiveHandler-traverse-contentList', contentList);
      return contentList.some(
        (item) => item.type === 'directory' && item.basename === curr
      );
    });
  }

  // 判断文件是否存在
  async isFileExists(client: WebDAVClient, dir: string, filename: string) {
    const isDirExists = this.isDirExists(client, dir);
    if (!isDirExists) return false;
    const contentList = (await client.getDirectoryContents(dir)) as FileStat[];
    return contentList.some((item) => item.type === 'file' && item.basename === filename);
  }

  // 自己实现的创建目录
  // 强迫症, 请求不存在的资源时会报错, 虽然 webdav client catch 了这个错误, 但是错误请求真实发生了. 所以自己递归处理
  async createDirectory(client: WebDAVClient, dir: string) {
    return this.recursiveHandler(dir, async (pre, curr) => {
      // console.log('recursiveHandler-traverse-handler', pre, curr);
      try {
        const contentList = (await client.getDirectoryContents(pre)) as FileStat[];
        const isDirExists = contentList.some(
          (item) => item.type === 'directory' && item.basename === curr
        );
        if (isDirExists) return true;
        await client.createDirectory(pre + curr);
        return true;
      } catch (error) {
        await client.createDirectory(pre + curr)
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
    const emojiReg = emojiRegex();
    content = content.replaceAll(emojiReg, '');
    return content;
  }

  getRemoteFilepath() {
    return `${this.webDAVDirectory?.replace(/\/$/, '') || ''}/${this.webDAVFilename}`;
  }

  // 根据syncType执行不同的操作
  async handleBySyncType(
    client: WebDAVClient,
    configItem: SyncConfigItemWebDAVProps,
    syncType: SyncType
  ) {
    const filepath = this.getRemoteFilepath();

    if (syncType === syncTypeMap.MANUAL_PUSH_FORCE) {
      const localContent = await this.getSyncContent();
      const result = await client.putFileContents(filepath, localContent);
      console.log('putFileContentsRes--MANUAL_PUSH_FORCE', result);
      await this.handleSyncResult(configItem.key, syncType, result);
      return;
    }

    let remoteFileContent = '';
    const isFileExists = await client.exists(filepath);
    if (isFileExists) {
      remoteFileContent = await client.getFileContents(filepath, { format: "text" }) as string;
    }

    if (!!remoteFileContent && syncType === syncTypeMap.MANUAL_PULL_FORCE) {
      await Store.tabListUtils.clearAll();
    }
    const tagList = extContentImporter.niceTab(remoteFileContent || '');
    await Store.tabListUtils.importTags(tagList, 'merge');
    if (syncType === syncTypeMap.MANUAL_PUSH_MERGE) {
      const localContent = await this.getSyncContent();
      const result = await client.putFileContents(filepath, localContent);
      console.log('putFileContentsRes--MANUAL_PUSH_MERGE', result);
      await this.handleSyncResult(configItem.key, syncType, result);
    } else {
      await this.handleSyncResult(configItem.key, syncType, true);
    }
  }

  // 开始同步入口
  async syncStart(configItem: SyncConfigItemWebDAVProps, syncType: SyncType) {
    if (!configItem.webdavConnectionUrl) return;
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
      if (error?.message?.includes('401')) {
        await this.handleSyncResult(configItem.key, syncType, false, 'authFailed');
      } else {
        await this.handleSyncResult(configItem.key, syncType, false);
      }
    }
  }
}

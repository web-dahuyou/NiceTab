// import { storage } from 'wxt/storage';
import dayjs from 'dayjs';
import emojiRegex from 'emoji-regex';
import type {
  SyncRemoteType,
  SyncConfigItemProps,
  SyncConfigProps,
  SyncResultItemProps,
  SyncResultProps,
  SyncStatus,
  SyncStatusProps,
  SyncType,
} from '~/entrypoints/types';
import {
  extContentImporter,
  fetchApi,
  getLocaleMessages,
} from '~/entrypoints/common/utils';
import { SUCCESS_KEY, FAILED_KEY } from '~/entrypoints/common/constants';
import Store from './instanceStore';

type GistFilesProps = {
  [key: string]: {
    content: string;
    size: number;
    raw_url: string;
    truncated: boolean;
  };
};

type GistResponseItemProps = {
  id: string;
  description: string;
  public: boolean;
  files: GistFilesProps;
  created_at: string;
  updated_at: string;
  truncated: boolean;
};

export default class SyncUtils {
  storageConfigKey: `local:${string}` = 'local:syncConfig';
  storageResultKey: `local:${string}` = 'local:syncResult';
  storageKey: `local:${string}` = 'local:syncConfig';
  initialConfig: SyncConfigProps = {
    gitee: {
      accessToken: '',
      gistId: '',
      autoSync: false,
    },
    github: {
      accessToken: '',
      gistId: '',
      autoSync: false,
    },
  };
  config: SyncConfigProps = this.initialConfig;
  syncStatus: SyncStatusProps = {
    gitee: 'idle',
    github: 'idle',
  };
  syncResult: SyncResultProps = {
    gitee: [],
    github: [],
  };
  apiBaseUrl = {
    gitee: 'https://gitee.com/api/v5/gists',
    github: 'https://api.github.com/gists',
  };
  gistDescKey: string = '__NiceTab_gist_key__';
  gistFileName: string = '__NiceTab_gist__.json';

  constructor() {
    this.getConfig();
  }

  async getConfig() {
    let config = await storage.getItem<SyncConfigProps>(this.storageConfigKey);
    this.config = { ...this.initialConfig, ...config };
    return config;
  }
  async setConfig(config: SyncConfigProps) {
    const { gitee, github } = this.config || {};
    const oldGithubConfig = { ...github };
    const oldGiteeConfig = { ...gitee };
    const newGithubConfig = {
      ...this.initialConfig.github,
      ...this.config.github,
      ...config.github,
    };
    const newGiteeConfig = {
      ...this.initialConfig.gitee,
      ...this.config.gitee,
      ...config.gitee,
    };
    // 修改 access token, 则清空 gistId 和 同步记录
    if (newGithubConfig?.accessToken !== oldGithubConfig?.accessToken) {
      newGithubConfig.gistId = '';
      this.clearSyncResult('github');
    }
    if (newGiteeConfig?.accessToken !== oldGiteeConfig?.accessToken) {
      newGiteeConfig.gistId = '';
      this.clearSyncResult('gitee');
    }

    this.config = { github: newGithubConfig, gitee: newGiteeConfig };
    return await storage.setItem<SyncConfigProps>(this.storageConfigKey, this.config);
  }
  async setConfigByType(remoteType: SyncRemoteType, config: SyncConfigItemProps) {
    const currConfig = { ...this.initialConfig[remoteType], ...this.config[remoteType] };
    this.config[remoteType] = { ...currConfig, ...config };
    return await storage.setItem<SyncConfigProps>(this.storageConfigKey, this.config);
  }
  getSyncStatus() {
    return this.syncStatus || {};
  }
  setSyncStatus(type: SyncRemoteType, status: SyncStatus) {
    this.syncStatus[type] = status;
  }
  async getSyncResult() {
    let result = await storage.getItem<SyncResultProps>(this.storageResultKey);
    this.syncResult = result || {};
    return result;
  }
  async addSyncResult(remoteType: SyncRemoteType, currResult: SyncResultItemProps) {
    this.syncResult[remoteType] = [currResult, ...(this.syncResult[remoteType] || [])];
    return await storage.setItem<SyncResultProps>(this.storageResultKey, this.syncResult);
  }
  async clearSyncResult(remoteType: SyncRemoteType) {
    this.syncResult[remoteType] = [];
    return await storage.setItem<SyncResultProps>(this.storageResultKey, this.syncResult);
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
    return content;
  }
  // 获取同步的gist参数
  async getApiParams() {
    let content = await this.getSyncContent();
    // 需要注意，如果title中包含emoji字符，提交gist接口会报错，所以将emoji标签给过滤掉
    const emojiReg = emojiRegex();
    content = content.replaceAll(emojiReg, '');

    return {
      description: this.gistDescKey,
      files: {
        [this.gistFileName]: {
          content,
        },
      },
    };
  }
  async getGistsList(remoteType: SyncRemoteType): Promise<GistResponseItemProps[]> {
    const { accessToken } = this.config[remoteType] || {};
    if (!accessToken) return [];

    const data = await fetchApi(
      this.apiBaseUrl[remoteType],
      {},
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    return (data as GistResponseItemProps[]) || [];
  }
  async getGistById(remoteType: SyncRemoteType): Promise<GistResponseItemProps> {
    const { accessToken, gistId } = this.config[remoteType] || {};
    if (!accessToken) return {} as GistResponseItemProps;

    const url = `${this.apiBaseUrl[remoteType]}/${gistId}`;
    const data = await fetchApi(
      url,
      { id: gistId },
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    return (data as GistResponseItemProps) || {};
  }
  async createGist(remoteType: SyncRemoteType): Promise<GistResponseItemProps> {
    const { accessToken } = this.config[remoteType] || {};
    if (!accessToken) return {} as GistResponseItemProps;

    const params = await this.getApiParams();

    const data = await fetchApi(this.apiBaseUrl[remoteType], params, {
      method: 'POST',
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    return (data as GistResponseItemProps) || {};
  }
  async updateGist(remoteType: SyncRemoteType): Promise<GistResponseItemProps> {
    const { accessToken, gistId } = this.config[remoteType] || {};
    if (!accessToken) return {} as GistResponseItemProps;

    const url = `${this.apiBaseUrl[remoteType]}/${gistId}`;
    const params = await this.getApiParams();

    const data = await fetchApi(
      url,
      { ...params, id: gistId },
      {
        method: 'PATCH',
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    return (data as GistResponseItemProps) || {};
  }

  // 根据syncType执行不同的操作
  async handleBySyncType(
    remoteType: SyncRemoteType,
    syncType: SyncType,
    gistData?: GistResponseItemProps
  ) {
    let result: GistResponseItemProps = {} as GistResponseItemProps;
    if (syncType === 'manual-push-force') {
      result = await this.updateGist(remoteType);
    } else {
      try {
        const { files } = gistData || {};
        let fileContent = '';
        const fileInfo = files?.[this.gistFileName];
        // https://docs.github.com/en/rest/gists/gists#truncation
        // 通过 raw_url 获取的文件内容小于 10M
        if (fileInfo?.truncated && fileInfo?.raw_url) {
          // 如果内容大小超过 10M，则取消合并到本地
          if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
            const localeMessage = getLocaleMessages();
            const reason = localeMessage['sync.tip.contentTooLarge'];
            this.handleSyncResult(remoteType, syncType, result, reason);
            return;
          }
          fileContent = await fetchApi(fileInfo?.raw_url) as string || '';
        } else {
          fileContent = fileInfo?.content || '';
        }
        const tagList = extContentImporter.niceTab(fileContent || '');
        await Store.tabListUtils.importTags(tagList, 'merge');
        result = await this.updateGist(remoteType);
      } catch (e) {
        console.log(e);
      }
    }

    this.handleSyncResult(remoteType, syncType, result);
  }
  // 处理同步结果并保存
  async handleSyncResult(
    remoteType: SyncRemoteType,
    syncType: SyncType,
    result: GistResponseItemProps,
    reason?: string
  ) {
    // gitee 请求接口返回的 updated_at 时间有时候不更新，还是使用本地时间吧
    // const syncTime = dayjs(result?.updated_at || result?.created_at).format('YYYY-MM-DD HH:mm:ss');
    const syncTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    this.addSyncResult(remoteType, {
      syncType,
      syncTime,
      syncResult: reason || !result.id ? FAILED_KEY : SUCCESS_KEY,
      reason,
    });
  }

  // 开始同步入口
  async syncStart(remoteType: SyncRemoteType, syncType: SyncType) {
    const { accessToken, gistId, autoSync } = this.config[remoteType] || {};
    if (!accessToken) return;
    this.setSyncStatus(remoteType, 'syncing');

    if (gistId) {
      const gistData = await this.getGistById(remoteType);
      await this.handleBySyncType(remoteType, syncType, gistData);
    } else {
      const allGists = await this.getGistsList(remoteType);
      const gistData = allGists.find((gist) => gist.description === this.gistDescKey);
      const isExist = gistData && gistData.id;

      if (isExist) {
        this.setConfigByType(remoteType, { gistId: gistData.id });
        await this.handleBySyncType(remoteType, syncType, gistData);
      } else {
        const data = await this.createGist(remoteType);
        this.setConfigByType(remoteType, { gistId: data.id || '' });
        this.handleSyncResult(remoteType, syncType, data);
      }
    }

    this.setSyncStatus(remoteType, 'idle');
  }
}

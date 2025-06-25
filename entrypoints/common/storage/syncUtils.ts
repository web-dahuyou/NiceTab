import dayjs from 'dayjs';
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
import { eventEmitter } from '~/entrypoints/common/hooks/global';
import {
  extContentImporter,
  fetchApi,
  sendRuntimeMessage,
  sanitizeContent,
} from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import {
  fetchErrorMessageOptions,
  SUCCESS_KEY,
  FAILED_KEY,
  syncTypeMap,
  defaultLanguage,
} from '~/entrypoints/common/constants';
import { getCreatedIntl } from '~/entrypoints/common/locale';
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
  storageStatusKey: `local:${string}` = 'local:syncStatus';
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

  // 同步的文件名配置（标签页列表，设置项）
  gistFileNameConfig = {
    tabList: '__NiceTab_gist__.json',
    settings: '__NiceTab_settings_gist__.json',
  };

  constructor() {
    this.getConfig();
  }

  async getConfig() {
    let config = await storage.getItem<SyncConfigProps>(this.storageConfigKey);
    this.config = { ...this.initialConfig, ...config };
    return { ...this.initialConfig, ...config };
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
  async getSyncStatus() {
    const syncStatus = await storage.getItem<SyncStatusProps>(this.storageStatusKey);
    this.syncStatus = { gitee: 'idle', github: 'idle', ...syncStatus };
    return this.syncStatus;
  }
  async setSyncStatus(type: SyncRemoteType, status: SyncStatus) {
    this.syncStatus[type] = status;
    await storage.setItem<SyncStatusProps>(this.storageStatusKey, this.syncStatus);
    eventEmitter.emit('sync:sync-status-change--gist', {
      type,
      status,
    });
    sendRuntimeMessage({
      msgType: 'sync:sync-status-change--gist',
      data: {
        type,
        status,
      },
      targetPageContexts: ['optionsPage'],
    });
  }
  async getSyncResult() {
    let result = await storage.getItem<SyncResultProps>(this.storageResultKey);
    this.syncResult = result || {};

    return this.syncResult;
  }
  async addSyncResult(remoteType: SyncRemoteType, currResult: SyncResultItemProps) {
    const syncResult = await this.getSyncResult();
    const _syncResultList = [currResult, ...(syncResult[remoteType] || [])];
    // 最多保留 50 条
    this.syncResult[remoteType] = _syncResultList.slice(0, 50);
    return await storage.setItem<SyncResultProps>(this.storageResultKey, this.syncResult);
  }
  async clearSyncResult(remoteType: SyncRemoteType) {
    this.syncResult[remoteType] = [];
    return await storage.setItem<SyncResultProps>(this.storageResultKey, this.syncResult);
  }

  // 获取需要同步的内容
  async getSyncContent() {
    const tagList = await Store.tabListUtils.exportTags();
    const settings = await Store.settingsUtils.getSettings();
    let content = '[]';
    let settingsContent = '{}';
    try {
      content = JSON.stringify(tagList);
      settingsContent = JSON.stringify(settings);
    } catch (error) {
      console.error(error);
    }
    return {
      tabList: content,
      settings: settingsContent,
    };
  }
  // 获取同步的gist参数
  async getApiParams() {
    let contentResult = await this.getSyncContent();
    // 需要注意，如果title中包含emoji字符，提交gist接口会报错，所以将emoji标签给过滤掉
    const tabListContent = sanitizeContent(contentResult?.tabList) || '[]';

    return {
      description: this.gistDescKey,
      files: {
        [this.gistFileNameConfig.tabList]: {
          content: tabListContent,
        },
        [this.gistFileNameConfig.settings]: {
          content: contentResult.settings,
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
    gistData: GistResponseItemProps
  ) {
    // 如果没有gist数据，则直接输出失败结果
    if (!gistData?.id) {
      this.handleSyncResult(remoteType, syncType, gistData);
      return;
    }
    let result: GistResponseItemProps = {} as GistResponseItemProps;
    if (
      syncType === syncTypeMap.MANUAL_PUSH_FORCE ||
      syncType === syncTypeMap.AUTO_PUSH_FORCE
    ) {
      result = await this.updateGist(remoteType);
    } else {
      const { files } = gistData || {};
      let fileContent = '';
      const settingsFileInfo = files?.[this.gistFileNameConfig.settings];
      const fileInfo = files?.[this.gistFileNameConfig.tabList];
      // https://docs.github.com/en/rest/gists/gists#truncation
      // 通过 raw_url 获取的文件内容小于 10M
      if (fileInfo?.truncated && fileInfo?.raw_url) {
        // 如果内容大小超过 10M，则取消合并到本地
        if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          const settings = await Store.settingsUtils.getSettings();
          const createdIntl = getCreatedIntl(settings.language || defaultLanguage);
          this.handleSyncResult(
            remoteType,
            syncType,
            result,
            createdIntl.formatMessage({ id: 'sync.reason.contentTooLarge' })
          );
          return;
        }
        fileContent =
          ((await fetchApi(fileInfo?.raw_url, {}, {}, 'text')) as string) || '';
      } else {
        fileContent = fileInfo?.content || '';
      }

      if (
        !!fileContent &&
        (syncType === syncTypeMap.MANUAL_PULL_FORCE ||
          syncType === syncTypeMap.AUTO_PULL_FORCE)
      ) {
        await Store.tabListUtils.clearAll();
      }

      if (!!settingsFileInfo?.content) {
        try {
          let settings = JSON.parse(settingsFileInfo?.content || '{}');
          if (
            syncType === syncTypeMap.MANUAL_PUSH_MERGE ||
            syncType === syncTypeMap.AUTO_PUSH_MERGE
          ) {
            const localSettings = await Store.settingsUtils.getSettings();
            settings = {
              ...localSettings,
              ...settings,
              autoSync: localSettings.autoSync, // 自动同步开关，本地优先级高于远程（防止其他设备的设置覆盖本地的开关）
            };
          }
          await Store.settingsUtils.setSettings(settings);
          sendRuntimeMessage({
            msgType: 'setLocale',
            data: { locale: settings.language },
          });
        } catch (error) {
          console.error(error);
        }
      }
      const tagList = extContentImporter.niceTab(fileContent || '');
      await Store.tabListUtils.importTags(tagList, 'merge');
      if (
        syncType === syncTypeMap.MANUAL_PUSH_MERGE ||
        syncType === syncTypeMap.AUTO_PUSH_MERGE
      ) {
        result = await this.updateGist(remoteType);
      } else {
        result = { id: gistData?.id } as GistResponseItemProps;
      }
    }

    this.handleSyncResult(remoteType, syncType, result);
    reloadOtherAdminPage();
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

  // 格式化错误信息
  formatErrorMsg(errorMsg: string, createdIntl: ReturnType<typeof getCreatedIntl>) {
    const messageItem = fetchErrorMessageOptions.find((item) => errorMsg === item.type);
    if (messageItem?.messageId) {
      return createdIntl.formatMessage({ id: messageItem.messageId });
    }
    return (
      errorMsg ||
      createdIntl.formatMessage(
        { id: `common.actionFailed` },
        { action: createdIntl.formatMessage({ id: 'common.sync' }) }
      )
    );
  }

  // 开始同步入口
  async syncStart(remoteType: SyncRemoteType, syncType: SyncType) {
    const { accessToken, gistId } = this.config[remoteType] || {};
    if (!accessToken) return;
    if (this.syncStatus[remoteType] === 'syncing') return;
    this.setSyncStatus(remoteType, 'syncing');

    try {
      if (gistId) {
        const gistData = await this.getGistById(remoteType);
        await this.handleBySyncType(remoteType, syncType, gistData);
      } else {
        const allGists = await this.getGistsList(remoteType);
        const gistData = allGists.find((gist) => gist.description === this.gistDescKey);
        const isExist = gistData && gistData.id;

        if (isExist) {
          await this.setConfigByType(remoteType, { gistId: gistData.id });
          // 这里需要注意，github API 列表中并不返回文件内容（gitee API 在列表中依然返回content内容）
          // 因此为了保持逻辑一致性，全都通过id来手动获取一遍内容
          const gistDataById = await this.getGistById(remoteType);
          await this.handleBySyncType(remoteType, syncType, gistDataById);
        } else {
          const data = await this.createGist(remoteType);
          this.setConfigByType(remoteType, { gistId: data.id || '' });
          this.handleSyncResult(remoteType, syncType, data);
        }
      }
    } catch (error: any) {
      const settings = await Store.settingsUtils.getSettings();
      const createdIntl = getCreatedIntl(settings.language || defaultLanguage);
      await this.handleSyncResult(
        remoteType,
        syncType,
        {} as GistResponseItemProps,
        this.formatErrorMsg(error.message, createdIntl)
      );
    }

    this.setSyncStatus(remoteType, 'idle');
  }

  // 自动同步
  async autoSyncStart(data: { syncType: SyncType }) {
    const { syncType } = data || {};
    await this.getConfig();
    ['github', 'gitee'].forEach(async (remoteType) => {
      await this.syncStart(remoteType as SyncRemoteType, syncType);
    });
  }
}

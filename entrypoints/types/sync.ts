import type { WebDAVClientOptions } from 'webdav';

// 目标同步配置类型
export type SyncTargetType = 'gist' | 'webdav';

// 远程同步类型
export type SyncRemoteType = 'gitee' | 'github';
export type SyncConfigItemProps = {
  accessToken?: string;
  gistId?: string;
  autoSync?: boolean;
};
// 同步配置
export type SyncConfigProps = {
  gitee: SyncConfigItemProps;
  github: SyncConfigItemProps;
};

export type AutoSyncType = 'auto-pull-merge' | 'auto-pull-force' | 'auto-push-merge' | 'auto-push-force';
export type ManualSyncType = 'manual-pull-merge' | 'manual-pull-force' | 'manual-push-merge' | 'manual-push-force';
// 同步类型
export type SyncType = AutoSyncType | ManualSyncType;
// 单次同步结果类型
export type SyncResultItemProps = {
  syncTime: string;
  syncType: SyncType;
  syncResult: string;
  reason?: string;
};
// 同步状态
export type SyncStatus = 'idle' | 'syncing';
// 所有渠道同步状态
export type SyncStatusProps = {
  gitee: SyncStatus;
  github: SyncStatus;
};
// 所有渠道同步结果集合
export type SyncResultProps = {
  gitee?: SyncResultItemProps[];
  github?: SyncResultItemProps[];
  [key: string]: SyncResultItemProps[] | undefined;
};

/***** webDAV 配置 *****/
export type SyncConfigItemWebDAVProps = WebDAVClientOptions & {
  key: string;
  label: string;
  webdavConnectionUrl?: string;
  username?: string;
  password?: string;
  syncStatus?: SyncStatus;
  syncResult?: SyncResultItemProps[];
};
export type SyncConfigWebDAVProps = {
  configList: SyncConfigItemWebDAVProps[];
};

/***** 同步事件相关 *****/
// gists同步状态变化
interface SyncStatusChangeGistEvent {
  type: SyncRemoteType;
  status: SyncStatus;
}
// webDAV同步状态变化
interface SyncStatusChangeWebDAVEvent {
  key: string;
  status: SyncStatus;
}

// gist同步状态变化事件参数
export type SyncStatusChangeEventProps<T extends SyncTargetType = 'gist'> =
  T extends 'gist'
    ? SyncStatusChangeGistEvent
    : T extends 'webdav'
    ? SyncStatusChangeWebDAVEvent
    : never;


// 开始同步事件参数
export type SyncStartEventProps = {
  targetType: SyncTargetType;
  syncType: SyncType;
};

// 自动同步时间单位
export type AutoSyncTimeUnits = 'm' | 'h';

export default { name: 'sync-types' };

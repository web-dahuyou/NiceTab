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
export type SyncType = 'auto' | 'manual-pull-merge' | 'manual-pull-force' | 'manual-push-merge' | 'manual-push-force';
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
};

export default { name: 'sync-types' };

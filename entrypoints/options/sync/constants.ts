import type { SyncRemoteType, SyncType } from '~/entrypoints/types';
import type { RemoteOptionProps } from './types';

// 个人账号 access token 设置页面
export const tokenSettingsPageUrls: Record<SyncRemoteType, string> = {
  github: 'https://github.com/settings/tokens',
  gitee: 'https://gitee.com/profile/personal_access_tokens'
};

// 远程同步选项
export const remoteOptions: RemoteOptionProps[] = [
  { key: 'github', label: 'Github', pageUrl: tokenSettingsPageUrls.github },
  { key: 'gitee', label: 'Gitee', pageUrl: tokenSettingsPageUrls.gitee },
];

// 同步方式枚举
export const syncTypeMap: Record<string, SyncType> = {
  AUTO: 'auto',
  MANUAL_PUSH_MERGE: 'manual-push-merge',
  MANUAL_PUSH_FORCE: 'manual-push-force',
};

export default {
  name: 'option-sync-constants',
};

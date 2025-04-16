import type { MessageArgsProps } from 'antd';
import type { ThemeProps, ThemeTypes, LanguageTypes } from './global';
import type { SyncRemoteType, SyncStatus } from './sync';
import type { SendTargetProps } from './tabList';

// 页面上下文类型
export type PageContextType =
  | 'background'
  | 'optionsPage'
  | 'popupPage'
  | 'contentScriptPage';

export type RuntimeMsgType =
  | 'setPrimaryColor'
  | 'setThemeData'
  | 'setThemeType'
  | 'setLocale'
  | 'openAdminRoutePage'
  | 'reloadAdminPage'
  | 'sync:sync-status-change--gist'
  | 'sync:sync-status-change--webdav'
  | 'sendTabsActionStart'
  | 'sendTabsActionConfirm';

export interface RuntimeMsgSetPrimaryColor {
  msgType: 'setPrimaryColor';
  data: {
    colorPrimary: string;
  };
}
export interface RuntimeMsgSetThemeData {
  msgType: 'setThemeData';
  data: Partial<ThemeProps>;
}
export interface RuntimeMsgSetThemeType {
  msgType: 'setThemeType';
  data: {
    themeType: ThemeTypes;
  };
}
export interface RuntimeMsgSetLocale {
  msgType: 'setLocale';
  data: {
    locale: LanguageTypes;
  };
}
export interface RuntimeMsgOpenAdminRoutePage {
  msgType: 'openAdminRoutePage';
  data: { path: string; query?: Record<string, any> };
}
export interface RuntimeMsgReloadAdminPage {
  msgType: 'reloadAdminPage';
  data: { currWindowId?: number };
}
export interface RuntimeMsgSyncStatusChangeGist {
  msgType: 'sync:sync-status-change--gist';
  data: { type: SyncRemoteType; status: SyncStatus };
}
export interface RuntimeMsgSyncStatusChangeWebdav {
  msgType: 'sync:sync-status-change--webdav';
  data: { key: string; status: SyncStatus };
}
export interface RuntimeMsgSendTabsActionStart {
  msgType: 'sendTabsActionStart';
  data: { actionName: string };
}
export interface RuntimeMsgSendTabsActionConfirm {
  msgType: 'sendTabsActionConfirm';
  data: { actionName: string; targetData: SendTargetProps; currWindowId?: number };
}

export type RuntimeMsgBaseProps =
  | RuntimeMsgSetPrimaryColor
  | RuntimeMsgSetThemeData
  | RuntimeMsgSetThemeType
  | RuntimeMsgSetLocale
  | RuntimeMsgOpenAdminRoutePage
  | RuntimeMsgReloadAdminPage
  | RuntimeMsgSyncStatusChangeGist
  | RuntimeMsgSyncStatusChangeWebdav
  | RuntimeMsgSendTabsActionStart
  | RuntimeMsgSendTabsActionConfirm;

// runtime message event props
export type RuntimeMessageEventProps = RuntimeMsgBaseProps & {
  targetPageContext?: PageContextType; // 目标页面上下文
};

// sendRuntimeMessage base props
export type SendRuntimeMessageBaseProps<T extends RuntimeMsgType> =
  T extends 'setPrimaryColor'
    ? RuntimeMsgSetPrimaryColor
    : T extends 'setThemeData'
    ? RuntimeMsgSetThemeData
    : T extends 'setThemeType'
    ? RuntimeMsgSetThemeType
    : T extends 'setLocale'
    ? RuntimeMsgSetLocale
    : T extends 'openAdminRoutePage'
    ? RuntimeMsgOpenAdminRoutePage
    : T extends 'reloadAdminPage'
    ? RuntimeMsgReloadAdminPage
    : T extends 'sync:sync-status-change--gist'
    ? RuntimeMsgSyncStatusChangeGist
    : T extends 'sync:sync-status-change--webdav'
    ? RuntimeMsgSyncStatusChangeWebdav
    : T extends 'sendTabsActionStart'
    ? RuntimeMsgSendTabsActionStart
    : T extends 'sendTabsActionConfirm'
    ? RuntimeMsgSendTabsActionConfirm
    : never;

// sendRuntimeMessage params
export type SendRuntimeMessageParams<T extends RuntimeMsgType = any> =
  SendRuntimeMessageBaseProps<T> & {
    targetPageContexts?: PageContextType[];
  };

/* 给tabs标签页发送消息 */
export type SendTabMsgType = 'action:open-send-target-modal' | 'action:callback-message';

export interface SendTabMsgOpenSendTargetModal {
  msgType: 'action:open-send-target-modal';
  data: {
    actionName: string;
    currWindowId?: number;
  };
}
export interface SendTabMsgCallbackMessage {
  msgType: 'action:callback-message';
  data: {
    type: MessageArgsProps['type'];
    content: string;
  };
}

export interface SendTabMsgOpenGlobalSearchModal {
  msgType: 'action:open-global-search-modal';
  data: {
    currWindowId?: number;
  };
}

export type SendTabMsgBaseProps =
  | RuntimeMsgBaseProps
  | SendTabMsgOpenSendTargetModal
  | SendTabMsgCallbackMessage
  | SendTabMsgOpenGlobalSearchModal;

// sendTabMessage event props
export type SendTabMsgEventProps = SendTabMsgBaseProps & {
  onlyCurrentTab?: boolean;
  onlyCurrentWindow?: boolean;
};

export default { name: 'runtime-msg-types' };

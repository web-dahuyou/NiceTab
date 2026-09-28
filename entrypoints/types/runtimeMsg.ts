import type { MessageArgsProps } from 'antd';
import type { ThemeProps, ThemeTypes, LanguageTypes } from './global';
import type { SyncRemoteType, SyncStatus } from './sync';
import type { SendTargetProps } from './tabList';

// 页面上下文类型
export type PageContextType =
  | 'background'
  | 'optionsPage'
  | 'popupPage'
  | 'contentScriptPage'
  | 'newtabPage';

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
export interface RuntimeMsgReloadAllAdminPage {
  msgType: 'reloadAllAdminPage';
  data: {};
}
export interface RuntimeMsgReloadOtherAdminPage {
  msgType: 'reloadOtherAdminPage';
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
export interface RuntimeMsgShowMessage {
  msgType: 'showMessage';
  data: { type: 'success' | 'error' | 'info' | 'warning'; content: string };
}

// msgType -> 对应消息接口的映射表，新增消息类型只需在此添加一行
export interface RuntimeMsgMap {
  setPrimaryColor: RuntimeMsgSetPrimaryColor;
  setThemeData: RuntimeMsgSetThemeData;
  setThemeType: RuntimeMsgSetThemeType;
  setLocale: RuntimeMsgSetLocale;
  openAdminRoutePage: RuntimeMsgOpenAdminRoutePage;
  reloadAllAdminPage: RuntimeMsgReloadAllAdminPage;
  reloadOtherAdminPage: RuntimeMsgReloadOtherAdminPage;
  'sync:sync-status-change--gist': RuntimeMsgSyncStatusChangeGist;
  'sync:sync-status-change--webdav': RuntimeMsgSyncStatusChangeWebdav;
  sendTabsActionStart: RuntimeMsgSendTabsActionStart;
  sendTabsActionConfirm: RuntimeMsgSendTabsActionConfirm;
  showMessage: RuntimeMsgShowMessage;
}

export type RuntimeMsgType = keyof RuntimeMsgMap;
export type RuntimeMsgBaseProps = RuntimeMsgMap[keyof RuntimeMsgMap];

// runtime message event props
export type RuntimeMessageEventProps = RuntimeMsgBaseProps & {
  targetPageContext?: PageContextType; // 目标页面上下文
};

// sendRuntimeMessage base props
export type SendRuntimeMessageBaseProps<T extends RuntimeMsgType> = RuntimeMsgMap[T];

// sendRuntimeMessage params
export type SendRuntimeMessageParams<T extends RuntimeMsgType = any> =
  SendRuntimeMessageBaseProps<T> & {
    targetPageContexts?: PageContextType[];
  };

/* 给tabs标签页发送消息 */
export type SendTabMsgType =
  | 'action:open-send-target-modal'
  | 'action:callback-message'
  | 'action:global-search-panel-data-refesh';

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

export interface SendTabMsgRefreshGlobalSearchModal {
  msgType: 'action:refresh-global-search-modal';
  data?: {};
}

export type SendTabMsgBaseProps =
  | RuntimeMsgBaseProps
  | SendTabMsgOpenSendTargetModal
  | SendTabMsgCallbackMessage
  | SendTabMsgOpenGlobalSearchModal
  | SendTabMsgRefreshGlobalSearchModal;

// sendTabMessage event props
export type SendTabMsgEventProps = SendTabMsgBaseProps & {
  onlyCurrentTab?: boolean;
  onlyCurrentWindow?: boolean;
  sendToAdminTab?: boolean;
};

export default { name: 'runtime-msg-types' };

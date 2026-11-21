import type { GroupItem, TabItem } from '~/entrypoints/types';

import { ENUM_SETTINGS_PROPS as S, UNNAMED_GROUP } from './constants';
import { incognitoUtils, settingsUtils } from './storage';
import {
  createNewWindowForOpen,
  openNewGroup,
  openNewTab,
  removeNewWindowBlankTabs,
} from './tabs';
import { getRandomId } from './utils';

export type OpenMode = 'current' | 'newWindow' | 'incognito';
export type OpenTarget =
  | { id: string; groupName: string; urls: string[]; selectedIds?: string[] }
  | {
      id: string;
      url?: string;
      active?: boolean;
      openToNext?: boolean;
      discard?: boolean;
    };

export function groupTarget(
  group: Pick<GroupItem, 'groupId' | 'groupName' | 'tabList'>,
  selectedTabsOnly = false,
): OpenTarget {
  const tabs = group.tabList.filter(tab => tab.url?.trim());
  return {
    id: group.groupId,
    groupName: group.groupName,
    urls: tabs.map(tab => tab.url!),
    selectedIds: selectedTabsOnly ? tabs.map(tab => tab.tabId) : undefined,
  };
}

export function tabTarget(
  tab: Pick<TabItem, 'tabId' | 'url'>,
  options: { active?: boolean; openToNext?: boolean; discard?: boolean } = {},
): OpenTarget {
  return { id: tab.tabId, url: tab.url, ...options };
}

export interface OpenResult {
  processedIds: string[];
  failed: boolean;
  permissionDenied?: boolean;
}

export const OPEN_SAVED_TABS_PORT = 'openSavedSearchTabs';
export interface SearchOpenRequest {
  mode: OpenMode;
  tabs: Array<{ id: string; active?: boolean; discard?: boolean }>;
}

export function openSearchTabsFromPage(targets: OpenTarget[], mode: OpenMode) {
  const port = browser.runtime.connect({ name: OPEN_SAVED_TABS_PORT });
  return new Promise<OpenResult>((resolve, reject) => {
    port.onDisconnect.addListener(() =>
      reject(new Error('Search tab port disconnected')),
    );
    port.onMessage.addListener(message => {
      resolve(message as OpenResult);
      port.disconnect();
    });
    const tabs = targets.map(target => {
      if ('groupName' in target)
        throw new Error('Search results must be individual tabs');
      return { id: target.id, active: target.active, discard: target.discard };
    });
    port.postMessage({ tabs, mode } satisfies SearchOpenRequest);
  });
}

// 普通窗口与 split 无痕辅助页使用同一段打开逻辑，删除由发起入口根据结果处理。
export async function openInTargetWindow(
  targets: OpenTarget[],
  windowId?: number,
  continueOnFailure = false,
): Promise<OpenResult> {
  const result: OpenResult = { processedIds: [], failed: false };
  const settings = await settingsUtils.getSettings();
  for (const target of targets) {
    const createdIds: string[] = [];
    try {
      if ('groupName' in target) {
        const opened = await openNewGroup(target.groupName, target.urls, {
          windowId,
          onTabCreated: target.selectedIds
            ? index => createdIds.push(target.selectedIds![index])
            : undefined,
          asGroup:
            settings[
              target.groupName === UNNAMED_GROUP
                ? S.UNNAMED_GROUP_RESTORE_AS_GROUP
                : S.NAMED_GROUP_RESTORE_AS_GROUP
            ],
          discard: settings[S.DISCARD_WHEN_OPEN_TABS],
        });
        if (!opened) throw new Error('Unable to open saved group');
        result.processedIds.push(...(target.selectedIds ?? [target.id]));
      } else {
        const { id, url, ...options } = target;
        const tab = await openNewTab(url, { ...options, windowId });
        if (!tab) throw new Error('Unable to open saved tab');
        result.processedIds.push(target.id);
      }
    } catch (error) {
      result.processedIds.push(...createdIds);
      console.warn('Unable to open saved tabs', error);
      result.failed = true;
      if (!continueOnFailure) break;
    }
  }
  return result;
}

export async function openTabs(
  targets: OpenTarget[],
  mode: OpenMode,
  sourceWindowId?: number,
  continueOnFailure = false,
): Promise<OpenResult> {
  if (!targets.length) return { processedIds: [], failed: false };
  if (mode === 'incognito') {
    if ((await browser.extension.isAllowedIncognitoAccess?.()) === false) {
      return { processedIds: [], failed: true, permissionDenied: true };
    }
    const id = getRandomId();
    await incognitoUtils.setTask({ id, targets, createdAt: Date.now() });
    try {
      await browser.windows.create({
        focused: true,
        incognito: true,
        url: browser.runtime.getURL('/incognito-open.html') + '#' + id,
      });
      return (await incognitoUtils.waitResult(id)) ?? { processedIds: [], failed: true };
    } finally {
      await incognitoUtils.removeTask(id);
      await incognitoUtils.removeResult(id);
    }
  }
  if (mode === 'current') {
    const windowId =
      sourceWindowId ??
      (targets.length > 1 ? (await browser.windows.getCurrent()).id : undefined);
    return openInTargetWindow(targets, windowId, continueOnFailure);
  }
  const { windowId, initialTabIds } = await createNewWindowForOpen();
  if (windowId === undefined) return { processedIds: [], failed: true };
  try {
    return await openInTargetWindow(targets, windowId);
  } finally {
    await removeNewWindowBlankTabs(windowId, initialTabIds);
  }
}

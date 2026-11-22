import type { Runtime } from 'wxt/browser';
import { scheduledSnapshotLimitRange } from '~/entrypoints/common/constants';
import {
  OPEN_SAVED_TABS_PORT,
  openTabs,
  tabTarget,
  type SearchOpenRequest,
  type OpenResult,
} from '~/entrypoints/common/openUtils';
import { snapshotUtils, tabListUtils } from '~/entrypoints/common/storage';
import tabUtils from '~/entrypoints/common/tabs';
import { SNAPSHOT_ACTION_PORT } from '~/entrypoints/common/utils/runtimeMsg';
import type {
  SnapshotLimitResult,
  SnapshotPortRequest,
  SnapshotRestoreResult,
} from '~/entrypoints/types';

async function handleSnapshotAction(
  message: unknown,
  sender?: Runtime.MessageSender,
): Promise<SnapshotRestoreResult | SnapshotLimitResult> {
  const failed = { status: 'failed' } as const;
  if (
    sender?.id !== browser.runtime.id ||
    sender.url?.split(/[?#]/)[0] !== browser.runtime.getURL('/options.html')
  ) {
    return failed;
  }
  const request = message as SnapshotPortRequest | null;
  if (request?.action === 'setLimit') {
    const { limit, confirmedIds } = request;
    if (
      !Number.isSafeInteger(limit) ||
      limit < scheduledSnapshotLimitRange.min ||
      limit > scheduledSnapshotLimitRange.max ||
      (confirmedIds !== undefined &&
        (!Array.isArray(confirmedIds) || confirmedIds.some(id => typeof id !== 'string')))
    ) {
      return failed;
    }
    return (await snapshotUtils.setScheduledLimit(limit, confirmedIds)) ?? failed;
  }
  if (request?.action === 'restore') {
    const { id, source, mode } = request;
    if (
      typeof id !== 'string' ||
      !id ||
      (source !== 'manual' && source !== 'auto' && source !== 'scheduled') ||
      (mode !== 'newWindow' && mode !== 'replaceCurrent') ||
      (mode === 'replaceCurrent' && sender.tab?.windowId === undefined)
    ) {
      return failed;
    }
    const record = await snapshotUtils.getRecord(source, id);
    if (record) return await tabUtils.restoreSnapshotRecord(record, mode, sender.tab);
  }
  return failed;
}

export function initPortMessageListener() {
  browser.runtime.onConnect.addListener(port => {
    if (port.name !== SNAPSHOT_ACTION_PORT) return;
    port.onMessage.addListener(async message => {
      let result: SnapshotRestoreResult | SnapshotLimitResult = { status: 'failed' };
      try {
        result = await handleSnapshotAction(message, port.sender);
      } catch (error) {
        console.warn('Unable to complete snapshot action', error);
      }
      try {
        port.postMessage(result);
      } catch (error) {
        console.warn('Snapshot page disconnected', error);
      }
    });
  });
  browser.runtime.onConnect.addListener(port => {
    if (port.name !== OPEN_SAVED_TABS_PORT) return;
    port.onMessage.addListener(async message => {
      const request = message as SearchOpenRequest;
      let result: OpenResult = { processedIds: [], failed: true };
      try {
        // 网页内搜索只传保存条目的 ID，由后台读取 URL，并使用发起操作的窗口。
        const sourceWindowId = port.sender?.tab?.windowId;
        if (sourceWindowId === undefined) throw new Error('Missing source window');
        const tags = await tabListUtils.getTagList();
        const saved = new Map(
          tags.flatMap(tag =>
            tag.groupList.flatMap(group =>
              group.tabList.map(tab => [tab.tabId, tab] as const),
            ),
          ),
        );
        const targets = request.tabs.flatMap(({ id, active, discard }) => {
          const tab = saved.get(id);
          return tab ? [tabTarget(tab, { active, discard })] : [];
        });
        result = await openTabs(targets, request.mode, sourceWindowId, true);
        if (targets.length !== request.tabs.length) result.failed = true;
      } catch (error) {
        console.warn('Unable to open search results', error);
      }
      try {
        port.postMessage(result);
      } catch (error) {
        console.warn('Search page disconnected', error);
      }
    });
  });
}

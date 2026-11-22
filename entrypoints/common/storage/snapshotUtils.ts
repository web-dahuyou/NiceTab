import type {
  ScheduledSnapshot,
  ScheduledSnapshotWindow,
  SnapshotGroupItem,
  SnapshotItem,
  SnapshotLimitResult,
  SnapshotRecord,
  SnapshotStore,
  SnapshotTabItem,
  WindowSnapshotItem,
  WindowSnapshotTab,
} from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { getRandomId, newCreateTime } from '~/entrypoints/common/utils';
import Store from './instanceStore';

const { SCHEDULED_SNAPSHOTS_ENABLED } = ENUM_SETTINGS_PROPS;

interface SnapshotSession {
  key: string;
  signatures: Record<number, string>;
}

function compareScheduledFocus(a: ScheduledSnapshot, b: ScheduledSnapshot) {
  return (b.lastFocusedAt ?? 0) - (a.lastFocusedAt ?? 0);
}

export const SNAPSHOT_STORE_VERSION = 2 as const;
export const MAX_MANUAL_SNAPSHOTS = 50;

const initialStore: SnapshotStore = {
  version: SNAPSHOT_STORE_VERSION,
  manual: [],
};

export function legacyTabToSnapshot(tab: SnapshotTabItem): WindowSnapshotTab {
  return {
    type: 'tab',
    id: tab?.tabId || getRandomId(12),
    title: tab.title || tab.url || '',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl,
    pinned: false,
    active: false,
  };
}

export function convertLegacyItems(items: SnapshotItem[]): WindowSnapshotItem[] {
  const result = items.map(item => {
    if (item.type === 'group') {
      const group = item as SnapshotGroupItem;
      return {
        type: 'group' as const,
        id: group.groupId || getRandomId(12),
        title: group.groupName || '',
        color: 'grey',
        collapsed: false,
        tabs: (group.tabList || []).map(tab =>
          legacyTabToSnapshot({ ...tab, type: 'tab' }),
        ),
      };
    }
    return legacyTabToSnapshot(item);
  });

  const firstTab = result.find(item => item.type === 'tab') as
    | WindowSnapshotTab
    | undefined;
  if (firstTab) {
    firstTab.active = true;
  } else {
    const firstGroup = result.find(item => item.type === 'group');
    if (firstGroup?.type === 'group' && firstGroup.tabs[0]) {
      firstGroup.tabs[0].active = true;
    }
  }
  return result;
}

export function createLegacyRecord(
  source: SnapshotRecord['source'],
  items: SnapshotItem[],
): SnapshotRecord {
  const now = newCreateTime();
  return {
    id: getRandomId(16),
    name: `${source === 'manual' ? 'Snapshot' : 'Auto snapshot'} ${now}`,
    source,
    createdAt: now,
    updatedAt: now,
    items: convertLegacyItems(items),
  };
}

export function isSnapshotRecord(
  value: SnapshotItem[] | SnapshotRecord | undefined,
): value is SnapshotRecord {
  return !!value && !Array.isArray(value) && Array.isArray(value.items);
}

export function normalizeAutoBuffer(value: SnapshotItem[] | SnapshotRecord | undefined) {
  if (isSnapshotRecord(value)) return value;
  return value?.length ? createLegacyRecord('auto', value) : undefined;
}

async function getSnapshotSignature(items: WindowSnapshotItem[]) {
  const tabFields = (tab: WindowSnapshotTab) => [tab.url, tab.pinned];
  const content = items.map(item =>
    item.type === 'tab'
      ? tabFields(item)
      : [item.title, item.color, item.collapsed, item.tabs.map(tabFields)],
  );
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(content)),
  );
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function refreshSnapshotTab(saved: WindowSnapshotTab, current: WindowSnapshotTab) {
  const { title, favIconUrl, active } = current;
  if (
    title === saved.title &&
    favIconUrl === saved.favIconUrl &&
    active === saved.active
  ) {
    return saved;
  }
  return { ...saved, title, favIconUrl, active };
}

// 结构相同的快照按位置更新元数据，沿用标签页和分组的 ID。
function refreshSnapshotItems(
  saved: WindowSnapshotItem[],
  current: WindowSnapshotItem[],
) {
  const refreshed = saved.map((item, index) => {
    const next = current[index];
    if (item.type === 'tab' && next.type === 'tab') return refreshSnapshotTab(item, next);
    if (item.type === 'group' && next.type === 'group') {
      const tabs = item.tabs.map((tab, tabIndex) =>
        refreshSnapshotTab(tab, next.tabs[tabIndex]),
      );
      if (tabs.some((tab, tabIndex) => tab !== item.tabs[tabIndex]))
        return { ...item, tabs };
    }
    return item;
  });
  return refreshed.some((item, index) => item !== saved[index]) ? refreshed : saved;
}

export default class SnapshotUtils {
  storageKey: `local:${string}` = 'local:snapshots';
  readonly scheduledKey = 'local:scheduledSnapshots';
  private readonly scheduledSessionKey = 'session:scheduledSnapshotSession';
  private scheduledUpdates: Promise<unknown> = Promise.resolve();
  // 启动恢复期间暂停所有窗口的定时采集。
  restoringOnStartup = false;
  // 正在恢复的窗口；采集期间会同步标记到本轮采集，避免采集到恢复中的窗口。
  private readonly restoringWindows = new Map<symbol, number | null>();
  private captureWindowIds: Set<number | null> | undefined;
  store: SnapshotStore = initialStore;

  async getStore() {
    const stored = await storage.getItem<SnapshotStore>(this.storageKey);
    if (stored?.version === SNAPSHOT_STORE_VERSION) {
      this.store = {
        ...initialStore,
        ...stored,
        manual: stored.manual || [],
      };
      const globalState = await Store.stateUtils.getState('global');
      const autoBuffer = normalizeAutoBuffer(globalState.openedTabsAutoSave);
      if (!autoBuffer && this.store.auto) {
        await Store.stateUtils.setStateByModule('global', {
          openedTabsAutoSave: this.store.auto,
        });
      } else if (autoBuffer && autoBuffer !== globalState.openedTabsAutoSave) {
        await Store.stateUtils.setStateByModule('global', {
          openedTabsAutoSave: autoBuffer,
        });
      }
      return this.store;
    }

    return await this.migrateLegacySnapshots();
  }

  async setStore(store: SnapshotStore) {
    this.store = {
      ...store,
      version: SNAPSHOT_STORE_VERSION,
      manual: (store.manual || []).slice(0, MAX_MANUAL_SNAPSHOTS),
    };
    await storage.setItem<SnapshotStore>(this.storageKey, this.store);
    return this.store;
  }

  async migrateLegacySnapshots() {
    const globalState = await Store.stateUtils.getState('global');
    const manualItems = globalState.openedTabsManualSave || [];
    const autoRecord = normalizeAutoBuffer(globalState.openedTabsAutoSave);
    const migrated: SnapshotStore = {
      ...initialStore,
      manual: manualItems.length ? [createLegacyRecord('manual', manualItems)] : [],
      auto: autoRecord,
    };

    await this.setStore(migrated);
    if (manualItems.length || autoRecord) {
      await Store.stateUtils.setStateByModule('global', {
        openedTabsManualSave: undefined,
        openedTabsAutoSave: autoRecord,
      });
    }
    return migrated;
  }

  async addManual(record: SnapshotRecord, removeOldest = true) {
    const store = await this.getStore();

    const manual = removeOldest
      ? [record, ...store.manual.slice(0, MAX_MANUAL_SNAPSHOTS - 1)]
      : [record, ...store.manual];

    await this.setStore({ ...store, manual });
    return { saved: true as const, store: this.store };
  }

  async setAuto(record: SnapshotRecord) {
    const store = await this.getStore();
    return await this.setStore({ ...store, auto: record });
  }

  async setAutoBuffer(record: SnapshotRecord) {
    await Store.stateUtils.setStateByModule('global', { openedTabsAutoSave: record });
    return record;
  }

  async promoteAutoBuffer() {
    const store = await this.getStore();
    const globalState = await Store.stateUtils.getState('global');
    const record = normalizeAutoBuffer(globalState.openedTabsAutoSave);
    if (!record?.items.length) return store.auto;
    const promoted = {
      ...record,
      source: 'auto' as const,
      updatedAt: newCreateTime(),
    };
    await this.setStore({ ...store, auto: promoted });
    if (record !== globalState.openedTabsAutoSave) {
      await Store.stateUtils.setStateByModule('global', { openedTabsAutoSave: promoted });
    }
    return promoted;
  }

  async update(record: SnapshotRecord) {
    const store = await this.getStore();
    if (record.source === 'auto') {
      return await this.setStore({ ...store, auto: record });
    }
    return await this.setStore({
      ...store,
      manual: store.manual.map(item => (item.id === record.id ? record : item)),
    });
  }

  async remove(id: string, source: SnapshotRecord['source']) {
    const store = await this.getStore();
    if (source === 'auto') {
      return await this.setStore({ ...store, auto: undefined });
    }
    return await this.setStore({
      ...store,
      manual: store.manual.filter(item => item.id !== id),
    });
  }

  async getScheduled() {
    return (await storage.getItem<ScheduledSnapshot[]>(this.scheduledKey)) || [];
  }

  async getScheduledLimit(recordCount?: number) {
    const { settingsUtils } = Store;
    const limit = await storage.getItem<number>(settingsUtils.scheduledSnapshotLimitKey);
    if (limit != null) return limit;
    // 旧设置可能已把上限降到历史条数以下。首次确认新上限前保留现有容量。
    const legacyLimit = await settingsUtils.getLegacyScheduledSnapshotLimit();
    return Math.max(legacyLimit, recordCount ?? (await this.getScheduled()).length);
  }

  async getRecord(
    source: SnapshotRecord['source'] | ScheduledSnapshot['source'],
    id: string,
  ) {
    if (source === 'scheduled')
      return (await this.getScheduled()).find(item => item.id === id);
    const store = await this.getStore();
    if (source === 'auto') return store.auto?.id === id ? store.auto : undefined;
    return store.manual.find(item => item.id === id);
  }

  // 采集与恢复的互斥状态统一维护在这里，避免采集读到恢复中的窗口。
  isRestoringWindow(windowId: number) {
    return [...this.restoringWindows.values()].includes(windowId);
  }

  beginRestore(windowId: number | null) {
    const key = Symbol();
    this.restoringWindows.set(key, windowId);
    this.captureWindowIds?.add(windowId);
    return key;
  }

  updateRestore(key: symbol, windowId: number) {
    this.restoringWindows.set(key, windowId);
  }

  endRestore(key: symbol) {
    this.restoringWindows.delete(key);
  }

  beginScheduledCapture() {
    this.captureWindowIds = new Set(this.restoringWindows.values());
    return this.captureWindowIds;
  }

  endScheduledCapture() {
    this.captureWindowIds = undefined;
  }

  // 采集、焦点置顶及数量裁剪在同一后台队列中执行，避免覆盖并发写入。
  runScheduledUpdate<T>(operation: () => Promise<T>) {
    if (browser.extension.inIncognitoContext) return;
    const result = this.scheduledUpdates.then(operation).catch(error => {
      console.warn('Scheduled snapshots:', error);
    });
    this.scheduledUpdates = result;
    return result;
  }

  async saveScheduled(windows: ScheduledSnapshotWindow[], openWindowIds: number[]) {
    if (this.restoringOnStartup) return;
    let session = await storage.getItem<SnapshotSession>(this.scheduledSessionKey);
    if (!session) {
      session = { key: getRandomId(16), signatures: {} };
      await storage.setItem(this.scheduledSessionKey, session);
    }
    const records = await this.getScheduled();
    const limit = await this.getScheduledLimit(records.length);
    const additions: ScheduledSnapshot[] = [];
    const backfill: ScheduledSnapshot[] = [];
    const signatures: Record<number, string> = {};
    // 恢复期间跳过的窗口仍然打开，保留它们上次采集的摘要。
    for (const windowId of openWindowIds) {
      const signature = session.signatures[windowId];
      if (signature !== undefined) signatures[windowId] = signature;
    }
    const capturedAt = Date.now();
    const now = newCreateTime(capturedAt);
    let changed = false;
    for (const { windowId, focused, items } of windows) {
      const current = await getSnapshotSignature(items);
      signatures[windowId] = current;
      const previous = records.find(
        record => record.windowId === windowId && record.sessionKey === session.key,
      );
      // 优先比对保留的记录；被裁剪的窗口仍可用会话摘要去重。
      const previousSignature = previous
        ? await getSnapshotSignature(previous.items)
        : session.signatures[windowId];
      const sameContent = current === previousSignature;
      if (sameContent && previous) {
        const refreshed = refreshSnapshotItems(previous.items, items);
        if (refreshed !== previous.items) {
          Object.assign(previous, { updatedAt: now, items: refreshed });
          changed = true;
        }
        continue;
      }
      const record: ScheduledSnapshot = {
        source: 'scheduled',
        id: getRandomId(16),
        sessionKey: session.key,
        windowId,
        lastFocusedAt: previous?.lastFocusedAt ?? capturedAt,
        createdAt: now,
        updatedAt: now,
        name: `Snapshot-${windowId} ${now}`,
        items,
      };
      const target = sameContent ? backfill : additions;
      if (focused) target.unshift(record);
      else target.push(record);
    }
    // 给尚无历史的窗口补存一条，优先保留内容有变化的记录。
    const available = Math.max(0, limit - records.length - additions.length);
    additions.push(...backfill.slice(0, available));
    if (changed || additions.length) {
      const history = [...additions, ...records].sort(compareScheduledFocus);
      await storage.setItem(this.scheduledKey, history.slice(0, limit));
    }
    await storage.setItem(this.scheduledSessionKey, { key: session.key, signatures });
  }

  focusScheduledWindow(windowId: number) {
    if (windowId < 0) return;
    const lastFocusedAt = Date.now();
    return this.runScheduledUpdate(async () => {
      if (!(await Store.settingsUtils.getSettings())[SCHEDULED_SNAPSHOTS_ENABLED]) return;
      const session = await storage.getItem<SnapshotSession>(this.scheduledSessionKey);
      if (!session) return;
      const records = await this.getScheduled();
      const index = records.findIndex(
        record => record.windowId === windowId && record.sessionKey === session.key,
      );
      if (index < 0) return;
      const [record] = records.splice(index, 1);
      records.unshift({ ...record, lastFocusedAt });
      await storage.setItem(this.scheduledKey, records.sort(compareScheduledFocus));
    });
  }

  setScheduledLimit(limit: number, confirmedIds: string[] = []) {
    return this.runScheduledUpdate(async (): Promise<SnapshotLimitResult> => {
      const records = await this.getScheduled();
      const recordIds = records.slice(limit).map(record => record.id);
      if (
        recordIds.length &&
        (recordIds.length !== confirmedIds.length ||
          recordIds.some(id => !confirmedIds.includes(id)))
      ) {
        return { status: 'confirm', recordIds };
      }
      const key = Store.settingsUtils.scheduledSnapshotLimitKey;
      if (recordIds.length) {
        await storage.setItems([
          { key, value: limit },
          { key: this.scheduledKey, value: records.slice(0, limit) },
        ]);
      } else {
        await storage.setItem(key, limit);
      }
      return { status: 'saved' };
    });
  }
}

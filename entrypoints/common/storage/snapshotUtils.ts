import type {
  SnapshotGroupItem,
  SnapshotItem,
  SnapshotRecord,
  SnapshotStore,
  SnapshotTabItem,
  WindowSnapshotItem,
  WindowSnapshotTab,
} from '~/entrypoints/types';
import { getRandomId, newCreateTime } from '~/entrypoints/common/utils';
import Store from './instanceStore';

export const SNAPSHOT_STORE_VERSION = 2 as const;
export const MAX_MANUAL_SNAPSHOTS = 50;

const initialStore: SnapshotStore = {
  version: SNAPSHOT_STORE_VERSION,
  manual: [],
};

function legacyTabToSnapshot(tab: SnapshotTabItem): WindowSnapshotTab {
  return {
    type: 'tab',
    id: tab.tabId || getRandomId(12),
    title: tab.title || tab.url || '',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl,
    pinned: false,
    active: false,
  };
}

function convertLegacyItems(items: SnapshotItem[]): WindowSnapshotItem[] {
  const result = items.map(item => {
    if (item.type === 'group') {
      const group = item as SnapshotGroupItem;
      return {
        type: 'group' as const,
        id: group.groupId || getRandomId(12),
        title: group.groupName || '',
        color: 'grey' as const,
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

function createLegacyRecord(
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

export default class SnapshotUtils {
  storageKey: `local:${string}` = 'local:snapshots';
  store: SnapshotStore = initialStore;

  async getStore() {
    const stored = await storage.getItem<SnapshotStore>(this.storageKey);
    if (stored?.version === SNAPSHOT_STORE_VERSION) {
      this.store = {
        ...initialStore,
        ...stored,
        manual: stored.manual || [],
      };
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
    const autoItems = globalState.openedTabsAutoSave || [];
    const migrated: SnapshotStore = {
      ...initialStore,
      manual: manualItems.length ? [createLegacyRecord('manual', manualItems)] : [],
      auto: autoItems.length ? createLegacyRecord('auto', autoItems) : undefined,
    };

    await this.setStore(migrated);
    if (manualItems.length || autoItems.length) {
      await Store.stateUtils.setStateByModule('global', {
        openedTabsManualSave: undefined,
        openedTabsAutoSave: undefined,
      });
    }
    return migrated;
  }

  async addManual(record: SnapshotRecord, removeOldest = false) {
    const store = await this.getStore();
    if (store.manual.length >= MAX_MANUAL_SNAPSHOTS && !removeOldest) {
      return { saved: false as const, limitReached: true as const, store };
    }

    const manual = removeOldest
      ? [record, ...store.manual.slice(0, MAX_MANUAL_SNAPSHOTS - 1)]
      : [record, ...store.manual];
    await this.setStore({ ...store, manual });
    return { saved: true as const, limitReached: false as const, store: this.store };
  }

  async setAuto(record: SnapshotRecord) {
    const store = await this.getStore();
    return await this.setStore({ ...store, auto: record });
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
}

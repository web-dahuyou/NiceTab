import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { storage } from 'wxt/storage';
import { fakeBrowser } from 'wxt/testing';

// Mock 所有依赖模块（必须在 import 之前）
vi.mock('~/entrypoints/common/storage/instanceStore', () => ({
  default: {
    settingsUtils: {
      getSettings: vi.fn(),
      getLegacyScheduledSnapshotLimit: vi.fn(),
      scheduledSnapshotLimitKey: 'local:scheduledSnapshotLimit',
    },
  },
}));
vi.mock('~/entrypoints/common/storage/index', () => ({
  tabListUtils: {},
  settingsUtils: {},
  stateUtils: {},
}));

import SnapshotUtils, {
  isSnapshotRecord,
  normalizeAutoBuffer,
  convertLegacyItems,
  createLegacyRecord,
  legacyTabToSnapshot,
  SNAPSHOT_STORE_VERSION,
  MAX_MANUAL_SNAPSHOTS,
} from '../snapshotUtils';
import type {
  SnapshotItem,
  SnapshotGroupItem,
  SnapshotTabItem,
  SnapshotRecord,
  ScheduledSnapshotWindow,
} from '~/entrypoints/types';
import Store from '../instanceStore';

// ==========================================================================
// 常量
// ==========================================================================
describe('常量', () => {
  it('SNAPSHOT_STORE_VERSION 为 2', () => {
    expect(SNAPSHOT_STORE_VERSION).toBe(2);
  });

  it('MAX_MANUAL_SNAPSHOTS 为 50', () => {
    expect(MAX_MANUAL_SNAPSHOTS).toBe(50);
  });
});

// ==========================================================================
// isSnapshotRecord
// ==========================================================================
describe('isSnapshotRecord', () => {
  it('识别 SnapshotRecord 对象', () => {
    const record: SnapshotRecord = {
      id: '1',
      name: 'test',
      source: 'manual',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      items: [],
    };
    expect(isSnapshotRecord(record)).toBe(true);
  });

  it('拒绝数组（SnapshotItem[]）', () => {
    expect(isSnapshotRecord([])).toBe(false);
  });

  it('拒绝 undefined', () => {
    expect(isSnapshotRecord(undefined)).toBe(false);
  });

  it('拒绝没有 items 属性的对象', () => {
    expect(isSnapshotRecord({ id: '1' } as any)).toBe(false);
  });

  it('拒绝 items 非数组的对象', () => {
    expect(isSnapshotRecord({ items: 'not-array' } as any)).toBe(false);
  });
});

// ==========================================================================
// legacyTabToSnapshot
// ==========================================================================
describe('legacyTabToSnapshot', () => {
  it('转换基本标签数据', () => {
    const tab: SnapshotTabItem = {
      tabId: 't1',
      title: 'Example',
      url: 'https://example.com',
      favIconUrl: 'https://example.com/favicon.ico',
      type: 'tab',
    };
    const result = legacyTabToSnapshot(tab);
    expect(result.type).toBe('tab');
    expect(result.id).toBe('t1');
    expect(result.title).toBe('Example');
    expect(result.url).toBe('https://example.com');
    expect(result.favIconUrl).toBe('https://example.com/favicon.ico');
    expect(result.pinned).toBe(false);
    expect(result.active).toBe(false);
  });

  it('缺少 tabId 时生成随机 id', () => {
    const tab: SnapshotTabItem = { type: 'tab', url: 'https://example.com' };
    const result = legacyTabToSnapshot(tab);
    expect(result.id).toBeTruthy();
    expect(result.id).not.toBe('');
  });

  it('缺少 title 时使用 url 作为 fallback', () => {
    const tab: SnapshotTabItem = { type: 'tab', url: 'https://example.com' };
    const result = legacyTabToSnapshot(tab);
    expect(result.title).toBe('https://example.com');
  });

  it('title 和 url 都为空时使用空字符串', () => {
    const tab: SnapshotTabItem = { type: 'tab' };
    const result = legacyTabToSnapshot(tab);
    expect(result.title).toBe('');
    expect(result.url).toBe('');
  });
});

// ==========================================================================
// convertLegacyItems
// ==========================================================================
describe('convertLegacyItems', () => {
  it('转换标签组项', () => {
    const items: SnapshotItem[] = [
      {
        type: 'group',
        groupId: 'g1',
        groupName: 'My Group',
        createTime: '2024-01-01 00:00:00',
        bsGroupId: 123456,
        tabList: [{ tabId: 't1', title: 'Tab 1', url: 'https://a.com' }],
      } as SnapshotGroupItem,
    ];
    const result = convertLegacyItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('group');
    if (result[0].type === 'group') {
      expect(result[0].title).toBe('My Group');
      expect(result[0].color).toBe('grey');
      expect(result[0].collapsed).toBe(false);
      expect(result[0].tabs).toHaveLength(1);
    }
  });

  it('转换标签页项', () => {
    const items: SnapshotItem[] = [
      { type: 'tab', tabId: 't1', title: 'Tab', url: 'https://a.com' } as SnapshotTabItem,
    ];
    const result = convertLegacyItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tab');
  });

  it('第一个标签页被标记为 active', () => {
    const items: SnapshotItem[] = [
      { type: 'tab', tabId: 't1', title: 'A', url: 'https://a.com' } as SnapshotTabItem,
      { type: 'tab', tabId: 't2', title: 'B', url: 'https://b.com' } as SnapshotTabItem,
    ];
    const result = convertLegacyItems(items);
    const tabs = result.filter(i => i.type === 'tab');
    expect(tabs[0].active).toBe(true);
    expect(tabs[1].active).toBe(false);
  });

  it('无标签页时第一个标签组的第一个标签标记为 active', () => {
    const items: SnapshotItem[] = [
      {
        type: 'group',
        groupId: 'g1',
        groupName: 'Group',
        createTime: '2024-01-01 00:00:00',
        bsGroupId: 123456,
        tabList: [{ tabId: 't1', title: 'A', url: 'https://a.com' }],
      } as SnapshotGroupItem,
    ];
    const result = convertLegacyItems(items);
    if (result[0].type === 'group') {
      expect(result[0].tabs[0].active).toBe(true);
    }
  });

  it('空数组返回空数组', () => {
    expect(convertLegacyItems([])).toEqual([]);
  });
});

// ==========================================================================
// createLegacyRecord
// ==========================================================================
describe('createLegacyRecord', () => {
  it('创建 manual 类型记录', () => {
    const record = createLegacyRecord('manual', []);
    expect(record.source).toBe('manual');
    expect(record.name).toMatch(/^Snapshot/);
    expect(record.id).toBeTruthy();
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBeTruthy();
    expect(record.items).toEqual([]);
  });

  it('创建 auto 类型记录', () => {
    const record = createLegacyRecord('auto', []);
    expect(record.source).toBe('auto');
    expect(record.name).toMatch(/^Auto snapshot/);
  });

  it('转换传入的 items', () => {
    const items: SnapshotItem[] = [
      { type: 'tab', tabId: 't1', title: 'T', url: 'https://a.com' } as SnapshotTabItem,
    ];
    const record = createLegacyRecord('manual', items);
    expect(record.items).toHaveLength(1);
    expect(record.items[0].type).toBe('tab');
  });
});

// ==========================================================================
// normalizeAutoBuffer
// ==========================================================================
describe('normalizeAutoBuffer', () => {
  it('已是 SnapshotRecord 格式则直接返回', () => {
    const record: SnapshotRecord = {
      id: '1',
      name: 'test',
      source: 'auto',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      items: [],
    };
    expect(normalizeAutoBuffer(record)).toBe(record);
  });

  it('非空 SnapshotItem[] 转换为 SnapshotRecord', () => {
    const items: SnapshotItem[] = [
      { type: 'tab', tabId: 't1', title: 'T', url: 'https://a.com' } as SnapshotTabItem,
    ];
    const result = normalizeAutoBuffer(items);
    expect(result).toBeDefined();
    expect(result!.source).toBe('auto');
    expect(result!.items).toHaveLength(1);
  });

  it('空数组返回 undefined', () => {
    expect(normalizeAutoBuffer([])).toBeUndefined();
  });

  it('undefined 返回 undefined', () => {
    expect(normalizeAutoBuffer(undefined)).toBeUndefined();
  });
});

describe('定时快照历史', () => {
  let snapshots: SnapshotUtils;

  const capture = (
    windowId: number,
    url: string,
    title = url,
  ): ScheduledSnapshotWindow => ({
    windowId,
    focused: false,
    items: [{ type: 'tab', id: title, url, title, pinned: false, active: true }],
  });

  beforeEach(() => {
    fakeBrowser.reset();
    snapshots = new SnapshotUtils();
    vi.mocked(Store.settingsUtils.getSettings).mockResolvedValue({
      scheduledSnapshotsEnabled: true,
    });
    vi.mocked(Store.settingsUtils.getLegacyScheduledSnapshotLimit).mockResolvedValue(2);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-22T00:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('同会话同窗口的内容去重并更新元数据，内容变化或新会话保留新记录', async () => {
    await snapshots.setScheduledLimit(5);
    const url = 'https://example.test';
    await snapshots.saveScheduled([capture(7, url, 'Original')], [7]);
    const [original] = await snapshots.getScheduled();
    const initialUpdatedAt = original.updatedAt;

    vi.setSystemTime(Date.now() + 60000);
    await snapshots.saveScheduled([capture(7, url, 'Updated')], [7]);
    const [updated, extra] = await snapshots.getScheduled();
    expect(extra).toBeUndefined();
    expect(updated).toMatchObject({ id: original.id, createdAt: original.createdAt });
    expect(updated.updatedAt).not.toBe(initialUpdatedAt);
    expect(updated.items[0]).toMatchObject({ id: 'Original', title: 'Updated' });

    await snapshots.saveScheduled([capture(7, url + '/next')], [7]);
    await browser.storage.session.clear();
    await snapshots.saveScheduled([capture(7, url + '/next')], [7]);
    const records = await snapshots.getScheduled();
    expect(records).toHaveLength(3);
    expect(new Set(records.map(record => record.sessionKey)).size).toBe(2);
  });

  it('裁剪后仍记住打开窗口的内容，剩余容量增加后补存', async () => {
    await snapshots.setScheduledLimit(1);
    const first = { ...capture(1, 'https://first.test'), focused: true };
    const second = capture(2, 'https://second.test');
    await snapshots.saveScheduled([first, second], [1, 2]);
    const [kept] = await snapshots.getScheduled();
    expect(kept.windowId).toBe(1);

    vi.setSystemTime(Date.now() + 60000);
    await snapshots.saveScheduled([first, second], [1, 2]);
    expect((await snapshots.getScheduled()).map(record => record.id)).toEqual([kept.id]);

    await snapshots.setScheduledLimit(2);
    await snapshots.saveScheduled([first, second], [1, 2]);
    expect(
      (await snapshots.getScheduled()).map(record => record.windowId).sort(),
    ).toEqual([1, 2]);
  });

  it('按焦点调整保留顺序，删除对象变化后需要重新确认', async () => {
    const first = { ...capture(1, 'https://first.test'), focused: true };
    await snapshots.saveScheduled([first, capture(2, 'https://second.test')], [1, 2]);
    const [oldFirst, oldSecond] = await snapshots.getScheduled();
    await expect(snapshots.setScheduledLimit(1)).resolves.toEqual({
      status: 'confirm',
      recordIds: [oldSecond.id],
    });
    expect(
      await storage.getItem(Store.settingsUtils.scheduledSnapshotLimitKey),
    ).toBeNull();

    vi.setSystemTime(Date.now() + 60000);
    await snapshots.focusScheduledWindow(2);
    await expect(snapshots.setScheduledLimit(1, [oldSecond.id])).resolves.toEqual({
      status: 'confirm',
      recordIds: [oldFirst.id],
    });
    expect((await snapshots.getScheduled()).map(record => record.id)).toEqual([
      oldSecond.id,
      oldFirst.id,
    ]);

    await expect(snapshots.setScheduledLimit(1, [oldFirst.id])).resolves.toEqual({
      status: 'saved',
    });
    expect((await snapshots.getScheduled()).map(record => record.id)).toEqual([
      oldSecond.id,
    ]);
    expect(await snapshots.getScheduledLimit()).toBe(1);
  });

  it('采集和保留上限变更按顺序提交，前次失败后队列可继续执行', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let finish!: () => void;
    const pending = new Promise<void>(resolve => {
      finish = resolve;
    });
    const failing = snapshots.runScheduledUpdate(async () => {
      await pending;
      throw new Error('capture failed');
    });
    const saving = snapshots.setScheduledLimit(4);
    expect(
      await storage.getItem(Store.settingsUtils.scheduledSnapshotLimitKey),
    ).toBeNull();
    finish();

    await failing;
    await expect(saving).resolves.toEqual({ status: 'saved' });
    expect(await snapshots.getScheduledLimit()).toBe(4);
    expect(warn).toHaveBeenCalledWith('Scheduled snapshots:', expect.any(Error));
  });
});

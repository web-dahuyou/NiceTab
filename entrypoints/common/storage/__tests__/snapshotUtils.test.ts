import { describe, it, expect, vi } from 'vitest';

// Mock 所有依赖模块（必须在 import 之前）
vi.mock('~/entrypoints/common/storage/instanceStore', () => ({
  default: class Store {},
}));
vi.mock('~/entrypoints/common/storage/index', () => ({
  tabListUtils: {},
  settingsUtils: {},
  stateUtils: {},
}));

import {
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
} from '~/entrypoints/types';

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

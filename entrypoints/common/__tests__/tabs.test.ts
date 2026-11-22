import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WindowSnapshotTab } from '~/entrypoints/types';
import { settingsUtils, snapshotUtils } from '../storage';
import {
  createNewWindowForOpen,
  openNewGroup,
  removeNewWindowBlankTabs,
  restoreSnapshotRecord,
  saveScheduledWindowSnapshots,
} from '../tabs';

const {
  createWindow,
  getWindow,
  getWindows,
  createTab,
  queryTabs,
  removeTabs,
  groupTabs,
  updateTab,
} = vi.hoisted(() => ({
  createWindow: vi.fn(),
  getWindow: vi.fn(),
  getWindows: vi.fn(),
  createTab: vi.fn(),
  queryTabs: vi.fn(),
  removeTabs: vi.fn(),
  groupTabs: vi.fn(),
  updateTab: vi.fn(),
}));
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: { getURL: (path: string) => 'chrome-extension://nicetab' + path },
    windows: { create: createWindow, get: getWindow, getAll: getWindows },
    tabs: {
      create: createTab,
      query: queryTabs,
      remove: removeTabs,
      group: groupTabs,
      update: updateTab,
    },
    tabGroups: { update: vi.fn() },
  },
}));
vi.mock('../storage', () => ({
  settingsUtils: { getSettings: vi.fn(async () => ({})) },
  snapshotUtils: {
    restoringOnStartup: false,
    beginScheduledCapture: vi.fn(),
    endScheduledCapture: vi.fn(),
    saveScheduled: vi.fn(),
    isRestoringWindow: vi.fn(),
    beginRestore: vi.fn(),
    updateRestore: vi.fn(),
    endRestore: vi.fn(),
  },
}));
vi.mock('~/entrypoints/common/utils', () => ({
  isGroupSupported: () => true,
  getRandomId: () => 'generated-id',
}));
vi.mock('~/entrypoints/common/locale', () => ({ getCustomLocaleMessages: vi.fn() }));

describe('恢复到新窗口', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(settingsUtils.getSettings).mockResolvedValue({});
  });

  it('无有效 URL 时不创建窗口', async () => {
    expect(await openNewGroup('group', [undefined, ' '], { newWindow: true })).toBe(
      false,
    );
    expect(createWindow).not.toHaveBeenCalled();
  });

  it('首个请求失败后仍等待后续创建结束，再仅清理初始页', async () => {
    createWindow.mockResolvedValue({ id: 7, tabs: [{ id: 10 }] });
    const { windowId, initialTabIds } = await createNewWindowForOpen();
    let finish!: (tab: { id: number }) => void;
    createTab.mockRejectedValueOnce(new Error('creation failed')).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    queryTabs.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    const restoring = openNewGroup('group', ['https://a.test', 'https://b.test'], {
      windowId,
    }).finally(() => removeNewWindowBlankTabs(windowId, initialTabIds));
    const failed = expect(restoring).rejects.toThrow('creation failed');
    await vi.waitFor(() => expect(createTab).toHaveBeenCalledTimes(2));
    expect(queryTabs).not.toHaveBeenCalled();
    expect(removeTabs).not.toHaveBeenCalled();
    finish({ id: 11 });
    await failed;
    expect(removeTabs).toHaveBeenCalledWith([10]);
    expect(groupTabs).not.toHaveBeenCalled();
  });

  it('创建成功但分组失败时保留所有内容页', async () => {
    createTab.mockResolvedValueOnce({ id: 11 }).mockResolvedValueOnce({ id: 12 });
    groupTabs.mockRejectedValueOnce(new Error('group failed'));
    queryTabs.mockResolvedValue([{ id: 10 }, { id: 11 }, { id: 12 }]);
    await expect(
      openNewGroup('group', ['https://a.test', 'https://b.test'], {
        windowId: 7,
      }).finally(() => removeNewWindowBlankTabs(7, [10])),
    ).rejects.toThrow('group failed');
    expect(removeTabs).toHaveBeenCalledWith([10]);
  });

  it('未成功打开任何页时只关闭仍存在的初始页', async () => {
    queryTabs.mockResolvedValue([{ id: 10 }]);
    await removeNewWindowBlankTabs(7, [9, 10]);
    expect(removeTabs).toHaveBeenCalledWith([10]);
  });
});

describe('定时快照采集及恢复', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(settingsUtils.getSettings).mockResolvedValue({
      scheduledSnapshotsEnabled: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('采集只保存可用窗口，被跳过的恢复窗口仍计入打开窗口 ID', async () => {
    const restoring = new Set<number | null>([2]);
    vi.mocked(snapshotUtils.beginScheduledCapture).mockReturnValue(restoring);
    getWindows.mockImplementation(async () => {
      restoring.add(3);
      return [
        {
          id: 1,
          focused: true,
          tabs: [
            { id: 11, url: 'chrome-extension://nicetab/options.html#/snapshots' },
            { id: 12, pendingUrl: 'https://one.test', active: true, pinned: true },
          ],
        },
        { id: 2, tabs: [{ id: 20, url: 'https://two.test' }] },
        { id: 3, tabs: [{ id: 30, url: 'https://three.test' }] },
        { id: 4, incognito: true, tabs: [{ id: 40, url: 'https://private.test' }] },
        { id: 5, tabs: [] },
      ];
    });

    await saveScheduledWindowSnapshots();

    expect(getWindows).toHaveBeenCalledWith({ populate: true, windowTypes: ['normal'] });
    expect(snapshotUtils.saveScheduled).toHaveBeenCalledWith(
      [
        {
          windowId: 1,
          focused: true,
          items: [
            expect.objectContaining({
              url: 'https://one.test',
              pinned: true,
              active: true,
            }),
          ],
        },
      ],
      [1, 2, 3, 5],
    );
    expect(snapshotUtils.endScheduledCapture).toHaveBeenCalledTimes(1);
  });

  it('新恢复窗口尚无 ID 时暂停采集并释放采集状态', async () => {
    vi.mocked(snapshotUtils.beginScheduledCapture).mockReturnValue(new Set([null]));

    await saveScheduledWindowSnapshots();

    expect(getWindows).not.toHaveBeenCalled();
    expect(snapshotUtils.saveScheduled).not.toHaveBeenCalled();
    expect(snapshotUtils.endScheduledCapture).toHaveBeenCalledTimes(1);
  });

  it.each(['partial', 'success'] as const)(
    '替换当前窗口的 %s 结果按创建情况处理原标签页',
    async status => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const key = Symbol('restore');
      vi.mocked(snapshotUtils.beginRestore).mockReturnValue(key);
      getWindow.mockResolvedValue({ id: 7, tabs: [{ id: 1 }, { id: 2 }, { id: 3 }] });
      queryTabs.mockResolvedValue([{ id: 2 }]);
      createTab.mockResolvedValueOnce({ id: 11, pinned: true });
      if (status === 'partial')
        createTab.mockRejectedValueOnce(new Error('creation failed'));
      else createTab.mockResolvedValueOnce({ id: 12, pinned: true });
      const items: WindowSnapshotTab[] = ['first', 'second'].map(name => ({
        type: 'tab',
        id: name,
        title: name,
        url: `https://${name}.test`,
        pinned: true,
        active: name === 'first',
      }));

      await expect(
        restoreSnapshotRecord({ items }, 'replaceCurrent', { id: 1, windowId: 7 }),
      ).resolves.toEqual({ status });

      expect(getWindow).toHaveBeenCalledWith(7, { populate: true });
      expect(createTab).toHaveBeenCalledTimes(2);
      expect(updateTab).toHaveBeenCalledWith(11, { active: true });
      if (status === 'partial') {
        expect(removeTabs).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledWith('Error restoring snapshot', expect.any(Error));
      } else {
        expect(removeTabs).toHaveBeenCalledWith([3]);
      }
      expect(snapshotUtils.endRestore).toHaveBeenCalledWith(key);
    },
  );
});

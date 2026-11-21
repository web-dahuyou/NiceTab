import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewWindowForOpen, openNewGroup, removeNewWindowBlankTabs } from '../tabs';

const { createWindow, createTab, queryTabs, removeTabs, groupTabs } = vi.hoisted(() => ({
  createWindow: vi.fn(),
  createTab: vi.fn(),
  queryTabs: vi.fn(),
  removeTabs: vi.fn(),
  groupTabs: vi.fn(),
}));
vi.mock('wxt/browser', () => ({
  browser: {
    windows: { create: createWindow },
    tabs: { create: createTab, query: queryTabs, remove: removeTabs, group: groupTabs },
    tabGroups: { update: vi.fn() },
  },
}));
vi.mock('../storage', () => ({ settingsUtils: { getSettings: async () => ({}) } }));
vi.mock('~/entrypoints/common/utils', () => ({ isGroupSupported: () => true }));
vi.mock('~/entrypoints/common/locale', () => ({ getCustomLocaleMessages: vi.fn() }));

describe('恢复到新窗口', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

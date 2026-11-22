import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { groupTarget, openTabs, tabTarget, type OpenTarget } from '../openUtils';
import { incognitoUtils } from '../storage';
import {
  createNewWindowForOpen,
  openNewGroup,
  openNewTab,
  removeNewWindowBlankTabs,
} from '../tabs';

const { getCurrent, create, isAllowedIncognitoAccess } = vi.hoisted(() => ({
  getCurrent: vi.fn(),
  create: vi.fn(),
  isAllowedIncognitoAccess: vi.fn(),
}));
vi.mock('wxt/browser', () => ({
  browser: {
    extension: { isAllowedIncognitoAccess },
    runtime: { getURL: (path: string) => 'chrome-extension://nicetab' + path },
    windows: { getCurrent, create },
  },
}));
vi.mock('../storage', () => ({
  settingsUtils: { getSettings: async () => ({ namedGroupRestoreAsGroup: true }) },
  incognitoUtils: {
    setTask: vi.fn(),
    waitResult: vi.fn(),
    removeTask: vi.fn(),
    removeResult: vi.fn(),
  },
}));
vi.mock('../tabs', () => ({
  createNewWindowForOpen: vi.fn(),
  openNewGroup: vi.fn(),
  openNewTab: vi.fn(),
  removeNewWindowBlankTabs: vi.fn(),
}));
vi.mock('../utils', () => ({ getRandomId: () => 'private-task' }));

const first = tabTarget({ tabId: 'first', url: 'https://first.test' }, { active: true });
const second = tabTarget({ tabId: 'second', url: 'https://second.test' });

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('打开已保存标签页', () => {
  it('在当前窗口打开整批标签页并返回实际成功的 ID', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    getCurrent.mockResolvedValue({ id: 9 });
    vi.mocked(openNewTab)
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce({
        id: 44,
        windowId: 9,
        index: 1,
        pinned: false,
        active: false,
        highlighted: false,
        incognito: false,
      });

    await expect(openTabs([first, second], 'current', undefined, true)).resolves.toEqual({
      processedIds: ['second'],
      failed: true,
    });
    expect(openNewTab).toHaveBeenNthCalledWith(1, 'https://first.test', {
      active: true,
      windowId: 9,
    });
    expect(openNewTab).toHaveBeenNthCalledWith(2, 'https://second.test', { windowId: 9 });
    expect(createNewWindowForOpen).not.toHaveBeenCalled();
  });

  it('新窗口部分失败时回传已创建的选中页并清理初始页', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const target = groupTarget(
      {
        groupId: 'g',
        groupName: 'Group',
        tabList: [
          { tabId: 'a', url: 'https://a.test' },
          { tabId: 'blank', url: ' ' },
          { tabId: 'b', url: 'https://b.test' },
        ],
      },
      true,
    );
    vi.mocked(createNewWindowForOpen).mockResolvedValue({
      windowId: 10,
      initialTabIds: [12],
    });
    vi.mocked(openNewGroup).mockImplementation(async (_name, _urls, options) => {
      options?.onTabCreated?.(1);
      throw new Error('partial open');
    });

    await expect(openTabs([target, second], 'newWindow')).resolves.toEqual({
      processedIds: ['b'],
      failed: true,
    });
    expect(openNewGroup).toHaveBeenCalledWith(
      'Group',
      ['https://a.test', 'https://b.test'],
      expect.objectContaining({ windowId: 10, asGroup: true }),
    );
    expect(removeNewWindowBlankTabs).toHaveBeenCalledWith(10, [12]);
    expect(openNewTab).not.toHaveBeenCalled();
  });

  it('无痕权限被拒绝时返回可识别的拒绝结果', async () => {
    isAllowedIncognitoAccess.mockResolvedValue(false);
    await expect(openTabs([first], 'incognito')).resolves.toEqual({
      processedIds: [],
      failed: true,
      permissionDenied: true,
    });
    expect(incognitoUtils.setTask).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each(['complete', 'timeout', 'creation failure'] as const)(
    '无痕任务在 %s 后清理请求和结果',
    async outcome => {
      isAllowedIncognitoAccess.mockResolvedValue(true);
      const targets: OpenTarget[] = [first, second];
      const reply = {
        id: 'private-task',
        processedIds: ['first'],
        failed: true,
        finishedAt: 10,
      };
      vi.mocked(incognitoUtils.waitResult).mockResolvedValue(
        outcome === 'complete' ? reply : null,
      );
      if (outcome === 'creation failure')
        create.mockRejectedValue(new Error('window failed'));
      const opening = openTabs(targets, 'incognito');
      if (outcome === 'creation failure')
        await expect(opening).rejects.toThrow('window failed');
      else
        await expect(opening).resolves.toEqual(
          outcome === 'complete' ? reply : { processedIds: [], failed: true },
        );

      expect(incognitoUtils.setTask).toHaveBeenCalledWith({
        id: 'private-task',
        targets,
        createdAt: expect.any(Number),
      });
      expect(create).toHaveBeenCalledWith({
        focused: true,
        incognito: true,
        url: 'chrome-extension://nicetab/incognito-open.html#private-task',
      });
      expect(incognitoUtils.removeTask).toHaveBeenCalledWith('private-task');
      expect(incognitoUtils.removeResult).toHaveBeenCalledWith('private-task');
    },
  );
});

import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Runtime } from 'wxt/browser';
import { OPEN_SAVED_TABS_PORT, openTabs } from '~/entrypoints/common/openUtils';
import { snapshotUtils, tabListUtils } from '~/entrypoints/common/storage';
import tabUtils from '~/entrypoints/common/tabs';
import {
  requestSnapshotAction,
  SNAPSHOT_ACTION_PORT,
} from '~/entrypoints/common/utils/runtimeMsg';
import type { ScheduledSnapshot, SnapshotPortRequest } from '~/entrypoints/types';
import { initPortMessageListener } from '../portMessage';

const { addListener, connect } = vi.hoisted(() => ({
  addListener: vi.fn(),
  connect: vi.fn(),
}));
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      id: 'nicetab',
      getURL: (path: string) => 'chrome-extension://nicetab' + path,
      onConnect: { addListener },
      connect,
    },
  },
}));
vi.mock('~/entrypoints/common/storage', () => ({
  snapshotUtils: { setScheduledLimit: vi.fn(), getRecord: vi.fn() },
  tabListUtils: { getTagList: vi.fn() },
}));
vi.mock('~/entrypoints/common/tabs', () => ({
  default: { restoreSnapshotRecord: vi.fn() },
}));
vi.mock('~/entrypoints/common/openUtils', async importOriginal => ({
  ...(await importOriginal<typeof import('~/entrypoints/common/openUtils')>()),
  openTabs: vi.fn(),
}));

const tab = {
  id: 3,
  windowId: 50,
  index: 0,
  highlighted: false,
  active: true,
  pinned: false,
  incognito: false,
};
const sender = {
  id: 'nicetab',
  url: 'chrome-extension://nicetab/options.html#/snapshots',
  tab,
};
const record: ScheduledSnapshot = {
  id: 'snapshot',
  name: 'History',
  source: 'scheduled',
  sessionKey: 'session',
  windowId: 40,
  createdAt: '',
  updatedAt: '',
  items: [],
};
const restore: SnapshotPortRequest<'restore'> = {
  action: 'restore',
  source: 'scheduled',
  id: record.id,
  mode: 'replaceCurrent',
};

function port(name: string, from: Runtime.MessageSender) {
  const receive = vi.fn<[(request: unknown) => Promise<void>], void>();
  const postMessage = vi.fn();
  for (const [listen] of addListener.mock.calls) {
    listen({ name, sender: from, onMessage: { addListener: receive }, postMessage });
  }
  return { send: receive.mock.calls[0][0], postMessage };
}

beforeEach(() => {
  vi.resetAllMocks();
  initPortMessageListener();
});
afterEach(() => {
  vi.restoreAllMocks();
});

it('从快照页提交恢复请求，后台按快照 ID 读取记录并回传结果', async () => {
  vi.mocked(snapshotUtils.getRecord).mockResolvedValue(record);
  vi.mocked(tabUtils.restoreSnapshotRecord).mockResolvedValue({ status: 'partial' });
  const server = port(SNAPSHOT_ACTION_PORT, sender);
  const disconnect = vi.fn();
  connect.mockReturnValue({
    onDisconnect: { addListener: vi.fn() },
    onMessage: {
      addListener: (reply: (result: unknown) => void) => {
        server.postMessage.mockImplementation(reply);
      },
    },
    postMessage: server.send,
    disconnect,
  });

  await expect(requestSnapshotAction(restore)).resolves.toEqual({ status: 'partial' });
  expect(connect).toHaveBeenCalledWith({ name: SNAPSHOT_ACTION_PORT });
  expect(snapshotUtils.getRecord).toHaveBeenCalledWith('scheduled', 'snapshot');
  expect(tabUtils.restoreSnapshotRecord).toHaveBeenCalledWith(
    record,
    'replaceCurrent',
    tab,
  );
  expect(disconnect).toHaveBeenCalledTimes(1);
});

it('验证快照请求来源和参数，并原样回传需要确认的裁剪对象', async () => {
  const unrelated = port(SNAPSHOT_ACTION_PORT, { ...sender, url: 'https://site.test' });
  await unrelated.send(restore);
  expect(unrelated.postMessage).toHaveBeenCalledWith({ status: 'failed' });
  expect(snapshotUtils.getRecord).not.toHaveBeenCalled();

  const settings = port(SNAPSHOT_ACTION_PORT, sender);
  await settings.send({ action: 'setLimit', limit: 0 });
  expect(snapshotUtils.setScheduledLimit).not.toHaveBeenCalled();
  vi.mocked(snapshotUtils.setScheduledLimit).mockResolvedValue({
    status: 'confirm',
    recordIds: ['removed'],
  });
  await settings.send({ action: 'setLimit', limit: 1, confirmedIds: ['old'] });
  expect(snapshotUtils.setScheduledLimit).toHaveBeenCalledWith(1, ['old']);
  expect(settings.postMessage.mock.calls).toEqual([
    [{ status: 'failed' }],
    [{ status: 'confirm', recordIds: ['removed'] }],
  ]);
});

it('页面在恢复完成前断开时，后台仍等待恢复并处理回执失败', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(snapshotUtils.getRecord).mockResolvedValue(record);
  let finish!: (result: { status: 'success' }) => void;
  vi.mocked(tabUtils.restoreSnapshotRecord).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const server = port(SNAPSHOT_ACTION_PORT, sender);
  const result = server.send(restore);
  await vi.waitFor(() => expect(tabUtils.restoreSnapshotRecord).toHaveBeenCalledTimes(1));
  expect(server.postMessage).not.toHaveBeenCalled();
  server.postMessage.mockImplementation(() => {
    throw new Error('page closed');
  });
  finish({ status: 'success' });
  await result;
  expect(warn).toHaveBeenCalledWith('Snapshot page disconnected', expect.any(Error));
});

it('网页内搜索按保存 ID 读取 URL，延续发起窗口并报告缺失条目', async () => {
  const search = port(OPEN_SAVED_TABS_PORT, { ...sender, url: 'https://site.test' });
  vi.mocked(tabListUtils.getTagList).mockResolvedValue([
    {
      tagId: 'tag',
      tagName: 'Tag',
      createTime: '',
      groupList: [
        {
          groupId: 'group',
          groupName: 'Group',
          createTime: '',
          tabList: [{ tabId: 'saved', url: 'https://saved.test' }],
        },
      ],
    },
  ]);
  vi.mocked(openTabs).mockResolvedValue({ processedIds: ['saved'], failed: false });
  await search.send({
    mode: 'current',
    tabs: [
      { id: 'saved', url: 'https://not-stored.test', active: true },
      { id: 'deleted' },
    ],
  });
  expect(openTabs).toHaveBeenCalledWith(
    [{ id: 'saved', url: 'https://saved.test', active: true, discard: undefined }],
    'current',
    50,
    true,
  );
  expect(search.postMessage).toHaveBeenCalledWith({
    processedIds: ['saved'],
    failed: true,
  });
});

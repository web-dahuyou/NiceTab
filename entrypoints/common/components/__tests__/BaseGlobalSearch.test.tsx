// @vitest-environment happy-dom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ConfigProvider, message } from 'antd';
import { useContext, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

import { GlobalContext } from '~/entrypoints/common/hooks/global';
import commonMessages from '~/entrypoints/common/locale/modules/common/enUS';
import homeMessages from '~/entrypoints/common/locale/modules/home/enUS';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import MoveToModal from '~/entrypoints/options/home/MoveToModal';
import { eventEmitter as homeEventEmitter } from '~/entrypoints/options/home/hooks/homeCustomEvent';
import type { GroupItem, TagItem, TabItem } from '~/entrypoints/types';

import { GlobalSearchPanel } from '../BaseGlobalSearch';

vi.mock('~/entrypoints/common/storage', () => ({
  settingsUtils: { getSettings: vi.fn() },
  tabListUtils: {
    getTagList: vi.fn(),
    addTag: vi.fn(),
    createTabGroup: vi.fn(),
    tabsMoveThrough: vi.fn(),
    tabMoveThrough: vi.fn(),
  },
}));

const error = vi.fn();
const warning = vi.fn();
const createTime = '2024-01-01';
const first = { tabId: 'first', title: 'Matching first', url: 'https://first.test' };
const second = { tabId: 'second', title: 'Matching second', url: 'https://second.test' };
const other = { tabId: 'other', title: 'Unrelated tab', url: 'https://other.test' };

function group(groupId: string, groupName: string, tabList: TabItem[] = []): GroupItem {
  return { groupId, groupName, createTime, tabList };
}

function tag(tagId: string, tagName: string, groupList: GroupItem[] = []): TagItem {
  return { tagId, tagName, createTime, groupList };
}

function TestProviders({ children }: { children: ReactNode }) {
  const global = useContext(GlobalContext);
  return (
    <ConfigProvider
      prefixCls="nicetab"
      virtual={false}
      theme={{ token: { motion: false } }}
    >
      <IntlProvider locale="en-US" messages={{ ...commonMessages, ...homeMessages }}>
        <GlobalContext.Provider
          value={{ ...global, $message: { ...message, error, warning } }}
        >
          {children}
        </GlobalContext.Provider>
      </IntlProvider>
    </ConfigProvider>
  );
}

async function triggerSearchMessage(msgType: string) {
  await act(async () => {
    await fakeBrowser.runtime.onMessage.trigger({ msgType }, {});
  });
}

function queryDialog(title: string) {
  return screen
    .queryAllByRole('dialog')
    .find(dialog =>
      within(dialog).queryByText(title, { selector: '.nicetab-modal-title' }),
    );
}

async function findDialog(title: string) {
  return waitFor(() => {
    const dialog = queryDialog(title);
    if (!dialog) throw new Error(`Expected the ${title} dialog to be open`);
    return dialog;
  });
}

async function openSearchWithSelection() {
  render(<GlobalSearchPanel />, { wrapper: TestProviders });
  await triggerSearchMessage('action:open-global-search-modal');
  const search = within(await findDialog('Global Search'));
  fireEvent.click(search.getByRole('switch'));
  fireEvent.click(await search.findByText(first.title));
  fireEvent.click(await search.findByText(second.title));
  expect(search.getByText('2 Tabs Selected')).toBeTruthy();
  return search;
}

async function moveDialog() {
  return within(await findDialog('Move To'));
}

function pressEscape(dialog: HTMLElement) {
  fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape', keyCode: 27 });
}

async function submitName(dialogName: string, name: string) {
  const form = within(await findDialog(dialogName));
  fireEvent.change(form.getByRole('textbox'), { target: { value: name } });
  fireEvent.click(form.getByRole('button', { name: 'OK' }));
}

beforeEach(() => {
  fakeBrowser.reset();
  vi.resetAllMocks();
  const snapshot = [
    tag('source-tag', 'Source', [
      group('source-a', 'Source A', [first, other]),
      group('source-b', 'Source B', [second]),
    ]),
    tag('empty-tag', 'Empty category'),
    tag('target-tag', 'Target category', [
      group('target-group', 'Available group'),
      { ...group('locked-group', 'Locked group'), isLocked: true },
    ]),
  ];
  vi.mocked(settingsUtils.getSettings).mockResolvedValue({ language: 'en-US' });
  vi.mocked(tabListUtils.getTagList).mockImplementation(async () =>
    structuredClone(snapshot),
  );
  vi.mocked(tabListUtils.tabMoveThrough).mockResolvedValue(true);
  vi.mocked(tabListUtils.addTag).mockImplementation(async data => {
    const created = tag('new-tag', data?.tagName || '');
    snapshot.push(created);
    return created;
  });
  vi.mocked(tabListUtils.createTabGroup).mockImplementation(async (tagId, data) => {
    const created = group('new-group', data?.groupName || '');
    snapshot.find(item => item.tagId === tagId)?.groupList.push(created);
    return { tagId, tabGroup: created };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('创建目标后的刷新保留搜索与勾选，Esc 逐层关闭弹窗', async () => {
  const emit = vi.spyOn(homeEventEmitter, 'emit');
  const search = await openSearchWithSelection();
  const query = search.getByRole<HTMLInputElement>('combobox');
  fireEvent.change(query, { target: { value: 'matching' } });
  await waitFor(() => expect(search.queryByText(other.title)).toBeNull());

  fireEvent.click(search.getByTitle('Move To'));
  const move = await moveDialog();
  const createTag = move.getByRole('button', { name: /Create Tag/ });
  fireEvent.click(createTag);
  pressEscape(await findDialog('Create Tag'));
  await waitFor(() => expect(queryDialog('Create Tag')).toBeUndefined());
  expect(queryDialog('Move To')).toBeTruthy();

  fireEvent.click(createTag);
  await submitName('Create Tag', 'New category');
  expect(await move.findByText('New category')).toBeTruthy();
  fireEvent.click(move.getByRole('button', { name: /Create Tab Group/ }));
  await submitName('Create Tab Group', 'New group');
  expect(await move.findByText('New group')).toBeTruthy();
  expect(emit.mock.calls).toEqual([
    ['home:treeDataHook', { action: 'init', params: [] }],
    ['home:treeDataHook', { action: 'init', params: [] }],
  ]);

  await triggerSearchMessage('action:refresh-global-search-modal');
  pressEscape(await findDialog('Move To'));
  await waitFor(() => expect(queryDialog('Move To')).toBeUndefined());
  expect(queryDialog('Global Search')).toBeTruthy();
  expect(query.value).toBe('matching');
  expect(search.queryByText(other.title)).toBeNull();
  expect(search.getByText('2 Tabs Selected')).toBeTruthy();
});

it('禁止锁定目标，零条成功时保留弹窗，部分成功时保留未处理条目的勾选', async () => {
  vi.mocked(tabListUtils.tabsMoveThrough)
    .mockResolvedValueOnce({ processedTabIds: [] })
    .mockResolvedValueOnce({ processedTabIds: [first.tabId] });
  const search = await openSearchWithSelection();
  fireEvent.click(search.getByTitle('Move To'));
  const move = await moveDialog();
  fireEvent.click(await move.findByText('Target category'));
  const confirm = move.getByRole<HTMLButtonElement>('button', { name: 'OK' });
  expect(confirm.disabled).toBe(true);
  fireEvent.click(move.getByText('Locked group'));
  expect(confirm.disabled).toBe(true);
  fireEvent.click(move.getByText('Available group'));
  expect(confirm.disabled).toBe(false);

  fireEvent.click(confirm);
  await waitFor(() =>
    expect(error).toHaveBeenCalledWith(commonMessages['common.operationFailed']),
  );
  expect(queryDialog('Move To')).toBeTruthy();
  expect(search.getByText('2 Tabs Selected')).toBeTruthy();

  fireEvent.click(confirm);
  await waitFor(() => expect(queryDialog('Move To')).toBeUndefined());
  expect(warning).toHaveBeenCalledWith(homeMessages['home.treeNodeBatch.failed']);
  const request = {
    tabs: [
      { ...first, groupId: 'source-a' },
      { ...second, groupId: 'source-b' },
    ],
    targetTagId: 'target-tag',
    targetGroupId: 'target-group',
    isCopy: false,
    autoMerge: false,
  };
  expect(vi.mocked(tabListUtils.tabsMoveThrough).mock.calls).toEqual([
    [request],
    [request],
  ]);
  expect(search.getByText('1 Tab Selected')).toBeTruthy();
  const selectedRow = search
    .getByText(second.title)
    .closest<HTMLElement>('.search-list-item');
  expect(selectedRow?.querySelector('input')?.checked).toBe(true);
});

it('组内移动可在空分类建组，创建后以新组为目标', async () => {
  render(<MoveToModal visible moveData={{ groupId: 'source-a', tabs: [first] }} />, {
    wrapper: TestProviders,
  });
  const move = await moveDialog();
  fireEvent.click(await move.findByText('Empty category'));
  const confirm = move.getByRole<HTMLButtonElement>('button', { name: 'OK' });
  expect(confirm.disabled).toBe(true);
  fireEvent.click(move.getByRole('button', { name: /Create Tab Group/ }));
  await submitName('Create Tab Group', 'New group');
  expect(await move.findByText('New group')).toBeTruthy();
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(tabListUtils.tabMoveThrough).toHaveBeenCalledWith({
      sourceGroupId: 'source-a',
      targetTagId: 'empty-tag',
      targetGroupId: 'new-group',
      tabs: [first],
      isCopy: false,
      autoMerge: false,
    }),
  );
});

it('组内移动确认时目标组已删除，提示失败并允许重新选组', async () => {
  const onOk = vi.fn();
  vi.mocked(tabListUtils.tabMoveThrough).mockResolvedValueOnce(false);
  render(
    <MoveToModal visible moveData={{ groupId: 'source-a', tabs: [first] }} onOk={onOk} />,
    { wrapper: TestProviders },
  );
  const move = await moveDialog();
  fireEvent.click(await move.findByText('Target category'));
  fireEvent.click(move.getByText('Available group'));
  const confirm = move.getByRole<HTMLButtonElement>('button', { name: 'OK' });
  expect(confirm.disabled).toBe(false);

  vi.mocked(tabListUtils.getTagList).mockResolvedValueOnce([
    tag('target-tag', 'Target category', [group('replacement', 'Replacement group')]),
  ]);
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(error).toHaveBeenCalledWith(commonMessages['common.operationFailed']),
  );
  expect(queryDialog('Move To')).toBeTruthy();
  expect(onOk).not.toHaveBeenCalled();
  expect(move.queryByText('Available group')).toBeNull();
  expect(confirm.disabled).toBe(true);

  fireEvent.click(move.getByText('Replacement group'));
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(onOk).toHaveBeenCalledWith({
      targetTagId: 'target-tag',
      targetGroupId: 'replacement',
    }),
  );
});

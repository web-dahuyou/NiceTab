// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useContext, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';
import { GlobalContext } from '~/entrypoints/common/hooks/global';
import commonMessages from '~/entrypoints/common/locale/modules/common/enUS';
import homeMessages from '~/entrypoints/common/locale/modules/home/enUS';
import snapshotMessages from '~/entrypoints/common/locale/modules/snapshots/enUS';
import { snapshotUtils } from '~/entrypoints/common/storage';
import { requestSnapshotAction } from '~/entrypoints/common/utils/runtimeMsg';
import type { ScheduledSnapshot } from '~/entrypoints/types';
import SnapshotsPage from '..';

vi.mock('~/entrypoints/common/storage', () => ({
  snapshotUtils: { getStore: vi.fn(), getScheduled: vi.fn() },
  initSnapshotStorageListener: () => () => {},
  initScheduledSnapshotStorageListener: () => () => {},
}));
vi.mock('~/entrypoints/common/storage/snapshotUtils', () => ({
  MAX_MANUAL_SNAPSHOTS: 50,
}));
vi.mock('~/entrypoints/common/tabs', () => ({ saveOpenedTabsAsSnapshot: vi.fn() }));
vi.mock('~/entrypoints/common/utils/runtimeMsg', () => ({
  requestSnapshotAction: vi.fn(),
}));
vi.mock('~/entrypoints/options/components/SidebarLayout', () => ({
  default: ({ innerContent }: { innerContent: ReactNode }) => (
    <aside>{innerContent}</aside>
  ),
}));
vi.mock('../SnapshotDetails', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('从定时记录发起恢复，等待后台回执后展示成功反馈', async () => {
  const success = vi.fn();
  const record: ScheduledSnapshot = {
    id: 'scheduled-id',
    source: 'scheduled',
    windowId: 7,
    sessionKey: 'session',
    name: 'Scheduled history record',
    createdAt: '2026-11-22',
    updatedAt: '2026-11-22',
    items: [],
  };
  vi.mocked(snapshotUtils.getStore).mockResolvedValue({ version: 2, manual: [] });
  vi.mocked(snapshotUtils.getScheduled).mockResolvedValue([record]);
  let finish!: (status: { status: 'success' }) => void;
  vi.mocked(requestSnapshotAction).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve as typeof finish;
      }),
  );
  function Context({ children }: { children: ReactNode }) {
    const value = useContext(GlobalContext);
    return (
      <GlobalContext.Provider
        value={{ ...value, $message: { ...value.$message, success } }}
      >
        {children}
      </GlobalContext.Provider>
    );
  }
  render(
    <IntlProvider
      locale="en-US"
      messages={{
        ...commonMessages,
        ...homeMessages,
        ...snapshotMessages,
      }}
    >
      <Context>
        <SnapshotsPage />
      </Context>
    </IntlProvider>,
  );

  fireEvent.click(
    screen.getByRole('menuitem', { name: snapshotMessages['snapshots.scheduled'] }),
  );
  await screen.findByText(record.name);
  const restore = screen.getByRole('button', {
    name: name => name.includes(homeMessages['home.restoreSnapshot']),
  });
  fireEvent.mouseEnter(restore);
  fireEvent.click(
    await screen.findByRole('menuitem', {
      name: snapshotMessages['snapshots.restoreNewWindow'],
    }),
  );
  expect(requestSnapshotAction).toHaveBeenCalledWith({
    action: 'restore',
    id: record.id,
    source: 'scheduled',
    mode: 'newWindow',
  });
  expect(success).not.toHaveBeenCalled();
  finish({ status: 'success' });
  await vi.waitFor(() => expect(success).toHaveBeenCalledTimes(1));
});

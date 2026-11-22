import { beforeEach, expect, it, vi } from 'vitest';
import { settingsUtils } from '~/entrypoints/common/storage';
import { saveScheduledWindowSnapshots } from '~/entrypoints/common/tabs';
import {
  AUTO_SAVE_OPENED_TABS_ALARM_KEY,
  autoSaveOpenedTabsAlarm,
  onAutoSaveOpenedTabsAlarm,
} from '../autoSaveOpenedTabsAlarm';

const { get, create, clear } = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  clear: vi.fn(),
}));
vi.mock('wxt/browser', () => ({ browser: { alarms: { get, create, clear } } }));
vi.mock('~/entrypoints/common/storage', () => ({
  settingsUtils: {
    getSettings: vi.fn(),
    getScheduledSnapshotOptions: (settings: { scheduledSnapshotInterval: number }) => ({
      interval: settings.scheduledSnapshotInterval,
    }),
  },
  snapshotUtils: { runScheduledUpdate: (work: () => Promise<void>) => work() },
}));
vi.mock('~/entrypoints/common/tabs', () => ({ saveScheduledWindowSnapshots: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

it('开启时注册闹钟并立即采集，定时触发时继续采集', async () => {
  const enabled = { scheduledSnapshotsEnabled: true, scheduledSnapshotInterval: 15 };
  vi.mocked(settingsUtils.getSettings).mockResolvedValue(enabled);
  await autoSaveOpenedTabsAlarm.checkReset(enabled, { scheduledSnapshotsEnabled: false });
  expect(create).toHaveBeenCalledWith(AUTO_SAVE_OPENED_TABS_ALARM_KEY, {
    delayInMinutes: 15,
    periodInMinutes: 15,
  });
  expect(saveScheduledWindowSnapshots).toHaveBeenCalledTimes(1);

  await onAutoSaveOpenedTabsAlarm();
  expect(saveScheduledWindowSnapshots).toHaveBeenCalledTimes(2);
});

it('调整间隔时重设闹钟，关闭时清除闹钟', async () => {
  const enabled = { scheduledSnapshotsEnabled: true, scheduledSnapshotInterval: 20 };
  const disabled = { ...enabled, scheduledSnapshotsEnabled: false };
  vi.mocked(settingsUtils.getSettings)
    .mockResolvedValueOnce(enabled)
    .mockResolvedValueOnce(disabled);
  get.mockResolvedValueOnce({ periodInMinutes: 10 });
  await autoSaveOpenedTabsAlarm.checkReset(enabled, {
    ...enabled,
    scheduledSnapshotInterval: 10,
  });
  expect(clear).toHaveBeenCalledWith(AUTO_SAVE_OPENED_TABS_ALARM_KEY);
  expect(create).toHaveBeenCalledWith(AUTO_SAVE_OPENED_TABS_ALARM_KEY, {
    delayInMinutes: 20,
    periodInMinutes: 20,
  });

  await autoSaveOpenedTabsAlarm.checkReset(disabled, enabled);
  expect(clear).toHaveBeenCalledTimes(2);
  expect(create).toHaveBeenCalledTimes(1);
  expect(saveScheduledWindowSnapshots).not.toHaveBeenCalled();
});

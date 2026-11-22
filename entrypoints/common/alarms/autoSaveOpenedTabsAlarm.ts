import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { settingsUtils, snapshotUtils } from '~/entrypoints/common/storage';
import { saveScheduledWindowSnapshots } from '~/entrypoints/common/tabs';
import CommonAlarm from './utils';

const { SCHEDULED_SNAPSHOTS_ENABLED, SCHEDULED_SNAPSHOT_INTERVAL } = ENUM_SETTINGS_PROPS;

export const AUTO_SAVE_OPENED_TABS_ALARM_KEY = 'auto-save-opened-tabs-alarm-key';

class AutoSaveOpenedTabsAlarm extends CommonAlarm {
  constructor() {
    super(AUTO_SAVE_OPENED_TABS_ALARM_KEY);
  }

  create(captureOnEnable = false) {
    return snapshotUtils.runScheduledUpdate(async () => {
      const settings = await settingsUtils.getSettings();
      const { interval } = settingsUtils.getScheduledSnapshotOptions(settings);
      if (!settings[SCHEDULED_SNAPSHOTS_ENABLED]) {
        await this.clearAlarm();
        return;
      }

      const alarm = await browser.alarms.get(this.name);
      const createInfo = { delayInMinutes: interval, periodInMinutes: interval };
      if (!alarm) await this.createAlarm(createInfo);
      else if (alarm.periodInMinutes !== interval) await this.resetAlarm(createInfo);
      if (captureOnEnable) await saveScheduledWindowSnapshots();
    });
  }

  checkReset(settings: SettingsProps, oldSettings: SettingsProps) {
    const keys = [SCHEDULED_SNAPSHOTS_ENABLED, SCHEDULED_SNAPSHOT_INTERVAL];
    if (keys.some(key => settings[key] !== oldSettings[key])) {
      return this.create(!oldSettings[SCHEDULED_SNAPSHOTS_ENABLED]);
    }
  }
}

export const autoSaveOpenedTabsAlarm = new AutoSaveOpenedTabsAlarm();

export const onAutoSaveOpenedTabsAlarm = () =>
  snapshotUtils.runScheduledUpdate(saveScheduledWindowSnapshots);

export default {
  autoSaveOpenedTabsAlarm,
  onAutoSaveOpenedTabsAlarm,
};

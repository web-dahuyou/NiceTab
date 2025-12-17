import { Alarms } from 'wxt/browser';
import { saveOpenedTabsAsSnapshot } from '../tabs';
import { settingsUtils } from '../storage';
import { ENUM_SETTINGS_PROPS } from '../constants';
import CommonAlarm from './utils';

const { AUTO_CREATE_SNAPSHOT_INTERVAL } = ENUM_SETTINGS_PROPS;

export const AUTO_SAVE_OPENED_TABS_ALARM_KEY = 'auto-save-opened-tabs-alarm-key';

class AutoSaveOpenedTabsAlarm extends CommonAlarm {
  constructor() {
    super(AUTO_SAVE_OPENED_TABS_ALARM_KEY);
  }

  async create() {
    const settings = await settingsUtils.getSettings();
    const autoCreateSnapshotInterval = settings[AUTO_CREATE_SNAPSHOT_INTERVAL];

    await this.clearAlarm();
    await this.createAlarm({
      delayInMinutes: 1,
      periodInMinutes: autoCreateSnapshotInterval,
    });
  }
}

export const autoSaveOpenedTabsAlarm = new AutoSaveOpenedTabsAlarm();

export const onAutoSaveOpenedTabsAlarm = async (alarm: Alarms.Alarm) => {
  saveOpenedTabsAsSnapshot();
};

export default {
  autoSaveOpenedTabsAlarm,
  onAutoSaveOpenedTabsAlarm,
};

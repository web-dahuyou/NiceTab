import { Alarms } from 'wxt/browser';
import { saveOpenedTabsAsSnapshot } from '../tabs';
import CommonAlarm from './utils';

export const AUTO_SAVE_OPENED_TABS_ALARM_KEY = 'auto-save-opened-tabs-alarm-key';

class AutoSaveOpenedTabsAlarm extends CommonAlarm {
  constructor() {
    super(AUTO_SAVE_OPENED_TABS_ALARM_KEY);
  }

  async create() {
    await this.clearAlarm();
    await this.createAlarm({
      delayInMinutes: 1,
      periodInMinutes: 5,
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

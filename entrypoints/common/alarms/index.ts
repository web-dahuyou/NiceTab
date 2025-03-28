import { Alarms } from 'wxt/browser';
import { AUTO_SYNC_ALARM_KEY, onAutoSyncAlarm } from './autoSyncAlarm';
import {
  AUTO_SAVE_OPENED_TABS_ALARM_KEY,
  onAutoSaveOpenedTabsAlarm,
} from './autoSaveOpenedTabsAlarm';

browser.alarms.onAlarm.addListener((alarm: Alarms.Alarm) => {
  if (alarm.name === AUTO_SYNC_ALARM_KEY) {
    onAutoSyncAlarm(alarm);
  } else if (alarm.name === AUTO_SAVE_OPENED_TABS_ALARM_KEY) {
    onAutoSaveOpenedTabsAlarm(alarm);
  }
});

export { autoSyncAlarm } from './autoSyncAlarm';
export { autoSaveOpenedTabsAlarm } from './autoSaveOpenedTabsAlarm';

export default {
  name: 'alarms-index',
};

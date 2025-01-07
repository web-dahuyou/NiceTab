import { Alarms } from 'wxt/browser';
import { AUTO_SYNC_ALARM_KEY, onAutoSyncAlarm } from './autoSyncAlarm';

browser.alarms.onAlarm.addListener((alarm: Alarms.Alarm) => {
  if (alarm.name === AUTO_SYNC_ALARM_KEY) {
    onAutoSyncAlarm(alarm);
  }
});

export { autoSyncAlarm } from './autoSyncAlarm';

export default {
  name: 'alarms-index',
};


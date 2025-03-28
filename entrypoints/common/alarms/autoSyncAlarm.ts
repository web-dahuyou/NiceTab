import { Alarms } from 'wxt/browser';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils, syncUtils, syncWebDAVUtils } from '../storage';
import { ENUM_SETTINGS_PROPS, defaultAutoSyncType } from '../constants';
import CommonAlarm from './utils';

const { AUTO_SYNC, AUTO_SYNC_INTERVAL, AUTO_SYNC_TYPE } = ENUM_SETTINGS_PROPS;

export const AUTO_SYNC_ALARM_KEY = 'auto-sync-alarm-key';

class AutoSyncAlarm extends CommonAlarm {
  constructor() {
    super(AUTO_SYNC_ALARM_KEY);
  }

  async create() {
    const settings = await settingsUtils.getSettings();
    const autoSync = settings[AUTO_SYNC];

    if (!autoSync) {
      await this.clearAlarm();
      return;
    }

    return await this.createAlarm({
      periodInMinutes: settings[AUTO_SYNC_INTERVAL],
    });
  }
  async reset() {
    const settings = await settingsUtils.getSettings();
    const autoSync = settings[AUTO_SYNC];

    if (!autoSync) {
      await this.clearAlarm();
      return;
    }

    await this.resetAlarm({
      periodInMinutes: settings[AUTO_SYNC_INTERVAL],
    });
  }

  async checkReset(settings: SettingsProps, oldSettings: SettingsProps) {
    const { [AUTO_SYNC]: autoSync, [AUTO_SYNC_INTERVAL]: autoSyncInterval } = settings;
    const { [AUTO_SYNC]: autoSyncOld, [AUTO_SYNC_INTERVAL]: autoSyncIntervalOld } =
      oldSettings;

    if (autoSync !== autoSyncOld || autoSyncInterval !== autoSyncIntervalOld) {
      await this.reset();
    }
  }
}

export const autoSyncAlarm = new AutoSyncAlarm();

export const onAutoSyncAlarm = async (alarm: Alarms.Alarm) => {
  const settings = await settingsUtils.getSettings();
  const autoSync = settings[AUTO_SYNC];
  if (!autoSync) {
    autoSyncAlarm.clearAlarm();
    return;
  }
  const autoSyncType = settings[AUTO_SYNC_TYPE] || defaultAutoSyncType;
  syncUtils.autoSyncStart({ syncType: autoSyncType });
  syncWebDAVUtils.autoSyncStart({ syncType: autoSyncType });
};

export default {
  autoSyncAlarm,
  onAutoSyncAlarm,
};

import { Alarms } from 'wxt/browser';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils, syncUtils, syncWebDAVUtils } from '../storage';
import {
  ENUM_SETTINGS_PROPS,
  defaultAutoSyncType,
  defaultAutoSyncRelation,
} from '../constants';
import CommonAlarm from './utils';

const { AUTO_SYNC, AUTO_SYNC_TIME_UNIT, AUTO_SYNC_INTERVAL, AUTO_SYNC_TYPE } =
  ENUM_SETTINGS_PROPS;

export const AUTO_SYNC_ALARM_KEY = 'auto-sync-alarm-key';

class AutoSyncAlarm extends CommonAlarm {
  constructor() {
    super(AUTO_SYNC_ALARM_KEY);
  }

  convert(settings: SettingsProps) {
    const timeUnit = settings[AUTO_SYNC_TIME_UNIT];
    let periodInMinutes = settings[AUTO_SYNC_INTERVAL];

    // convert to minutes
    if (timeUnit === 'h') {
      periodInMinutes = (periodInMinutes || defaultAutoSyncRelation.h) * 60;
    }

    return periodInMinutes;
  }
  async create() {
    const settings = await settingsUtils.getSettings();
    const autoSync = settings[AUTO_SYNC];

    if (!autoSync) {
      await this.clearAlarm();
      return;
    }

    const periodInMinutes = this.convert(settings);

    return await this.createAlarm({ periodInMinutes });
  }
  async reset() {
    const settings = await settingsUtils.getSettings();
    const autoSync = settings[AUTO_SYNC];

    if (!autoSync) {
      await this.clearAlarm();
      return;
    }

    const periodInMinutes = this.convert(settings);

    await this.resetAlarm({ periodInMinutes });
  }

  async checkReset(settings: SettingsProps, oldSettings: SettingsProps) {
    for (const key of [AUTO_SYNC, AUTO_SYNC_TIME_UNIT, AUTO_SYNC_INTERVAL]) {
      if (oldSettings[key] !== settings[key]) {
        await this.reset();
        break;
      }
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

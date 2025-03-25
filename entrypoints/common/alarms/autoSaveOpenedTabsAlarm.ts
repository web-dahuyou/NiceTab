import { Alarms } from 'wxt/browser';
import { stateUtils } from '../storage';
import { getAdminTabInfo } from '../tabs';
import CommonAlarm from './utils';

export const AUTO_SAVE_OPENED_TABS_ALARM_KEY = 'auto-save-opened-tabs-alarm-key';

class AutoSaveOpenedTabsAlarm extends CommonAlarm {
  constructor() {
    super(AUTO_SAVE_OPENED_TABS_ALARM_KEY);
  }

  async create() {
    await this.clearAlarm();
    await this.createAlarm({
      delayInMinutes: 0.2,
      periodInMinutes: 30,
    });
  }
}

export const autoSaveOpenedTabsAlarm = new AutoSaveOpenedTabsAlarm();

export const onAutoSaveOpenedTabsAlarm = async (alarm: Alarms.Alarm) => {
  const tabs = await browser.tabs.query({});
  const { tab: adminTab } = await getAdminTabInfo();
  const filteredTabs = tabs.filter((tab) => {
    if (!tab?.id) return false;
    if (adminTab && adminTab.id === tab.id) return false;
    if (tab.pinned) return false;
    return true;
  });

  stateUtils.setStateByModule('global', {
    openedTabs: filteredTabs,
  });
};

export default {
  autoSaveOpenedTabsAlarm,
  onAutoSaveOpenedTabsAlarm,
};

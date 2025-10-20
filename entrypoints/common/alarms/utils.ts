import { Alarms } from 'wxt/browser';

export default class CommonAlarm {
  name: string;
  createInfo: Alarms.CreateAlarmInfoType = {};
  constructor(name: string, createInfo?: Alarms.CreateAlarmInfoType) {
    this.name = name;
    this.setCreateInfo(createInfo);
  }

  async setCreateInfo(createInfo?: Alarms.CreateAlarmInfoType) {
    this.createInfo = {
      delayInMinutes: 0.2,
      periodInMinutes: 30,
      ...createInfo,
    };
  }

  async createAlarm(createInfo?: Alarms.CreateAlarmInfoType) {
    createInfo && this.setCreateInfo(createInfo);
    const alarm = await browser.alarms.get(this.name);
    if (!alarm) {
      await browser.alarms.create(this.name, this.createInfo);
      return await browser.alarms.get(this.name);
    }

    return alarm;
  }

  async clearAlarm() {
    await browser.alarms.clear(this.name);
  }

  async resetAlarm(createInfo?: Alarms.CreateAlarmInfoType) {
    await this.clearAlarm();
    await this.createAlarm(createInfo);
  }
}

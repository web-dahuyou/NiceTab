import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage 和依赖
const mockStorage = new Map<string, any>();

vi.mock('wxt/storage', () => ({
  storage: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: any) => mockStorage.set(key, value)),
  },
}));

vi.mock('~/entrypoints/options/home/constants', () => ({
  defaultGroupActions: [],
}));

import SettingsUtils from '../settingsUtils';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';

// Stub navigator 全局对象
vi.stubGlobal('navigator', { language: 'en-US' });

describe('SettingsUtils', () => {
  let settingsUtils: InstanceType<typeof SettingsUtils>;

  beforeEach(() => {
    mockStorage.clear();
    settingsUtils = new SettingsUtils();
  });

  // ==========================================================================
  // initialSettings 默认值
  // ==========================================================================
  describe('initialSettings 默认值', () => {
    it('language 默认为 en-US', () => {
      expect(settingsUtils.initialSettings.language).toBe('en-US');
    });

    it('themeType 默认为 light', () => {
      expect(settingsUtils.initialSettings.themeType).toBe('light');
    });

    it('openAdminTabAfterBrowserLaunch 默认为 true', () => {
      expect(settingsUtils.initialSettings.openAdminTabAfterBrowserLaunch).toBe(true);
    });

    it('closeTabsAfterSendTabs 默认为 true', () => {
      expect(settingsUtils.initialSettings.closeTabsAfterSendTabs).toBe(true);
    });

    it('allowDuplicateTabs 默认为 true', () => {
      expect(settingsUtils.initialSettings.allowDuplicateTabs).toBe(true);
    });

    it('deleteAfterRestore 默认为 false', () => {
      expect(settingsUtils.initialSettings.deleteAfterRestore).toBe(false);
    });

    it('linkTemplate 默认为 {{url}} | {{title}}', () => {
      expect(settingsUtils.initialSettings.linkTemplate).toBe('{{url}} | {{title}}');
    });

    it('tabCountThreshold 默认为 100', () => {
      expect(settingsUtils.initialSettings.tabCountThreshold).toBe(100);
    });

    it('groupInsertPosition 默认为 top', () => {
      expect(settingsUtils.initialSettings.groupInsertPosition).toBe('top');
    });

    it('tabInsertPosition 默认为 bottom', () => {
      expect(settingsUtils.initialSettings.tabInsertPosition).toBe('bottom');
    });

    it('groupActionBtnStyle 默认为 icon', () => {
      expect(settingsUtils.initialSettings.groupActionBtnStyle).toBe('icon');
    });

    it('showOpenedTabCount 默认为 true', () => {
      expect(settingsUtils.initialSettings.showOpenedTabCount).toBe(true);
    });

    it('autoSync 默认为 false', () => {
      expect(settingsUtils.initialSettings.autoSync).toBe(false);
    });

    it('searchEngines 包含默认搜索引擎', () => {
      const engines = settingsUtils.initialSettings.searchEngines;
      expect(engines.length).toBeGreaterThanOrEqual(4);
      expect(engines.some(e => e.id === 'google')).toBe(true);
      expect(engines.some(e => e.id === 'bing')).toBe(true);
      expect(engines.some(e => e.id === 'baidu')).toBe(true);
      expect(engines.some(e => e.id === 'duckduckgo')).toBe(true);
    });

    it('contextMenuConfig 包含所有 action 名称', () => {
      const config = settingsUtils.initialSettings.contextMenuConfig;
      expect(config.length).toBeGreaterThan(0);
      config.forEach(item => {
        expect(item).toHaveProperty('menuId');
        expect(item).toHaveProperty('display');
      });
    });

    it('所有 ENUM_SETTINGS_PROPS 键都有对应默认值', () => {
      const props = Object.values(ENUM_SETTINGS_PROPS);
      props.forEach(prop => {
        expect(settingsUtils.initialSettings).toHaveProperty(prop);
      });
    });
  });

  // ==========================================================================
  // getSettings
  // ==========================================================================
  describe('getSettings', () => {
    it('无存储数据时返回默认设置', async () => {
      const settings = await settingsUtils.getSettings();
      expect(settings.themeType).toBe('light');
      expect(settings.language).toBeTruthy();
    });

    it('合并已存储的部分设置', async () => {
      mockStorage.set('local:settings', {
        themeType: 'dark',
        closeTabsAfterSendTabs: false,
      });
      const settings = await settingsUtils.getSettings();
      expect(settings.themeType).toBe('dark');
      expect(settings.closeTabsAfterSendTabs).toBe(false);
      // 未覆盖的字段保持默认值
      expect(settings.openAdminTabAfterBrowserLaunch).toBe(true);
    });

    it('language 通过 resolveLanguage 解析', async () => {
      mockStorage.set('local:settings', { language: 'zh-CN' });
      const settings = await settingsUtils.getSettings();
      expect(settings.language).toBe('zh-CN');
    });
  });

  // ==========================================================================
  // setSettings
  // ==========================================================================
  describe('setSettings', () => {
    it('存储完整设置', async () => {
      const newSettings = {
        ...settingsUtils.initialSettings,
        themeType: 'dark' as const,
      };
      await settingsUtils.setSettings(newSettings);
      expect(mockStorage.get('local:settings')).toBeDefined();
    });
  });
});

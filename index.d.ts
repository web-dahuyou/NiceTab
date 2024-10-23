import type { AugmentedBrowser as WxtBrowser, WxtRuntime as WxtRuntimeBase, Tabs as WxtTabs } from 'wxt/browser';

// 目前 webextension-polyfill 中没有 group 相关的类型定义, 但是新版浏览器有相关的 API
enum Color {
  grey = 'grey',
  blue = 'blue',
  red = 'red',
  yellow = 'yellow',
  green = 'green',
  pink = 'pink',
  purple = 'purple',
  cyan = 'cyan',
  orange = 'orange',
}
interface TabGroup {
  collapsed: boolean;
  color: Color;
  id: number;
  title: string;
  windowId: number;
}

declare module 'wxt/browser' {
  export type PublicPath = WxtBrowser.PublicPath | '/_favicon/';
  export interface TabGroup {
    collapsed: boolean;
    color: Color;
    id: number;
    title: string;
    windowId: number;
  }
  export namespace Tabs {
    interface Tab extends WxtTabs.Tab {
      groupId?: number;
    }
    interface Static extends WxtTabs.Static {
      group: (options: {
        createProperties?: { windowId?: number };
        groupId?: number;
        tabIds: number | number[];
      }) => Promise<number>;
    }
  }
}

declare global {
  const browser: WxtBrowser & {
    tabGroups: {
      TAB_GROUP_ID_NONE: number;
      get: (groupId: number) => Promise<TabGroup>;
      get: (groupId: number, callback?: (group: TabGroup) => void) => void;
      update: (groupId: number, updateProperties: Partial<TabGroup>) => Promise<TabGroup | undefined>;
      update: (groupId: number, updateProperties: Partial<TabGroup>, callback?: (group?: TabGroup) => void) => void;
    };
  };
}

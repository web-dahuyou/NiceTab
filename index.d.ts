import type { AugmentedBrowser as WxtBrowser, Tabs as WxtTabs } from 'wxt/browser';

declare module 'react-copy-to-clipboard' {
  type CopyToClipboardProps = {
    text: string;
    onCopy: (text: string, result: boolean) => void;
    children: JSX.Element
  }
  export function CopyToClipboard(props: CopyToClipboardProps): JSX.Element
};

declare module 'file-saver' {
  export function saveAs(blob: Blob, name?: string): void
};

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
    "collapsed": boolean;
    "color": string;
    "id": number;
    "title": string;
    "windowId": number;
}

declare module 'wxt/browser' {
    export interface TabGroup {
        "collapsed": boolean;
        "color": Color;
        "id": number;
        "title": string;
        "windowId": number;
    }
    export namespace Tabs {
        interface Tab extends WxtTabs.Tab {
            groupId?: number;
        }
    }
}

declare global {
    const browser: WxtBrowser & {
        tabGroups: {
            TAB_GROUP_ID_NONE: number;
            get: (groupId: number) => Promise<TabGroup>;
            get: (groupId: number, callback?: (group: TabGroup) => void) => void;
        }
    }
}


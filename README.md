# NiceTab

![NiceTab](https://github.com/user-attachments/assets/6099f21e-fc0a-4bb5-8280-e497be3fb0ae)

<p>
  English | <a href="./README-zh.md">中文</a>
</p>

## Extension Installation

- Google Chrome Web Store: [Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)
- Microsoft Edge Add-ons: [Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl)  
  (Note that due to longer review times, the Edge store release may lag behind the Chrome version.)
- Firefox: Not yet available.

## Overview

- NiceTab is a browser extension that makes managing your browser tabs quick and convenient.
- Named `NiceTab` with the hope that it would be a "nice" tab management tool.
- Similar to other tab management extensions like `OneTab`, `Toby`, `N-Tab`, and `KepTab`. it supports browsers such as Chrome, Firefox, Microsoft Edge, and any Chromium based browser.
- Developed using `React` and based on the [`wxt framework`](https://wxt.dev/), which provides built-in templates for `Vanilla`, `Vue`, `React`, `Svelte`, and `Solid`.
- The UI is powered by the popular [`Ant Design`](https://ant-design.antgroup.com/) library.

## Motivation

I personally get anxious when there are too many tabs open, and switching to a specific tab among them is a hassle. After using OneTab, managing tabs became much easier, improving efficiency and saving memory, so I used it for a long time.

However, I felt a few aspects weren’t quite smooth:

- Group names are lost after exporting and re-importing tabs.
- Because renaming group names isn't persisted, I gave up on renaming them. Once many groups accumulate, locating a specific group is difficult.
- The right-click menu on the extension icon often shows several duplicate menu groups, but only one group of menus actually works, you have to try each to find out.
- Sometimes I just want to bookmark some tabs without closing them, but OneTab lacks an option for that (a personal preference).
- There's no straightforward way to create a new group within OneTab directly and move tabs from an existing group into that new group.
- And a few more smaller issues...

Additionally, the `N-Tab` extension is open-source, but after reviewing it, I found the tech stack a bit outdated, making it difficult to contribute effectively.

Based on the above reasons, I decided to develop the `NiceTab` extension. incorporate additional features upon some features from `OneTab`, `N-Tab`, to enhance the experience.

## Features

- Manage categories, tab groups, and tabs. Includes easy saving, restoring, starring (favorites), locking, adding, deleting, editing, searching, and drag-and-drop reordering, etc.
- Categories support expand/collapse, creation of categories and tab groups, making it easy to move other tab groups/tabs to new categories/groups.
- Offers **import/export** in multiple formats, with local file saving supported. Currently supports cross-import/export for `NiceTab`, `Toby`, `OneTab`, and `KepTab`. (e.g., import OneTab format then export to NiceTab format, or export from NiceTab to OneTab format.) More formats can be added later as needed.
- Supports **remote syncing** (note that merging push do not perform a diff-comparison delete; it merges remote and local, then pushes to remote. To sync deletions, remove them locally and then manually overwrite the remote):
  - Gists Sync: You can sync your data to GitHub or Gitee by configuring your personal access token (note, token permissions only check `gists` scope). Potentially more platforms may be supported in the future.
  - WebDAV Sync: You can sync your data to a WebDAV service by configuring the WebDAV URL, username, and password (supports multiple WebDAV accounts).
  - Auto Sync: Automatic synchronization is supported; you can enable/disable it and set syncing frequency and method.
- Supports manual switch for **Light/Dark** themes.
- Supports **Theme color switch**, currently with several preset theme colors(More can be added later as needed).
- **Multilingual support**, currently Chinese and English (contributions for more natural English or additional languages are welcome).
- Supports **Recycle Bin** feature: deleted tabs, tab groups, and categories go to a recycle bin where you can restore or permanently delete them.
- Supports browser command shortcuts (open the NiceTab-Admin-Page, send all tabs, send the current tab, etc.).
- Option to **Open NiceTab Admin Page after launching the browser**.
- Option to **Pin the NiceTab Admin Page**.
- Option to **Send pinned tabs to NiceTab when sending tabs**.
- Option to **Open NiceTab Admin Page when sending tabs**.
- Option to **Automatically close tabs when sending tabs**.
- Option to **Show "Send To" modal when sending tabs**.
- Option to **Retain duplicate groups when sending tabs**.
- Option to **Retain duplicate tabs when sending tabs**.
- Option to **Show "Send To" modal when sending tabs**. You can send tabs to a specified category or tab group.
- Configurable **Exclude domains for sending tabs** (regex supported) so certain sites or pages are never sent to NiceTab.
- Option to **Open tab group in a new window when opening**.
- Option to **Remove tabs when opening tabs or tab group**.
- Option to **Restore the unnamed group as a browser tab group**.
- Configurable **Modifier key for opening a tab silently (in background)**.
- Configurable **Modifier key for opening a tab in foreground**.
- Option to **Remove empty groups when clearing tabs**.
- Option to **Confirm before removing tabs**.
- Configurable **Copy links format template for tab groups**.
- Option to **Display the number of open tabs on the extension icon**.
- Option to **Display ContextMenu on your webpage**.
- Configurable **popup panel modules**: you can configure which modules to display in the popup. If none are selected, clicking the extension icon sends all tabs to NiceTab by default.
- Option to **Automatically expand the tree list on Home Page**.
- Supports send all tabs, current tab, other tabs, left-side tabs, and right-side tabs in just one click.
- Supports sending native browser tab groups into NiceTab, and re-open them as native tab groups in your browser.
- Supports keyboard shortcuts for certain operations, such as reordering categories or tab groups.
- Tabs support custom editing of title and URL.
- "**Staging Area**" category is fixed at the top; tabs/tab groups sent will be automatically save to the category.
- Supports sorting tab groups by group name or creation time.
- Supports one-click copying of all links in a tab group, with a customizable link template.
- Supports tab and URL search, and jump straight to the result.
- Supports import/export and remote sync for both tabs (existing) and preference settings (newly supported).
- Supports manually hibernate inactive tabs from memory. Hibernated tabs are still visible on the tab strip and will automatically reload when activated.

## Screenshots of Features

### Extension Icon (Popup)

- By default, clicking the `NiceTab` extension icon opens a popup panel where you can quickly access the  list page, settings page, import/export page, sync page and recycle bin page.
- You can quickly switch theme colors or view/close the current open tab.
- If none popup modules are configured in preferences, clicking the extension icon will sends all tabs to NiceTab by default.

Screenshots of other actions are not yet updated.

![NiceTab-extension-icon-1](https://github.com/user-attachments/assets/cf65a363-3a2b-465a-936c-8fc8274856dc)

![NiceTab-extension-icon-2](https://github.com/user-attachments/assets/899bfd01-c426-4c5b-af5e-0beb52882edf)

### Right-Click Menu

- Right-clicking the extension icon reveals a quick-access context menu, you can open the `NiceTab Admin Page` (aka `Dashboard`) or try one-click actions to send all tabs, the current tab, other tabs, left-side tabs, or right-side tabs.

![NiceTab-right-click-menu](https://github.com/user-attachments/assets/2fe82628-9dde-4cba-b336-6ca59b2ec5eb)

### Tab List

- Manage sent tabs in categories and groups.
- The left panel supports drag-and-drop reordering and shortcuts sorting. The right panel displays all tab groups and tabs for the current category, and allows corresponding operations.
- You can easily delete tab groups or move them to other categories. Multiple tabs can also be selected and moved or deleted in bulk.

![NiceTab-list-page](https://github.com/user-attachments/assets/03a534d0-c034-4b9a-98fd-2d8d084ebcd3)

### Preferences

- Customize various preference settings according to your own preferences.

![NiceTab-preferences](https://github.com/user-attachments/assets/90e19998-206b-42de-9329-410e553955a4)

### Import/Export

- Currently supports cross-import/export for `NiceTab`, `Toby`, `OneTab`, and `KepTab` formats.
- You can import `OneTab`, `Toby` or `KepTab` data, and parsed into `NiceTab` format.
- You can export `NiceTab` data to `NiceTab`, `OneTab`, `Toby` or `KepTab` format.

Screenshots of KepTab and Toby format imports/exports are not yet updated.

![NiceTab-import-export](https://github.com/user-attachments/assets/e2ea4b00-3531-4819-b67a-e45f09b4e948)

### Remote Sync

Supports syncing via Gitee Gists, GitHub Gists, and WebDAV:
- Gists Sync: You can sync your data to your Github and Gitee accounts as needed, just configure your access token.
- WebDAV Sync: You can sync your data to a WebDAV service by configuring the WebDAV URL, username, and password (supports multiple WebDAV accounts).

**Note**:
- For gists, token permissions only check `gists` scope.
- Merging push sync does not perform a diff-comparison delete. It merges remote and local data, then pushes to remote, so tabs increase cumulatively. To sync deletions, remove them locally and then manually overwrite the remote.

Screenshots of WebDAV sync are not yet updated.

![NiceTab-remote-sync](https://github.com/user-attachments/assets/1d082c8f-4660-4f8e-9ac9-7cf468178ee1)

### Theme Color Switching

You can easily switch theme colors in the management dashboard or the popup panel.

![NiceTab-theme-color-switch](https://github.com/user-attachments/assets/9e6dce98-8b6e-4fe7-846d-d5a00f410e6d)

### Light/Dark Mode

Light and dark themes are available, which can be toggled in the management dashboard.

![NiceTab-light-dark-switch](https://github.com/user-attachments/assets/8d7a6f02-9feb-4289-b9f8-f066ab02f32e)

### Language Switching

Switch between Chinese and English in the management dashboard.

![NiceTab-language-switch](https://github.com/user-attachments/assets/2d6b2348-a666-4996-bdd9-8653dfabf1d4)

### Recycle Bin

- Deleted categories, tab groups, or tabs go into the recycle bin.
- You can restore them back to the tab list or permanently delete them.

![NiceTab-recycle-bin](https://github.com/user-attachments/assets/016cb266-fe12-4063-b786-c979288f01fb)

## Usage

- Click the extension icon to open the popup panel displaying the currently open tabs. From there, you can access the Admin Page or quickly switch themes, etc.
- Right-click the extension icon to display context menu items for sending tabs to NiceTab.
- In the Dashboard (Admin Page), you can switch languages and themes, or toggle light/dark mode.
- In `Dashboard > List` page, view all sent tabs organized by category and group.
- In `Dashboard > Settings` page, manage the extension's preferences.
- In `Dashboard > Import & Export` page, import or export tabs in NiceTab, OneTab, Toby or KepTab formats.
- In `Dashboard > Sync` page, sync tabs to your Github and Gitee accounts as needed, just configure your access token (note, token permissions only check `gists` scope).
- In `Dashboard > Recycle Bin` page, view and manage any deleted categories, tab groups, or tabs. You can restore or permanently delete them.

## Community & Feedback

Feel free to join our QQ group: 924270240

<img width="300" alt="NiceTab Community" src="https://github.com/user-attachments/assets/f773c96e-8f4f-4e53-9ffa-20c11690675a">

## References

- [Chrome for Developers - Extensions API Docs](https://developer.chrome.com/docs/extensions/reference/api?hl=zh-cn)  
- [WXT Official Site](https://wxt.dev/)  
- [Ant Design](https://ant-design.antgroup.com/)  
- [React Router](https://reactrouter.com/)  
- [styled-components](https://styled-components.com/)  
- [react-intl](https://formatjs.io/docs/react-intl)  
- [pragmatic-drag-and-drop](https://atlassian.design/components/pragmatic-drag-and-drop/about)  
- [“Complete Guide to Developing Chrome Extensions” (Chinese)](https://www.cnblogs.com/liuxianan/p/chrome-plugin-develop.html)

## Extension Development

### Project Setup
- Install dependencies:  
  `pnpm install`
- Start the dev server:  
  `pnpm run dev`

Important: Each `.js .ts .tsx` file must have an `export default` statement. Otherwise, you'll encounter errors when running the local service.

### Set Browser Binaries 

By default, `WXT` will try to automatically discover where `Chrome/Firefox` are installed. If you encounter an error:

```
ERROR  No Chrome installations found.  
```

Or you want to specify a browser executable binary.

You can refer to the [docs - Set Browser Binaries](https://wxt.dev/guide/essentials/config/browser-startup.html#set-browser-binaries) to manually configure the browser binary paths.

```js
export default defineRunnerConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

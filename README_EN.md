# NiceTab

![NiceTab](https://github.com/user-attachments/assets/6099f21e-fc0a-4bb5-8280-e497be3fb0ae)

## Extension Installation

- Google Chrome Web Store: [Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)
- Microsoft Edge Add-ons: [Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl)  
  (Note that due to longer review times, the Edge store release may lag behind the Chrome version.)
- Firefox: Not yet available.

## Overview

- NiceTab is a browser extension that makes managing your browser tabs quick and convenient.
- The name `NiceTab` reflects the goal of making tab management a nice experience (although personal UI and interaction design might be limited).
- Similar to other tab management extensions such as `OneTab`, `N-Tab`, and `KepTab`, `NiceTab` works on Chrome, Firefox, and Microsoft Edge.
- Written in `React` and developed with the [`wxt framework`](https://wxt.dev/), which offers templates for `Vanilla`, `Vue`, `React`, `Svelte`, and `Solid`.
- The UI is built with the popular [`Ant Design`](https://ant-design.antgroup.com/) component library.

## Motivation

I tend to get anxious when there are too many tabs open, and finding the right tab among them can be frustrating. OneTab helped a lot by making tab management easier and more memory-friendly, so I used it for quite some time.

However, I felt there were some limitations:

- Group names are lost after exporting and re-importing tabs.
- Because renaming group names isn't persisted, I gave up on renaming them. Once many groups accumulate, locating a specific group is difficult.
- Right-clicking the OneTab extension icon sometimes shows multiple sets of menus, but only one group of menus actually works—you have to try each one to find out.
- Sometimes I just want to bookmark certain tabs without closing them, but OneTab lacks an option for that (a personal preference).
- There's no straightforward way to create a new group within OneTab directly and move tabs from an existing group into that new group.
- And a few more smaller issues...

N-Tab is open source, but after reviewing it, I found the tech stack a bit outdated for my tastes, so I decided to develop my own extension. Thus, `NiceTab` was created to address the above points and incorporate additional features.

## Features

- Manage categories, tab groups, and tabs. Includes easy saving, restoring, starring (favorites), locking, adding, deleting, editing, searching, and drag-and-drop reordering.
- Categories can be expanded/collapsed, so it's easy to organize tab groups and move them, or individual tabs, to new categories/groups.
- Offers **import/export** in multiple formats, with local file saving supported. Currently supports `NiceTab`, `OneTab`, and `KepTab` cross-import and export. (For instance, import OneTab format then export as NiceTab format, or export from NiceTab to OneTab format.) More formats can be added later as needed.
- Option to **remote syncing of tabs** (note that merges do not perform a diff-based delete; it merges remote and local, then pushes to remote. To sync deletions, remove them locally and then manually overwrite the remote):
  - Gists Sync: You can sync your tabs to GitHub or Gitee by configuring your personal access token (with only "gists" permission). Potentially more platforms may be supported in the future.
  - WebDAV Sync: You can sync your tabs to a WebDAV service by configuring the WebDAV URL, username, and password (supports multiple WebDAV accounts).
  - Auto Sync: Automatic synchronization is supported; you can enable/disable it and set syncing frequency and method.
- Manual switch for **Light/Dark** themes.
- **Theme color switching** is supported, currently with a few predefined options available. More can be added later as needed.
- **Multilingual support** (currently Chinese and English; contributions for more natural English or additional languages are welcome).
- **Recycle Bin** feature: deleted tabs, tab groups, and categories go to a recycle bin where you can restore or permanently delete them. Both the main tab listing and the recycle bin are organized by category/group, keeping things tidy.
- Browser command shortcuts (open the NiceTab dashboard, send all tabs, send the current tab, etc.).
- Option to **open the NiceTab dashboard automatically when the browser starts**.
- Option to **pin the NiceTab dashboard tab**.
- Configurable **behaviors for sending tabs** (whether to include pinned tabs, whether to auto-close them, etc.).
- Option to **open group links in a new window or existing one**.
- Option to **auto-delete tabs from NiceTab after opening them**.
- Option to **choose a modifier key for silently opening a tab**.
- Option to **keep or remove the group after clearing all tabs**.
- Option to **keep or remove duplicate tab groups when sending tabs**.
- Option to **keep or remove duplicate tabs when sending tabs**.
- Option to **customize the template for copying group links**.
- Option to **display the number of open tabs on the extension icon**.
- Option to **show a NiceTab right-click menu inside web pages**.
- Configurable **popup panel modular view**: you can configure which modules to display in the popup. If none are selected, clicking the extension icon sends all tabs to NiceTab by default.
- Option to **automatically expand all nodes in the main listing on load**.
- Option to **send tabs to a specific folder/category**.
- Configurable **exclusion settings for domains** (regex supported) so certain sites or pages are never sent to NiceTab.
- Option to **remove duplicate tabs manually**.
- Option to **send all tabs, the current tab, other tabs, left-of-current tabs, or right-of-current tabs in just one click**.
- Option to **import native Chromium tab groups into NiceTab, and re-open them as tab groups in your browser**.
- Supports keyboard shortcuts for certain operations, such as rearranging categories or tab groups, with the potential to add more soon.
- **Tabs can be edited to change their title or URL**.
- "**Staging Area**" category is fixed at the top; newly sent tabs/groups can go there automatically.
- Option to **sort tab groups by name or creation time**.
- Option to **one-click copy of all links in a tab group, with a customizable link template**.
- Option to **search for tabs or URLs**, and jump straight to the result.
- Supports **import/export and remote sync for both tabs (existing) and preference settings (newly supported)**.

## Screenshots of Features

### Extension Icon (Popup)

- Clicking the `NiceTab` extension icon opens a popup panel where you can quickly access the main list, settings page, import/export page, and recycle bin by default.
- You can quickly switch theme colors or view/close the current open tab.

![NiceTab-extension-icon-1](https://github.com/user-attachments/assets/cf65a363-3a2b-465a-936c-8fc8274856dc)

![NiceTab-extension-icon-2](https://github.com/user-attachments/assets/899bfd01-c426-4c5b-af5e-0beb52882edf)

### Right-Click Menu

- Right-clicking the extension icon reveals a quick-access menu, you can open the `NiceTab Admin Page` (aka `Dashboard`) or try one-click actions to send all tabs, the current tab, other tabs, tabs to the left, or tabs to the right.

![NiceTab-right-click-menu](https://github.com/user-attachments/assets/2fe82628-9dde-4cba-b336-6ca59b2ec5eb)

### Dashboard - Tab List

- Manage saved tabs in categories and groups.
- The left panel supports drag-and-drop reordering and keyboard shortcuts. The right panel displays all tab groups and tabs for the current category, allowing you to edit or move them around.
- You can easily delete tab groups or move them to other categories. Multiple tabs can also be selected and moved or deleted in bulk.

![NiceTab-list-page](https://github.com/user-attachments/assets/03a534d0-c034-4b9a-98fd-2d8d084ebcd3)

### Dashboard - Preferences

- Customize various preferences for the extension according to your needs.

![NiceTab-preferences](https://github.com/user-attachments/assets/90e19998-206b-42de-9329-410e553955a4)

### Dashboard - Import/Export

- Currently supports cross-import/export for `NiceTab`, `OneTab`, and `KepTab` formats.
- Import your `OneTab` or `KepTab` data, which will be parsed into `NiceTab` format.
- Export your `NiceTab` data as `NiceTab`, `OneTab`, or `KepTab` format.

![NiceTab-import-export](https://github.com/user-attachments/assets/e2ea4b00-3531-4819-b67a-e45f09b4e948)

### Remote Sync

Supports syncing via Gitee Gists, GitHub Gists, and WebDAV:

- Gists Sync: Configure your personal access token for GitHub or Gitee to store tab data remotely.
- WebDAV Sync: Configure multiple WebDAV accounts with URL, username, and password.

Note:

- For gists, ensure that your token is set with "gists" permission only.
- Merged sync does not remove remote entries. It merges remote and local data, then pushes to remote, so tabs increase cumulatively. To truly remove remote tabs, delete them locally and do a manual overwrite push.

(Screenshots for WebDAV syncing coming soon.)

![NiceTab-remote-sync](https://github.com/user-attachments/assets/1d082c8f-4660-4f8e-9ac9-7cf468178ee1)

### Theme Color Switching

You can easily switch theme colors in the main dashboard or the popup.

![NiceTab-theme-color-switch](https://github.com/user-attachments/assets/9e6dce98-8b6e-4fe7-846d-d5a00f410e6d)

### Light/Dark Mode

Light and dark themes are available, which can be toggled in the dashboard.

![NiceTab-light-dark-switch](https://github.com/user-attachments/assets/8d7a6f02-9feb-4289-b9f8-f066ab02f32e)

### Language Switch

Switch between Chinese and English in the dashboard settings.

![NiceTab-language-switch](https://github.com/user-attachments/assets/2d6b2348-a666-4996-bdd9-8653dfabf1d4)

### Dashboard - Recycle Bin

- Deleted categories, tab groups, or tabs go into the recycle bin.
- You can restore them back to the main list or permanently delete them.

![NiceTab-recycle-bin](https://github.com/user-attachments/assets/016cb266-fe12-4063-b786-c979288f01fb)

## Usage

- Click the extension icon to open the popup panel and quickly see currently open tabs. From there, you can access the dashboard or switch themes.
- Right-click the extension icon to see shortcut menu items for sending tabs to the dashboard.
- In the Dashboard (Admin Page), you can switch languages and themes, or toggle light/dark mode.
- In `Dashboard > List`, see all sent tabs organized by category and group.
- In `Dashboard > Settings`, manage the extension's preferences.
- In `Dashboard > Import & Export`, import or export tabs in NiceTab, OneTab, or KepTab formats.
- In `Dashboard > Sync`, configure your GitHub or Gitee account if you'd like to sync tabs to a remote repository (with a token that has "gists" permission).
- In `Dashboard > Recycle Bin`, view and manage any deleted categories, tab groups, or tabs. You can restore or permanently delete them.

## Roadmap

- [x] NiceTab & OneTab format import/export  
- [x] Recycle Bin feature  
- [x] Theme color switching  
- [x] Light/dark mode  
- [x] Multilingual support (currently Chinese and English)  
- [x] Edit tab titles and URLs  
- [x] Version checks and update prompts  
- [x] Support for native browser tab groups  
- [x] Remote Sync via GitHub/Gitee gists (local size limit 100KB per sync, ~1 request every 2 seconds)  
- [x] WebDAV syncing  
- [x] Auto-sync feature  
- [x] Keyboard shortcuts for sending tabs  
- [x] Option to send tabs to a specific folder  
- [x] Domain exclusion rules (regex)  
- [x] Import/export & remote sync of preference settings  
- [ ] Configurable right-click menu entries  
- [ ] Note-taking feature with remote sync  
- [ ] More features to come

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

- Install dependencies:  
  `pnpm install`
- Start the dev server:  
  `pnpm run dev`

Important: Each .js file must have an `export default` statement. Otherwise, you'll encounter errors when running the local service.

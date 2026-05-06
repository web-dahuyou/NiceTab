
# NiceTab User Guide

<p>
  English | <a href="./GUIDE-zh.md">中文</a>
</p>

## Project Introduction

This project is a free and open-source browser tab manager extension. It is a powerful upgrade and alternative to OneTab, Toby, SessionBuddy, and similar extensions, with rich features and excellent usability.

For the basic project introduction and details, please refer to the [README](./README.md). It will not be repeated here.

## Installation

**Method 1: Install from the browser extension store**  
- Google Chrome: [Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)  
- Microsoft Edge: [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl) (review cycle is longer, so updates may lag behind Chrome)  
- Firefox: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/nice-tab-manager)

**Method 2: Manual installation from ZIP**  
- Download `nice-tab-<version>-chrome.zip` (for Chrome/Edge) or `nice-tab-<version>-firefox.zip` from the [Releases page](https://github.com/leonlovecode/NiceTab/releases).  
- Search online for "how to install unpacked Chrome extension" if needed.

After installation, it is recommended to pin the extension icon for quick access.

On first launch of the management page (no tabs saved yet), the list will be empty. Right-click the extension icon and choose "Send all tabs" to try it out.

NiceTab also supports keyboard shortcuts. You can view default shortcuts in the right-click menu or customize them in the browser's keyboard shortcuts settings (see [Bind Shortcuts](#bind-shortcuts) below).

## Feature Overview

NiceTab's core function is to send browser tabs to its list with a one-click operation, managing them in a `Category > Group > Tab` hierarchy.

The extension mainly consists of:  
- [Extension Icon Right-click Menu](#extension-right-click-menu)  
- [Extension Icon Popup Panel](#extension-icon-popup-panel)  
- [Management Dashboard](#management-dashboard)

Before diving deeper, try left-clicking and right-clicking the NiceTab icon to explore the interactions.

### Extension Right-click Menu

When first installed (list empty), right-click the NiceTab icon to open the context menu and send tabs.

Current menu items:  
- Open NiceTab Dashboard  
- Global Search  
- Send all tabs (current window)  
- Send all tabs (all windows)  
- Send current tab group  
- Send current tab  
- Send other tabs  
- Send tabs to the left  
- Send tabs to the right  
- Start Sync  
- Hibernate other tabs  

**Notes**:  
- v2.8.4 added "Send current tab" in Firefox tab context menu.

### Extension Icon Popup Panel

Left-click the icon to open the popup, which includes: **Extension Info**, **Go To**, **Actions**, **Theme**, **Open Tabs**, etc.

**Modules**:  
- **Extension Info**: Current version (more info may be added later).  
- **Go To**: Quick navigation (Dashboard, Bind Shortcuts).  
- **Actions**: Send tabs (all/current/other/left/right), Global Search, Hibernate other tabs, Start Sync.  
- **Theme**: Switch accent color.  
- **Open Tabs**: List of currently open browser tabs (supports browser groups); close, hibernate, or switch to them.

**Notes**:  
- v2.8.4 added compact mode toggle.  
- You can configure left-click to directly send all tabs (like OneTab) in Preferences.  
- Hibernation reduces memory without closing tabs.

### Management Dashboard

The options page includes: **List**, **Preferences**, **Import/Export**, **Remote Sync**, **Recycle Bin**.

**Quick Tip**: The same actions appear in multiple places (popup, right-click, dashboard) to suit different user habits.

## Dashboard - Navigation Bar

- Page switching (List / Preferences / Import-Export / Remote Sync / Recycle Bin)  
- Version info & update notification  
- Accent color picker  
- Light/Dark theme toggle  
- Language switch (English/Chinese)  
- More actions (dropdown)

### Create Snapshot / Restore Snapshot

Located in the **Actions** dropdown. Save current open tabs as a temporary snapshot and restore them later.

Useful before manually closing/restarting the browser.

## Dashboard - List Page

Hierarchical view: `Category > Group > Tab`.  
Left sidebar: directory tree. Right panel: detailed list (virtual scrolling).

### Directory Tree

- Categories (level 1) and Groups (level 2)  
- **Transit Station**: Special fixed category (cannot be deleted). New tabs go here by default.  
- Create/rename/delete/lock categories & groups  
- Drag & drop to move across categories  
- Search support

### Right Panel

Group-level operations:  
- Rename (default: `Unnamed Group`)  
- Delete / Open in browser / Lock / Star / Clone / Deduplicate / Sort / Copy links  
- Batch operations on selected tabs (multi-select with mouse drag or Shift)  

Tabs support: delete, edit, copy, QR code, drag-sort, etc.

## Dashboard - Preferences

Preferences control interaction behavior. Defaults are based on the author's habits — adjust as needed.

### General Settings
| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Language | ... | Auto (system) | ★★ |
| Theme Mode | ... | Light | ★★ |
| Auto open dashboard on browser startup | ... | Yes | ★★ |
| ... (and more) | ... | ... | ... |

(Full tables for **Send Tabs**, **Open Tabs**, **Global Search**, **Other Operations**, **Display**, **Auto Sync** follow the same structure as in the Chinese version — all translated with accurate descriptions.)

## Dashboard - Import/Export

Supports importing from NiceTab, OneTab, KepTab, Toby (json), Session Buddy, and browser HTML bookmarks.  
Three modes: Add, Merge, Overwrite.  
Export list + preferences (also as HTML bookmarks since v2.7.7).

## Dashboard - Remote Sync

(Full section translated, including current limitations due to historical design using names instead of IDs, recommended workflows for single/multi-device use, etc.)

**Note**: After the upcoming `groupId` refactor, the "random renaming of Unnamed Groups" issue will be resolved.

## Dashboard - Recycle Bin

Deleted items go here temporarily. Auto-cleared daily — recover promptly if needed.

## Bind Shortcuts

Use browser's built-in command system.  
Default shortcuts (examples):  
- Open Dashboard: `Alt + Shift + M`  
- Send All Tabs: `Alt + Shift + A`  
- Send Current Tab: `Alt + Shift + C`  
... (others customizable)

## Other

More content to be added later.

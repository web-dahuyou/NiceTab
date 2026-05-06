
# NiceTab User Guide

<p>
  English | <a href="./GUIDE-zh.md">中文</a>
</p>

## Project Introduction

This project is a free and open-source browser tab manager extension. It is a powerful upgraded alternative to OneTab, Toby, SessionBuddy, and similar extensions, with rich features and excellent usability.

For the basic project introduction, please refer to <a href="./README.md">README</a>. Details are not repeated here.

## Installation

**Method 1: Install from the browser extension store**  
- Google Chrome: [Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)  
- Microsoft Edge: [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl) (review cycle is longer, so updates may lag behind Chrome)  
- Firefox: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/nice-tab-manager)

**Method 2: Manual installation from ZIP**  
- Download `nice-tab-<version>-chrome.zip` (for Chrome/Edge) or `nice-tab-<version>-firefox.zip` from the [Releases page](https://github.com/leonlovecode/NiceTab/releases).  
- Search online for "how to install unpacked Chrome extension" if needed.

After installation, we recommend pinning the extension icon for quick access.

On first launch, the list will be empty. Right-click the extension icon and select **Send all tabs** to get started.

NiceTab also supports keyboard shortcuts. You can view defaults in the right-click menu or customize them in the browser’s keyboard shortcuts settings (see [Bind Shortcuts](#bind-shortcuts) below).

## Feature Overview

NiceTab’s core function is to send browser tabs to its list with one click and manage them in a `Category > Group > Tab` hierarchy.

The extension mainly consists of:  
- [Extension Right-click Menu](#extension-right-click-menu)  
- [Extension Icon Popup Panel](#extension-icon-popup-panel)  
- [Management Dashboard](#management-dashboard)

Try left-clicking and right-clicking the NiceTab icon to explore the interactions.

### Extension Right-click Menu

When the list is empty (first install), right-click the NiceTab icon to open the context menu and send tabs.

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
- v2.8.4 added **Send current tab** to the Firefox tab context menu.

### Extension Icon Popup Panel

Left-click the icon to open the popup panel, which includes **Extension Info**, **Go To**, **Actions**, **Theme**, and **Open Tabs**.

**Modules**:  
- **Extension Info**: Current version (more info may be added later).  
- **Go To**: Quick navigation  
  - Dashboard  
  - Bind Shortcuts  
- **Actions**:  
  - Send tabs (all / current / other / left / right)  
  - Global Search  
  - Hibernate other tabs  
  - Start Sync  
- **Theme**: Switch accent color.  
- **Open Tabs**: List of currently open browser tabs (supports browser groups). Supports close, hibernate, or switch.

**Notes**:  
- v2.8.4 added compact mode toggle.  
- By default, left-click opens the popup. You can configure it in Preferences to send all tabs directly (like OneTab).  
- Hibernation reduces memory usage without closing tabs. Tabs reactivate when switched to.

### Management Dashboard

The dashboard includes: **List**, **Preferences**, **Import/Export**, **Remote Sync**, and **Recycle Bin**.

**Tip**: The same actions are available in multiple places (popup, right-click, dashboard) to suit different user habits.

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

## Dashboard - List

The List page uses a `Category > Group > Tab` hierarchy.

It consists of a left **directory tree** and a right **detail panel** (virtual scrolling).

### Directory Tree

- Level 1: Categories, Level 2: Groups  
- **Transit Station**: A special fixed category (cannot be deleted) at the top. New tabs go here by default.  
- Create, rename, delete, lock categories and groups.  
- Drag & drop to move across categories.  
- Search support.  
- Locked categories become read-only.

### Right Panel

**Group Operations**:  
- Rename (default: `Unnamed Group`)  
- Delete, Open in browser, Lock, Star, Clone, Deduplicate, Sort, Copy links, Move to, etc.  

**Tab Operations**:  
- Delete, edit, copy, QR code, drag to reorder.  
- Multi-select (drag or Shift + click).  
- Batch operations.

## Dashboard - Preferences

Preferences control interaction behavior. Defaults follow the author’s habits — adjust as needed.

### General Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Language | Plugin display language | Auto (system, fallback English) | ★★ |
| Theme Mode | Light/Dark + follow system | Light | ★★ |
| Auto open dashboard on browser startup | ... | Yes | ★★ |
| Auto open dashboard in new browser window | ... | No | ★★ |
| Pin NiceTab dashboard | Pin to left side of browser window | Yes | ★★ |
| Auto restore previous tabs on browser startup | ... | No | ★★★★ |

### Send Tabs Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Show directory selector when sending tabs | Choose target category & group | No | ★★★★★ |
| Send pinned tabs | ... | No | ★ |
| Exclude domains | e.g. New Tab / blank pages (regex or wildcard supported) | New Tab pages | ★★ |
| Open dashboard after sending | ... | Yes | ★★★ |
| Auto close tabs after sending | ... | Yes | ★★★★ |
| Create new group for single tab | ... | Yes | ★★★ |
| Keep duplicate groups | ... | Yes | ★★ |
| Keep duplicate tabs | ... | Yes | ★★ |

### Open Tabs Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Open group in new window | ... | No | ★★ |
| Auto delete after opening | ... | No | ★★★★★ |
| Auto hibernate when opening multiple tabs | ... | No | ★★★★ |
| Modifier for silent (background) open | ... | Alt (⌥) | ★★★ |
| Modifier for foreground open | ... | None | ★★★ |
| Batch open order | ... | Default (left to right) | ★★ |
| Open unnamed groups as browser group | ... | Yes | ★★ |
| Open named groups as browser group | ... | Yes | ★★ |

**Notes**: You can swap modifiers to make silent open the default behavior.

### Webpage Title Customization

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Webpage Title Customization | Rewrite page titles (support exact, starts with, ends with, contains, regex, wildcard) | None | ★★★★★ |

### Global Search Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Auto delete after opening from search | ... | No | ★★ |

### Other Operations Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Auto delete empty group after clearing tabs | ... | Yes | ★★★ |
| Confirm before deleting tab | ... | No | ★ |
| Group - Copy links template format | Custom Mustache template for copying titles & URLs | `{{url}} \| {{title}}` | ★★★★ |
| Insert group position in target category | Top or bottom | Top | ★★ |
| Insert tab position in target group | Top or bottom | Bottom | ★★ |

### Display Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Operation button style | Icon or text | Icon | ★★★★★ |
| Common group operation buttons | Customize visible buttons | All | ★★★ |
| Show open tab count on extension icon | ... | Yes | ★★ |
| Show NiceTab in webpage context menu | ... | Yes | ★★ |
| Right-click menu configuration | Drag to sort, top 5 shown directly | All | ★★★★★ |
| Popup panel module settings | Choose which modules to show. **Tip**: Deselect all → left-click sends all tabs directly | All | ★★★★★ |
| Auto expand all nodes on list page | ... | No | ★★ |
| Content area width | Fixed or adaptive | Fixed | ★★ |
| Show tooltip on tab hover | Legacy feature, not recommended | No | ★ |

### Auto Sync Settings

| Item | Description | Default | Importance |
|------|-------------|---------|------------|
| Enable auto sync | ... | No | ★★★ |
| Interval unit | Minutes or Hours | Minutes | ★★★★ |
| Auto sync interval | ... | 30 minutes | ★★★★ |
| Active time period | Only sync during specified periods | 00:00 ~ 23:59 | ★★★ |
| Sync mode | Merge push / Overwrite push / Overwrite local | Merge push | ★★★★ |

## Dashboard - Import/Export

Supports import from NiceTab, OneTab, KepTab, Toby (json), Session Buddy, and browser HTML bookmarks.  
Import modes: **Add**, **Merge**, **Overwrite**.  
Export list + preferences (also as HTML bookmarks since v2.7.7).

## Dashboard - Remote Sync

(Full section with current limitations, historical reasons, and recommended workflows — identical in detail to Chinese version.)

## Dashboard - Recycle Bin

Deleted items are temporarily stored here and auto-cleared daily. Recover promptly if needed.

## Bind Shortcuts

Use the browser’s built-in command system.

Default shortcuts:

| Action | macOS | Windows | Note |
|--------|-------|---------|------|
| Open Dashboard | ⌥ + ⇧ + M | Alt + Shift + M | M = manager |
| Send All Tabs | ⌥ + ⇧ + A | Alt + Shift + A | A = all |
| Send Current Tab | ⌥ + ⇧ + C | Alt + Shift + C | C = current |

Other shortcuts can be customized in the browser settings.

## Other

More content will be added later.

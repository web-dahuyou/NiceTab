
# NiceTab User Guide

<p>
  English | <a href="./GUIDE-zh.md">中文</a> | <a href="./GUIDE-ru.md">Русский</a>
</p>

## Project Introduction

NiceTab is a free, open-source browser tab manager extension. It serves as a powerful, upgraded alternative to OneTab, Toby, SessionBuddy, and similar tools, delivering rich features and excellent usability.

For a project overview, see the <a href="./README.md">README</a>.

## Installation

**Method 1: Install from the browser extension store**
- Google Chrome: [Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)
- Microsoft Edge: [Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl) (Due to longer review cycles, version releases may be slower than Chrome)
- Firefox Add-ons: [Firefox Browser Addons](https://addons.mozilla.org/firefox/addon/nice-tab-manager)

**Method 2: Manual installation from ZIP**
- Download `nice-tab-<version>-chrome.zip` (for Chrome/Edge) or `nice-tab-<version>-firefox.zip` from the [Releases page](https://github.com/web-dahuyou/NiceTab/releases).
- If you need to load an unpacked extension, refer to the official Chrome/Edge developer documentation, or search online for "how to install unpacked Chrome extension".

After installation, we recommend **pinning the extension icon** for quick access to extension features.

On first launch the list is empty because no tabs have been sent yet. Right-click the extension icon and choose **Send All Tabs** to get started quickly.

NiceTab also supports keyboard shortcuts. You can view the corresponding shortcuts in the right-click menu, or go to the keyboard shortcuts settings page to customize them (see [Bind Shortcuts](#bind-shortcuts) below).

## Changelog

For the detailed changelog, see <a href="./CHANGELOG.md">CHANGELOG</a>.

## Feature Overview

NiceTab's core strength is sending browser tabs to a structured list with one click and managing them via the `Category > Tab Group > Tab` hierarchy.

The extension provides three main interfaces:
- [Right-click Menu](#extension-right-click-menu)
- [Icon Popup Panel](#extension-icon-popup-panel)
- [Management Dashboard (Admin Page)](#management-dashboard); Displayed as `NiceTab Admin Page`.

Try left-clicking and right-clicking the NiceTab extension icon to explore the interactions.

### Extension Right-click Menu

Upon first installation, the NiceTab list is empty because no tabs have been sent yet. You can right-click the NiceTab extension icon to open the plugin's right-click menu and send the tabs currently open in the browser to the NiceTab management page.

Current menu items:
- **Open NiceTab Admin Page**: Clicking this will open the NiceTab management dashboard page.
- **Global Search**: You can globally search for tabs sent to the NiceTab Admin Page in the browser. Refer to the [Global Search](#global-search) section below.
- **Send All Tabs**: Send all opened tabs in the current browser window to the NiceTab Admin Page.
- **Send All Tabs (all windows)**: Send all opened tabs in all browser windows to the NiceTab Admin Page.
- **Send Current Group**: Send the tab group containing the currently active or highlighted tab to the NiceTab Admin Page (supports multi-tab and cross-group selection).
- **Send Current Tab**: Send the currently active or highlighted tab to the NiceTab Admin Page (supports multiple tabs, browser tabs can be multi-selected and highlighted).
- **Send Other Tabs**: Send other tabs (excluding the currently highlighted/active tab) to the NiceTab Admin Page.
- **Send Left Tabs**: Send left-side tabs to the NiceTab Admin Page.
- **Send Right Tabs**: Send right-side tabs to the NiceTab Admin Page.
- Choose **Create Snapshot** to save the current window. See [Window Snapshots](#window-snapshots).
- **Start Sync**: Manually execute synchronization operation.
- **Hibernate Other Tabs**: Hibernate tabs other than the current tab.

**Notes**:
- v2.8.4: Added **Send Current Tab** to the Firefox tab context menu.

### Extension Icon Popup Panel

Left-click the extension icon to open the `Popup Panel`. It includes the following modules: **Extension Info**, **Go To**, **Actions**, **Theme**, and **Opened Tabs**.

**Modules**:
- **Extension Info**: NiceTab extension information, currently only shows extension version (more info may be added later).
- **Go To**: Quick navigation to specific pages
  - NiceTab Admin Page: Jump to the NiceTab Admin Page.
  - Bind Shortcuts: Jump to the browser's shortcuts binding page.
  - User Guide: Jump to the user guide page.
- **Actions**: Quick access to NiceTab common functions
  - Send Tabs
  - Global Search
  - Hibernate Other Tabs
  - Start Sync
- **Theme**: Switch theme colors
- **Opened Tabs**: Displays currently opened browser tabs and native browser tab groups. You can close, hibernate, or switch to tabs directly from this panel.

**Notes**:
- v2.8.4: Added compact mode toggle button.
- By default, left-clicking the extension icon opens the `Popup Panel`. You can configure it in [Management Dashboard - Preferences](#management-dashboard---preferences) to send all tabs directly (OneTab-style).
- Hibernation reduces memory usage without closing tabs. When switching to a hibernated tab, it will be reactivated.

### Management Dashboard

The NiceTab management dashboard includes **List**, **Preferences**, **Snapshots**, **Import/Export**, **Remote Sync**, and **Recycle Bin**.

**Page Introduction**:
- **List**: Manages all tabs sent to NiceTab using the **hierarchical structure of Category > Tab Group > Tab**. In addition to basic CRUD operations, it also supports **Sorting**, **Moving**, **Locking**, **Starring**, **Copying**, **Deduplication**, **Opening**, **Renaming**, **QR Code**, and many other rich features, as well as some batch operations.
- **Preferences**: For better experience and adapting to different user habits.
- Use [Snapshots](#window-snapshots) to view and restore manual snapshots, scheduled snapshots, and the latest automatic snapshot.
- Use **Import/Export** to save the tab list, preferences, and remote sync configuration to local files or import them from those files.
- **Remote Sync**: Supports synchronizing tab list and preferences to remote storage (GitHub Gists, Gitee Gists, WebDAV), supports automatic synchronization (see [Management Dashboard - Remote Sync](#management-dashboard---remote-sync) for details).
- **Recycle Bin**: Tabs removed from the list are moved to the Recycle Bin, facilitating recovery when remove by accident (the Recycle Bin is automatically cleared daily. If accidentally removed, please recover on the same day).

### Tips

During use, you'll find that the same operations appear in multiple places: Popup Panel, Right-click Menu, Management Dashboard, etc. This is to accommodate different user habits:
- Most users prefer pinning the extension icon and performing various operations in the Popup Panel or right-click menu.
- Some users don't like exposing the extension icon, so they need some regular operation buttons displayed in the management dashboard page.
- NiceTab also supports binding shortcuts to common operations. After getting used to shortcuts, efficiency is higher.

### Newtab
The version 3.0.0 added a new feature and configuration item to customize the browser's newtab page. You can replace the newtab page with `NiceTab Admin Page` or `NiceTab Newtab Page`. Set to "Default" will revert to the browser's native newtab page.

You can go to the `Preferences Page` to configure it according to your preference.

## Management Dashboard - Navigation Bar Operations

- **Page Switching**: Quickly switch between **List**, **Preferences**, **Snapshots**, **Import/Export**, **Remote Sync**, and **Recycle Bin** pages.
- **Version Information Display**: Normally displays current version information. When updates are available, displays the latest upgradeable version; click to update immediately.
- **Theme Color Settings**: Preset multiple theme colors, freely switchable (theme colors are currently limited to several preset colors; dark theme colors and theme color extensions may be optimized later).
- **Light/Dark Theme**: Freely switch between light/dark themes.
- **Language Switch**: Switch languages, currently supports Chinese, English, Traditional Chinese, and Russian.
- **Other Operation Items**: Other functions are folded into dropdown options; these functions are also practical.


## Management Dashboard - List

The List page uses a `Category > Tab Group > Tab` hierarchical structure for tab management. It consists of a left **Directory Tree** (category and tab group directory index), a middle **Stored Tab List** (all tab groups in the currently selected category and all tabs within those tab groups), and a right **Opened Tabs Panel** (the tabs and tab groups currently opened in the browser window).

### Directory Tree

The left Directory Tree functions like a file explorer, managing Categories (first level) and Tab Groups (second level). It supports search, expand/collapse, drag-and-drop reordering, locking, and cross-category moving.
- **Staging Area**: A special category, fixed at the first position and cannot be deleted. Sent tabs are automatically added to the Staging Area. You can operate tab groups and tabs in the Staging Area as needed (edit, move, delete, etc.).
- You can create, expand, collapse, and delete categories. Lock a category to protect it from accidental deletion or moves.
- The categories support creating tab groups, one-click moving of tab groups from a category to other categories.
- You can rename and delete categories and tab groups. Drag a tab group to move it to another category.
- Clicking a category or tab group selects the corresponding category or tab group, while the **Stored Tab List** displays all tab groups under that category and the tab list within those tab groups.
- Selected categories/tab groups support shortcut operations for moving up/down (these shortcuts only apply to the directory tree and are not yet customizable).
  - Move Up: macOS (⌥ + ⇧ + ↑) Windows (Alt + Shift + ↑)
  - Move Down: macOS (⌥ + ⇧ + ↓) Windows (Alt + Shift + ↓)

#### Batch actions for tab groups

1. Check the boxes next to the tab groups. Checking a category selects its groups in the current results. **Select All** applies to the current search and filters. Changing the search or filters clears the selection.
2. Use the toolbar above the tree to open, delete, or move the selected groups. When opening them, [choose a window](#opening-tabs). For **Move To**, choose a destination category. Use **Copy Selected Items?** to keep the originals, or **Merge Duplicate Items?** to merge groups with the same name.
3. With several groups checked, drag one of them to move them together. Drop them within the same category to reorder them, or move them to another category. Drop above or below a group to choose where to insert them.

Locked categories are excluded as sources and destinations for batch moves. Batch deletion skips locked categories and locked groups. You can still open locked items.

### Stored Tab List

The **Stored Tab List** displays all tab groups in the currently selected category and all tabs within those tab groups, rendered using virtual scrolling list.

The **Stored Tab List** presents by group. Tab groups here support renaming, deleting, opening to browser, locking, starring, cloning, copying links, deduplication, etc.

**Tab Group Operations**:
- **Rename**: Click the edit icon to rename (group name has character length limit).
- **Remove**: Click the "Remove" button of the tab group to remove it.
- Click **Open Group** and [choose a window](#opening-tabs) to open the group's tabs. You can also enable removal from the list after opening in Preferences.
- **Create Group Before**: Create a new tab group before this tab group.
- **Create Group After**: Create a new tab group after this tab group.
- **Lock**: Click the "Lock" button to lock the tab group. Locked tab groups cannot be removed, and tabs in locked groups cannot be removed, dragged, moved, or multi-selected.
- **Star**: Click the "Top" button to star the tab group. Starred groups are pinned to the top of the current category, then the button text changes to "Untop".
- **Move To**: Click the "Move To" button to open a target selection box. Select the category you want to move to, then confirm to move the current tab group to the selected category.
- **Copy Links**: Click the "Copy Links" button to copy the tab names and urls in this tab group to the clipboard in text format according to the specified format set in Preferences (see `Preferences > Other Actions > Copy links format template for tab groups`), for sharing or other purposes.
- **Clone**: Click the "Clone" button to completely copy this tab group (independent) and add it next to this group.
- **Deduplicate**: Click the "Deduplicate" button to remove duplicate tabs with the same URL in this tab group.
- **Title Ascending**: Click the "Title Ascending" button to sort tabs in this tab group by tab name in ascending order.
- **Title Descending**: Click the "Title Descending" button to sort tabs in this tab group by tab name in descending order.
- **Sort by Domain** sorts in ascending order by base domain, then subdomain. Tabs with the same domain keep their original order. Links without a domain go last.

**Tab List**:
- You can remove, edit, or copy a tab, or display its QR code. Use the tab's more menu to choose where to open it.
- Tabs within a tab group support multi-selection and drag-and-drop reordering.
- **Supports click-and-drag selection for quick multi-selection of tabs**.
- **Supports quick batch selection of all tabs between two tabs**: Hold Shift key and click one tab to highlight it, then hold Shift key and click another tab to batch select.
- After multi-selecting tabs, you can batch remove, open, move to, batch drag-and-drop move, copy links, clone, etc.
- **Tip**: You can also drag tabs onto a tab group in the left Directory Tree and drop to move them across categories quickly.

### Opened Tabs Panel

The v2.9.0 version added a "Opened Tabs Panel" on the right side of the page.

The collapsible panel on the right side of the page displays the tabs and tab groups currently opened in the browser window. Tabs in this panel support quick multi-selection and batch drag-and-drop to the **Stored Tab List** or **Directory Tree** nodes. You can also drag entire tab groups directly.

## Management Dashboard - Preferences

Preferences directly affect the extension's interaction behavior and processing logic. NiceTab's default configuration is based on my personal usage habits; you can adjust them as needed.

Preferences are divided into the following configuration modules:
- **Common**: Contains general configuration
- **Sending Tabs**: Interaction configuration related to sending tabs
- **Opening Tabs**: Interaction configuration related to opening tabs
- **Other Action**: Interaction configuration related to tther actions
- **Displays**: Display configuration related to user interface
- **New Tab**: Custom the browser's newtab page
- [Snapshot Settings](#snapshot-settings) controls startup restore and scheduled captures.
- **Sync**: Configuration related to auto-sync
- **Global Search**: Interaction configuration related to global search

Next, I will explain each configuration item, and provide key indicators for reference based on a comprehensive evaluation of their common usage and degree of interaction

### Common

General configuration items are easy to understand.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Language | Set extension's display language (Chinese/English/Russian) | Automatically set based on system language, fallback to English | ★★ |
| Theme Mode | Set light/dark mode, or follow system | Light | ★★ |
| Open NiceTab Admin Page after launching the browser? | Literal meaning | Automatically open | ★★ |
| Open the NiceTab Admin Page when a new window is created? | Literal meaning | No | ★★ |
| Pin NiceTab Admin Page? | If pinned, the NiceTab Admin Page will be pinned to the left side of the browser window for easy access; of course, you can also choose not to pin to browser, and access via **Popup Panel**, **Right-click Menu**, etc. | Yes | ★★ |

### Sending Tabs

The configuration items of this module significantly affect the interactive behavior. You can freely adjust them to achieve your desired effect.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Show "Send To" modal when sending tabs? | When sending tabs, you can choose the directory (Category > Tab Group) to save. **If set to "No", tabs are sent to the tab group in the "Staging Area" category by default** | No | ★★★★★ |
| Send pinned tabs to NiceTab when sending tabs? | Whether to send pinned tabs to NiceTab | No | ★ |
| Exclude domains for sending tabs | Tabs from certain domains, e.g., blank pages, new tab, etc., that you don't want to send to the management dashboard. <br /> Regex example: `.*?\.vuejs\.org.*` <br /> Wildcard example: `*.vuejs.org*` | Blank page and new tab | ★★ |
| Open NiceTab Admin Page when sending tabs? | After successfully sending tabs, whether to open the NiceTab Admin Page. I prefer opening the dashboard to confirm or proceed other operations. | Yes | ★★★ |
| Create a new tab group when sending a single tab? | If set to "No", the tab will be automatically sent to the first unstarred/unlocked tab group in the Staging Area. | Yes | ★★★ |
| Automatically close tabs when sending tabs? | After successfully sending tabs, whether to automatically close the sent tabs from the browser to save memory. If you want to keep tabs in the browser after sending, set to "No". | Yes | ★★★★ |
| Automatically close tabs when sending through selected actions. | Effective when "Automatically close tabs when sending tabs?" is set to "No". When you want to auto-close for certain sending operations, use it. | Yes | ★★★★ |
| Retain duplicate groups when sending tabs? | When sending tabs, whether the sent tab groups should be merged with the same name groups in the Staging Area. Default is retain. | Yes | ★★ |
| Retain duplicate tabs when sending tabs? | When sending tabs or merging tab groups, whether to merge tabs with same name. Default is retain. | Yes | ★★ |

### Opening Tabs

Choose **Open in Current Window**, **Open in New Window**, or **Open in New Incognito Window** from a category or group menu in the directory tree, an open button in the saved list, or a tab's more menu. The same choices are available for batch opening from the tree or saved list, global search results, the Recycle Bin, and tab cards on the custom new tab page.

The window you choose takes precedence over the default setting. Clicking a tab in the saved list still follows your foreground and background opening preferences. To open an incognito window, first allow NiceTab to run in incognito in your browser's extension settings.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Open tab group in a new window? | Sets the default window for opening a group when you leave the destination unspecified. | No | ★★ |
| Remove tabs from the NiceTab list after opening tabs or tab group? | Removes the groups or individual tabs that opened successfully, depending on what you opened. Items that fail to open or are protected by a category or group lock stay in the list. Leave this off if you use NiceTab to keep bookmarks. | No | ★★★★★ |
| Auto-hibernate when opening multiple tabs? | When opening tabs/tab group from the list to the browser, whether to auto hibernate. | No | ★★★★ |
| Modifier key for opening a tab silently (in background) | When needing to silently open tabs from the list (not automatically activating to the newly opened tab, staying on the management dashboard page), hold this modifier key while left-clicking the tab. You can hold the modifier key and click multiple tabs consecutively to open them; the page won't switch away and interrupt your flow (you can also achieve this with middle-click). | Alt(⌥) | ★★★ |
| Modifier key for opening a tab in the foreground | By default, clicking a tab in the list opens in the foreground, i.e., the page switches to that tab. | None | ★★★ |
| The order when opening multiple tabs | By default, tabs are opened from left to right. Some users have set their browsers to open tabs on the right side of the current page. In this case, you can set to "Reverse" to enable tabs to open in the normal order. | Default | ★★ |
| Restore the unnamed group as a browser tab group? | Create a native browser tab group when opening an unnamed group. | No in Firefox, Yes in other browsers | ★★ |
| Restore the named group as a browser tab group? | Create a native browser tab group when opening a named group. | No in Firefox, Yes in other browsers | ★★ |

**Notes**:
- By default, tabs open in foreground. If you want to open tabs silently (background) by default, set "Modifier key for opening a tab silently" to `None` (i.e., no shortcut needed), and set "Modifier key for opening a tab in the foreground" to `Alt(⌥)` or other modifier keys (supports `Alt(⌥)`, `Command(⌘)`, `Shift(⇧)`).
- Note: If silent opening and foreground opening are configured with the same modifier key, foreground opening is triggered.

### Page Title Overwrite

Customize overwrite webpage titles; you can uninstall previously installed webpage title modification extensions.

> New features may be added later.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Page title overwrite | Rewrite page titles, supports multiple matching modes (e.g., **Exact**, **Starts With**, **Ends With**, **Contains**, **Regex**, **Wildcard**). <br />Regex example: `.*?\.vuejs\.org.*` <br />Wildcard example: `*.vuejs.org*` | None | ★★★★★ |

### Global Search

You can [choose a window](#opening-tabs) for a single search result or for several selected results.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Remove tabs from the NiceTab list after opening them? | This setting is separate from the saved list setting. When enabled, it removes only results that opened successfully and are outside locked categories or groups. | No | ★★ |

### Other Actions

Other action items for some scenarios.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Remove empty groups when clearing tabs? | Whether to automatically remove unlocked empty tab groups. | Yes | ★★★ |
| Confirm before removing tabs? | Literal meaning; if you want confirm when remove tabs, set to "Yes". | No | ★ |
| Copy links format template for tab groups | Personally, I think this is a great feature that allows configurable template formatting for copying all tab titles and links in a tab group with one click. It provides three default template formats for quick switching, and you can also customize the template format according to your needs (the template format uses Mustache syntax, and variables in the template will be automatically replaced when copying with one click). For example, the syntax for links in a Markdown file is `[title](url)`, you can set the template format as `[{{title}}]({{url}})` to batch format the tabs into text that conforms to Markdown syntax. | `{{title}} \| {{url}}` | ★★★★ |
| Position for inserting tab groups when moving or inserting them into the target category | When moving or inserting tab groups into target category, whether to insert at top (front) or bottom (end) of a category. | Top | ★★ |
| Position for inserting tabs when moving or inserting them into the target tab group | When moving or inserting tabs into target tab group, whether to insert at top (front) or bottom (end) of a tab group. | Bottom | ★★ |

### Display

The configuration items of this module are mainly related to interface display; configure according to your preference.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| ~~Action button style (for tab groups and tabs)~~ | ~~`(Deprecated)`The action buttons of tab group/tabs were text-style in the earlier versions, and icon-style buttons were added starting from version `v2.7.4`~~ | Icon style | ★★★★★ |
| Configure commonly used tab group action buttons | The commonly used action buttons can be checked for permanent display, while other unchecked buttons will be collapsed into the "More" dropdown menu | All action buttons | ★★★ |
| Display the number of open tabs on the extension icon? | The extension icon supports displaying the number of currently opened tabs, which is displayed by default | Yes | ★★ |
| Display ContextMenu on your webpage? | By default, the ContextMenu is displayed in two places: the extension icon and the right-click menu on webpages. If you have installed many browser extensions, the right-click menu on webpages will showcase numerous extension menus, which can be overwhelming. You can choose not to display the ContextMenu on webpages | Yes | ★★ |
| Configure ContextMenu items | The right-click menu supports customization, **drag-and-drop sorting**. Select the right-click menu items to be displayed. The first 5 selected items are displayed at the outer level, the rest are collapsed into the "More" menu group. | All items | ★★★★★ |
| Choose the modules to be displayed in the "Popup Panel" | The modules in the Popup Panel support free configuration, you can check the modules you want to display. <br/>**Important**: If no modules are checked, left-clicking the extension icon will directly send all tabs to the NiceTab list without opening the Popup Panel. You can use this feature to flexibly set interaction behavior. | All modules | ★★★★★ |
| Automatically expand the tree list on Home Page? | When entering the list page, whether to automatically expand categories and tab groups in the tree list. | No | ★★ |
| ~~Width of the page content area~~ | ~~`(Deprecated)`The width display mode of the main content area in the management dashboard; "Fixed" mode by default (approximately 1200 pixels, centered displayed). When set to "Responsive", will adapts to the width of the webpage, effect similar to left-aligned display.~~ | Fixed width | ★★ |
| ~~Show a tooltip when hovering over a tab?~~ | ~~`(Deprecated)`This configuration item temporarily retains historical interaction; not recommended to enable tooltip display.~~ | No | ★ |

### Newtab Page

The configuration items of this module are mainly for customizing the browser's native newtab page.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Newtab Display | You can customize the browser's newtab page with `NiceTab Admin Page` or `NiceTab Newtab Page`. Set to "Default" will revert to the browser's native newtab page. | Default | ★★★★ |


### Snapshot Settings

In **Preferences**, select **Snapshot Settings**.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Restore previously opened tabs after launching the browser? | Restores the latest automatic snapshot in the current window on startup. | No | ★★★★ |
| Enable scheduled snapshots | Captures each regular window at the configured interval. | No | ★★★ |
| Capture interval (minutes) | Set from 5 to 60 minutes in 5-minute increments. | 10 minutes | ★★★ |
| Maximum scheduled snapshots to keep | Set from 1 to 200 snapshots in total across all windows. Records beyond the limit are removed from the end of the scheduled snapshots list. | 30 snapshots | ★★★ |

When lowering the limit would remove existing records, NiceTab asks for confirmation before saving that limit. Canceling keeps the previous limit and saves your other settings.

### Auto Sync

The configuration items of this module are mainly related to auto sync.

| Item | Description | Default Value | Key Index |
| --- | --- | --- | --- |
| Enable Auto Sync? | Whether to enable auto sync function. Enabling will start a timer and performs auto sync according to configured auto sync interval; disabling will clear the timer. | No | ★★★ |
| Auto-sync interval unit | Supports minute level (time interval range 5~60 minutes) and hour level (time interval range 1~24 hours). | Minutes | ★★★★ |
| Auto sync interval time | Controls auto sync frequency, how often to sync. | 30 minutes | ★★★★ |
| Auto-sync active time ranges | Some users may only use extension and sync function during specific time periods; multiple time periods are supported. If configured, auto sync will only occur during the specified time period. | 00:00 ~ 23:59 | ★★★ |
| Auto sync method | Sync method used during auto sync; options: `Auto Push (Force)`, `Auto Pull (Force)`, `Auto Push (Merge)`. | Auto Push (Merge) | ★★★★ |

**Notes**: [Management Dashboard - Remote Sync](#management-dashboard---remote-sync)

## Window Snapshots

The **Snapshots** page in the management dashboard shows three types of window snapshots. A snapshot records tab order, pinned state, the active tab, and, where the browser supports native tab groups, their names, colors, and collapsed state.

- **Manual Snapshots** save the current window. Click **Snapshot Current Window** on the Snapshots page, or choose **Create Snapshot** from the **Actions** menu in the navigation bar or the extension's context menu. In browsers that support [extension shortcuts](#bind-shortcuts), you can also bind a shortcut. Manual snapshots are named by time and can be renamed or deleted. NiceTab keeps up to 50 and drops the oldest when you create another at the limit.
- **Scheduled Snapshots** are enabled in [Snapshot Settings](#snapshot-settings). NiceTab captures each regular window separately at the configured interval and skips incognito windows. Within a browser session, windows whose contents are unchanged generally produce no new record. Existing records remain available after you turn scheduled captures off.
- **Latest Automatic Snapshot** comes from the recovery buffer updated as tabs and groups change. The buffer collects tabs from all windows into one record. On the next browser launch, NiceTab saves the buffer as the latest automatic snapshot. If startup restore is enabled, NiceTab restores those tabs in the current window.

Click **View** to inspect the tabs and groups in a snapshot. **Restore in New Window** keeps the current window. **Replace Current Window** asks for confirmation and removes the original tabs only after every tab in the snapshot has opened. It keeps the management page open. If restore reports a failure, check the open tabs and groups first because some items may already have been restored.

Snapshots are stored locally and are excluded from Gist and WebDAV sync.

## Management Dashboard - Import/Export

This page imports and exports the tab list, preferences, and remote sync configuration.

### Import Tab Data from Other Extensions

Supports importing data from other extensions into NiceTab.

Currently supported extensions:
- NiceTab
- OneTab
- KepTab
- Toby (json)
- Session Buddy

### Import Modes

Currently supports three import modes: Append, Merge, Overwrite.

- **Append**: Creates new categories and tab groups without modifying existing data.
- **Merge**: Imported data merges with existing data; if imported category has same name with existing category, they are merged.
- **Overwrite**: Directly overwrite existing data with the imported data; original data is overwritten.

### Import Sources

Supports textarea and local file import.

v2.7.7 version supports browser HTML bookmark file import.

> Note: NiceTab does not support unlimited directory nesting; imported directories are ultimately converted to **Category > Tab Group > Tab** structure (no unlimited nesting).

### Export

You can export tab list and preferences to local file.

NiceTab supports remote synchronization, which is more convenient than exporting to the local file. Although no remote data loss or other abnormal situations have occurred so far, it's still recommended to export data to local file for backup periodically (even if the backup files may not be needed).

v2.7.7 version supports saving NiceTab data as HTML bookmark file; exported bookmark file can be imported to browser.

### Import/Export Remote Sync Config

On the **Import/Export** page, find **Import/Export Remote Sync Config**. Choose **Export to Local File** to save your GitHub and Gitee Gist and WebDAV configuration as JSON. To restore it, choose **Import from File** and select that file.

An imported Gist configuration with an access token replaces the existing configuration for that provider. WebDAV configurations are merged by name. Imported configurations replace existing ones with the same name, while the other existing configurations are kept.

The exported file may contain access tokens and WebDAV passwords. Store it securely and avoid sharing it publicly.

## Management Dashboard - Remote Sync

v2.8.2 version supports custom remote storage directories; you can allocate different directories for different devices on a remote account for data management.

### Current Status

Currently remote sync is just a basic backup functionality. Due to historical factors below, there are some functional defects; not a full version sync functionality.

1. NiceTab remote sync's original purpose was only for remote backup and ensuring data integrity, using incremental merge strategy; does not sync deletion operations.
2. NiceTab uses category/tab group **names** to distinguish same categories/groups (initially to save data storage, didn't store id attribute, so didn't use id as unique identifier). NiceTab allows the existence of the same category/tab group names.
3. When remote sync merges local and remote data, categories/tab groups with the same names will be merged. However, the default name for creating a tag group is `Unnamed Tag`, and the default name for creating a group is `Unnamed Group`. If these categories/tab groups have not been renamed, during merge, to avoid merging these unrenamed categories/groups together, NiceTab will first renames them randomly before merging them. Ultimately, you may find that unrenamed tag groups have been duplicated, because the extension cannot determine which local `Unnamed Group` to merge with which remote `Unnamed Group`. Therefore, it simply retains all for renaming.
4. Due to above reasons, many users were confused about remote sync functionality, and consequently disabled the automatic synchronization function. Actually, as long as categories/tab groups are renamed, such forced random renaming and duplication won't occur. This also indirectly indicates that many people do not have the habit of renaming (I personally have OCD and manually rename categories and tag groups).
5. The full feature sync functionality development may start in the future; due to personal time constraints, I'm not sure when it will be launched. If you encounter any usage issues, please join the communication group for further discussion.

### Current Recommended Usage

Based on above reasons, here are some recommended usages:

**Single Device Usage**:
- Manual sync method: Regularly manually "push data to the remote - force overwrite"
- Auto Sync Method: Enable auto sync, set Auto Sync Type to "Auto Push (Force)". This ensures that the remote backup data is fully consistent with the local data.

**Multi-Devices Usage**:
- Manual Sync Method
  1. Open Device A at work, first "Pull remote data - Merge to local" (latest data = Device A old data + remote data). After work, execute "Push local data to remote - Force overwrite" to push data to remote (remote data = Device A latest data).
  2. Open Device B at home at night, first "Pull remote data - Merge to local" (latest data = Device B old data + remote data = Device B old data + Device A latest data). If data changes, execute "Push local data to remote - Force overwrite" to push data to remote (remote data = Device B latest data).
  3. Repeat above two steps daily.
- Auto Sync Method
  - Set sync method to "Auto Sync - Merge Push". Each time auto sync is triggered, the remote data will be merged with the local data, then pushes to remote (currently, deletion operations will not be synchronized, and the data will always be incrementally merged).
  - If you are not satisfied with the current auto sync function, I suggest using manual sync method (I personally prefer using manual synchronization).

### Remote Disaster Recovery Backup

Version 2.9.2 added a simplified remote disaster recovery backup feature. When pushing data to remote via sync, the remote data will be backed up first (with the backup directory and backup file name being customizable), and then the local data will be pushed to the remote.

> The backup data is one version behind the main data. Under normal circumstances, the latest main data takes priority. If there is an issue with the main data, the previous version of the backup data may be useful.
> The extension does not automatically restore data from backups. The backup data serves only as a safeguard. You can log into your remote account (Gists/WebDAV) to view the backup data by yourself.

### Default Directories and File Names

**Gists Main Data**
- Default description key: `__NiceTab_gist_key__`
- Default list file name: `__NiceTab_gist__.json`
- Default settings file name: `__NiceTab_settings_gist__.json`

**Gists Backup Data**
- Default description key: `__NiceTab_gist_key_bak__`
- Default list file name: `__NiceTab_gist__.json`
- Default settings file name: `__NiceTab_settings_gist__.json`

**WebDAV Main Data**
- Default directory name: `__NiceTab_web_dav__`
- Default list file name: `__NiceTab_web_dav__.json`
- Default settings file name: `__NiceTab_settings_web_dav__.json`

**WebDAV Backup Data**
- Default directory name: `__NiceTab_web_dav_bak__`
- Default list file name: `__NiceTab_web_dav__.bak.json`
- Default settings file name: `__NiceTab_settings_web_dav__.bak.json`


## Management Dashboard - Recycle Bin

The data removed from the tab list will be temporarily retained in the Recycle Bin. In case of accidental deletion, you can enter the Recycle Bin to recover the data.

The data stored in the Recycle Bin is not retained for long. The Recycle Bin is automatically cleared daily to control memory usage. Please recover any accidentally deleted items on the same day.

## Bind Shortcuts

Use the browser's built-in command system. Click "Bind Shortcuts" button to go to browser's built-in shortcut settings page. Other shortcuts can be customized in this shortcut settings page.

In Popup Panel and management dashboard, both have "Bind Shortcuts" button.

Default shortcuts:

| Action | Default Value | Note |
| --- | --- | --- |
| Open NiceTab Management Dashboard | macOS (⌥ + ⇧ + M) <br /> windows (Alt + Shift + M) | Letter `M` is the first letter of `manager` |
| Send All Tabs | macOS (⌥ + ⇧ + A) <br /> Windows (Alt + Shift + A) | Letter `A` is the first letter of `all` |
| Send Current Tab | macOS (⌥ + ⇧ + C) <br /> Windows (Alt + Shift + C) | Letter `C` is the first letter of `current` |

Other shortcuts can be customized in the browser built-in page.


## Other

More content will be added later.

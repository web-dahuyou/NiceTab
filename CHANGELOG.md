# Changelog

This document records the version update logs.

For the most detailed and up-to-date release notes, see [GitHub Releases](https://github.com/web-dahuyou/NiceTab/releases).

---

## v2.9.2

**Release Date:** June 25, 2026

- Added remote disaster recovery backup feature
- Left sidebar (Directory Tree) and right panel (Opened Tabs Panel) now support drag-to-resize for width adjustment
- Added dropdown menus for categories and tab groups in the left directory tree

---

## v2.9.1

**Release Date:** June 12, 2026

- Improved multilingual support and added Shift key multi-selection tips

---

## v2.9.0

**Release Date:** June 10, 2026

- Added English GUIDE.md
- Added Traditional Chinese language support
- Directory selection modal supports creating categories and tab groups
- Added **Opened Tabs Panel** on the right side of the List page

---

## v2.8.8

**Release Date:** April 27, 2026

- Fixed an issue where `Send All Tabs` would overwrite existing tab groups
- Added `confirmBeforeDeletingGroups` setting
- Page title overwrite and domain exclusion configurations support wildcard patterns
- Added independent auto-sync switches for Gist and WebDAV
- Added persistent storage for pinned tabs switch in Popup Panel

---

## v2.8.7

**Release Date:** April 9, 2026

- Tab list now supports multi-selection using the Shift key
- Added new configuration option: `Create a new tab group when sending a single tab?`
- Added pinned tabs switch in Popup Panel
- Added action buttons for tab groups

---

## v2.8.6

**Release Date:** February 4, 2026

- Added new configuration option: `The order when opening multiple tabs:`
- Added new configuration options and filter options

---

## v2.8.5

**Release Date:** January 18, 2026

- Added new context menu items
- Added flashing badge after configuration changes

---

## v2.8.4

**Release Date:** December 19, 2025

- Restore previously opened tabs after launching the browser
- Added compact mode for Popup Panel
- Added tab context menu item for Firefox: `Send Current Tab`
- Added light/dark mode configuration option (follow system mode)

---

## v2.8.3

**Release Date:** December 11, 2025

- Firefox native tab groups API support

---

## v2.8.2

**Release Date:** November 17, 2025

- Fine-tune the English translation
- Remote sync supports custom directories

---

## v2.8.1

**Release Date:** October 20, 2025

- The tabs support multi-select and drag-and-drop
- Added page title customization feature
- added context menu item: `Hibernate Other Tabs`
- Added configuration option: `Sync preferences along with list data?`

---

## v2.7.8

**Release Date:** September 29, 2025

- Added configuration options (with customization support) for context menu
- Close **Global Search Panel** when pressing `ESC`
- Updated `User Guide`

---

## v2.7.7

**Release Date:** September 10, 2025

- Added `User Guide`
- Added configuration option: `Auto-hibernate when opening multiple tabs?`
- `User Guide` localization
- Support import/export `HTML` format bookmark

---

## v2.7.6

**Release Date:** June 30, 2025

- Added auto-sync time unit configuration, supporting minute-level and hour-level intervals
- Added sync status reset button
- Added configuration for remote sync active time ranges
- Added keyboard shortcut for remote sync 
- Optimized error messages for sync request 
- Added new feature for tabs: reordering by name
- Added lint and format configuration for project

---

## v2.7.5

**Release Date:** June 12, 2025

- Added category locking feature
- Global search supports multi-select operations
- Added configuration option: `Position for inserting tab groups when moving or inserting them into the target category:` (top/bottom)
- Send tabs target selection modal remembers last selected category and tab group
- Removed virtual scrolling threshold configuration
- Fixed default selecting issue when first entering settings page

---

## v2.7.4

**Release Date:** May 29, 2025

- Interaction and style adjustments
- Tab group and tab interaction adjustments
- Added configuration for tab group action button style
- Popup panel displays tab groups
- Feature and style optimizations

---

## v2.7.3.1

**Release Date:** May 14, 2025

- Fine-tune the English translation
- Reduce the scope of the multi-select box
- Multi-selected tabs support batch opening
- Filter special characters

---

## v2.7.3

**Release Date:** April 27, 2025

- Added **Global Search** modal and keyboard shortcuts
- Added copy feature for tab group and tabs
- Added configuration option: `Position for inserting tabs when moving or inserting them into the target tab group:` (top/bottom)
- Tabs now support multi-selection and batch operations

---

## v2.7.2

**Release Date:** April 16, 2025

- SessionBuddy extension data adaptation
- Split modules for Settings page form, added menu navigation
- Adjusted the responseType to `text` for gist raw_url request

---

## v2.7.1

**Release Date:** April 3, 2025

- English localization updates
- Fixed issue where tabs are not automatically closed after sending in popup panel
- Removed repositioning when removing selected tab groups, maintaining original position
- Save and restore currently selected category or tab group (stored independently per window)
- Interaction and style scope control optimization for shadowDOM in ContentScript

---

## v2.7.0

**Release Date:** March 28, 2025

- Upgraded WXT version
- Added CONTRIBUTING documentation
- Enabled virtual scrolling for Recycle Bin page
- Firefox compatibility
- Create and restore snapshot feature
- Firefox browser Support

---

## v2.6.4

**Release Date:** March 13, 2025

- Enhanced internationalization type safety
- Preferences interaction optimization
- Fine-tune the English translation
- Feature optimizations: link style adjustments for tab, global search, favicon retrieval optimization

---

## v2.6.3

**Release Date:** February 28, 2025

- Initialize state data on startup
- Added directory selection modal in Admin Page
- Popup panel action buttons collapse into dropdown menu
- Added manual hibernation for tabs
- Foreground/background opening configuration for tabs
- Added configuration option: `Restore the named group as a browser tab group?`

---

## v2.6.2

**Release Date:** February 18, 2025

- Send tabs action buttons optimization for Popup panel
- Format auto-detects for import data
- Context menus logic adjustment
- Added Toby extension data format

---

## v2.6.1

**Release Date:** February 16, 2025

- Feature optimizations
- Fine-tune the English translation
- Added KepTab extension data format
- Interaction optimizations
- Fixed reordering issue when all tab groups in a category are starred
- Multi-window data sync, runtime message optimization

---

## v2.6.0

**Release Date:** January 9, 2025

- Added auto-sync feature and related configuration options
- Bump nanoid from 3.3.7 to 3.3.8
- Fine-tune the English translation

---

## v2.5.13.1

**Release Date:** December 24, 2024

- Fine-tune the English translation
- Title position adjustment for Divider Component
- Version Adjusted

---

## v2.5.13

**Release Date:** December 23, 2024

- Added preferences for remote sync
- Added import/export feature for preferences

---

## v2.5.12

**Release Date:** December 18, 2024

- Adjusted sort-by-time icon, updated privacy policy
- Bug fixes and new configuration options
- Preserve locked tabs when setting auto-deleting tabs after opening

---

## v2.5.11

**Release Date:** December 6, 2024

- Fine-tune the English translation
- New features and interaction optimizations
- Feature Optimizations
- Added tab group reordering by creation time
- Navigate to specific tab After searching and clicking on it
- Added action module and reload button in Popup panel 
- Added dropdown menu with reload, send all tabs, and other operations in Admin Page 
- Auto-clears once a day for **Recycle Bin**

---

## v2.5.10

**Release Date:** December 2, 2024

- Interaction optimization
- Auto-confirm on `Enter` key in tab info modal
- Display "Expand All" button in list page
- Added URL exclusion and configuration for Sending tabs
- Fixed issue for tab removing in Popup panel

---

## v2.5.9

**Release Date:** November 26, 2024

- Performance optimization

---

## v2.5.8

**Release Date:** November 22, 2024

- Bump cross-spawn from 7.0.3 to 7.0.6
- Isolated styles to prevent style and theme pollution

---

## v2.5.6

**Release Date:** November 18, 2024

- English localization updates
- Supports selecting specific directory for Sending tabs
- Adjusted stopPropagation

---

## v2.5.5

**Release Date:** November 14, 2024

- Added configuration option for popup panel and click interaction for extension icon
- Fine-tune the English translation

---

## v2.5.4

**Release Date:** November 10, 2024

- Display current extension version
- Version display when upgrade available
- New configuration options, export content adjustments

---

## v2.5.3

**Release Date:** November 6, 2024

- Support pushing local data to all remote storage with one click

---

## v2.5.2

**Release Date:** October 25, 2024

- Bug fixes and interaction adjustments
- Version update

---

## v2.5.1

**Release Date:** October 23, 2024

- Experience optimization: disable drag-and-drop when the tab list is in edit mode
- Added configuration option: `Open tab group in a new window?`
- Optimization of favicon icon link url

---

## v2.5.0

**Release Date:** October 18, 2024

- Added WebDAV sync
- Nicetab-message style adjustments for Content-scripts
- Dynamic switching for lang attribute 

---

## v2.4.0

**Release Date:** October 10, 2024

- Support commands shortcuts, added authorization
- Added configuration option: `Open NiceTab Admin Page when sending tabs?`
- Added configuration option: `Display ContextMenu on your webpage?`

---

## v2.3.1

**Release Date:** October 6, 2024

- The tab supports foreground opening and background silent opening
- Added configuration option: `Display the number of open tabs on the extension icon?`
- Added persistent storage for UI state
- Added authorization prompt message for the next version

---

## v2.3.0

**Release Date:** September 30, 2024

- Support tab and URL search functions

---

## v2.2.8

**Release Date:** September 23, 2024

- Added QR code viewing function for tabs
- The tab list enables virtual scrolling based on the situation

---

## v2.2.7

**Release Date:** September 20, 2024

- Added tab threshold setting for current category (default 500), removed "Show More" button

---

## v2.2.6

**Release Date:** September 15, 2024

- Optimization of large data list, import and export loading
- Rendering optimization for large data volume on list pages and import/export pages

---

## v2.2.4

**Release Date:** September 10, 2024

- Context menus updated

---

## v2.2.3

**Release Date:** September 10, 2024

- Fixed GitHub API sync issue

---

## v2.2.2

**Release Date:** September 7, 2024

- Remote sync error handling

---

## v2.2.1

**Release Date:** September 7, 2024

- Feature and style optimizations

---

## v2.2.0

**Release Date:** September 3, 2024

- Upgraded WXT version
- Fully supports for light/dark theme switching
- Updated feature screenshots

---

## v2.1.0

**Release Date:** August 25, 2024

- Overwrite confirmation reminder for remote sync 
- Copy links within tab group
- Hover to display title and link for tabs


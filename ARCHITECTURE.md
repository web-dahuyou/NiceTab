<p>
  English | <a href="./ARCHITECTURE-ru.md">Русский</a>
</p>

## Architecture

### Extension Structure

The extension follows WXT's entrypoint-based architecture with these key directories:

- **entrypoints/background/**: Background service worker handling extension lifecycle, tab events, badges, and popup initialization
- **entrypoints/popup/**: Popup panel UI (displayed on extension icon click)
- **entrypoints/options/**: Main dashboard UI with sub-pages for List, Settings, Import/Export, Sync, and Recycle Bin
- **entrypoints/content/**: Content scripts for webpage context menu integration
- **entrypoints/common/**: Shared utilities, storage management, hooks, and constants
- **entrypoints/nice-newtab/**: Custom new-tab UI; background redirects browser new-tab URLs according to settings
- **entrypoints/types/**: TypeScript type definitions for the entire extension

### Data Management

The extension uses WXT's storage wrapper over browser storage, with structured utilities in `entrypoints/common/storage/`:

- **tabListUtils**: Manages tab list data (categories, groups, tabs)
- **settingsUtils**: Manages user preferences and settings
- **syncUtils**: Handles GitHub/Gitee Gists synchronization
- **syncWebDAVUtils**: Handles WebDAV synchronization
- **recycleBinUtils**: Manages deleted items for recovery
- **themeUtils**: Manages theme/color preferences
- **stateUtils**: Manages application state
- **snapshotUtils**: Manages versioned snapshots and migration
- **newTabUtils**: Reads the saved tab list for the custom new-tab page

`storage/index.ts` creates utility instances and exports storage listeners. `instanceStore.ts` provides access within each JS context; these instances are not shared memory across background, popup, and pages.

### Key Data Models

Core data types defined in `entrypoints/types/tabList.ts`:

- **TagItem**: Category containing groupList
- **GroupItem**: Tab group containing tabList
- **TabItem**: Individual tab with URL, title, favicon

The hierarchy: TagItem (Category) → GroupItem (Tab Group) → TabItem (Tab)

### Internationalization

Uses `react-intl` for i18n:
- Supports Chinese Simplified (zh-CN), Chinese Traditional (zh-TW), English (en-US), and Russian (ru-RU)
- Locale modules in `entrypoints/common/locale/modules/`
- Ant Design locale integration via `antdMap`

### UI Framework

- **React 18** with TypeScript
- **Ant Design 5** for UI components
- **styled-components** for custom styling
- **react-router-dom** for options page navigation
- **pragmatic-drag-and-drop** (Atlassian) for drag-and-drop functionality
- **react-virtuoso** for virtual list rendering (performance optimization)

### Extension Permissions

Key permissions configured in `wxt.config.ts`:
- `storage`: For data persistence
- `tabs`: For tab management
- `contextMenus`: For right-click menu
- `tabGroups`: For browser's native tab groups
- `commands`: Chrome-only for keyboard shortcuts
- `alarms`: For auto-sync scheduling
- `scripting`: For content script injection

Firefox has conditional permissions due to API differences.

## Key Files and Patterns

### Background Worker (`entrypoints/background/index.ts`)

- Initializes context menus, keyboard commands, and tab event listeners
- Sets extension badge showing opened tab count
- Handles page title customization
- Manages popup panel initialization based on settings

### Common Utilities

- **contextMenus.ts**: Right-click menu registration and handlers
- **commands.ts**: Keyboard shortcut command handlers
- **tabs.ts**: Tab manipulation utilities (create, close, hibernate, etc.)
- **keyMap.ts**: Keyboard shortcuts mapping for operations
- **constants.ts**: Application constants and settings property enums

### Options Page Structure

The options page (`entrypoints/options/`) contains:
- **home/**: Main tab list management page with tree navigation
- **settings/**: Preferences configuration forms
- **importExport/**: Import/export functionality
- **sync/**: Remote sync configuration (Gists/WebDAV)
- **recycleBin/**: Deleted items recovery
- **snapshots/**: Manual snapshot history and latest automatic snapshot

### Important Hooks

- **global.ts**: Global event bus and messaging
- **selectionBox.ts**: Multi-selection box functionality
- **themeColors.ts**: Theme color management
- **treeData.ts**: Category/group tree operations

## Development Guidelines

### File Export Requirement

WXT script entrypoints require the appropriate default-exported entrypoint definition. Ordinary shared modules and HTML-loaded scripts do not universally require a default export. See the examples and conventions in [CONTRIBUTING](CONTRIBUTING.md).

### Import Path Alias

The `~` alias points to the project root; use it for cross-module imports:
```ts
import { something } from '~/entrypoints/common/utils';
```

### Styling Approach

- Use styled-components for component styling
- Follow Ant Design's theme system for consistent UI
- Theme colors managed via themeUtils
- Light/dark mode switching supported

### Browser API Usage

Use `browser.*` API (WXT's cross-browser wrapper) instead of `chrome.*`:
```ts
browser.tabs.query({}) // instead of chrome.tabs.query({})
```

### Storage Pattern

Use the predefined storage utilities rather than direct storage API calls:
```ts
// Correct
const settings = await settingsUtils.getSettings();

// Avoid
const settings = await storage.getItem('settings');
```

### Type Safety

Run `pnpm run compile` before committing to check TypeScript types.

### Commit Message Convention

Follow the existing Fork → `origin/dev` feature branch → push to your fork → PR to upstream `dev` workflow in [CONTRIBUTING](CONTRIBUTING.md). Commit titles use an English type and Chinese description; common types are:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for refactoring
- `style:` for formatting
- `test:` for tests
- `chore:` for maintenance

## Browser-Specific Considerations

### Firefox Differences

Firefox has restricted permissions for privileged URLs:
- Cannot open `chrome:`, `javascript:`, `data:`, `file:` URLs
- Cannot open privileged `about:` URLs (e.g., `about:config`)
- `tabGroups` permission is optional (requires user grant)
- `commands` and `favicon` permissions not available

`isFirefox` in `wxt.config.ts` controls build configuration. Runtime modules use `import.meta.env.FIREFOX` and capability checks in `entrypoints/common/utils/support.ts`; Firefox grouping also requires the optional permission.

### Content Security Policy

Different CSP configurations for Firefox and Chrome in `wxt.config.ts` due to Firefox's stricter security requirements.

## Testing and Quality

The project has Vitest tests integrated with WXT through `WxtVitest()`. Quality checks include:
- TypeScript type checking (`pnpm run compile`)
- ESLint checking without automatic edits (`pnpm lint:no-fix`); `pnpm lint` applies fixes
- Existing Vitest tests (`pnpm test`, or a targeted test file)
- Manual testing across browsers

## Remote Sync Implementation

Sync functionality supports multiple backends:
- **GitHub Gists**: Requires a personal access token with permission to access Gists
- **Gitee Gists**: Alternative for users in regions with GitHub access issues
- **WebDAV**: Supports multiple WebDAV accounts

Sync strategy: Merge-based (doesn't sync deletions by default). Users must manually overwrite to sync deletions.

## Performance Considerations

- Uses **react-virtuoso** for virtual scrolling in large tab lists
- **lodash-es** for utility functions (ES modules for better bundling)
- Debounced event handlers to prevent excessive API calls
- Storage listeners notify registered consumers; each consumer determines what to refresh

## Extension Manifest

WXT auto-generates manifest.json from `wxt.config.ts`. Key manifest features:
- Default locale: `zh_CN`
- Keyboard shortcuts defined in `commands` section
- Homepage URL links to GitHub repository
- Browser-specific settings for Firefox gecko compatibility


## Domain model and invariants

`entrypoints/types/tabList.ts` defines the saved hierarchy:

```text
TagItem (category, tagId)
└── groupList: GroupItem[] (saved group, groupId)
    └── tabList: TabItem[] (saved tab, tabId)
```

Saved string IDs are distinct from runtime browser tab/group IDs. Browser groups describe currently open tabs; NiceTab groups persist independently of them.

- The staging area is a special category (`static`, normally `tagId: '0'`). `getTagList()` ensures it exists at the front of the list.
- Starred groups precede unstarred groups within a category. Insertion and movement may adjust `isStarred` according to the destination position.
- Category and group locks affect destructive/reordering operations. Check both UI guards and storage methods; locking is not a universal read-only flag for every operation.
- Copying, moving, merging, and restoring have different ID, deduplication, and source-removal rules. Preserve those distinctions, including partial failures.
- Recycle-bin data retains the hierarchy. `RecycleBinUtils` extends `TabListUtils`, so changes to base behavior may affect both stores.

See the `.claude/skills/nicetab-dev/references/checklist.md` before changing these operations.

## Persistence and state

`entrypoints/common/storage/index.ts` creates utility instances and exports `init*StorageListener` helpers. `entrypoints/common/storage/instanceStore.ts` provides access between utility classes within one context. Data is persisted through WXT's storage wrapper; current domain stores use the `local:` namespace, not automatic browser cloud sync.

| Owner                              | Data boundary                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `tabListUtils` / `newTabUtils`     | Saved hierarchy in `local:tabList`; new-tab UI reads the same list           |
| `settingsUtils`                    | Preferences and defaults in `local:settings`                                 |
| `themeUtils` / `stateUtils`        | Theme in `local:theme`; UI/global state in `local:state`                     |
| `recycleUtils` (`RecycleBinUtils`) | Deleted hierarchy in `local:recycleBin`, plus cleanup state                  |
| `snapshotUtils`                    | Versioned `local:snapshots`; automatic capture buffer also uses global state |
| `syncUtils`                        | Gist configuration, result history, and status                               |
| `syncWebDAVUtils`                  | WebDAV configuration; its historical key is `local:syncWevDAVConfig`         |

Do not rename persisted keys to correct spelling without a migration. Utility objects can hold cached data; a write or a `storage.watch` callback does not automatically update every React tree. `entrypoints/common/utils/faviconDb.ts` separately maintains an IndexedDB cache for icons and failed fetches.

## Main workflows

### Send browser tabs to NiceTab

1. Popup actions, context menus, or commands enter `entrypoints/common/contextMenus.ts` and the background action flow.
2. If enabled, destination selection is shown through `SendTargetActionHolder`; confirmation resumes the send action.
3. `entrypoints/common/tabs.ts` and `entrypoints/common/storage/tabListUtils.ts` select/filter browser tabs, preserve supported native grouping, and write the saved hierarchy.
4. Settings govern closing sent tabs, opening the dashboard, and feedback. Existing message/refresh paths update affected views.

### Edit or restore saved items

Home action menus, tree operations, drag-and-drop, and batch actions converge on `entrypoints/options/home/hooks/treeData.ts` and storage utilities. Local `refreshTreeData()` uses the utility's current list; `init()` reads persisted data. Other contexts need a reload/read path, not just a local render call.

Opening saved tabs/groups uses `tabs.ts` for window selection, URL handling, grouping, and discard behavior. Removal after opening depends on settings and the applicable success/lock rules.

### Import, export, and remote sync

`entrypoints/common/utils/importExport.ts` parses and formats supported external data; `tabListUtils.importTags()` applies append, merge, or overwrite semantics. UI lives in `entrypoints/options/importExport`.

`entrypoints/common/storage/syncUtils.ts` handles GitHub/Gitee Gists; `entrypoints/common/storage/syncWebDAVUtils.ts` handles WebDAV. Both expose manual/automatic pull and push with merge or force modes. Merge retains content rather than propagating deletions; force replaces the destination data. Settings inclusion depends on configuration. Remote backup and error handling belong to the respective implementations, not a universal transaction guarantee.

`entrypoints/common/alarms/autoSyncAlarm.ts` schedules automatic sync. Tokens and endpoints are user configuration, not repository defaults.

### Snapshots and startup recovery

`entrypoints/common/storage/snapshotUtils.ts` manages versioned snapshots, manual history, legacy migration, and automatic-buffer promotion. `entrypoints/background/handler.ts` captures browser tab/group events with debounce. Current automatic capture is event-driven; the background clears the legacy auto-save alarm.

On startup, the background turns `snapshotStatus` off, promotes the prior automatic buffer, optionally restores it, and turns capture back on in `finally`. This prevents restore events from immediately overwriting the recovery source. Do not treat snapshots as merely a copy of the saved category tree: they represent open browser windows/tabs.

## Communication and rendering

```text
Component / browser event
    → domain utility → persistent storage
    → local state refresh, registered storage listener, or runtime notification
    → recipient reads data / performs action → UI update
```

- React Context and mitt events stay within one JS context. Shared mitt lives in `entrypoints/common/hooks/global.ts`; Home has `entrypoints/options/home/hooks/homeCustomEvent.ts`.
- `storage.watch` communicates persisted changes only to registered listeners.
- `entrypoints/common/utils/runtimeMsg.ts` sends typed messages between extension contexts; `entrypoints/types/runtimeMsg.ts` defines the protocol. The helper always sends to background and does not aggregate processing acknowledgements.
- `sendTabMessage` in `tabs.ts` targets content scripts in selected tabs. Restricted pages may lack receivers.
- `entrypoints/common/components/Root.tsx` provides shared theme/locale/context and handles UI messages. Dashboard reload messages use the existing URL/update mechanism.

Detailed sender/receiver and cleanup guidance is in the `.claude/skills/nicetab-dev/references/messages.md`.

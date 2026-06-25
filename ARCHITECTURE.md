## Architecture

### Extension Structure

The extension follows WXT's entrypoint-based architecture with these key directories:

- **entrypoints/background/**: Background service worker handling extension lifecycle, tab events, badges, and popup initialization
- **entrypoints/popup/**: Popup panel UI (displayed on extension icon click)
- **entrypoints/options/**: Main dashboard UI with sub-pages for List, Settings, Import/Export, Sync, and Recycle Bin
- **entrypoints/content/**: Content scripts for webpage context menu integration
- **entrypoints/common/**: Shared utilities, storage management, hooks, and constants
- **entrypoints/types/**: TypeScript type definitions for the entire extension

### Data Management

The extension uses Chrome's storage API with structured utilities in `entrypoints/common/storage/`:

- **tabListUtils**: Manages tab list data (categories, groups, tabs)
- **settingsUtils**: Manages user preferences and settings
- **syncUtils**: Handles GitHub/Gitee Gists synchronization
- **syncWebDAVUtils**: Handles WebDAV synchronization
- **recycleBinUtils**: Manages deleted items for recovery
- **themeUtils**: Manages theme/color preferences
- **stateUtils**: Manages application state

All storage utilities follow a singleton pattern via `instanceStore.ts` and provide reactive storage listeners.

### Key Data Models

Core data types defined in `entrypoints/types/tabList.ts`:

- **TagItem**: Category containing groupList
- **GroupItem**: Tab group containing tabList
- **TabItem**: Individual tab with URL, title, favicon

The hierarchy: TagItem (Category) → GroupItem (Tab Group) → TabItem (Tab)

### Internationalization

Uses `react-intl` for i18n:
- Supports Chinese Simplified (zh-CN), Chinese Traditional(zh-TW) and English (en-US)
- Locale modules in `entrypoints/common/locale/modules/`
- Ant Design locale integration via `antdMap`

### UI Framework

- **React 18** with TypeScript
- **Ant Design 5.29.3** for UI components
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

### Important Hooks

- **global.ts**: Global event bus and messaging
- **selectionBox.ts**: Multi-selection box functionality
- **themeColors.ts**: Theme color management
- **treeData.ts**: Category/group tree operations

## Development Guidelines

### File Export Requirement

**Critical**: Every `.js`, `.ts`, `.tsx` file must have an `export default` statement. Files without this will cause errors when running the local service.

### Import Path Alias

The project uses the `~` alias for imports from the entrypoints directory:
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

Follow Angular commit message guidelines:
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

Code checks `isFirefox` flag from `wxt.config.ts` for conditional logic.

### Content Security Policy

Different CSP configurations for Firefox and Chrome in `wxt.config.ts` due to Firefox's stricter security requirements.

## Testing and Quality

No automated test suite currently exists. Quality is ensured through:
- TypeScript type checking (`pnpm run compile`)
- ESLint linting (`pnpm run lint`)
- Manual testing across browsers

## Remote Sync Implementation

Sync functionality supports multiple backends:
- **GitHub Gists**: Requires personal access token with `gists` scope
- **Gitee Gists**: Alternative for users in regions with GitHub access issues
- **WebDAV**: Supports multiple WebDAV accounts

Sync strategy: Merge-based (doesn't sync deletions by default). Users must manually overwrite to sync deletions.

## Performance Considerations

- Uses **react-virtuoso** for virtual scrolling in large tab lists
- **lodash-es** for utility functions (ES modules for better bundling)
- Debounced event handlers to prevent excessive API calls
- Storage listeners use efficient diffing

## Extension Manifest

WXT auto-generates manifest.json from `wxt.config.ts`. Key manifest features:
- Default locale: `zh_CN`
- Keyboard shortcuts defined in `commands` section
- Homepage URL links to GitHub repository
- Browser-specific settings for Firefox gecko compatibility

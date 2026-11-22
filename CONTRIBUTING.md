# Contributing Guide

<p>
  English | <a href="./CONTRIBUTING-zh.md">中文</a> | <a href="./CONTRIBUTING-ru.md">Русский</a>
</p>

Read [Architecture](ARCHITECTURE.md) for execution contexts and data flow. When working with an agent, start with `AGENTS.md` for shared constraints. Task-specific checklists live in `.claude/skills`.

## Unit Testing

The project uses [Vitest](https://vitest.dev/) as the unit testing framework.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific file
pnpm test entrypoints/common/storage/__tests__/tabListUtils.test.ts

# Run tests with coverage report
pnpm test:coverage
```

### Test File Conventions

- Test files are placed in a `__tests__` directory alongside the source file, named `<module>.test.ts`.
- Coverage scope covers utility functions and storage modules under `entrypoints/common/`.

```
entrypoints/common/storage/
├── tabListUtils.ts
└── __tests__/
    └── tabListUtils.test.ts
```

### Writing Guidelines

- **Mock dependencies**: Use `vi.mock()` at the top of the file to mock external dependencies (e.g., `instanceStore`, `wxt/storage`), avoiding reliance on the real environment.
- **Mock methods**: Use `vi.spyOn()` to spy on or mock methods of the object under test. Call `vi.restoreAllMocks()` in `afterEach` to clean up state.
- **WXT globals**: WXT auto-imported modules (like `storage`) must be mocked via `vi.mock('wxt/storage', ...)` rather than setting `globalThis`.
- **Independent test cases**: Reset mock state in `beforeEach` to ensure test cases do not interfere with each other.


## Submitting Code

1. [Fork](https://github.com/web-dahuyou/NiceTab/fork) the repository.
2. Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/${yourname}/NiceTab
   ```
3. Create your feature branch `dev-your-awesome-code` from the `dev` branch.

   ```bash
   git checkout -b dev-your-awesome-code origin/dev
   ```
4. Commit your changes (follow [commit message conventions](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md)).
  Note: Before committing, it is recommended to run the `pnpm compile` command to verify TypeScript types.

   ```bash
   pnpm compile
   git commit -m 'feat: 添加新功能'
   ```
5. Push your branch to your remote repository.

   ```bash
   git push -u origin dev-your-awesome-code
   ```
6. [Create a Pull Request](https://github.com/web-dahuyou/NiceTab/compare) from your `dev-your-awesome-code` branch to the `dev` branch of [web-dahuyou/NiceTab](https://github.com/web-dahuyou/NiceTab/compare/dev).

   ```bash
   https://github.com/web-dahuyou/NiceTab/compare/dev...${yourname}:NiceTab:dev-your-awesome-code
   ```

### Additional commit conventions

- Keep the workflow above: fork, branch from `origin/dev`, push to your own `origin`, and open a PR against the main repository's `dev`. An additional `upstream` remote is not required.
- Project commit titles use `<type>: <Chinese description>` or `<type>(<scope>): <Chinese description>`. Types include `feat`, `fix`, `perf`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, and `chore`. Consult recent `git log` entries.
- Review working-tree and staged diffs before committing. Include only task-related files or hunks and preserve other uncommitted work. Agents commit or push only within user authorization.
- Describe the problem, resulting behavior, scope, and verification in the PR. Include screenshots where useful for UI changes and identify unverified areas.

## Development Guidelines

### Project Setup
- Install dependencies:
  `pnpm install`
- Start the dev server:
  `pnpm run dev`

### File Export Requirement

WXT script entrypoints use `export default defineBackground(...)`, `defineContentScript(...)`, or the appropriate entrypoint definition. Ordinary shared modules and HTML-loaded `main.tsx` files do not universally require a default export. Check new file locations so WXT does not mistake shared files for independent entrypoints.

### Import Path Alias

Prefer the `~` alias, which points to the project root, for cross-module imports. `@` also works, but retain `~` for consistency. Relative imports are appropriate within a directory.

```ts
import { something } from '~/entrypoints/common/utils';
```

### Set Browser Binaries

By default, `WXT` will try to automatically discover where `Chrome/Firefox` are installed. If you encounter an error:

```
ERROR  No Chrome installations found.
```

Or you want to specify a browser executable binary.

You can refer to the [docs - Set Browser Binaries](https://wxt.dev/guide/essentials/config/browser-startup.html#set-browser-binaries) to manually configure the browser binary paths.

```js
// <rootDir>/web-ext.config.ts

import { defineRunnerConfig } from 'wxt';

export default defineRunnerConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

### Persist User Data

If you want to preserve user data between development sessions, you can persist data by following the [official documentation - persist-data](https://wxt.dev/guide/essentials/config/browser-startup.html#persist-data).

```js
// <rootDir>/web-ext.config.ts

import { defineRunnerConfig } from 'wxt';

// Mac/Linux
export default defineRunnerConfig({
   chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});

// Windows
import path from 'path';
export default defineRunnerConfig({
   // On Windows, the path must be absolute
   chromiumProfile: path.resolve('.wxt\\chrome-data'),
   keepProfileChanges: true
})
```

The Mac/Linux and Windows configurations above are alternatives. Choose the one for your operating system and keep only one `export default` in the configuration file.

## Environment and startup

Use pnpm and the repository's `pnpm-lock.yaml`. The root `package.json` declares Node.js `>=18.20.0`, but current dependencies including `marked` and `happy-dom` require Node.js `>=20`. Your environment must also satisfy dependency requirements; the root declaration does not guarantee that all tools work on Node 18. `package.json` and the lockfile define dependencies and scripts.

```sh
pnpm install
pnpm dev
# Firefox
pnpm dev:firefox
```

The `postinstall` script runs `wxt prepare`, generating the `.wxt` type configuration inherited by `tsconfig.json`. Do not maintain generated `.wxt` files manually. If dependencies are already installed but this configuration is missing, run `pnpm exec wxt prepare`.

`dev:firefox` currently passes `--mode production`, so its mode differs from `dev`. Development, build, and packaging scripts first run `convert:guide`, which may update guide HTML. Inspect the diff to avoid including unrelated generated files.

## Browser startup and local data

`web-ext.config.ts` configures the local runner and currently stores Chromium development data in `.wxt/chrome-data`. If the browser cannot be found, configure suitable `binaries` locally; agents still need approval before changing configuration. Do not commit personal absolute browser paths as shared defaults.

Development profiles may retain real tab data. Use disposable data to verify deletion, overwrite imports, removal after restoration, and remote sync. `wxt.config.ts` defines permissions, shortcuts, and browser-specific manifest settings.

## Code conventions

Follow these contribution conventions. Exact formatter and lint settings are defined in `.prettierrc` and `eslint.config.js`.

- **Formatting and scope:** Use two-space indentation, semicolons, single quotes, and trailing commas. Follow neighboring code and format only the changed scope. ESLint does not currently enforce import ordering; avoid unrelated file-wide reordering.
- **Names and types:** Use PascalCase for React components, the `use` prefix for hooks, and camelCase for variables and functions. Follow existing constant/enum conventions. Shared domain types belong in `entrypoints/types/`; keep local types near their use and prefer `import type` for type-only imports. Give new interfaces explicit types instead of bypassing errors with `any` or assertions.
- **Imports and exports:** Prefer the root alias `~` across modules, for example `~/entrypoints/common/storage`; relative imports are fine within a directory. WXT script entrypoints use `export default defineBackground(...)`, `defineContentScript(...)`, or the appropriate entrypoint definition. Ordinary modules and HTML-loaded `main.tsx` files have no universal default-export requirement. Do not add meaningless default exports to shared files. Place new files so WXT does not mistake them for independent entrypoints.
- **React and styling:** Follow existing function components, hooks, Ant Design, and styled-components patterns. Preserve hook ordering and clean up effect listeners/timers. Review dependencies and closures even though exhaustive dependency linting is disabled. Reuse theme values and corresponding `*.styled.tsx` or existing style files. Preserve Shadow DOM style isolation in content scripts.
- **Data and side effects:** UI code uses the instances in `entrypoints/common/storage/` rather than bypassing defaults, migration, merging, or recycle-bin behavior. Reuse `tabs.ts` for browser operations; use `browser.*` with capability and permission checks. Persistent IDs are not browser tab IDs.
- **Messages and refresh:** Account for both local rendering and cross-context notification. Mitt and React Context do not cross windows. Update types, senders, and receivers together for new runtime messages; see the `.claude/skills/nicetab-dev/references/messages.md`.
- **Domain constraints:** Preserve staging-area behavior, locks, starred ordering, deduplication, and failed-item handling when changing hierarchy operations; see the `.claude/skills/nicetab-dev/references/checklist.md`. Do not describe an unverified design intention as an implemented guarantee.
- **Copy and logging:** Put user-visible text in locale resources. Preserve useful error handling and diagnostics without logging credentials. Agents follow the project approval rule before removing added logs. Prefer the existing dayjs convention `YYYY-MM-DD_HHmmss` for dates in filenames.

## Localization and documentation

UI resources live in `entrypoints/common/locale/modules/`: `zhCN.ts`, `zhTW.ts`, `enUS.ts`, and `ruRU.ts`. Keep all four resources aligned when changing keys, including placeholders and ICU meaning. React components use the existing `useIntlUtls().$fmt` pattern; non-React code uses locale utilities. Manifest strings are maintained separately in `public/_locales/`.

Keep meaning, commands, and links aligned across existing document translations; do not add languages by default. See the `.claude/skills/translate/SKILL.md` for terminology and workflow. Manually maintain only `CHANGELOG-zh.md` and `CHANGELOG.md`; their HTML and `.output` artifacts belong to generation workflows.

Documents are converted to bundled static HTML by `scripts/md2html.js`. Preserve the existing `<p>` / `<a>` language switchers and link to same-directory `.md` documents. The script also recognizes Markdown links, but flattens output without copying source directories or preserving nested document paths. Use repository paths for source code and internal agent materials to avoid collisions between files named `SKILL.md`. Validate conversion using a script copy in a temporary directory and check generated language links; do not edit generated HTML manually.

When documenting existing features, use committed HEAD source as the baseline rather than staged or uncommitted features. Committed does not mean released. For documentation accompanying ongoing development, explicitly establish its scope and status.

## Validation and builds

Select checks according to impact and report results and unverified areas in the PR:

| Command                                  | Purpose                        |
| ---------------------------------------- | ------------------------------ |
| `pnpm compile`                           | TypeScript checking            |
| `pnpm lint:no-fix`                       | ESLint without automatic edits |
| `pnpm test <test-file-path>`             | Related existing tests         |
| `pnpm test`                              | All Vitest tests               |
| `pnpm test:watch` / `pnpm test:coverage` | Watch mode / coverage report   |
| `pnpm build` / `pnpm build:firefox`      | Chromium / Firefox build       |
| `pnpm zip` / `pnpm zip:firefox`          | Browser-specific packages      |

`pnpm lint` applies fixes; check the intended scope before using it. Documentation-only changes need path, link, Markdown, and translation checks rather than the full application suite. Agents do not proactively add tests for new features; when explicitly requested, follow the `.claude/skills/unit-test/SKILL.md`.

Tests live in sibling `__tests__/` directories as `*.test.ts` or `*.test.tsx`. Vitest integrates WXT through `WxtVitest()`; `vitest.config.ts` defines coverage. Mock browser behavior does not replace real-browser validation.

For UI or browser API changes, manually check affected dashboard, popup, and content-script surfaces in applicable Chromium/Firefox scenarios. Check another window's dashboard for data updates and reopen pages for persistence. Use test endpoints for sync and check merge/overwrite modes, failure feedback, and the settings-sync option.

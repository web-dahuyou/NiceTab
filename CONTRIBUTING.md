# Contributing Guide

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
  Note: Before committing, it is recommended to run the `pnpm compile` command to check the typescript types.

   ```bash
   pnpm compile
   git commit -m 'feat: add a new feature'
   ```
5. Push your branch to your remote repository.

   ```bash
   git push -u origin dev-your-awesome-code
   ```
6. [Create a Pull Request](https://github.com/web-dahuyou/NiceTab/compare) from your `dev-your-awesome-code` branch to the `dev` branch of [web-dahuyou/NiceTab](https://github.com/web-dahuyou/NiceTab/compare/dev).

   ```bash
   https://github.com/web-dahuyou/NiceTab/compare/dev...${yourname}:NiceTab:dev-your-awesome-code
   ```

## Project Setup
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
// <rootDir>/web-ext.config.ts

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
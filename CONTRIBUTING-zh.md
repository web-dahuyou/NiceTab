# 贡献指南

## 提交代码

1. [Fork](https://github.com/web-dahuyou/NiceTab/fork) 仓库。
2. 将上述Fork仓库克隆到本地。

   ```bash
   git clone https://github.com/${yourname}/NiceTab
   ```
3. 从 `dev` 分支创建自己的分支 `dev-your-awesome-code`。

   ```bash
   git checkout -b dev-your-awesome-code origin/dev
   ```
4. 提交修改（注意 [commit message规范](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md)）。

   ```bash
   git commit -m 'feat: add a new feature'
   ```
5. 将你的分支推送到你的远程仓库。

   ```bash
   git push -u origin dev-your-awesome-code
   ```
6. 从 `dev-your-awesome-code` [创建PR](https://github.com/web-dahuyou/NiceTab/compare) 到 [web-dahuyou/NiceTab](https://github.com/web-dahuyou/NiceTab/compare/dev) `dev`分支。

   ```bash
   https://github.com/web-dahuyou/NiceTab/compare/dev...${yourname}:NiceTab:dev-your-awesome-code
   ```

## 项目启动
- 依赖安装：`pnpm install`
- 启动插件服务：`pnpm run dev`

**注意**：每个js文件都必须有 `export default` 默认导出，否则本地启动服务时会报错。

### 指定浏览器可执行文件路径

默认情况下，`wxt` 会自动识别 `Chrome/Firefox` 的安装路径，并启动对应的浏览器。如果启动项目报错找不到浏览器安装路径
```
ERROR  No Chrome installations found.  
```

或者想自定义浏览器可执行文件，可以参考 [官方文档-Set Browser Binaries](https://wxt.dev/guide/essentials/config/browser-startup.html#set-browser-binaries)，手动配置浏览器可执行文件的路径即可。

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

### 持久化存储用户数据

如果希望每次启动项目时，都使用上次保存的用户数据，可以参考 [官方文档-persist-data](https://wxt.dev/guide/essentials/config/browser-startup.html#persist-data) 进行持久化存储即可。
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
   // 在Windows上，路径必须是绝对的
   chromiumProfile: path.resolve('.wxt\\chrome-data'),
   keepProfileChanges: true
})
```

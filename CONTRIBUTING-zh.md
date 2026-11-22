# 贡献指南

<p>
  中文 | <a href="./CONTRIBUTING.md">English</a> | <a href="./CONTRIBUTING-ru.md">Русский</a>
</p>

开始前阅读 [架构文档](ARCHITECTURE.md)，了解运行上下文和数据流。使用 Agent 协作时，从 `AGENTS.md` 进入共享工作约束；具体开发检查清单维护在 `.claude/skills`。

## 单元测试

项目使用 [Vitest](https://vitest.dev/) 作为单元测试框架。

### 运行测试

```bash
# 运行全部测试
pnpm test

# 运行指定文件的测试
pnpm test entrypoints/common/storage/__tests__/tabListUtils.test.ts

# 运行测试并查看覆盖率报告
pnpm test:coverage
```

### 测试文件约定

- 测试文件放在源文件同级的 `__tests__` 目录下，命名为 `<模块名>.test.ts`。
- 覆盖率范围主要为 `entrypoints/common/` 下的工具函数和 storage 模块。

```
entrypoints/common/storage/
├── tabListUtils.ts
└── __tests__/
    └── tabListUtils.test.ts
```

### 编写规范

- **Mock 依赖模块**：使用 `vi.mock()` 在文件顶部 mock 外部依赖（如 `instanceStore`、`wxt/storage` 等），避免测试依赖真实环境。
- **Mock 方法**：使用 `vi.spyOn()` 对被测对象的方法进行 spy 或 mock，`afterEach` 中调用 `vi.restoreAllMocks()` 清理状态。
- **WXT 全局变量**：WXT 自动导入的模块（如 `storage`）需要通过 `vi.mock('wxt/storage', ...)` 进行 mock，而不是设置 `globalThis`。
- **每个测试用例独立**：在 `beforeEach` 中重置 mock 状态，确保用例之间互不影响。

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
  注意：提交之前建议执行 `pnpm compile` 命令检查下 typescript 类型
   ```bash
   pnpm compile
   git commit -m 'feat: 添加新功能'
   ```
5. 将你的分支推送到你的远程仓库。

   ```bash
   git push -u origin dev-your-awesome-code
   ```
6. 从 `dev-your-awesome-code` [创建PR](https://github.com/web-dahuyou/NiceTab/compare) 到 [web-dahuyou/NiceTab](https://github.com/web-dahuyou/NiceTab/compare/dev) `dev`分支。

   ```bash
   https://github.com/web-dahuyou/NiceTab/compare/dev...${yourname}:NiceTab:dev-your-awesome-code
   ```

### 提交约定补充

- 沿用上面的 Fork、从 `origin/dev` 建分支、推送到自己的 `origin`、向主仓库 `dev` 发起 PR 的流程；不要求额外配置 `upstream`。
- 按项目约定，标题为 `<type>: <中文描述>` 或 `<type>(<scope>): <中文描述>`。类型使用 `feat`、`fix`、`perf`、`docs`、`style`、`refactor`、`test`、`build`、`ci`、`chore` 等英文标识，参考近期 `git log`。
- 提交前检查工作区与暂存区 diff，仅纳入本任务文件或片段，保留其他未提交内容。Agent 执行提交、推送需在用户授权范围内。
- PR 说明问题、修改后行为、影响范围及验证结果；UI 改动按需附截图，未验证事项明确标出。

## 开发指引

### 启动服务
- 依赖安装：`pnpm install`
- 启动插件服务：`pnpm run dev`

### 文件导出要求

**注意**：WXT 脚本入口按类型使用 `export default defineBackground(...)`、`defineContentScript(...)` 或相应入口定义。普通共享模块及 HTML 引入的 `main.tsx` 不统一要求默认导出。新增文件时需检查位置，避免被 WXT 误识别为独立入口。

### 文件导入路径别名

项目跨模块导入优先使用指向项目根目录的 `~` 别名；`@` 也可用，沿用 `~` 保持一致。同目录可以使用相对路径。

```ts
import { something } from '~/entrypoints/common/utils';
```

### 指定浏览器可执行文件路径

默认情况下，`wxt` 会自动识别 `Chrome/Firefox` 的安装路径，并启动对应的浏览器。如果启动项目报错找不到浏览器安装路径

```
ERROR  No Chrome installations found.
```

或者想自定义浏览器可执行文件，可以参考 [官方文档-Set Browser Binaries](https://wxt.dev/guide/essentials/config/browser-startup.html#set-browser-binaries)，手动配置浏览器可执行文件的路径即可。

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

以上 Mac/Linux 和 Windows 配置是两种替代方案，请按操作系统选用，在同一个配置文件中只保留一个 `export default`。

## 环境与启动

使用 pnpm 和仓库中的 `pnpm-lock.yaml`。根 `package.json` 声明 Node.js `>=18.20.0`，但当前依赖中的 `marked`、`happy-dom` 要求 Node.js `>=20`，开发环境需同时满足依赖要求；不要将根声明理解为全部工具都兼容 Node 18。依赖与脚本以 `package.json` 和锁文件为准。

```sh
pnpm install
pnpm dev
# Firefox
pnpm dev:firefox
```

安装后的 `postinstall` 会执行 `wxt prepare`，生成 `.wxt` 类型配置；`tsconfig.json` 继承该配置。不要手工维护生成的 `.wxt` 文件。已有依赖但缺少生成配置时，可运行 `pnpm exec wxt prepare`。

`dev:firefox` 当前传入 `--mode production`，不能假设其模式与 `dev` 完全相同。启动、构建和打包脚本会先运行 `convert:guide`，可能更新指南 HTML；检查 diff，避免顺带提交无关生成文件。

## 浏览器启动与本地数据

`web-ext.config.ts` 管理本地启动器，目前使用 `.wxt/chrome-data` 保存 Chromium 开发数据。找不到浏览器时，在本地配置合适的 `binaries`；涉及配置修改时，Agent 仍须先获得确认。不要把个人浏览器绝对路径提交为公共默认值。

开发 Profile 可能保留真实标签数据。使用临时数据验证删除、导入覆盖、恢复后移除和远程同步。扩展权限、快捷键及各浏览器 Manifest 差异在 `wxt.config.ts` 中定义。

## 代码规范

以下是贡献时应遵守的约定；格式工具的精确配置以 `.prettierrc` 和 `eslint.config.js` 为准。

- **格式与范围：** 2 空格缩进、分号、单引号和尾逗号，沿用相邻代码组织方式。只格式化本次修改范围，避免无关整理。ESLint 当前不强制 import 排序，不额外进行全文件排序。
- **命名与类型：** React 组件使用 PascalCase，自定义 hook 使用 `use` 前缀，变量和函数使用 camelCase；已有常量枚举沿用所在模块风格。跨模块业务类型放在 `entrypoints/types/`，局部类型就近定义；纯类型导入优先 `import type`。为新增接口提供明确类型，避免用 `any` 或类型断言绕过错误。
- **导入与导出：** 跨模块优先使用根目录别名 `~`，例如 `~/entrypoints/common/storage`；同目录可用相对路径。WXT 脚本入口按入口类型使用 `export default defineBackground(...)`、`defineContentScript(...)` 或相应定义。普通模块和 HTML 引入的 `main.tsx` 没有“必须默认导出”的统一规则；不要为共享文件添加无意义的默认导出。新增文件位置需避免被 WXT 误识别为独立入口。
- **React 与样式：** 沿用函数组件、hooks、Ant Design 和 styled-components。保留 hooks 调用顺序，effect 清理监听器和计时器；即使依赖检查规则关闭，也须核对闭包与依赖。主题值来自现有主题系统，样式优先放在对应 `*.styled.tsx` 或现有样式文件中；内容脚本保留 Shadow DOM 样式隔离。
- **数据与副作用：** UI 使用 `entrypoints/common/storage/` 的工具实例读写数据，避免绕过默认值、迁移、合并或回收站逻辑。浏览器操作优先复用 `tabs.ts`，使用 `browser.*` 和能力／权限检测。持久化 ID 不等于浏览器标签页 ID。
- **消息与刷新：** 明确本页面刷新和跨上下文通知；mitt 与 React Context 不跨窗口。新增 runtime 消息同步更新类型、发送方和接收方。详细流程见 `.claude/skills/nicetab-dev/references/messages.md`。
- **业务约束：** 修改层级操作时保留中转站、锁定、星标顺序、去重和失败项目处理，见 `.claude/skills/nicetab-dev/references/checklist.md`。不要把未验证的设计意图写成已经实现的保证。
- **文案与日志：** 用户可见文本通过 locale 资源提供；保留必要的错误处理和诊断日志，避免记录令牌等凭证。Agent 删除新增日志前遵循项目确认规则。涉及文件名日期时优先沿用 dayjs 和 `YYYY-MM-DD_HHmmss` 格式。

## 国际化与文档

UI 资源在 `entrypoints/common/locale/modules/`，现有语言为 `zhCN.ts`、`zhTW.ts`、`enUS.ts`、`ruRU.ts`。修改键时同步这四种资源，保持占位符与 ICU 语义一致。React 组件沿用 `useIntlUtls().$fmt`；非 React 代码沿用 locale 工具。Manifest 文案另在 `public/_locales/` 下维护。

已有多语言文档同步含义、命令和链接，不默认新增语言文件。术语及操作流程见 `.claude/skills/translate/SKILL.md`。Changelog 仅手工维护 `CHANGELOG-zh.md` 和 `CHANGELOG.md`，对应 HTML 和 `.output` 由生成流程处理。

文档会通过 `scripts/md2html.js` 生成供插件访问的静态 HTML。保留原有 `<p>` / `<a>` 语言切换块，链接使用同目录的 `.md` 文件。脚本也识别 Markdown 链接，但输出目录是平铺的，不会复制源码目录或保留嵌套文档结构；源码与 Agent 内部资料应写成仓库路径，避免同名 `SKILL.md` 覆盖输出。验证转换时在临时目录运行脚本副本，检查生成的语言链接，不手改生成 HTML。

整理现有功能说明时以 HEAD 已提交源码为基线，不混入暂存或未提交的功能；已提交也不等于已发布。为正在开发的功能配套写文档时，明确约定范围和状态。

## 验证与构建

按改动影响选择检查，并在 PR 中说明结果和未验证范围：

| 命令                                     | 用途                        |
| ---------------------------------------- | --------------------------- |
| `pnpm compile`                           | TypeScript 类型检查         |
| `pnpm lint:no-fix`                       | ESLint 检查，不自动修改文件 |
| `pnpm test <测试文件路径>`               | 运行相关已有测试            |
| `pnpm test`                              | 运行全部 Vitest 测试        |
| `pnpm test:watch` / `pnpm test:coverage` | 监听测试／生成覆盖率报告    |
| `pnpm build` / `pnpm build:firefox`      | 构建 Chromium／Firefox 扩展 |
| `pnpm zip` / `pnpm zip:firefox`          | 生成对应浏览器安装包        |

`pnpm lint` 会自动修复；使用前确认修改范围。纯文档改动检查路径、链接、Markdown 和各语言一致性即可，不必运行全部应用测试。新增功能不要求 Agent 主动新增测试；用户明确要求时按 `.claude/skills/unit-test/SKILL.md` 编写。

测试放在源文件同级 `__tests__/`，命名为 `*.test.ts` 或 `*.test.tsx`。Vitest 通过 `WxtVitest()` 集成 WXT，覆盖率范围以 `vitest.config.ts` 为准。单元测试的浏览器 mock 不等于真实浏览器验证。

涉及 UI 或浏览器 API 时，手动验证受影响的管理页、popup、内容脚本，以及适用的 Chromium/Firefox 场景。涉及数据更新时检查另一个窗口的管理页；涉及持久化时检查重开页面后的结果。同步使用测试端点，验证合并与覆盖、失败反馈及设置同步开关。

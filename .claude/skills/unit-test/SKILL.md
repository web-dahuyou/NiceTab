---
name: unit-test
description: NiceTab 测试编写与维护规范；用户要求新增测试或任务涉及修改已有测试时读取。
---

# NiceTab 单元测试

用户要求编写测试，或任务涉及修改已有测试时，按本指引选择测试边界。新增测试的授权见 [项目工作约束](../../../CLAUDE.md)，运行命令见 [贡献指南](../../../CONTRIBUTING-zh.md#单元测试)。

## 配置与目录

- 使用 Vitest，配置在 `vitest.config.ts`，`WxtVitest()` 处理 WXT 转换、别名及测试环境集成。
- 在被测文件同级的 `__tests__/` 中放置 `<模块名>.test.ts`；含 JSX 的组件测试使用 `.test.tsx`。
- 测试显式从 `vitest` 导入 `describe`、`it`、`expect`、`vi` 等。
- React DOM 测试按现有组件测试配置 `// @vitest-environment happy-dom`，不要为单个测试随意修改全局配置。
- 覆盖率范围以配置中的 include/exclude 为准，不代表所有测试仅限于 `common`。

## 选择测试边界

围绕实际契约选正常、边界和失败场景，断言写入结果、顺序、去重内容、成功与失败项目，或页面操作后的状态。空值与异常输入应来自调用方可能传入的数据或明确的错误契约，保持用例输入的类型约束。

例如排序应断言完整 ID 顺序，去重应断言保留了哪些项目，批量恢复应断言失败项目仍在源数据中。仅检查方法存在或数组非空不能证明这些行为。

| 要验证的行为 | 已有测试 |
| --- | --- |
| 设置默认值及持久化读写 | [settingsUtils.test.ts](../../../entrypoints/common/storage/__tests__/settingsUtils.test.ts) 使用内存存储替身，每例清空后重新创建工具实例 |
| 打开后按成功结果处理源数据 | [treeData.test.ts](../../../entrypoints/options/home/hooks/__tests__/treeData.test.ts) 控制打开操作的完成时机，断言等待期间的源数据及完成后的保留结果 |
| 批量删除序列化和失败后的后续请求 | [batchRemoval.test.ts](../../../entrypoints/background/__tests__/batchRemoval.test.ts) 控制前一笔写入何时结束，检查普通和无痕请求的处理顺序及回执 |
| 扩展消息的目标过滤和页面更新 | [Root.favicon.test.tsx](../../../entrypoints/common/components/__tests__/Root.favicon.test.tsx) 用 `fakeBrowser.runtime.onMessage.trigger()` 触发消息，检查实际渲染结果 |

## Mock 与清理

- 先阅读相邻测试确定边界。测试存储类时可 mock `wxt/storage`；测试调用方时可 mock `~/entrypoints/common/storage` 或 `instanceStore`，不要同时替换掉要验证的行为。
- `vi.mock()` 会被提升；工厂依赖的初始化数据按需使用 `vi.hoisted()`，不要依赖普通 import 的文本顺序。
- WXT 提供 `wxt/testing` 的 `fakeBrowser`。需要隔离浏览器状态时参考现有用例调用 `fakeBrowser.reset()`。针对环境缺少的权限、窗口或跨上下文 API 补充 mock。真实浏览器行为按改动范围单独验证。
- WXT 自动导入的 `storage` 按模块来源 mock；`navigator` 等真正全局对象使用 `vi.stubGlobal()`。
- 每个用例重置内存存储和 mock 调用；spy 使用 `vi.restoreAllMocks()` 清理，全局 stub 使用 `vi.unstubAllGlobals()`，fake timer 使用后恢复真实计时器，组件测试清理挂载。
- 外部同步测试 mock 网络请求，不访问真实 Gist/WebDAV 或用户存储。

## Mock 与断言示例

测试调用方时，可按实际使用的字段 mock 存储模块；下面保留常用的模块替换方式，不替换被测函数本身：

```ts
import { afterEach, beforeEach, expect, vi } from 'vitest';

vi.mock('~/entrypoints/common/storage', () => ({
  tabListUtils: {
    getInitialTabGroup: () => ({
      groupId: '',
      groupName: '',
      createTime: '',
      isStarred: false,
      isLocked: false,
      tabList: [],
    }),
    getInitialTag: () => ({
      tagId: '',
      tagName: '',
      createTime: '',
      isLocked: false,
      groupList: [],
    }),
  },
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

使用 `vi.stubGlobal('navigator', { userAgent: 'test-agent' })` 模拟真正的浏览器全局对象。测试存储类本身时，参考 `entrypoints/common/storage/__tests__/settingsUtils.test.ts` 的 `wxt/storage` mock 和每例清空内存存储的方式。

断言优先使用 `toBe` 比较原始值、`toEqual` 比较结构，异步结果使用 `await expect(...).resolves` 或 `rejects`。例如排序后的完整 ID 列表应为 `expect(actualIds).toEqual(['first', 'second'])`，不能只检查数组非空；统计值应与源数据计算出的数量对照，而不是仅用 `toHaveProperty` 检查字段存在。

## 验证

先运行受影响文件，例如：

```sh
pnpm test entrypoints/common/storage/__tests__/tabListUtils.test.ts
```

共享逻辑改动按影响范围运行更多已有测试，必要时执行 `pnpm test` 或 `pnpm test:coverage`。报告失败原因和覆盖边界；不得通过删除断言或放宽断言掩盖问题。配置变更仍需遵循项目确认规则。

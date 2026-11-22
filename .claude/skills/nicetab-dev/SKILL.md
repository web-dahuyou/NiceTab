---
name: nicetab-dev
description: NiceTab 功能开发与业务流程排查指引；修改设置、标签层级、浏览器操作或跨页面状态时读取。
---

# NiceTab 开发指引

使用本指引定位业务入口、写入位置和刷新链路。实施范围与测试授权遵循 [项目工作约束](../../../CLAUDE.md)，代码规范和验证命令见 [贡献指南](../../../CONTRIBUTING-zh.md)。

## 定位任务

1. 从实际触发点开始追踪，例如页面按钮、右键菜单、快捷键或后台事件。需要定位文件时查 [知识导航](../../knowledge/nicetab-overview.md)。
2. 确认数据属于保存列表、实时浏览器状态还是快照，并定位读写数据的工具模块。涉及多个扩展上下文时，对照 [架构文档](../../../ARCHITECTURE.md) 找到接收方和刷新方式。
3. 按改动类型读取对应入口和参考资料，仅修改需求涉及的链路。

| 改动                                   | 源码入口与必要阅读                                                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 分类、标签组、标签页增删改、移动、排序 | `entrypoints/common/storage/tabListUtils.ts`、`entrypoints/options/home/hooks/treeData.ts`；读 [业务检查清单](references/checklist.md)                                                                |
| 目录树勾选、批量移动、复制、删除、拖拽 | 从 `entrypoints/options/home/TreeBox.tsx`、`components/TreeBatchActions.tsx` 和 `MoveToModal.tsx` 追到 `tabListUtils.ts` 或 `entrypoints/common/storage/batchRemoval.ts`。读 [目录树批量操作](references/checklist.md#目录树批量操作) |
| 设置项                                 | `entrypoints/common/constants.ts`、`entrypoints/types/global.ts`、`entrypoints/common/storage/settingsUtils.ts`、`entrypoints/options/settings/`；读 [新增设置项](references/checklist.md#新增设置项) |
| 消息、主题、语言、跨页面刷新           | `entrypoints/types/runtimeMsg.ts`、`entrypoints/common/components/Root.tsx`；读 [消息与刷新](references/messages.md)                                                                                  |
| 浏览器标签页、右键菜单、快捷键         | `entrypoints/common/tabs.ts`、`contextMenus.ts`、`commands.ts`、`entrypoints/background/`                                                                                                             |
| 打开保存的标签页或标签组 | `entrypoints/common/components/OpenModeMenu.tsx`、`entrypoints/common/openUtils.ts`、`entrypoints/common/tabs.ts`。读 [浏览器操作与数据恢复](references/checklist.md#浏览器操作与数据恢复) |
| 同步、导入导出                         | `entrypoints/common/storage/syncUtils.ts`、`syncWebDAVUtils.ts`、`entrypoints/common/utils/importExport.ts`；核对合并与覆盖语义                                                                       |
| 快照采集、启动恢复、定时历史 | 手动与自动路径看 `entrypoints/common/storage/snapshotUtils.ts`、`stateUtils.ts`、`entrypoints/background/handler.ts` 和 `entrypoints/options/snapshots/`。定时采集看 `entrypoints/common/alarms/autoSaveOpenedTabsAlarm.ts`，恢复和调整上限看 [需要结果的 Port 请求](references/messages.md#需要结果的-port-请求) |
| 国际化                                 | 读 [translate](../translate/SKILL.md)，检查简中、繁中、英文、俄文资源                                                                                                                                 |
| 用户要求编写测试或修改已有测试         | 读 [unit-test](../unit-test/SKILL.md)                                                                                                                                                                 |

表中的路径相对仓库根目录。简写的文件名可通过 [知识导航](../../knowledge/nicetab-overview.md#功能到源码) 定位。

## 完成检查

- 数据经对应工具模块读写。确认当前页面从哪里读到新数据，以及需要通知哪些上下文。依赖执行结果的操作要核对业务回执。
- 受影响的锁定、中转站、星标顺序、去重和失败处理行为已核对。
- 浏览器能力与授权分别核对，例如 Firefox 原生标签组的可选权限。
- 文案资源与必要文档已同步，验证范围及结果可说明。

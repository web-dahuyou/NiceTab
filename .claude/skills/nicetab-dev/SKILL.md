---
name: nicetab-dev
description: NiceTab 功能开发与业务流程排查指引；修改设置、标签层级、浏览器操作或跨页面状态时读取。
---

# NiceTab 开发指引

遵循 [项目工作约束](../../../CLAUDE.md) 和 [贡献指南](../../../CONTRIBUTING-zh.md)。此技能用于定位改动链路；测试是否新增由任务授权决定。

## 定位任务

1. 从 UI、右键菜单、快捷键或后台事件找到实际调用入口，再追踪存储写入、浏览器操作和页面刷新。
2. 对照 [架构文档](../../../ARCHITECTURE.md) 确认上下文边界；需要文件导航时读 [知识导航](../../knowledge/nicetab-overview.md)。
3. 按下面的任务分支读取参考资料，仅修改需求涉及的链路。

| 改动                                   | 源码入口与必要阅读                                                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 分类、标签组、标签页增删改、移动、排序 | `entrypoints/common/storage/tabListUtils.ts`、`entrypoints/options/home/hooks/treeData.ts`；读 [业务检查清单](references/checklist.md)                                                                |
| 设置项                                 | `entrypoints/common/constants.ts`、`entrypoints/types/global.ts`、`entrypoints/common/storage/settingsUtils.ts`、`entrypoints/options/settings/`；读 [新增设置项](references/checklist.md#新增设置项) |
| 消息、主题、语言、跨页面刷新           | `entrypoints/types/runtimeMsg.ts`、`entrypoints/common/components/Root.tsx`；读 [消息与刷新](references/messages.md)                                                                                  |
| 浏览器标签页、右键菜单、快捷键         | `entrypoints/common/tabs.ts`、`contextMenus.ts`、`commands.ts`、`entrypoints/background/`                                                                                                             |
| 同步、导入导出                         | `entrypoints/common/storage/syncUtils.ts`、`syncWebDAVUtils.ts`、`entrypoints/common/utils/importExport.ts`；核对合并与覆盖语义                                                                       |
| 快照、启动恢复                         | `entrypoints/common/storage/snapshotUtils.ts`、`stateUtils.ts`、`entrypoints/background/handler.ts`、`entrypoints/options/snapshots/`                                                                 |
| 国际化                                 | 读 [translate](../translate/SKILL.md)，检查简中、繁中、英文、俄文资源                                                                                                                                 |
| 用户要求编写测试或修改已有测试         | 读 [unit-test](../unit-test/SKILL.md)                                                                                                                                                                 |

表中未带根目录的文件名与同一单元格前面的完整路径同目录。

## 完成检查

- 数据修改经对应工具类完成，UI 状态与其他上下文更新路径明确。
- 受影响的锁定、中转站、星标顺序、去重和失败处理行为已核对。
- 浏览器差异通过能力检测及权限判断处理；不将 Firefox 统一视为无标签组支持。
- 文案资源与必要文档已同步，验证范围及结果可说明。

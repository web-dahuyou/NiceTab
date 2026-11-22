# NiceTab 项目知识导航

按功能查找入口和写入位置时，从下表开始。模块边界与流程见 [架构文档](../../ARCHITECTURE.md)，代码规范见 [贡献指南](../../CONTRIBUTING-zh.md)，实施步骤见 [nicetab-dev](../skills/nicetab-dev/SKILL.md)。

## 先区分三类数据

- **保存列表**存于 `local:tabList`，层级为 `TagItem → GroupItem → TabItem`，使用独立的字符串 ID。
- **实时浏览器状态**来自 `browser.tabs`、`browser.windows` 和可用的 `browser.tabGroups`。窗口、原生标签组和标签页使用浏览器分配的运行时数字 ID。
- **快照**记录浏览器窗口中的标签页与原生标签组，用于会话恢复。手动及最近一次自动快照存于 `local:snapshots`，定时快照存于 `local:scheduledSnapshots`。

`storage/index.ts` 在每个 JS 上下文创建工具实例，`instanceStore.ts` 提供同一上下文内的访问。页面间通过持久化存储和消息传递变更，接收方按各自的刷新路径更新。

## 功能到源码

以下链接相对本文件，可直接跳转。

| 需求                           | 入口与关联文件                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 浏览器事件、启动恢复、消息分发 | [background/index.ts](../../entrypoints/background/index.ts)、[handler.ts](../../entrypoints/background/handler.ts)                                                                                                                                                                                                                                    |
| 页面路由与顶层导航             | [options/App.tsx](../../entrypoints/options/App.tsx)、[Root.tsx](../../entrypoints/common/components/Root.tsx)                                                                                                                                                                                                                                         |
| 右键菜单、快捷键、发送操作     | [contextMenus.ts](../../entrypoints/common/contextMenus.ts)、[commands.ts](../../entrypoints/common/commands.ts)、[tabs.ts](../../entrypoints/common/tabs.ts)                                                                                                                                                                                          |
| 层级 CRUD、合并、去重、拖放    | [tabListUtils.ts](../../entrypoints/common/storage/tabListUtils.ts)、[treeData.ts](../../entrypoints/options/home/hooks/treeData.ts)                                                                                                                                                                                                                   |
| 树节点与标签组菜单             | [RenderTreeNode.tsx](../../entrypoints/options/home/components/RenderTreeNode.tsx)、[tagActions.tsx](../../entrypoints/options/home/hooks/tagActions.tsx)、[groupActions.tsx](../../entrypoints/options/home/hooks/groupActions.tsx)、[constants.ts](../../entrypoints/options/home/constants.ts)、[types.ts](../../entrypoints/options/home/types.ts) |
| 主列表与多选                   | [TabGroup.tsx](../../entrypoints/options/home/TabGroup.tsx)、[TabListItem.tsx](../../entrypoints/options/home/TabListItem.tsx)、[multiSelection.ts](../../entrypoints/options/home/hooks/multiSelection.ts)                                                                                                                                            |
| 目录树多选与标签组批量操作 | [TreeBox.tsx](../../entrypoints/options/home/TreeBox.tsx)、[TreeBatchActions.tsx](../../entrypoints/options/home/components/TreeBatchActions.tsx)、[MoveToModal.tsx](../../entrypoints/options/home/MoveToModal.tsx)、[batchRemoval.ts](../../entrypoints/common/storage/batchRemoval.ts) |
| 打开保存的标签页或标签组 | [OpenModeMenu.tsx](../../entrypoints/common/components/OpenModeMenu.tsx)、[openUtils.ts](../../entrypoints/common/openUtils.ts)、[tabs.ts](../../entrypoints/common/tabs.ts)、[无痕辅助页](../../entrypoints/incognito-open/main.ts) |
| 全局搜索                       | [BaseGlobalSearch.tsx](../../entrypoints/common/components/BaseGlobalSearch.tsx)、[globalSearch.ts](../../entrypoints/common/hooks/globalSearch.ts)                                                                                                                                                                                                    |
| 发送目录弹窗                   | [SendTargetModal.tsx](../../entrypoints/options/home/SendTargetModal.tsx)、[SendTargetActionHolder.tsx](../../entrypoints/options/home/SendTargetActionHolder.tsx)                                                                                                                                                                                     |
| 设置                           | [constants.ts](../../entrypoints/common/constants.ts)、[global.ts](../../entrypoints/types/global.ts)、[settingsUtils.ts](../../entrypoints/common/storage/settingsUtils.ts)、[settings/](../../entrypoints/options/settings)                                                                                                                          |
| 存储实例与监听                 | [storage/index.ts](../../entrypoints/common/storage/index.ts)、[instanceStore.ts](../../entrypoints/common/storage/instanceStore.ts)                                                                                                                                                                                                                   |
| 回收站                         | [recycleBinUtils.ts](../../entrypoints/common/storage/recycleBinUtils.ts)、[recycleBin/](../../entrypoints/options/recycleBin)                                                                                                                                                                                                                         |
| 快照与会话恢复                 | [snapshotUtils.ts](../../entrypoints/common/storage/snapshotUtils.ts)、[stateUtils.ts](../../entrypoints/common/storage/stateUtils.ts)、[snapshots/](../../entrypoints/options/snapshots)、[state.ts](../../entrypoints/types/state.ts)                                                                                                                |
| 定时快照调度、恢复与上限设置 | [autoSaveOpenedTabsAlarm.ts](../../entrypoints/common/alarms/autoSaveOpenedTabsAlarm.ts)、[portMessage.ts](../../entrypoints/background/portMessage.ts)、[FormModuleSnapshot.tsx](../../entrypoints/options/settings/FormModuleSnapshot.tsx) |
| 导入导出                       | [importExport.ts](../../entrypoints/common/utils/importExport.ts)、[importExport/](../../entrypoints/options/importExport)                                                                                                                                                                                                                             |
| 远程同步与自动调度             | [syncUtils.ts](../../entrypoints/common/storage/syncUtils.ts)、[syncWebDAVUtils.ts](../../entrypoints/common/storage/syncWebDAVUtils.ts)、[autoSyncAlarm.ts](../../entrypoints/common/alarms/autoSyncAlarm.ts)                                                                                                                                         |
| 新标签页                       | [nice-newtab/](../../entrypoints/nice-newtab)、[newTabUtils.ts](../../entrypoints/common/storage/newTabUtils.ts)、[handler.ts](../../entrypoints/background/handler.ts)                                                                                                                                                                                |
| 图标加载与缓存                 | [Favicon.tsx](../../entrypoints/common/components/Favicon.tsx)、[favicon.ts](../../entrypoints/common/utils/favicon.ts)、[faviconDb.ts](../../entrypoints/common/utils/faviconDb.ts)                                                                                                                                                                   |
| 侧栏布局                       | [SidebarLayout.tsx](../../entrypoints/options/components/SidebarLayout.tsx)、[useDragResize.ts](../../entrypoints/options/common/hooks/useDragResize.ts)                                                                                                                                                                                               |

## 页面操作链路

按交互选择阅读顺序。操作定义见 `entrypoints/options/home/types.ts` 和同目录的 `constants.ts`。

- 分类菜单：`RenderTreeNode.tsx` → `useTagActions` → `TreeBox.tsx` → `treeData.ts` 的分类处理分支 → `tabListUtils`。
- 标签组菜单有主列表和侧边栏两个入口：`TabGroup.tsx` / `RenderTreeNode.tsx` 使用 `useGroupActions`，再通过 Home 事件与 `treeData.ts` 执行操作。修改动作时核对两个入口。
- 常用按钮与更多菜单：`groupActions.tsx` 组织 `outerList` / `innerList`，由常用按钮及按钮样式设置控制展示，通用组件为 `ActionBtnList.tsx`、`ActionIconBtn.tsx`。
- 列表拖放由 `DndComponent.tsx`、`DropComponent.tsx` 封装基础行为，`treeData.ts` 连接分类、组和标签页的数据更新。还可从右侧实时标签页列表拖入。
- 主列表的框选与 Shift 范围选择作用于标签页，入口为 `multiSelection.ts` 和共享的 `selectionBox.ts`。目录树勾选作用于当前筛选结果中的标签组，`TreeBatchActions.tsx` 提供批量打开、删除和移动／复制。
- 目录树批量拖拽由 `TreeBox.tsx` 收集选中的组 ID，交给 `treeData.ts` 的 `handleTreeNodeDrop()`，再由 `tabListUtils.onTabGroupsDrop()` 根据目标分类和组 ID 写入。
- 打开模式由 `OpenModeMenu.tsx` 提供。普通扩展页面通过 `openUtils.ts` 打开到当前窗口、新窗口或新无痕窗口。网页内全局搜索通过后台 Port 按保存条目 ID 查找并打开。
- Popup：模块显示由设置控制，可能包含扩展信息、跳转、动作、主题及已打开标签页；关闭所有 popup 模块时，图标点击走后台对应动作。
- 快捷键分为浏览器 `commands` 和页面内 `keyMap.ts` / Home `hotkeys.ts`。默认组合以 `wxt.config.ts` 为准；修改绑定时核对命令注册、动作处理和语言文案。

## 修改时容易遗漏的边界

- **层级操作：** 入口不止一个；主列表、树菜单、拖放和批量操作可能共用存储方法。核对中转站、父级锁定、组锁定、星标顺序以及复制与移动的区别，参见 [检查清单](../skills/nicetab-dev/references/checklist.md)。
- **本地与跨窗口刷新：** `refreshTreeData()` 基于当前工具实例的数据重建树；`init()` 才会读取持久化列表。外部写入后只触发本地渲染可能读到旧缓存，参见 [消息指南](../skills/nicetab-dev/references/messages.md)。
- **同步：** 合并不代表传播删除，覆盖有方向；是否携带设置由配置控制。Gist 和 WebDAV 都要检查，历史键 `syncWevDAVConfig` 不能直接改名。
- **快照**有三条采集路径。快照页手动保存当前窗口，`handler.ts` 监听浏览器标签页和原生组事件并防抖更新自动缓冲，`autoSaveOpenedTabsAlarm.ts` 按设置采集普通窗口的定时历史。启动时暂停采集，转存上次自动缓冲并按设置恢复，最后重新开启采集。
- **浏览器兼容：** `support.ts` 与 `getPermission.ts` 共同处理能力与权限；Firefox 并非一律不支持原生组。内容脚本也并非所有页面都有。
- **国际化：** UI 有简中、繁中、英文、俄文四组资源，Manifest 文案另行维护，见 [translate](../skills/translate/SKILL.md)。

## 维护本导航

新增入口或调整模块边界时更新对应行。字段或方法改名时同步核对类型、调用方和技能中的示例。依赖版本、脚本和配置直接查源文件，功能状态按 [文档维护](../../CLAUDE.md#文档维护) 的代码基线记录。

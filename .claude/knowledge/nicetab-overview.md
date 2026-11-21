# NiceTab 项目知识导航

用途：开发时从需求定位源码与业务边界。整体架构和流程见 [Architecture](../../ARCHITECTURE.md)，代码规范见 [贡献指南](../../CONTRIBUTING-zh.md)，实施步骤见 [nicetab-dev](../skills/nicetab-dev/SKILL.md)。本文件不复制完整类型、配置列表或依赖版本；本次现有功能说明以 HEAD 已提交源码为准；工作区中的实验或未提交功能不作为已实现架构记录。

## 先区分三类数据

- **保存列表：** `TagItem → GroupItem → TabItem`，保存在 `local:tabList`，拥有独立的字符串 ID。分类不等于浏览器窗口，保存的标签组不等于浏览器原生标签组。
- **实时浏览器状态：** 从 `browser.tabs`、`browser.windows`、可用的 `browser.tabGroups` 获取；数字 ID 随浏览器运行变化。
- **快照：** 捕获浏览器窗口和标签页以便恢复，包含版本迁移与自动保存缓冲，不能直接当作保存列表处理。

`storage/index.ts` 在各 JS 上下文创建自己的工具实例；`instanceStore.ts` 方便工具类之间访问，不提供跨页面共享内存或全局写锁。UI 更新需要明确的数据读取与通知链路。

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
| 全局搜索                       | [BaseGlobalSearch.tsx](../../entrypoints/common/components/BaseGlobalSearch.tsx)、[globalSearch.ts](../../entrypoints/common/hooks/globalSearch.ts)                                                                                                                                                                                                    |
| 发送目录弹窗                   | [SendTargetModal.tsx](../../entrypoints/options/home/SendTargetModal.tsx)、[SendTargetActionHolder.tsx](../../entrypoints/options/home/SendTargetActionHolder.tsx)                                                                                                                                                                                     |
| 设置                           | [constants.ts](../../entrypoints/common/constants.ts)、[global.ts](../../entrypoints/types/global.ts)、[settingsUtils.ts](../../entrypoints/common/storage/settingsUtils.ts)、[settings/](../../entrypoints/options/settings)                                                                                                                          |
| 存储实例与监听                 | [storage/index.ts](../../entrypoints/common/storage/index.ts)、[instanceStore.ts](../../entrypoints/common/storage/instanceStore.ts)                                                                                                                                                                                                                   |
| 回收站                         | [recycleBinUtils.ts](../../entrypoints/common/storage/recycleBinUtils.ts)、[recycleBin/](../../entrypoints/options/recycleBin)                                                                                                                                                                                                                         |
| 快照与会话恢复                 | [snapshotUtils.ts](../../entrypoints/common/storage/snapshotUtils.ts)、[stateUtils.ts](../../entrypoints/common/storage/stateUtils.ts)、[snapshots/](../../entrypoints/options/snapshots)、[state.ts](../../entrypoints/types/state.ts)                                                                                                                |
| 导入导出                       | [importExport.ts](../../entrypoints/common/utils/importExport.ts)、[importExport/](../../entrypoints/options/importExport)                                                                                                                                                                                                                             |
| 远程同步与自动调度             | [syncUtils.ts](../../entrypoints/common/storage/syncUtils.ts)、[syncWebDAVUtils.ts](../../entrypoints/common/storage/syncWebDAVUtils.ts)、[autoSyncAlarm.ts](../../entrypoints/common/alarms/autoSyncAlarm.ts)                                                                                                                                         |
| 新标签页                       | [nice-newtab/](../../entrypoints/nice-newtab)、[newTabUtils.ts](../../entrypoints/common/storage/newTabUtils.ts)、[handler.ts](../../entrypoints/background/handler.ts)                                                                                                                                                                                |
| 图标加载与缓存                 | [Favicon.tsx](../../entrypoints/common/components/Favicon.tsx)、[favicon.ts](../../entrypoints/common/utils/favicon.ts)、[faviconDb.ts](../../entrypoints/common/utils/faviconDb.ts)                                                                                                                                                                   |
| 侧栏布局                       | [SidebarLayout.tsx](../../entrypoints/options/components/SidebarLayout.tsx)、[useDragResize.ts](../../entrypoints/options/common/hooks/useDragResize.ts)                                                                                                                                                                                               |

## 页面操作链路

以下是定位交互问题时的阅读顺序；操作全集以 `entrypoints/options/home/types.ts` 和 `constants.ts` 为准，避免把历史按钮数量写成长期约束。

- 分类菜单：`RenderTreeNode.tsx` → `useTagActions` → `TreeBox.tsx` → `treeData.ts` 的分类处理分支 → `tabListUtils`。
- 标签组菜单有主列表和侧边栏两个入口：`TabGroup.tsx` / `RenderTreeNode.tsx` 使用 `useGroupActions`，再通过 Home 事件与 `treeData.ts` 执行操作。修改动作时核对两个入口。
- 常用按钮与更多菜单：`groupActions.tsx` 组织 `outerList` / `innerList`，由常用按钮及按钮样式设置控制展示，通用组件为 `ActionBtnList.tsx`、`ActionIconBtn.tsx`。
- 拖放：`DndComponent.tsx`、`DropComponent.tsx` 封装拖放基础行为，`treeData.ts` 连接分类、组和标签页的数据更新；同时检查右侧实时标签页拖入场景。
- 多选：列表支持框选和 Shift 范围选择；`multiSelection.ts`、共享 `selectionBox.ts` 与页面动作配合。不要将已有标签页多选误写为未提交的目录树标签组批量功能。
- Popup：模块显示由设置控制，可能包含扩展信息、跳转、动作、主题及已打开标签页；关闭所有 popup 模块时，图标点击走后台对应动作。
- 快捷键分为浏览器 `commands` 和页面内 `keyMap.ts` / Home `hotkeys.ts`。默认组合以 `wxt.config.ts` 为准；修改绑定时核对命令注册、动作处理和语言文案。

## 修改时容易遗漏的边界

- **层级操作：** 入口不止一个；主列表、树菜单、拖放和批量操作可能共用存储方法。核对中转站、父级锁定、组锁定、星标顺序以及复制与移动的区别，参见 [检查清单](../skills/nicetab-dev/references/checklist.md)。
- **本地与跨窗口刷新：** `refreshTreeData()` 基于当前工具实例的数据重建树；`init()` 才会读取持久化列表。外部写入后只触发本地渲染可能读到旧缓存，参见 [消息指南](../skills/nicetab-dev/references/messages.md)。
- **同步：** 合并不代表传播删除，覆盖有方向；是否携带设置由配置控制。Gist 和 WebDAV 都要检查，历史键 `syncWevDAVConfig` 不能直接改名。
- **快照：** 自动缓冲涉及 `stateUtils`，版本化历史由 `snapshotUtils` 管理。启动时先关闭捕获、提升旧缓冲并按设置恢复，再重新开启捕获；自动保存当前由浏览器事件触发，不依赖旧自动保存 alarm。
- **浏览器兼容：** `support.ts` 与 `getPermission.ts` 共同处理能力与权限；Firefox 并非一律不支持原生组。内容脚本也并非所有页面都有。
- **国际化：** UI 有简中、繁中、英文、俄文四组资源，Manifest 文案另行维护，见 [translate](../skills/translate/SKILL.md)。

## 维护本导航

新增入口或改变模块边界时更新对应行；字段与方法改名优先修改实际类型、调用方和相关技能示例。设计提案需注明未实现，不从外部介绍或历史说明推断当前实现。依赖版本、脚本和格式配置直接查看源文件，不在此保存另一份完整清单。

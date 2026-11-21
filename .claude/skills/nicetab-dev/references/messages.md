# 消息、状态与页面刷新

先区分更新发生在哪个上下文、谁需要知道，以及接收方如何重新读取数据。持久化成功不等于所有 React 页面已刷新。

## 通信边界

| 机制                   | 适用范围                                     | 源码                                                                                                      |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| React Context / state  | 当前 React 树中的状态共享与渲染              | `entrypoints/common/components/Root.tsx`、`entrypoints/common/hooks/global.ts`                            |
| `eventEmitter`（mitt） | 当前 JS 上下文中的组件通知，不跨窗口或后台   | `entrypoints/common/hooks/global.ts`；Home 自有事件见 `entrypoints/options/home/hooks/homeCustomEvent.ts` |
| `storage.watch`        | 存储变更通知；接收者需注册监听并更新自身状态 | `entrypoints/common/storage/index.ts` 的 `init*StorageListener`                                           |
| `sendRuntimeMessage`   | 扩展上下文间的动作和状态消息                 | `entrypoints/common/utils/runtimeMsg.ts`                                                                  |
| `sendTabMessage`       | 向浏览器标签页中的内容脚本发送消息           | `entrypoints/common/tabs.ts`                                                                              |

以上源码路径均相对仓库根目录。

## runtime 消息

类型由 `entrypoints/types/runtimeMsg.ts` 的 `RuntimeMsgMap`、`PageContextType` 维护。主要接收方是 `entrypoints/background/index.ts` 和 `Root.tsx`。

`sendRuntimeMessage` 会发送一份目标为 `background` 的消息，再按 `targetPageContexts` 发送其他目标消息；省略或传空数组时使用默认上下文集合。它没有汇总各接收方的处理结果，不能把 `await sendRuntimeMessage(...)` 当作业务处理完成的确认。

- 发送操作：`sendTabsActionStart` 进入后台发送流程；需要目录选择时，确认后通过 `sendTabsActionConfirm` 继续。
- 管理页刷新：`reloadAllAdminPage` / `reloadOtherAdminPage` 由 `Root.tsx` 处理，再触发页面刷新逻辑；后者结合窗口信息区分接收对象。
- 主题、语言等消息可能由后台转发到内容脚本。新增目标时检查发送与接收两侧的过滤条件，避免重复执行副作用。

## 标签页消息

`sendTabMessage` 根据 `onlyCurrentTab`、`onlyCurrentWindow`、`sendToAdminTab` 等参数选择目标。内容脚本不是每个页面都能注入，不能假设所有标签页都有接收者。

- `action:open-send-target-modal`、`action:callback-message`：由 `entrypoints/options/home/SendTargetActionHolder.tsx` 处理弹窗或反馈。
- `action:open-global-search-modal`、`action:refresh-global-search-modal`：由 `entrypoints/common/components/BaseGlobalSearch.tsx` 处理搜索界面。

## 修改数据后的检查

1. 等待对应存储写入完成，再触发依赖新数据的刷新。
2. 当前 Home 页沿用 `treeData.ts` 的 `refreshTreeData`；其他页面核对已有消息或监听路径，不重复广播。
3. 需要跨窗口更新时使用 runtime 消息或存储监听，不能只调用 mitt 或设置本地 state。
4. 新增监听时提供取消监听／卸载清理；设置变化后重新注册的后台监听应避免重复。
5. 验证当前页面、另一个窗口的管理页和相关 popup/content UI；说明未覆盖的接收环境。

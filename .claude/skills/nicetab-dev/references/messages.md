# 消息、状态与页面刷新

先找到执行操作的上下文，再确认哪些页面需要收到通知或操作结果，以及各页面从哪里读取更新后的数据。

## 通信边界

| 机制                   | 适用范围                                     | 源码                                                                                                      |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| React Context / state  | 当前 React 树中的状态共享与渲染              | `entrypoints/common/components/Root.tsx`、`entrypoints/common/hooks/global.ts`                            |
| `eventEmitter`（mitt） | 当前 JS 上下文中的组件通知，不跨窗口或后台   | `entrypoints/common/hooks/global.ts`；Home 自有事件见 `entrypoints/options/home/hooks/homeCustomEvent.ts` |
| `storage.watch`        | 存储变更通知；接收者需注册监听并更新自身状态 | `entrypoints/common/storage/index.ts` 的 `init*StorageListener`                                           |
| `sendRuntimeMessage`   | 扩展上下文间的动作和状态消息                 | `entrypoints/common/utils/runtimeMsg.ts`                                                                  |
| `browser.runtime.connect` | 通过命名 Port 向后台提交请求并接收业务结果 | `entrypoints/background/portMessage.ts`、`entrypoints/background/batchRemoval.ts` |
| `sendTabMessage`       | 向浏览器标签页中的内容脚本发送消息           | `entrypoints/common/tabs.ts`                                                                              |

以上源码路径均相对仓库根目录。

## runtime 消息

类型由 `entrypoints/types/runtimeMsg.ts` 的 `RuntimeMsgMap`、`PageContextType` 维护。主要接收方是 `entrypoints/background/index.ts` 和 `Root.tsx`。

`sendRuntimeMessage` 始终发送一份目标为 `background` 的消息，再按 `targetPageContexts` 分发其余消息。省略目标或传空数组时使用默认上下文集合。调用完成仅表示已发起发送，需要执行结果的操作走下方的请求路径。

- 发送操作：`sendTabsActionStart` 进入后台发送流程；需要目录选择时，确认后通过 `sendTabsActionConfirm` 继续。
- 管理页刷新：`reloadAllAdminPage` / `reloadOtherAdminPage` 由 `Root.tsx` 处理，再触发页面刷新逻辑；后者结合窗口信息区分接收对象。
- 主题、语言等消息可能由后台转发到内容脚本。新增目标时检查发送与接收两侧的过滤条件，避免重复执行副作用。

## 需要结果的 Port 请求

- **恢复快照和修改定时历史上限**由快照页和设置页调用 `requestSnapshotAction()`。后台 `portMessage.ts` 验证管理页来源及请求参数。恢复回执为 `success`、`partial` 或 `failed`。降低上限需要裁剪记录时，后台返回待裁剪的记录 ID，页面确认后按这批 ID 再提交。
- **网页内搜索打开保存条目**由 `openUtils.ts` 的 `openSearchTabsFromPage()` 发出。后台按保存条目 ID 读取 URL，取得发起窗口并执行所选打开模式，返回 `processedIds` 与失败状态。
- **批量删除**由 `requestTabGroupRemoval()` 决定执行路径。走后台 Port 时，`background/batchRemoval.ts` 返回实际删除的 `removedIds` 或错误。无痕上下文通过存储传请求与回执。
- 保留调用方断开后的处理。以快照恢复为例，管理页关闭或重载会断开 Port，已经开始的恢复仍由后台执行，窗口恢复状态在 `finally` 清理。

## 标签页消息

`sendTabMessage` 根据 `onlyCurrentTab`、`onlyCurrentWindow`、`sendToAdminTab` 等参数选择目标。内容脚本不是每个页面都能注入，不能假设所有标签页都有接收者。

- `action:open-send-target-modal`、`action:callback-message`：由 `entrypoints/options/home/SendTargetActionHolder.tsx` 处理弹窗或反馈。
- `action:open-global-search-modal`、`action:refresh-global-search-modal`：由 `entrypoints/common/components/BaseGlobalSearch.tsx` 处理搜索界面。

## 修改数据后的检查

1. 等待对应存储写入完成，再触发依赖新数据的刷新。
2. Home 的 `refreshTreeData()` 从当前 `tabListUtils.tagList` 缓存重建树。其他上下文完成写入后，先走已有的重读路径，例如 `init()` 或 `tabListUtils.getTagList()`，再刷新本页。
3. 需要跨窗口更新时使用 runtime 消息或存储监听，不能只调用 mitt 或设置本地 state。
4. 新增监听时提供取消监听／卸载清理；设置变化后重新注册的后台监听应避免重复。
5. 验证当前页面、另一个窗口的管理页和相关 popup/content UI；说明未覆盖的接收环境。

---
name: translate
description: NiceTab 界面文案与现有多语言文档的翻译维护；新增或修改文本时核对术语、语言资源和占位符。
---

# NiceTab 翻译维护

遵循 [贡献指南](../../../CONTRIBUTING-zh.md) 的国际化约定。先识别目标是 UI、Manifest 还是文档，再更新对应的已有语言版本；此技能不要求为每篇文档新增翻译文件，也不要求将中文 Agent 指令另建多语言副本。

## 更新流程

1. 查找同模块已有文案及调用处，理解按钮、状态、提示或说明的语境。
2. UI 文案在 `entrypoints/common/locale/modules/` 的相应模块中修改。以 `zhCN.ts` 的键和语义为基准，同步 `zhTW.ts`、`enUS.ts`、`ruRU.ts`；检查模块 `index.ts` 导出的语言映射。不要假定类型检查已覆盖所有语言缺键。
3. Manifest 文案在 `public/_locales/zh_CN`、`zh_TW`、`en`、`ru` 的 `messages.json` 中维护，保留消息键及浏览器占位符格式。
4. 文档只同步已有的语言版本、语言切换链接和示例；保留原有 `<p>` 中的 `<a href="./文件.md">` 切换形式。`CONTRIBUTING` 目前为中／英／俄，`ARCHITECTURE` 为英／俄；Changelog 按项目约定只维护中／英 Markdown。
5. 保留变量名、ICU 分支含义、链接和技术标识。对比各语言的键、插值参数及实际使用场景，必要时检查界面中的长度与换行。

公开文档的链接及静态 HTML 生成约束见 [项目文档维护规范](../../../CLAUDE.md#文档维护)。翻译时不要将源码路径或 Agent 技能文件改成会被递归打包的 Markdown 链接。

仓库路径均相对根目录；译文参考对应模块现有文本，而非个人目录或外部插件。

## 核心术语

| 中文               | 英文                           | 使用说明                                               |
| ------------------ | ------------------------------ | ------------------------------------------------------ |
| 标签页             | Tab                            | 区分浏览器打开的标签页与保存条目                       |
| 标签组             | Tab Group                      | 区分 NiceTab 保存组与浏览器原生组                      |
| 分类               | Tag / Category                 | 紧凑 UI 沿用 Tag；说明文档用 Category                  |
| 中转站             | Staging Area                   | 特殊的默认目标分类                                     |
| 目录树             | Directory Tree                 | 分类／组导航                                           |
| 管理页面           | Admin Page                     | 说明文档可用 Management Dashboard                      |
| 首页／列表页       | Home Page / List Page          | 根据已有页面命名选用                                   |
| 偏好设置           | Preferences / Settings         | 文档可用 Preferences，UI 沿用 Settings                 |
| 导入导出           | Import & Export                | 导入、导出动作分别用 Import、Export                    |
| 回收站             | Recycle Bin                    | 删除条目的恢复位置                                     |
| 快照               | Snapshot                       | 浏览器窗口／标签页恢复记录                             |
| 弹出面板           | Popup Panel                    | 扩展图标面板                                           |
| 右键菜单           | Context Menu                   | 浏览器或页面菜单                                       |
| 发送／打开标签页   | Send Tabs / Open Tabs          | 不把发送与打开混为一谈                                 |
| 锁定／解锁         | Lock / Unlock                  | 状态用 Locked                                          |
| 置顶／取消置顶     | Star / Unstar                  | 保存组的星标，状态用 Starred                           |
| 固定标签页         | Pinned Tabs                    | 浏览器固定标签，不与 Starred 混用                      |
| 展开／折叠         | Expand / Collapse              | 树与列表操作                                           |
| 去重               | Deduplicate                    | 移除重复项                                             |
| 恢复               | Recover / Restore              | 回收站沿用 Recover；快照／会话恢复按已有文案用 Restore |
| 移除／删除         | Remove / Delete                | 保持对应操作语义                                       |
| 休眠               | Hibernate                      | 状态用 Hibernated                                      |
| 拉取／推送         | Pull / Push                    | 明确数据流向                                           |
| 合并／强制覆盖     | Merge / Force Overwrite        | 不把合并描述为删除同步                                 |
| 自动／手动同步     | Auto Sync / Manual Sync        | 保留同步模式区别                                       |
| 访问令牌／同步历史 | Access Token / Sync History    | 配置与结果                                             |
| 主题／亮色／暗色   | Theme / Light Mode / Dark Mode | 跟随主题选项                                           |
| 快捷键／语言       | Hotkeys / Shortcuts / Language | 跟随模块已有命名                                       |
| 已选中／无数据     | Selected / No Data             | 状态提示                                               |

繁中与俄文优先保持对应模块已有译法；新增领域术语需要复用时再补充术语表。

## 文案规则

- 英文按钮使用动词原形（Send、Open、Recover）；状态用过去分词（Locked、Selected）。标题与按钮沿用模块大小写风格，说明句使用自然语序。
- ICU 变量使用 `{variable}`，例如 `{count, plural, =0 {No Items} one {# Item} other {# Items}}`。不同语言可按语法调整复数分支，但保留参数名和行为含义。
- 区分 ICU 变量、Manifest 占位符和链接模板中的 `{{url}}` 等业务标记，不统一替换花括号格式。
- 翻译描述而不改技术事实：代码键、命令、路径和存储键保持原样。条件、否定、覆盖方向和失败提示应与原文一致。
- 避免逐字套句，例如“合并推送不会同步删除”可译为 “Merge push does not propagate deletions.”。

## 参考入口

- [用户指南](../../../GUIDE.md)：功能语境与英文表达。
- [通用英文文案](../../../entrypoints/common/locale/modules/common/enUS.ts)、[首页英文文案](../../../entrypoints/common/locale/modules/home/enUS.ts)：常用术语。
- [locale 模块](../../../entrypoints/common/locale/modules)：查找各语言的现有译法。

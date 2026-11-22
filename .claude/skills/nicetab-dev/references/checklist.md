# 业务改动检查清单

本文件列出修改时需要保留的约束，不要求为每项新增测试。

## 标签层级与操作

- 数据类型为 `TagItem → GroupItem → TabItem`，定义在 `entrypoints/types/tabList.ts`。持久化 ID 与浏览器运行时数字 ID 不可混用。
- `tabListUtils.getTagList()` 维护中转站存在且排在首位；新增、移动、导入时保留 `static` 分类的特殊处理。
- 分类锁定和标签组锁定可能共同影响操作。对照原调用链保留删除、移动、排序及恢复后移除的限制；不能只依赖某个按钮的 disabled 状态。
- 同一分类内星标组位于非星标组之前；插入到星标区域时，按已有位置逻辑调整 `isStarred`，移动后同时检查顺序与标记。
- 分别核对合并、复制、移动和排序如何处理 ID、同名分组、URL 去重、源数据和相对顺序。
- 批量操作处理父子节点同时选中、重复选择、锁定项目和部分失败；恢复后移除仅作用于符合既有成功判定的项目。
- 回收站继承 `TabListUtils`，修改基类时检查是否影响回收站数据及恢复流程。
- 写入后沿用当前页和其他上下文的刷新机制，见 [消息与刷新](messages.md)。

## 新增设置项

1. 在 `entrypoints/common/constants.ts` 的 `ENUM_SETTINGS_PROPS` 添加键，放到对应功能分组。
2. 在 `entrypoints/types/global.ts` 的 `SettingsProps` 添加类型，考虑旧数据没有该字段的情况。
3. 在 `entrypoints/common/storage/settingsUtils.ts` 的 `initialSettings` 对象中设置默认值；检查读取合并、重置、导入及远程同步行为。
4. 在 `entrypoints/options/settings/` 对应 `FormModule` 中加入表单项，沿用相邻控件的读取和更新方式。只有归属会影响产品语义且无法判断时才请求澄清。
5. 更新对应 locale 模块的 `zhCN.ts`、`zhTW.ts`、`enUS.ts`、`ruRU.ts`，遵循 [翻译技能](../../translate/SKILL.md)。
6. 通过 `settingsUtils` 读取设置，明确需要立即重注册后台监听、更新 UI 或通知其他上下文的副作用。
7. 验证默认值、旧数据缺字段、切换后生效和重新打开页面后的持久化。

现有语言设置的键、类型和默认值分布在三个文件中。

```ts
// constants.ts：枚举中声明持久化键
export enum ENUM_SETTINGS_PROPS {
  LANGUAGE = 'language',
}

// types/global.ts：配置值类型，包含当前四种语言
export type LanguageTypes = 'zh-CN' | 'zh-TW' | 'en-US' | 'ru-RU';
export type SettingsProps = {
  language?: LanguageTypes;
};

// settingsUtils.ts：initialSettings 对象中的字段
// [ENUM_SETTINGS_PROPS.LANGUAGE]: defaultLanguage,
```

示例仅展示相关字段。把新键并入现有枚举，把类型和默认值分别并入现有类型与对象。

上述步骤针对新增应用设置项，不代表获得修改项目配置文件的授权。

## 浏览器操作与数据恢复

- 使用 `entrypoints/common/utils/support.ts` 的能力检测；Firefox 的标签组还涉及可选权限，参考 `entrypoints/common/hooks/getPermission.ts`。
- 打开保存条目时，沿用 `OpenModeMenu.tsx` 和 `openUtils.ts` 选择当前窗口、新窗口或新无痕窗口，由 `tabs.ts` 和 URL 工具处理受限链接、原生分组和浏览器操作失败。
- 启用打开后移除时，等待打开结果，再按 `processedIds` 处理成功条目。整组和选中标签页的回执粒度不同，写入时重新检查适用的分类锁、组锁，保留失败条目。
- 自动快照沿用 `snapshotUtils` 的版本迁移和自动缓冲。启动恢复期间，`snapshotStatus` 暂停事件驱动的缓冲更新，`restoringOnStartup` 暂停定时采集。
- 定时快照由后台采集。修改时检查 `runScheduledUpdate()` 对采集、焦点排序和保留上限的串行化，以及恢复中的窗口排除逻辑。替换当前窗口时，只有快照中的标签页全部创建后才移除旧标签页，并保留管理页和发起页。回执区分成功、部分成功和失败。
- 同步分别检查 Gist 和 WebDAV 的拉取、推送、合并、覆盖及设置开关。合并保留双方内容，传播删除需要选择对应方向的覆盖。

export default {
  'settings.block.sendTabs': '发送标签页相关配置',
  'settings.block.openTabs': '打开标签页相关配置',
  'settings.block.otherActions': '其他操作配置',
  'settings.block.display': '展示配置',
  'settings.block.autoSync': '自动同步配置',
  'settings.language': '语言{mark}',
  // 'settings.language.ChineseSimplified': '简体中文',
  // 'settings.language.English': '英文',
  'settings.openAdminTabAfterBrowserLaunch': '启动浏览器时是否自动打开NiceTab管理后台{mark}',
  'settings.openAdminTabAfterBrowserLaunch.yes': '自动打开NiceTab管理后台（推荐）',
  'settings.openAdminTabAfterBrowserLaunch.no': '不自动打开NiceTab管理后台',
  'settings.autoPinAdminTab': '是否固定NiceTab管理后台{mark}',
  'settings.autoPinAdminTab.yes': '自动固定NiceTab管理后台（推荐）',
  'settings.autoPinAdminTab.no': '不自动固定NiceTab管理后台',
  'settings.showSendTargetModal': '发送标签页时-是否展示指定目录选择框：',
  'settings.showSendTargetModal.tooltip': '若选择否，则直接发送到中转站（某些特殊页面无法触发弹窗，也会直接发送到中转站）',
  'settings.allowSendPinnedTabs': '发送标签页时-是否发送固定标签页到NiceTab{mark}',
  'settings.allowSendPinnedTabs.yes': '允许发送固定标签页',
  'settings.allowSendPinnedTabs.no': '不要发送固定标签页（推荐）',
  'settings.excludeDomainsForSending': '发送标签页时-以下域名的标签页不会发送到管理后台：',
  'settings.excludeDomainsForSending.tooltip': '多个域名可使用空格或者换行分隔；支持正则表达式；',
  'settings.excludeDomainsForSending.placeholder': '多个域名可使用空格或者换行分隔',
  'settings.openAdminTabAfterSendTabs': '发送标签页时-是否打开NiceTab管理后台{mark}',
  'settings.openAdminTabAfterSendTabs.yes': '自动打开NiceTab管理后台（推荐）',
  'settings.openAdminTabAfterSendTabs.no': '不要自动打开NiceTab管理后台',
  'settings.closeTabsAfterSendTabs': '发送标签页时-是否自动关闭标签页{mark}',
  'settings.closeTabsAfterSendTabs.yes': '自动关闭标签页',
  'settings.closeTabsAfterSendTabs.no': '不要自动关闭标签页',
  'settings.actionAutoCloseFlags': '当执行下面选中的操作时将自动关闭标签页',
  'settings.actionAutoCloseFlags.tooltip': '当[发送标签页时-是否自动关闭标签页]设置为“不要自动关闭标签页”时生效',
  'settings.restoreInNewWindow': '是否在新窗口打开标签组{mark}',
  'settings.deleteAfterRestore': '打开标签页/标签组时-是否自动删除标签页{mark}',
  'settings.deleteAfterRestore.yes': '从NiceTab列表中删除（仍保留固定标签页）',
  'settings.deleteAfterRestore.no': '保留在NiceTab列表中（推荐）',
  'settings.unnamedGroupRestoreAsGroup': '恢复未命名标签组时-是否以标签组形式打开到浏览器：',
  'settings.silentOpenTabModifierKey': '静默（后台）打开标签页使用的修饰键：',
  'settings.openTabModifierKey': '前台打开标签页使用的修饰键：',
  'settings.openTabModifierKey.tooltip': '前台打开方式优先级高于后台打开方式，意味着如果后台打开和前台打开的修饰键相同，则触发前台打开',
  'settings.deleteUnlockedEmptyGroup': '清空标签页时-是否自动删除该标签组{mark}',
  'settings.deleteUnlockedEmptyGroup.yes': '自动删除（仍保留锁定的空标签组）',
  'settings.deleteUnlockedEmptyGroup.no': '不自动删除',
  'settings.confirmBeforeDeletingTabs': '删除标签页前是否需要确认：',

  'settings.allowDuplicateTabs': '发送标签页时-是否保留重复的标签页{mark}',
  'settings.allowDuplicateTabs.yes': '保留',
  'settings.allowDuplicateTabs.no': '去重（针对发送的标签页以及标签组合并时的标签页）',
  'settings.allowDuplicateGroups': '发送标签页时-是否保留重复的标签组{mark}',
  'settings.allowDuplicateGroups.yes': '保留',
  'settings.allowDuplicateGroups.no': '去重（发送的标签组和中转站的标签组合并）',
  'settings.linkTemplate': '标签组-复制链接模板格式',
  'settings.linkTemplate.placeholder': '默认格式为',
  'settings.linkTemplate.tooltip': '复制链接所用的模板格式, 采用 Mustache 格式',
  'settings.tabCountThreshold': '当前分类中标签页数量阈值设置：',
  'settings.tabCountThreshold.tooltip': '为了保证交互性能，当前分类中标签页数量超过设定值时，右侧面板将开启虚拟滚动，根据滚动位置展示部分标签组。',

  'settings.showOpenedTabCount': '是否在扩展图标上显示打开的标签页数量：',
  'settings.showPageContextMenus': '是否在网页中显示NiceTab右键菜单：',
  'settings.popupModuleDisplays': 'Popup面板模块展示设置：',
  'settings.popupModuleDisplays.tooltip': '只要选择了任意面板模块，则点击扩展图标时将展示 Popup 面板，否则将直接发送所有标签页。',

  'settings.autoExpandHomeTree': '进入列表页时-是否自动展开全部节点：',
  'settings.pageWidthType': '页面内容区宽度设置：',
  'settings.pageWidthType.fixed': '固定宽度',
  'settings.pageWidthType.responsive': '自适应宽度',

  'settings.autoSync': '是否开启自动同步：',
  'settings.autoSyncInterval': '自动同步间隔时间（分钟）：',
  'settings.autoSyncType': '自动同步方式：',
  'settings.syncType.autoPullMerge': '自动拉取-合并到本地',
  'settings.syncType.autoPullForce': '自动拉取-覆盖本地数据',
  'settings.syncType.autoPushMerge': '自动同步-合并推送（推荐）',
  'settings.syncType.autoPushForce': '自动同步-覆盖推送',
  'settings.syncType.manualPullMerge': '手动拉取-合并到本地',
  'settings.syncType.manualPullForce': '手动拉取-覆盖本地数据',
  'settings.syncType.manualPushMerge': '手动同步-合并推送（推荐）',
  'settings.syncType.manualPushForce': '手动同步-覆盖推送',
}
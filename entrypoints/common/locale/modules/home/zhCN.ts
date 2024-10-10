export default {
  'home.tag': '分类',
  'home.tabGroup': '标签组',
  'home.tab': '标签页',
  'home.stagingArea': '中转站',
  'home.tabGroupList': '标签组列表',
  'home.expand': '展开{name}',
  'home.collapse': '折叠{name}',
  'home.expandAll': '全部展开',
  'home.collapseAll': '全部折叠',
  'home.addTag': '创建分类',
  'home.clearAll': '全部清空',
  'home.recoverAll': '全部还原',
  'home.emptyTip': '暂无数据',
  'home.searchTagAndGroup': '搜索分类/标签组',
  'home.searchTabAndUrl': '搜索标签页和链接',
  'home.moveAllGroupTo': '移动所有标签组到...',
  'home.createTabGroup': '创建标签组',
  'home.helpInfo': '帮助信息',
  'home.removeTitle': '删除提醒',
  'home.removeDesc': '您确定要删除该{type}吗？',
  'home.clearTitle': '删除提醒',
  'home.clearDesc': '您确定要清空列表吗？',
  'home.dedupTitle': '去重提醒',
  'home.dedupDesc': '您确定要进行去重操作吗？',
  'home.recoverTitle': '还原提醒',
  'home.recoverDesc': '您确定要还原该{type}吗？',
  'home.recoverAllDesc': '您确定要全部还原吗？',
  'home.copyLinks': '复制链接',

  'home.tag.remove': '删除',
  'home.tag.recover': '还原',
  'home.tag.countInfo': '当前分类统计',

  'home.tabGroup.add': '创建标签组',
  'home.tabGroup.remove': '删除该组',
  'home.tabGroup.restore': '恢复该组',
  'home.tabGroup.lock': '锁定该组',
  'home.tabGroup.unlock': '取消锁定',
  'home.tabGroup.star': '星标该组',
  'home.tabGroup.unstar': '取消星标',
  'home.tabGroup.recover': '还原该组',
  'home.tabGroup.open': '打开该组',

  'home.tabGroup.count': '{count}个标签组',
  'home.tab.count': '{count}个标签页',
  'home.tab.name': '名称',
  'home.tab.url': '网址',

  'home.help.content': `
    <li>左侧列表一级菜单表示分类，二级菜单表示标签组，左侧列表支持分类和标签组的搜索；右侧面板展示的是当前选中分类中的所有标签组以及标签组中的标签页。</li>
    <li>右侧面板中的标签页支持拖拽排序以及跨组移动，您还可以将右侧面板中的标签页拖拽到左侧列表的标签组中，以实现跨分类移动；另外可点击“移动到”按钮进行标签组和标签页的移动操作。</li>
    <li>标签组锁定后可以移动，该标签组以及组内的标签页，将禁止删除和移出，但可以将其他标签组的标签页移入该标签组；如果想要删除或移出，可先解锁该标签组。</li>
    <li>标签组星标后将在当前分类中置顶，移动其他标签组到星标状态的标签组之前，将自动被星标；移动星标状态的标签组到非星标的标签组之后，将自动解除星标状态。</li>
    <li>中转站是一个特殊分类，固定在第一位，发送标签页时会自动保存到中转站，您可根据需要处理中转站中的标签组和标签页（移动、删除等操作）。</li>
    <li>点击打开标签组时，会在浏览器中依次打开该标签组中的标签页，如果设置了“打开标签页时自动从列表中删除”，则该标签组中的标签页会被删除。</li>
    <li>
      <strong>单击标签页</strong>：会打开新标签页并激活该标签页。<br>
      <strong>Alt键 + 单击标签页</strong>：则会静默打开新标签页，停留在NiceTab后台页面。
    </li>
    <li>“还原”操作表示将回收站中的标签组还原到首页列表中。</li>
    <li>“升序”和“降序”功能只对当前分类中的非星标的标签组进行排序。</li>
    <li><strong>注意</strong>：为了保证交互性能，当前分类中标签页数量超过设定值时，右侧面板将开启虚拟滚动，根据滚动位置展示部分标签组。</li>
    <li>分类/标签组/标签页支持拖拽排序，当分类/标签组处在选中状态时，可通过快捷键进行排序，快捷键映射见下表：</li>
  `,
  'home.help.hotkey.1': `上述的快捷键，只限在本页使用，另外扩展插件还针对常用的几个操作注册了浏览器快捷键，(如`,
  'home.help.hotkey.2': `)；您还可以自行前往扩展程序页面`,
  'home.help.hotkey.modify': `修改快捷键`,
  'home.help.hotkey.modifyTip': '快捷键修改完后，会立即生效，但右键菜单中的快捷键按键名需在切换浏览器tab后自动更新。',

  'home.moveTo.missingTip': '请选择{type}',
  'home.moveTo.mergeLabel': '是否合并重复项',
  'home.moveTo.mergeTip.1': '1、勾选后，如果移动标签页，则与目标分组中相同 url 的标签页合并（去重）。',
  'home.moveTo.mergeTip.2': '2、勾选后，如果移动标签组，则与目标分类中同名的标签组合并，标签页去重。',
  'home.tip.tooManyTabs': '当前分类中标签页数量超过预定值, 已开启虚拟滚动。',
  'home.tip.addScope': '下一个版本将添加快捷键等功能，需要新增授权，新版本发布后可能会自动停用，如需继续使用请手动启用。',
}
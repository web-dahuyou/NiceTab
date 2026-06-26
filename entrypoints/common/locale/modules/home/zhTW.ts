import { LocaleKey } from './zhCN';

const zhTW: Record<LocaleKey, string> = {
  "home.tag": "分類",
  "home.tabGroup": "標籤組",
  "home.tab": "分頁",
  "home.stagingArea": "中繼站",
  "home.tabGroupList": "標籤組列表",
  "home.expand": "展開{name}",
  "home.collapse": "折叠{name}",
  "home.expandAll": "全部展開",
  "home.collapseAll": "全部折叠",
  "home.addTag": "創建分類",
  "home.clearAll": "全部清空",
  "home.recoverAll": "全部還原",
  "home.emptyTip": "暫無數據",
  "home.searchTagAndGroup": "搜尋分類/分頁群組",
  "home.searchTabAndUrl": "搜尋分頁和連結",
  "home.moveAllGroupTo": "移動全部標籤組到...",
  "home.createTabGroup": "創建分頁群組",
  "home.helpInfo": "帮助信息",
  "home.removeTitle": "刪除提醒",
  "home.removeDesc": "您確定要刪除该{type}嗎？",
  "home.clearTitle": "刪除提醒",
  "home.clearDesc": "您確定要清空列表嗎？",
  "home.dedupTitle": "去除重複提醒",
  "home.dedupDesc": "您確定要進行去除重複操作嗎？",
  "home.recoverTitle": "还原提醒",
  "home.recoverDesc": "您確定要還原該{type}嗎？",
  "home.recoverAllDesc": "您確定要全部還原嗎？",
  "home.copyLinks": "複製連結",

  "home.tag.remove": "刪除",
  "home.tag.recover": "還原",
  "home.tag.countInfo": "目前分類統計",
  "home.tag.lock": "鎖定該分類",
  "home.tag.unlock": "解鎖該分類",
  'home.tag.open': '開啟分類',

  "home.tabGroup.add": "創建分頁群組",
  "home.tabGroup.remove": "刪除該組",
  "home.tabGroup.restore": "恢复該組",
  "home.tabGroup.lock": "鎖定該組",
  "home.tabGroup.unlock": "取消鎖定",
  "home.tabGroup.star": "加星號該組",
  "home.tabGroup.unstar": "取消加星號",
  "home.tabGroup.recover": "還原該組",
  "home.tabGroup.open": "開啟該組",
  "home.tabGroup.addGroupBefore": "在上方新建標籤組",
  "home.tabGroup.addGroupAfter": "在下方新建標籤組",
  "home.tabGroup.tabsSortAsc": "標籤名稱遞增",
  "home.tabGroup.tabsSortDesc": "標籤名稱遞減",
  "home.tabGroup.count": "{count}個分頁群組",
  "home.tabGroup.name": "標籤組名稱",
  "home.tabGroup.createTime": "創建時間",
  "home.tab.count": "{count}個分頁",
  "home.tab.name": "名稱",
  "home.tab.url": "網址",
  "home.tab.selectedCount": "{count} 個分頁",
  'home.tab.removeSelected': `您確定要刪除{count, plural,
    =0 {分頁}
    =1 {這個分頁}
    other {這#個分頁}
  }嗎？`,

  "home.createSnapshot": "創建快照",
  "home.createSnapshot.tip": "將目前開啟的分頁儲存為快照",
  "home.restoreSnapshot": "恢復快照",
  "home.getPermission.tabGroups": "獲取分頁群組權限",
  "home.getPermission.tabGroups.tip": "授權 tabGroups 權限，可對接原生分頁群組功能，體驗更佳！",
  "home.displayPinnedTabs": "是否顯示釘選分頁",

  "home.help.tip.userGuide": "更多信息請檢視{userGuide}。",
  "home.help.reminder.start": "出於安全原因，在 Firefox 中，可能不允许使用特權 URL，例如：",
  'home.help.reminder.list': `
    <li>chrome: URLs</li>
    <li>javascript: URLs</li>
    <li>data: URLs</li>
    <li>file: URLs</li>
    <li>Firefox 的特權 about: URLs (e.g. about:config, about:addons, about:debugging). 非特權 URL（例如 about:blank）是允許的。</li>
  `,
  "home.help.reminder.end": "如果頁面連結符合上述場景，點擊連結可能無法開啟頁面，請手動複製連結進行訪問。",

  'home.help.content': `
    <li>列表頁由左側目錄樹（分類和標籤組目錄索引）、中間列表（目前選中分類中的所有標籤組及分頁）和右側已開啟分頁面板三部分組成。</li>
    <li>左側列表一級選單表示分類，二級選單表示分頁群組，左側列表支持分類和分頁群組的搜尋；中間列表顯示的是目前選中分類中的全部分頁群組以及分頁群組中的分頁。</li>
    <li>中間列表中的分頁支持拖拽排序以及跨組移動，您還可以將中間列表中的分頁拖拽到左側列表的分頁群組中，以實現跨分類移動；另外可點擊「移動到」按鈕進行分頁群組和分頁的移動操作。</li>
    <li>頁面右側的摺疊面板顯示目前瀏覽器視窗中開啟的分頁和標籤組，該面板的分頁支持快捷多選、批次拖拽到中間列表以及左側的目錄樹節點中，您也可以直接拖拽整個群組。</li>
    <li>更多詳細信息和使用技巧，請檢視“使用者指南”。</li>
    <li>分頁群組鎖定後可以移動，該分頁群組以及組內的分頁，將禁止刪除和移出，但可以將其他分頁群組的分頁移入該分頁群組；如果想要刪除或移出，可先解鎖該分頁群組。</li>
    <li>分頁群組加星號後將在目前分類中置頂，移動其他分頁群組到加星號狀態的分頁群組之前，將自動被加星號；移動加星號狀態的分頁群組到非加星號的分頁群組之後，將自動解除加星號狀態。</li>
    <li>中繼站是一個特殊分類，釘選在第一位，傳送分頁時會自動儲存到中繼站，您可根據需要處理中繼站中的分頁群組和分頁（移動、刪除等操作）。</li>
    <li>點擊開啟分頁群組時，會在瀏覽器中依次開啟該分頁群組中的分頁，如果設定了「開啟分頁時自動從列表中刪除」，則該分頁群組中的分頁會被刪除。</li>
    <li>
      <strong>單擊分頁</strong>：會開啟新分頁並切換至該分頁。<br>
      <strong>Alt鍵 + 單擊分頁</strong>：則會在背景開啟新分頁，停留在 NiceTab 管理頁面。<br>
      您可以修改偏好設定來調整點擊行為。
    </li>
    <li>“遞增”和“遞減”功能只對目前分類中的非加星號的分頁群組進行排序。</li>
    <li>左側列表中的分類/分頁群組/分頁支持拖拽排序，當分類/分頁群組處在選取狀態時，可透過快捷鍵進行排序，快捷鍵對應見下表：</li>
  `,
  "home.help.hotkey.1": "上述的快速鍵，只限在本頁使用，另外擴充功能插件還針對常用的幾個操作註冊了瀏覽器快速鍵，(如",
  "home.help.hotkey.2": ")；您還可以自行前往擴充功能程序頁面",
  "home.help.hotkey.modify": "修改快捷鍵",
  "home.help.hotkey.modifyTip": "快速鍵修改完后，會立即生效，但右鍵菜單中的快速鍵按鍵名需在切換瀏覽器tab後自動更新。",

  "home.moveTo.missingTip": "請選擇{type}",
  "home.moveTo.copyLabel": "複製所選項",
  "home.moveTo.copyTip": "勾選後，則將所選項複製到目標分類/分組中。",
  "home.moveTo.mergeLabel": "是否合併重複項",
  "home.moveTo.mergeTip.1": "1、勾選後，如果移動分頁，則與目標分組中相同 url 的分頁合併（去除重複）。",
  "home.moveTo.mergeTip.2": "2、勾选后，如果移動分頁群組，則與目標分類中同名的分頁群組合併，分頁去除重複。",
  "home.tip.tooManyTabs": "目前分類中分頁数量超過預定值, 已開啟虚拟滚動。",
  "home.tip.addScope": "下一個版本將添加快速鍵等功能，需要新增授權，新版本發布後可能會自動停用，如需繼續使用請手動起用。",
  'home.tip.multiSelection': 'Shift多選：第一步，Shift + Click A (高亮顯示A) 。第二步，Shift + Click B (A到B全被選中)。Shift多選操作也適用於頁面中間的標籤頁列表',

  "recycleBin.tip.autoClear": "注意：資源回收桶的數據每天會自動清空一次！",
};

export default zhTW;

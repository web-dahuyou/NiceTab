import { LocaleKey } from './zhCN';

const zhTW: Record<LocaleKey, string> = {
  "importExport.import": "匯入",
  "importExport.export": "匯出",
  'importExport.moduleTitle': `標籤{action, select,
    import {匯入}
    export {匯出}
    other {匯入/匯出}
  }`,
  'importExport.formatType': `選擇{action, select,
    import {匯入}
    export {匯出}
    other {''}
  }格式：`,
  "importExport.formatType.optionLabel": "{label}",
  "importExport.importMode": "選擇匯入模式：",
  'importExport.importMode.optionLabel': `{label, select,
    Append {新增匯入}
    Overwrite {覆蓋匯入}
    Merge {合併匯入}
    other {新增匯入}
  }`,
  "importExport.importContent": "填寫匯入内容：",
  "importExport.importFromText": "從文字匯入",
  "importExport.importFromFile": "從文件匯入",
  "importExport.importFromHTML": "從HTML匯入",
  "importExport.importSuccess": "匯入成功",
  "importExport.importFailed": "匯入失敗，請檢查格式是否正確",
  "importExport.settingsModuleTitle": "偏好設定匯入匯出",
  "importExport.exportContent": "匯出内容：",
  "importExport.getContent": "生成内容",
  "importExport.copy": "複製到剪貼板",
  "importExport.exportToFile": "匯出到本地",
  "importExport.saveAsHtml": "儲存為HTML",
  "importExport.CopySuccess": "複製成功",
  "importExport.CopyFailed": "複製失敗",
};

export default zhTW;

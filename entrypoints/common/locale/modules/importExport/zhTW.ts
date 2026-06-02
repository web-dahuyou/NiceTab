import zhCN from './zhCN';
import { toZhTW } from '../zhTW';

const overrides = {
  "importExport.importContent": "填寫匯入内容：",
  "importExport.importFromText": "從文字匯入",
  "importExport.importFromFile": "從文件匯入",
  "importExport.importFromHTML": "從HTML匯入",
  "importExport.importFailed": "匯入失敗，請檢查格式是否正確",
  "importExport.copy": "複製到剪貼板",
  "importExport.saveAsHtml": "儲存為HTML"
};

export default {
  ...toZhTW(zhCN),
  ...overrides,
};

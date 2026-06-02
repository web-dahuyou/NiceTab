import zhCN from './zhCN';
import { toZhTW } from '../zhTW';

const overrides = {
  "common.multiSelection": "多選",
  "common.goToGithub": "給個小星星吧",
  "common.sendTo": "儲存到",
  "common.selectedTabCount": "已選擇{count}個分頁",
  "common.networkError": "網路連線異常",
  "common.itemCount": "{count}項",
  "common.startsWith": "開始於",
  "common.endsWith": "結束於"
};

export default {
  ...toZhTW(zhCN),
  ...overrides,
};

import type { ExtContentParserFuncName, FormatTypeOptionItem } from './types';

// 初始数据
export const initialValues = {
  formatType: 1, // 1-NiceTab格式 2-OneTab格式
  content: '',
}
// 导入格式列表
export const formatTypeOptions: FormatTypeOptionItem[] = [
  { type: 1, label: 'NiceTab格式', funcName: 'niceTab' },
  { type: 2, label: 'OneTab格式', funcName: 'oneTab' },
];


export default {
  initialValues
}
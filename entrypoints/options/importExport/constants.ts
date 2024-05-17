import type { BaseOptionItem, FormatTypeOptionItem } from './types';

// 初始数据
export const initialValues = {
  formatType: 1, // 1-NiceTab格式 2-OneTab格式
  content: '',
  importMode: 'append',
}
// 导入格式选项
export const formatTypeOptions: FormatTypeOptionItem[] = [
  { type: 1, label: 'NiceTab格式', funcName: 'niceTab' },
  { type: 2, label: 'OneTab格式', funcName: 'oneTab' },
];
// 导入模式选项
export const importModeOptions: BaseOptionItem[] = [
  { type: 'append', label: '新增导入' },
  { type: 'override', label: '覆盖导入' },
];


export default {
  initialValues,
  formatTypeOptions,
  importModeOptions
}
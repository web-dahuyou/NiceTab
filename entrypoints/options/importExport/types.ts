import type { TagItem, GroupItem, TabItem } from '~/entrypoints/types';

export type ExtContentParserFuncName = 'niceTab' | 'oneTab';
export type ExtContentImporterProps = {
  [key in ExtContentParserFuncName]: (content: string) => TagItem[]
};
export type ExtContentExporterProps = {
  [key in ExtContentParserFuncName]: (content: Partial<TagItem>[]) => string
};

export type FormatTypeOptionItem = {
  type: number | string;
  label: string;
  funcName: ExtContentParserFuncName;
}

export default {
  name: 'import-export-types',
}
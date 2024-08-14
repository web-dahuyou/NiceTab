import { ExtContentParserFuncName } from '~/entrypoints/types';

export type BaseOptionItem = {
  type: number | string;
  label: string;
  disabled?: boolean;
};
export type FormatTypeOptionItem = BaseOptionItem & {
  funcName: ExtContentParserFuncName;
};

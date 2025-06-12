import { type LocaleKeys } from '~/entrypoints/common/locale';

// drag and drop keys
export const dndKeys = {
  tabItem: Symbol('dnd-tab-item'),
};

export const defaultGroupActions = [
  'remove',
  'rename',
  'restore',
  'lock',
  'star',
  'dedup',
  'moveTo',
  'copyLinks',
  'copyGroup',
];

export const defaultTabActions = ['open', 'remove', 'copy', 'moveTo'];

export interface ActionOption {
  actionName: string;
  labelKey: LocaleKeys;
}
export const groupActionOptions: ActionOption[] = [
  {
    actionName: 'remove',
    labelKey: 'home.tabGroup.remove',
  },
  {
    actionName: 'restore',
    labelKey: 'home.tabGroup.open',
  },
  {
    actionName: 'recover',
    labelKey: 'home.tabGroup.recover',
  },
  {
    actionName: 'lock',
    labelKey: 'home.tabGroup.lock',
  },
  {
    actionName: 'star',
    labelKey: 'home.tabGroup.star',
  },
  {
    actionName: 'moveTo',
    labelKey: 'common.moveTo',
  },
  {
    actionName: 'copyGroup',
    labelKey: 'home.copyGroup',
  },
  {
    actionName: 'copyLinks',
    labelKey: 'home.copyLinks',
  },
  {
    actionName: 'dedup',
    labelKey: 'common.dedup',
  },
];

export const tabsActionOptions: ActionOption[] = [
  {
    actionName: 'open',
    labelKey: 'common.open',
  },
  {
    actionName: 'remove',
    labelKey: 'common.remove',
  },
  {
    actionName: 'copy',
    labelKey: 'common.copy',
  },
  {
    actionName: 'moveTo',
    labelKey: 'common.moveTo',
  },
];

export default {
  name: 'option-home-constants',
};

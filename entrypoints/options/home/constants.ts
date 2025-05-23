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

export interface GroupActionOption {
  actionName: string;
  labelKey: LocaleKeys;
}
export const groupActionOptions: GroupActionOption[] = [
  {
    actionName: 'remove',
    labelKey: 'home.tabGroup.remove',
  },
  {
    actionName: 'restore',
    labelKey: 'home.tabGroup.open',
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

export default {
  name: 'option-home-constants',
};

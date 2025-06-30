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
  'clone',
  'tabsSortAsc',
  'tabsSortDesc',
];

export const defaultTabActions = ['open', 'remove', 'clone', 'copyLinks', 'moveTo'];

export type GroupActionName = typeof defaultGroupActions[number];
export type TabActionName = typeof defaultTabActions[number];

export interface ActionOption<T extends 'group' | 'tab' = 'group'> {
  actionName: T extends 'group' ? GroupActionName : TabActionName;
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
    actionName: 'clone',
    labelKey: 'common.clone',
  },
  {
    actionName: 'copyLinks',
    labelKey: 'home.copyLinks',
  },
  {
    actionName: 'dedup',
    labelKey: 'common.dedup',
  },
  {
    actionName: 'tabsSortAsc',
    labelKey: 'home.tabGroup.tabsSortAsc',
  },
  {
    actionName: 'tabsSortDesc',
    labelKey: 'home.tabGroup.tabsSortDesc',
  },
];

export const tabsActionOptions: ActionOption<'tab'>[] = [
  {
    actionName: 'open',
    labelKey: 'common.open',
  },
  {
    actionName: 'remove',
    labelKey: 'common.remove',
  },
  {
    actionName: 'clone',
    labelKey: 'common.clone',
  },
  {
    actionName: 'copyLinks',
    labelKey: 'home.copyLinks',
  },
  {
    actionName: 'moveTo',
    labelKey: 'common.moveTo',
  },
];

export default {
  name: 'option-home-constants',
};

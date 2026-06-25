import { type LocaleKeys } from '~/entrypoints/common/locale';
import type { TagActionName, GroupActionName, TabActionName } from './types';

// drag and drop keys
export const dndKeys = {
  tabItem: Symbol('dnd-tab-item'),
  tabGroupItem: Symbol('dnd-tab-group-item'),
};

export const defaultGroupActions: GroupActionName[] = [
  'remove',
  'rename',
  'restore',
  'addGroupBefore',
  'addGroupAfter',
  'lock',
  'star',
  'dedup',
  'moveTo',
  'copyLinks',
  'clone',
  'tabsSortAsc',
  'tabsSortDesc',
];

export const defaultTagActions: TagActionName[] = [
  'create',
  'remove',
  'lock',
  'restore',
  'moveTo',
  'sortByNameAsc',
  'sortByNameDesc',
  'sortByCreateTimeAsc',
  'sortByCreateTimeDesc',
];

export const tagActionOptions: ActionOption<'tag'>[] = [
  {
    actionName: 'create',
    labelKey: 'home.createTabGroup',
  },
  {
    actionName: 'remove',
    labelKey: 'common.remove',
  },
  {
    actionName: 'lock',
    labelKey: 'home.tag.lock',
  },
  {
    actionName: 'restore',
    labelKey: 'home.tag.open',
  },
  {
    actionName: 'moveTo',
    labelKey: 'home.moveAllGroupTo',
  },
  {
    actionName: 'sortByNameAsc',
    labelKey: 'common.ascending',
  },
  {
    actionName: 'sortByNameDesc',
    labelKey: 'common.descending',
  },
  {
    actionName: 'sortByCreateTimeAsc',
    labelKey: 'common.ascending',
  },
  {
    actionName: 'sortByCreateTimeDesc',
    labelKey: 'common.descending',
  },
];

export const defaultTabActions: TabActionName[] = [
  'open',
  'remove',
  'clone',
  'copyLinks',
  'moveTo',
];

export interface ActionOption<T extends 'tag' | 'group' | 'tab' = 'group'> {
  actionName: T extends 'tag'
    ? TagActionName
    : T extends 'group'
      ? GroupActionName
      : TabActionName;
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
    actionName: 'addGroupBefore',
    labelKey: 'home.tabGroup.addGroupBefore',
  },
  {
    actionName: 'addGroupAfter',
    labelKey: 'home.tabGroup.addGroupAfter',
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

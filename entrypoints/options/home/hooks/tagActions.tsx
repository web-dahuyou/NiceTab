import { useMemo } from 'react';
import {
  CloseOutlined,
  PlusOutlined,
  ExportOutlined,
  SendOutlined,
  LockOutlined,
  UnlockOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { type ActionOptionItem } from '~/entrypoints/common/components/ActionBtnList';
import {
  IconTimeAscending,
  IconTimeDescending,
} from '~/entrypoints/common/components/icon/CustomIcon';
import type { GroupItem } from '~/entrypoints/types';
import type { TagActionName } from '../types';
import { tagActionOptions, type ActionOption } from '../constants';

interface UseTagActionsProps {
  tagId: string;
  isStatic?: boolean;
  isLocked?: boolean;
  groupList?: GroupItem[];
  allowTagActions?: TagActionName[];
  onAction: (actionName: TagActionName, tagId: string) => void;
}

interface UseTagActionsReturn {
  tagMenuItems: ActionOptionItem[];
}

export default function useTagActions({
  tagId,
  isStatic = false,
  isLocked = false,
  groupList = [],
  allowTagActions = [],
  onAction,
}: UseTagActionsProps): UseTagActionsReturn {
  const { $fmt } = useIntlUtls();

  const tagMenuItems = useMemo(() => {
    const actionMap = tagActionOptions.reduce(
      (result, option) => {
        result[option.actionName as TagActionName] = option;
        return result;
      },
      {} as Record<TagActionName, ActionOption<'tag'>>,
    );

    const btns: ActionOptionItem[] = [
      {
        key: 'remove',
        label: $fmt(actionMap['remove'].labelKey),
        icon: <CloseOutlined />,
        disabled: isLocked,
        onClick: () => onAction('remove', tagId),
      },
      {
        key: 'create',
        label: $fmt(actionMap['create'].labelKey),
        icon: <PlusOutlined />,
        disabled: isLocked,
        onClick: () => onAction('create', tagId),
      },
      {
        key: 'lock',
        label: $fmt(isLocked ? 'home.tag.unlock' : 'home.tag.lock'),
        icon: isLocked ? <UnlockOutlined /> : <LockOutlined />,
        disabled: isStatic,
        onClick: () => onAction('lock', tagId),
      },
      {
        key: 'restore',
        label: $fmt('home.tag.open'),
        icon: <ExportOutlined />,
        disabled: !groupList.length,
        onClick: () => onAction('restore', tagId),
      },
      {
        key: 'moveTo',
        label: $fmt(actionMap['moveTo'].labelKey),
        icon: <SendOutlined />,
        disabled: isLocked,
        onClick: () => onAction('moveTo', tagId),
      },
      {
        key: 'sortByNameAsc',
        label: $fmt({
          id: 'common.ascending',
          values: { sortBy: $fmt('home.tabGroup.name') },
        }),
        icon: <SortAscendingOutlined />,
        disabled: isLocked,
        onClick: () => onAction('sortByNameAsc', tagId),
      },
      {
        key: 'sortByNameDesc',
        label: $fmt({
          id: 'common.descending',
          values: { sortBy: $fmt('home.tabGroup.name') },
        }),
        icon: <SortDescendingOutlined />,
        disabled: isLocked,
        onClick: () => onAction('sortByNameDesc', tagId),
      },
      {
        key: 'sortByCreateTimeAsc',
        label: $fmt({
          id: 'common.ascending',
          values: { sortBy: $fmt('home.tabGroup.createTime') },
        }),
        icon: <IconTimeAscending />,
        disabled: isLocked,
        onClick: () => onAction('sortByCreateTimeAsc', tagId),
      },
      {
        key: 'sortByCreateTimeDesc',
        label: $fmt({
          id: 'common.descending',
          values: { sortBy: $fmt('home.tabGroup.createTime') },
        }),
        icon: <IconTimeDescending />,
        disabled: isLocked,
        onClick: () => onAction('sortByCreateTimeDesc', tagId),
      },
    ];

    return btns.filter(item => {
      return allowTagActions.includes(item.key as TagActionName);
    });
  }, [$fmt, allowTagActions, isLocked, tagId, onAction]);

  return { tagMenuItems };
}

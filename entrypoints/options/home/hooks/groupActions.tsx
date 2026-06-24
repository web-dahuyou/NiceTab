import { useMemo, useCallback, useContext } from 'react';
import {
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
  StarOutlined,
  ExportOutlined,
  SendOutlined,
  CopyOutlined,
  BlockOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import copyToClipboard from 'copy-to-clipboard';
import { LuFolderUp, LuFolderDown } from 'react-icons/lu';
import { IconRepeat } from '~/entrypoints/common/components/icon/CustomIcon';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { type ActionOptionItem } from '@/entrypoints/common/components/ActionBtnList';
import type { TabItem, IntlForamtMessageParams } from '~/entrypoints/types';
import type { LocaleKeys } from '~/entrypoints/common/locale';
import type { GroupActionName } from '../types';
import { defaultGroupActions, groupActionOptions, type ActionOption } from '../constants';

const { GROUP_ACTION_BTNS_COMMONLY_USED } = ENUM_SETTINGS_PROPS;

export function copyLinksToClipboard(
  tabList: TabItem[],
  $message: { success: (msg: string) => void; error: (msg: string) => void },
  $fmt: (
    idOrFormatMsg: LocaleKeys | IntlForamtMessageParams,
    options?: Record<string, any>,
  ) => string,
) {
  const tabLinks = tabListUtils.copyLinks(tabList);
  const result = copyToClipboard(tabLinks);
  if (result) {
    $message.success($fmt('common.CopySuccess'));
  } else {
    $message.error($fmt('common.CopyFailed'));
  }
}

interface UseGroupActionsProps {
  groupId: string;
  tagId?: string;
  tagLocked?: boolean;
  isLocked?: boolean;
  isStarred?: boolean;
  tabList?: TabItem[];
  allowGroupActions?: GroupActionName[];
  onAction: (actionName: GroupActionName, groupId: string) => void;
}

interface UseGroupActionsReturn {
  getGroupActionOptions: () => ActionOptionItem[];
  groupActions: {
    outerList: ActionOptionItem[];
    innerList: ActionOptionItem[];
  };
}

export default function useGroupActions({
  groupId,
  tagId,
  tagLocked,
  isLocked,
  isStarred,
  tabList = [],
  allowGroupActions = defaultGroupActions,
  onAction,
}: UseGroupActionsProps): UseGroupActionsReturn {
  const { $fmt } = useIntlUtls();
  const { $message } = useContext(GlobalContext);

  const handleCopyLinks = useCallback(() => {
    copyLinksToClipboard(tabList, $message, $fmt);
  }, [tabList, $message, $fmt]);

  const getGroupActionOptions = useCallback(() => {
    const actionMap = groupActionOptions.reduce(
      (result, option) => {
        result[option.actionName] = option;
        return result;
      },
      {} as Record<GroupActionName, ActionOption>,
    );

    const btns: ActionOptionItem[] = [
      {
        key: 'remove',
        label: $fmt(actionMap['remove'].labelKey),
        icon: <CloseOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => onAction('remove', groupId),
      },
      {
        key: 'restore',
        label: $fmt(actionMap['restore'].labelKey),
        icon: <ExportOutlined />,
        disabled: !tabList.length,
        onClick: () => onAction('restore', groupId),
      },
      {
        key: 'addGroupBefore',
        label: $fmt(actionMap['addGroupBefore'].labelKey),
        icon: <LuFolderUp />,
        onClick: () => onAction('addGroupBefore', groupId),
      },
      {
        key: 'addGroupAfter',
        label: $fmt(actionMap['addGroupAfter'].labelKey),
        icon: <LuFolderDown />,
        onClick: () => onAction('addGroupAfter', groupId),
      },
      {
        key: 'lock',
        label: $fmt(isLocked ? 'home.tabGroup.unlock' : 'home.tabGroup.lock'),
        disabled: tagLocked,
        icon: isLocked ? <UnlockOutlined /> : <LockOutlined />,
        onClick: () => onAction('lock', groupId),
      },
      {
        key: 'star',
        label: $fmt(isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star'),
        disabled: tagLocked,
        icon: <StarOutlined />,
        onClick: () => onAction('star', groupId),
      },
      {
        key: 'moveTo',
        label: $fmt(actionMap['moveTo'].labelKey),
        disabled: tagLocked,
        icon: <SendOutlined />,
        onClick: () => onAction('moveTo', groupId),
      },
      {
        key: 'copyLinks',
        label: $fmt(actionMap['copyLinks'].labelKey),
        icon: <CopyOutlined />,
        onClick: handleCopyLinks,
      },
      {
        key: 'clone',
        label: $fmt(actionMap['clone'].labelKey),
        disabled: tagLocked,
        icon: <IconRepeat />,
        onClick: () => onAction('clone', groupId),
      },
      {
        key: 'dedup',
        label: $fmt(actionMap['dedup'].labelKey),
        icon: <BlockOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => onAction('dedup', groupId),
      },
      {
        key: 'tabsSortAsc',
        label: $fmt(actionMap['tabsSortAsc'].labelKey),
        icon: <SortAscendingOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => onAction('tabsSortAsc', groupId),
      },
      {
        key: 'tabsSortDesc',
        label: $fmt(actionMap['tabsSortDesc'].labelKey),
        icon: <SortDescendingOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => onAction('tabsSortDesc', groupId),
      },
    ];

    return btns.filter(item => {
      const isAllowed = allowGroupActions.includes(item.key as GroupActionName);
      return isAllowed;
    });
  }, [
    $fmt,
    allowGroupActions,
    tagLocked,
    groupId,
    isLocked,
    isStarred,
    onAction,
    handleCopyLinks,
  ]);

  const groupActions = useMemo(() => {
    const settings = settingsUtils.settings;
    const outerList: ActionOptionItem[] = [],
      innerList: ActionOptionItem[] = [];

    const groupActionBtnOptions = getGroupActionOptions();

    groupActionBtnOptions.forEach(item => {
      if (settings[GROUP_ACTION_BTNS_COMMONLY_USED]?.includes(item.key)) {
        outerList.push(item);
      } else {
        innerList.push(item);
      }
    });

    return { outerList, innerList };
  }, [getGroupActionOptions]);

  return {
    getGroupActionOptions,
    groupActions,
  };
}

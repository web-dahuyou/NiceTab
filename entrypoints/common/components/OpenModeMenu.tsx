import { useContext, useCallback } from 'react';
import { DownOutlined } from '@ant-design/icons';

import { GlobalContext, useIntlUtls } from '../hooks/global';
import {
  openTabs,
  openSearchTabsFromPage,
  type OpenMode,
  type OpenTarget,
  type OpenResult,
} from '../openUtils';

import ActionDropdown from './ActionDropdown';

export function openModeItems(
  $fmt: ReturnType<typeof useIntlUtls>['$fmt'],
  onOpen: (mode: OpenMode) => void,
) {
  return (['current', 'newWindow', 'incognito'] as const).map(mode => ({
    key: mode,
    label: $fmt(`home.treeNodeBatch.open.${mode}`),
    onClick: (event?: { domEvent: React.SyntheticEvent }) => {
      event?.domEvent.preventDefault();
      event?.domEvent.stopPropagation();
      onOpen(mode);
    },
  }));
}

export function OpenModeMenu({
  onOpen,
  disabled,
  children,
}: {
  onOpen: (mode: OpenMode) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { $fmt } = useIntlUtls();
  return (
    <ActionDropdown
      items={openModeItems($fmt, onOpen)}
      label={$fmt('common.open')}
      disabled={disabled}
    >
      {children || <DownOutlined />}
    </ActionDropdown>
  );
}

export function useOpenSavedTabs() {
  const { $fmt } = useIntlUtls();
  const { $message, pageContext } = useContext(GlobalContext);
  return useCallback(
    async (
      targets: OpenTarget[],
      mode: OpenMode = 'current',
      continueOnFailure = false,
    ) => {
      let result: OpenResult;
      try {
        result =
          pageContext === 'contentScriptPage'
            ? await openSearchTabsFromPage(targets, mode)
            : await openTabs(targets, mode, undefined, continueOnFailure);
        if (!result) throw new Error('Missing saved tabs open result');
      } catch (error) {
        console.warn('Unable to open saved tabs', error);
        result = { processedIds: [], failed: true };
      }
      if (result.permissionDenied)
        $message.warning($fmt('home.treeNodeBatch.incognitoPermission'));
      else if (result.failed) $message.error($fmt('home.treeNodeBatch.failed'));
      return result;
    },
    [$fmt, $message, pageContext],
  );
}

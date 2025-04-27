import { useCallback, useContext, useRef } from 'react';
import { eventEmitter } from '~/entrypoints/common/hooks/global';
import { type ActionCallbackFn } from '~/entrypoints/common/components/BaseGlobalSearch';
import type { TreeDataNodeUnion } from '../types';
import { HomeContext } from '../hooks/treeData';

export interface GlobalSearchHandle {
  open: () => void;
}

export function useGlobalSearchPanel() {
  const globalSearchPanelRef = useRef<GlobalSearchHandle>(null);

  const openGlobalSearchPanel = useCallback(async () => {
    globalSearchPanelRef.current?.open?.();
  }, []);

  return {
    globalSearchPanelRef,
    openGlobalSearchPanel,
  };
}

export default function useGlobalSearch() {
  const { treeDataHook } = useContext(HomeContext);
  const { tagList, selectedKeyChange } = treeDataHook;
  const { globalSearchPanelRef, openGlobalSearchPanel } = useGlobalSearchPanel();

  const onAction: ActionCallbackFn = useCallback(
    (type, option) => {
      const { tagId, groupId, tabId } = option || {};
      let params: Partial<TreeDataNodeUnion & { tabId: string }> = {};
      if (type === 'open') return;

      if (type === 'tag') {
        params = { type: 'tag', key: tagId };
      } else {
        params = {
          type: 'tabGroup',
          key: groupId,
          parentKey: tagId,
          tabId,
        };
      }

      eventEmitter.emit('home:set-tree-searchValue', {
        value: '',
        callback: () => selectedKeyChange(params),
      });
    },
    [selectedKeyChange]
  );

  return {
    globalSearchPanelRef,
    tagList,
    openGlobalSearchPanel,
    onAction,
  };
}

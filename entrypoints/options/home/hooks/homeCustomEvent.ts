import mitt from 'mitt';
import { type TreeDataHookProps } from './treeData';

export type HomeCustomEventParamsProps = (
  | {
      action: 'init';
      params: Parameters<TreeDataHookProps['init']>;
    }
  | {
      action: 'handleSelect';
      params: Parameters<TreeDataHookProps['handleSelect']>;
    }
  | {
      action: 'onSelect';
      params: Parameters<TreeDataHookProps['onSelect']>;
    }
  | {
      action: 'handleMoreItemClick';
      params: Parameters<TreeDataHookProps['handleMoreItemClick']>;
    }
  | {
      action: 'onTreeNodeAction';
      params: Parameters<TreeDataHookProps['onTreeNodeAction']>;
    }
  | {
      action: 'toggleExpand';
      params: Parameters<TreeDataHookProps['toggleExpand']>;
    }
  | {
      action: 'refreshTreeData';
      params: Parameters<TreeDataHookProps['refreshTreeData']>;
    }
  | {
      action: 'handleTagRemove';
      params: Parameters<TreeDataHookProps['handleTagRemove']>;
    }
  | {
      action: 'handleTagCreate';
      params: Parameters<TreeDataHookProps['handleTagCreate']>;
    }
  | {
      action: 'handleTagChange';
      params: Parameters<TreeDataHookProps['handleTagChange']>;
    }
  | {
      action: 'handleTabGroupRemove';
      params: Parameters<TreeDataHookProps['handleTabGroupRemove']>;
    }
  | {
      action: 'handleTabGroupCreate';
      params: Parameters<TreeDataHookProps['handleTabGroupCreate']>;
    }
  | {
      action: 'handleTabGroupChange';
      params: Parameters<TreeDataHookProps['handleTabGroupChange']>;
    }
  | {
      action: 'handleTabGroupStarredChange';
      params: Parameters<TreeDataHookProps['handleTabGroupStarredChange']>;
    }
  | {
      action: 'handleTabGroupDedup';
      params: Parameters<TreeDataHookProps['handleTabGroupDedup']>;
    }
  | {
      action: 'handleTabGroupRestore';
      params: Parameters<TreeDataHookProps['handleTabGroupRestore']>;
    }
  | {
      action: 'handleTabsOpen';
      params: Parameters<TreeDataHookProps['handleTabsOpen']>;
    }
  | {
      action: 'handleTreeNodeDrop';
      params: Parameters<TreeDataHookProps['handleTreeNodeDrop']>;
    }
  | {
      action: 'handleTabItemDrop';
      params: Parameters<TreeDataHookProps['handleTabItemDrop']>;
    }
  | {
      action: 'handleTabItemChange';
      params: Parameters<TreeDataHookProps['handleTabItemChange']>;
    }
  | {
      action: 'handleTabItemCopy';
      params: Parameters<TreeDataHookProps['handleTabItemCopy']>;
    }
  | {
      action: 'handleTabItemRemove';
      params: Parameters<TreeDataHookProps['handleTabItemRemove']>;
    }
  | {
      action: 'handleTabsSort';
      params: Parameters<TreeDataHookProps['handleTabsSort']>;
    }
  | {
      action: 'selectedKeyChange';
      params: Parameters<TreeDataHookProps['selectedKeyChange']>;
    }
) & {
  callback?: () => void;
};

export type HomeCustomEventProps = {
  'home:treeDataHook': HomeCustomEventParamsProps;
};

export const eventEmitter = mitt<HomeCustomEventProps>();

export default function useCustomEventListener(treeDataHook: TreeDataHookProps) {
  const handleCustomEvent = useCallback(
    async ({ action, params, callback }: HomeCustomEventParamsProps) => {
      // console.log('handleCustomEvent--action', action, params);
      await (treeDataHook?.[action] as any)?.(...params);
      callback?.();
    },
    [],
  );
  const addCustomEventListener = useCallback(() => {
    eventEmitter.on('home:treeDataHook', handleCustomEvent);
  }, []);
  const removeCustomEventListener = useCallback(() => {
    eventEmitter.off('home:treeDataHook', handleCustomEvent);
  }, []);

  useEffect(() => {
    addCustomEventListener();
    return () => {
      removeCustomEventListener();
    };
  }, []);
}

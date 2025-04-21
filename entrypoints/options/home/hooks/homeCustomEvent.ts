import mitt from 'mitt';
import { type TreeDataHookProps } from './treeData';

export type HomeCustomEventParamsProps = {
  action: 'handleSelect',
  params: Parameters<TreeDataHookProps['handleSelect']>
} | {
  action: 'onSelect',
  params: Parameters<TreeDataHookProps['onSelect']>
} | {
  action: 'handleMoreItemClick',
  params: Parameters<TreeDataHookProps['handleMoreItemClick']>
} | {
  action: 'onTreeNodeAction',
  params: Parameters<TreeDataHookProps['onTreeNodeAction']>
} | {
  action: 'toggleExpand',
  params: Parameters<TreeDataHookProps['toggleExpand']>
} | {
  action: 'refreshTreeData',
  params: Parameters<TreeDataHookProps['refreshTreeData']>
} | {
  action: 'handleTagRemove',
  params: Parameters<TreeDataHookProps['handleTagRemove']>
} | {
  action: 'handleTagCreate',
  params: Parameters<TreeDataHookProps['handleTagCreate']>
} | {
  action: 'handleTagChange',
  params: Parameters<TreeDataHookProps['handleTagChange']>
} | {
  action: 'handleTabGroupRemove',
  params: Parameters<TreeDataHookProps['handleTabGroupRemove']>
} | {
  action: 'handleTabGroupCreate',
  params: Parameters<TreeDataHookProps['handleTabGroupCreate']>
} | {
  action: 'handleTabGroupChange',
  params: Parameters<TreeDataHookProps['handleTabGroupChange']>
} | {
  action: 'handleTabGroupStarredChange',
  params: Parameters<TreeDataHookProps['handleTabGroupStarredChange']>
} | {
  action: 'handleTabGroupDedup',
  params: Parameters<TreeDataHookProps['handleTabGroupDedup']>
} | {
  action: 'handleTabGroupRestore',
  params: Parameters<TreeDataHookProps['handleTabGroupRestore']>
} | {
  action: 'handleTreeNodeDrop',
  params: Parameters<TreeDataHookProps['handleTreeNodeDrop']>
} | {
  action: 'handleTabItemDrop',
  params: Parameters<TreeDataHookProps['handleTabItemDrop']>
} | {
  action: 'handleTabItemChange',
  params: Parameters<TreeDataHookProps['handleTabItemChange']>
} | {
  action: 'handleTabItemCopy',
  params: Parameters<TreeDataHookProps['handleTabItemCopy']>
} | {
  action: 'handleTabItemRemove',
  params: Parameters<TreeDataHookProps['handleTabItemRemove']>
} | {
  action: 'selectedKeyChange',
  params: Parameters<TreeDataHookProps['selectedKeyChange']>
}

export type HomeCustomEventProps = {
  'home:treeDataHook': HomeCustomEventParamsProps
}

export const eventEmitter = mitt<HomeCustomEventProps>();

export default function useCustomEventListener(treeDataHook: TreeDataHookProps) {
  const handleCustomEvent = useCallback(
    ({ action, params }: HomeCustomEventParamsProps) => {
      // console.log('handleCustomEvent--action', action, params);
      (treeDataHook?.[action] as any)?.(...params);
    },
    []
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
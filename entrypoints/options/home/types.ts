import type { TreeDataNode } from 'antd';
import { TagItem, GroupItem, TabItem } from '~/entrypoints/types';

export type TreeDataNodeTabGroup = TreeDataNode & {
  type: 'tabGroup';
  parentKey: string;
  title: string;
  icon?: React.ReactNode;
  originData: GroupItem;
  children?: Array<TreeDataNode & { originData?: TabItem }>;
};
export type TreeDataNodeTag = TreeDataNode & {
  type: 'tag';
  parentKey?: string;
  title: string;
  icon?: React.ReactNode;
  originData: TagItem;
  children?: Array<TreeDataNodeTabGroup>;
};
export type TreeDataNodeUnion = TreeDataNodeTag | TreeDataNodeTabGroup;

export type RenderTreeNodeActionProps = {
  actionType: 'tag' | 'tabGroup';
  node: TreeDataNodeUnion;
  actionName: 'create' | 'remove' | 'rename' | 'moveTo';
  data?: Partial<TagItem | GroupItem>;
};
export type RenderTreeNodeProps = {
  node: TreeDataNodeUnion;
  selected?: boolean;
  container?:
    | (HTMLElement & { scrollTo?: (props: { key: React.Key; offset?: number }) => void })
    | null;
  refreshKey?: string;
  virtual?: boolean;
  onAction?: (props: RenderTreeNodeActionProps) => void;
  onTabItemDrop?: DndTabItemOnDropCallback;
  onMoveTo?: ({ moveData, targetData }: MoveToCallbackProps) => void;
};

// 需要移动的数据
export interface MoveDataProps {
  tagId?: string;
  groupId?: string;
  tabs?: TabItem[];
}

// 移动后的目标数据
export interface MoveTargetProps {
  targetTagId?: string;
  targetGroupId?: string;
}
// 移动后的目标数据
export interface MoveToCallbackProps {
  moveData?: MoveDataProps;
  targetData: MoveTargetProps;
  selected?: boolean;
}

// tagList 级联 option
export type CascaderOption = {
  type: string;
  value: string;
  label: React.ReactNode;
  children?: CascaderOption[];
  parentKey?: string;
} & Record<string, any>;

// 拖拽tab数据
export type DndTabItemProps = TabItem & {
  groupId: string;
  index: number;
  dndKey: symbol;
  isEmpty?: boolean; // 空标签组，默认设置一个空标签，便于拖拽
};
export type DndTabItemOnDropCallback = ({
  sourceData,
  targetData,
  sourceIndex,
  targetIndex,
}: {
  sourceData: Pick<DndTabItemProps, 'groupId' | 'index'>;
  targetData: Pick<DndTabItemProps, 'groupId' | 'index'>;
  sourceIndex: number;
  targetIndex: number;
}) => void;

// 标签组操作 remove-删除 rename-重命名 restore-恢复 lock-锁定 star-星标 recover-从回收站复原到列表页
export type GroupActions = 'remove' | 'rename' | 'restore' | 'lock' | 'star' | 'recover';

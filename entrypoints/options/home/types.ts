import type { TreeDataNode } from 'antd';
import { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';

export type TreeDataNodeTabGroup = TreeDataNode & {
  type: 'tabGroup';
  parentKey: string;
  icon?: React.ReactNode;
  originData: GroupItem;
  children?: Array<TreeDataNode & { originData?: TabItem }>;
};
export type TreeDataNodeTag = TreeDataNode & {
  type: 'tag';
  parentKey?: string;
  icon?: React.ReactNode;
  originData: TagItem;
  children?: Array<TreeDataNodeTabGroup & { originData?: GroupItem }>;
};
export type TreeDataNodeUnion = TreeDataNodeTag | TreeDataNodeTabGroup;

export type RenderTreeNodeActionProps = {
  actionType: 'tag' | 'tabGroup';
  node: TreeDataNodeUnion;
  actionName: 'create' | 'remove' | 'rename';
  data?: Partial<TagItem | GroupItem>;
};
export type RenderTreeNodeProps = {
  node: TreeDataNodeUnion;
  onAction?: (props: RenderTreeNodeActionProps) => void;
};
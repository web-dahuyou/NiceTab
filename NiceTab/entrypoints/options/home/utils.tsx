
import { TagItem, GroupItem, TabItem, CountInfo } from '~/entrypoints/types';
import { TreeDataNodeTabGroup, TreeDataNodeTag, TreeDataNodeUnion, RenderTreeNodeActionProps, RenderTreeNodeProps } from './types';
import {
  FolderOutlined,
  AppstoreOutlined,
  DownOutlined,
  CloseOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';

// 生成treeData
export const getTreeData = (tagList: TagItem[]): TreeDataNodeUnion[] => {
  return tagList.map((tag) => ({
    type: 'tag',
    key: tag.tagId,
    title: tag.tagName,
    icon: <FolderOutlined />,
    isLeaf: false,
    originData: { ...tag },
    children: tag?.groupList?.map((group) => {
      return {
        type: 'tabGroup',
        parentKey: tag.tagId,
        key: group.groupId,
        title: group.groupName,
        icon: <AppstoreOutlined />,
        isLeaf: true,
        originData: { ...group },
      };
    }),
  }));
};


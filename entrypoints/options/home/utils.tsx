
import { TagOutlined, ProductOutlined } from '@ant-design/icons';
import { TagItem } from '~/entrypoints/types';
import { TreeDataNodeUnion } from './types';

// 生成treeData
export const getTreeData = (tagList: TagItem[]): TreeDataNodeUnion[] => {
  return tagList.map((tag) => ({
    type: 'tag',
    key: tag.tagId,
    title: tag.tagName,
    isLeaf: false,
    icon: <TagOutlined />,
    originData: { ...tag },
    children: tag?.groupList?.map((group) => {
      return {
        type: 'tabGroup',
        parentKey: tag.tagId,
        key: group.groupId,
        title: group.groupName,
        isLeaf: true,
        icon: <ProductOutlined />,
        originData: { ...group },
      };
    }),
  }));
};

export default {
  getTreeData
}
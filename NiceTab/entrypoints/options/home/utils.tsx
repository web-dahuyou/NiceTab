
import { TagItem } from '~/entrypoints/types';
import { TreeDataNodeUnion } from './types';

// 生成treeData
export const getTreeData = (tagList: TagItem[]): TreeDataNodeUnion[] => {
  return tagList.map((tag) => ({
    type: 'tag',
    key: tag.tagId,
    title: tag.tagName,
    isLeaf: false,
    originData: { ...tag },
    children: tag?.groupList?.map((group) => {
      return {
        type: 'tabGroup',
        parentKey: tag.tagId,
        key: group.groupId,
        title: group.groupName,
        isLeaf: true,
        originData: { ...group },
      };
    }),
  }));
};


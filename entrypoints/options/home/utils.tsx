
import { PushpinOutlined, TagOutlined, ProductOutlined } from '@ant-design/icons';
import type { TagItem } from '~/entrypoints/types';
import type { TreeDataNodeUnion, MoveDataProps, CascaderOption } from './types';

// 生成treeData
export const getTreeData = (tagList: TagItem[]): TreeDataNodeUnion[] => {
  return tagList.map((tag) => ({
    type: 'tag',
    key: tag.tagId,
    title: tag.tagName,
    isLeaf: false,
    icon: tag.static ? <PushpinOutlined /> : <TagOutlined />,
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

// 生成Cascader级联数据
export const getCascaderData = (tagList: TagItem[], moveData?: MoveDataProps): CascaderOption[] => {
  const { groupId, tabs } = moveData || {};
  const moveType = tabs && tabs?.length > 0 ? 'tab' : 'tabGroup';

  const tagDisabled = (tag: TagItem) => {
    if (moveType === 'tabGroup' ) {
      return tag?.groupList.some(g => g.groupId === groupId);
    } else {
      return tag?.groupList?.length === 0;
    }
  };

  return tagList.map((tag) => ({
    type: 'tag',
    value: tag.tagId,
    label: (
      <div className='cascader-label-custom cascader-label-tag'>
        <TagOutlined />
        <span>{tag.tagName}</span>
      </div>
    ),
    disabled: tagDisabled(tag),
    // isLeaf: false,
    originData: { ...tag },
    children: tag?.groupList?.map((group) => {
      return {
        type: 'tabGroup',
        value: group.groupId,
        label: (
          <div className='cascader-label-custom cascader-label-group'>
            <ProductOutlined />
            <span>{group.groupName}</span>
          </div>
        ),
        disabled: moveType === 'tabGroup' || group.groupId === groupId,
        parentKey: tag.tagId,
        isLeaf: true,
        originData: { ...group },
      };
    }),
  }));
};

export default {
  getTreeData,
  getCascaderData
}
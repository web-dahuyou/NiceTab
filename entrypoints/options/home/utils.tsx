import type { TreeProps } from 'antd';
import {
  PushpinOutlined,
  TagOutlined,
  ProductOutlined,
  LockFilled,
} from '@ant-design/icons';
import { getLocaleMessages } from '~/entrypoints/common/utils';
import type { TagItem } from '~/entrypoints/types';
import type { TreeDataNodeUnion, MoveDataProps, CascaderOption } from './types';

// 生成treeData
export const getTreeData = (tagList: TagItem[]): TreeDataNodeUnion[] => {
  return tagList.map(tag => ({
    type: 'tag',
    key: tag.tagId,
    title: tag.tagName,
    isLeaf: false,
    icon: tag.static ? (
      <PushpinOutlined />
    ) : tag.isLocked ? (
      <LockFilled />
    ) : (
      <TagOutlined />
    ),
    originData: { ...tag },
    children: tag?.groupList?.map(group => {
      return {
        type: 'tabGroup',
        parentKey: tag.tagId,
        parentData: { isLocked: tag.isLocked, isStarred: tag.isStarred },
        key: group.groupId,
        title: group.groupName,
        isLeaf: true,
        icon: group.isLocked ? <LockFilled /> : <ProductOutlined />,
        originData: { ...group },
      };
    }),
  }));
};

// 获取当前分类下的标签组和标签组页数量
export const getSelectedCounts = (tag: TagItem) => {
  const groupCount = tag?.groupList?.length || 0;
  let tabCount = 0;
  tag?.groupList?.forEach(group => {
    tabCount += group.tabList?.length || 0;
  });
  return { groupCount, tabCount };
};

// 判断能否拖拽到节点上
export const checkAllowDrop: TreeProps<TreeDataNodeUnion>['allowDrop'] = ({
  dragNode,
  dropNode,
  dropPosition,
}) => {
  // console.log('checkAllowDrop--dragNode', dragNode)
  // console.log('checkAllowDrop--dropNode', dropNode)
  // console.log('checkAllowDrop--dropPosition', dropPosition)

  // dropPosition = 0 时表示，拖放到目标 node 的子集
  // dropPosition = 1 时表示，拖放到目标 node 的同级之后
  // dropPosition = -1 时表示，拖放到目标 node 的同级之前
  if (
    (dragNode.type === 'tag' && dragNode?.originData?.static) ||
    (dropNode.type === 'tag' && dropNode?.originData?.static && dropPosition == -1)
  ) {
    // 中转站永远置顶，不允许其他分类排到它前面
    return false;
  }

  return (
    (dragNode.type === 'tabGroup' && dropNode.type === 'tabGroup') ||
    (dragNode.type === 'tag' && dropNode.type === 'tag' && dropPosition !== 0) ||
    (dragNode.type === 'tabGroup' && dropNode.type === 'tag' && dropPosition >= 0)
  );
};

// 生成Cascader级联数据
export const getCascaderData = async (
  tagList: TagItem[],
  moveData?: MoveDataProps,
): Promise<CascaderOption[]> => {
  const localeMessage = await getLocaleMessages();
  const { tagId, groupId, tabs } = moveData || {};
  const moveType = tagId ? 'tag' : tabs && tabs?.length > 0 ? 'tab' : 'tabGroup';
  const tagDisabled = (tag: TagItem) => {
    if (moveType === 'tag') {
      return tag.tagId === tagId;
    } else if (moveType === 'tabGroup') {
      return tag?.groupList.some(g => g.groupId === groupId);
    } else {
      return tag?.groupList?.length === 0;
    }
  };

  return tagList.map(tag => ({
    type: 'tag',
    value: tag.tagId,
    label: (
      <div className="cascader-label-custom cascader-label-tag">
        <TagOutlined />
        <span className="label-name">
          {tag.static ? localeMessage?.['home.stagingArea'] : tag.tagName}
        </span>
      </div>
    ),
    disabled: tagDisabled(tag),
    // isLeaf: false,
    originData: { ...tag },
    children: tag?.groupList?.map(group => {
      return {
        type: 'tabGroup',
        value: group.groupId,
        label: (
          <div className="cascader-label-custom cascader-label-group">
            <ProductOutlined />
            <span className="label-name">{group.groupName}</span>
          </div>
        ),
        disabled: moveType !== 'tab' || group.groupId === groupId,
        parentKey: tag.tagId,
        isLeaf: true,
        originData: { ...group },
      };
    }),
  }));
};

// 生成全量的Cascader级联数据，发送标签页时选择指定分类或者标签组
export const getTotalCascaderData = async (
  tagList: TagItem[],
): Promise<CascaderOption[]> => {
  const localeMessage = await getLocaleMessages();

  return tagList.map(tag => ({
    type: 'tag',
    value: tag.tagId,
    label: (
      <div className="cascader-label-custom cascader-label-tag">
        <TagOutlined />
        <span className="label-name">
          {tag.static ? localeMessage?.['home.stagingArea'] : tag.tagName}
        </span>
      </div>
    ),
    // isLeaf: false,
    originData: { ...tag },
    children: tag?.groupList?.map(group => {
      return {
        type: 'tabGroup',
        value: group.groupId,
        label: (
          <div className="cascader-label-custom cascader-label-group">
            <ProductOutlined />
            <span className="label-name">{group.groupName}</span>
          </div>
        ),
        parentKey: tag.tagId,
        isLeaf: true,
        originData: { ...group },
      };
    }),
  }));
};

export default {
  getTreeData,
  getCascaderData,
};

import { PushpinOutlined, TagOutlined, ProductOutlined } from '@ant-design/icons';
import { getLocaleMessages } from '~/entrypoints/common/utils';
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

// 获取当前分类下的标签组和标签组页数量
export const getSelectedCounts = (tag: TagItem) => {
  const groupCount = tag?.groupList?.length || 0;
  let tabCount = 0;
  tag?.groupList?.forEach((group) => {
    tabCount += group.tabList?.length || 0;
  });
  return { groupCount, tabCount };
};

// 生成Cascader级联数据
export const getCascaderData = async (
  tagList: TagItem[],
  moveData?: MoveDataProps
): Promise<CascaderOption[]> => {
  const localeMessage = await getLocaleMessages();
  const { tagId, groupId, tabs } = moveData || {};
  const moveType = tagId ? 'tag' : tabs && tabs?.length > 0 ? 'tab' : 'tabGroup';
  const tagDisabled = (tag: TagItem) => {
    if (moveType === 'tag') {
      return tag.tagId === tagId;
    } else if (moveType === 'tabGroup') {
      return tag?.groupList.some((g) => g.groupId === groupId);
    } else {
      return tag?.groupList?.length === 0;
    }
  };

  return tagList.map((tag) => ({
    type: 'tag',
    value: tag.tagId,
    label: (
      <div className="cascader-label-custom cascader-label-tag">
        <TagOutlined />
        <span>{tag.static ? localeMessage?.['home.stagingArea'] : tag.tagName}</span>
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
          <div className="cascader-label-custom cascader-label-group">
            <ProductOutlined />
            <span>{group.groupName}</span>
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

export default {
  getTreeData,
  getCascaderData,
};

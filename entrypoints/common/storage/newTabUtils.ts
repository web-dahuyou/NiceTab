import type { GroupItem, TagItem } from '~/entrypoints/types';

export type NewTabGroupRef = Pick<GroupItem, 'groupId' | 'groupName'> & {
  tagId: string;
  tagName: string;
};

export default class NewTabUtils {
  storageKey: `local:${string}` = 'local:tabList';

  async getTagList(): Promise<TagItem[]> {
    return (await storage.getItem<TagItem[]>(this.storageKey)) || [];
  }

  async getGroupIds(): Promise<string[]> {
    const tagList = await this.getTagList();
    const groupIds: string[] = [];
    tagList.forEach(tag => {
      tag.groupList?.forEach(group => {
        if (group.isStarred) {
          groupIds.push(group.groupId);
        }
      });
    });
    return groupIds;
  }

  getSelectedGroups(tagList: TagItem[], selectedGroupIds: string[]): NewTabGroupRef[] {
    const selectedIdSet = new Set(selectedGroupIds);
    const groups: NewTabGroupRef[] = [];

    tagList.forEach(tag => {
      tag.groupList?.forEach(group => {
        if (selectedIdSet.has(group.groupId)) {
          groups.push({
            tagId: tag.tagId,
            tagName: tag.tagName,
            groupId: group.groupId,
            groupName: group.groupName,
          });
        }
      });
    });

    return groups;
  }
}


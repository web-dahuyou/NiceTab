import type { GroupItem, TagItem } from '~/entrypoints/types';

export type NewTabGroupRef = Pick<GroupItem, 'groupId' | 'groupName'> &
  Pick<TagItem, 'tagId' | 'tagName'>;

export default class NewTabUtils {
  storageKey: `local:${string}` = 'local:tabList';

  async getTagList(): Promise<TagItem[]> {
    return (await storage.getItem<TagItem[]>(this.storageKey)) || [];
  }
}

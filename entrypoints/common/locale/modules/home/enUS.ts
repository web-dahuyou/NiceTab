export default {
  'home.tag': 'Tag',
  'home.tabGroup': 'Tab Group',
  'home.tab': 'Tab',
  'home.stagingArea': 'Staging Area',
  'home.tabGroupList': 'Tab Group List',
  'home.expand': 'Expand the {name}',
  'home.collapse': 'Collapse the {name}',
  'home.expandAll': 'Expand',
  'home.collapseAll': 'Collapse',
  'home.addTag': 'Create Tag',
  'home.clearAll': 'Clear All',
  'home.recoverAll': 'Recover All',
  'home.emptyTip': 'No Data',
  'home.searchTagAndGroup': 'Search Tag/Group',
  'home.createTabGroup': 'Create Tab Group',
  'home.helpInfo': 'Help Info',
  'home.removeTitle': 'Remove Reminder',
  'home.removeDesc': 'Are you sure you want to remove the {type} ?',
  'home.clearTitle': 'Clear Reminder',
  'home.clearDesc': 'Are you sure you want to clear all the list ?',
  'home.dedupTitle': 'Dedup Reminder',
  'home.dedupDesc': 'Are you sure you want to perform deduplication ?',
  'home.recoverTitle': 'Recover Reminder',
  'home.recoverDesc': 'Are you sure you want to recover the {type} ?',
  'home.recoverAllDesc': 'Are you sure you want to recover All ?',

  'home.tag.remove': 'Remove',
  'home.tag.recover': 'Recover',

  'home.tabGroup.add': 'Create Tab Group',
  'home.tabGroup.remove': 'Remove',
  'home.tabGroup.restore': 'Restore',
  'home.tabGroup.lock': 'Lock',
  'home.tabGroup.unlock': 'Unlock',
  'home.tabGroup.star': 'Top',
  'home.tabGroup.unstar': 'Untop',
  'home.tabGroup.recover': 'Recover',
  'home.tabGroup.open': 'Open Group',

  'home.tabGroup.count': `{count, plural,
    =0 {No Groups}
    one {# Group}
    other {# Groups}
  }`,
  'home.tab.count': `{count, plural,
    =0 {No Tabs}
    one {# Tab}
    other {# Tabs}
  }`,
  'home.tab.name': 'Name',
  'home.tab.url': 'URL',

  'home.help.content.1': '1. The left side list displays the tags, and the secondary menus represent the tab groups. The list supports searching for both tags and tab groups. The right-side panel displays all the tab groups and the tabs within each tab group.',
  'home.help.content.2': '2、The Staging Area is a special category, fixed at the top of the list. When sending tabs, they will be saved to the Staging Area.',
  'home.help.content.3': '3. When a tab group is locked, the group and its tabs cannot be removed or moved out. However, tabs from other tab groups can be moved into the locked group. To remove a tab group, you need to first unlock it.',
  'home.help.content.4': '4. When a tab group is starred, it will be placed at the top of the current category. Moving other tab groups to a position before the starred tab group will automatically star them as well. If a starred tab group is moved to a position after a non-starred tab group, the star status will be automatically released.',
  'home.help.content.5': '5. When restoring a tab group, each of the tabs within the tab group will be opened in browser. If the "Automatically remove tabs from list when restoring" setting is enabled, the tabs will be removed from the list after they are opened.',
  'home.help.content.6': '6. The "Restore" action means opening the tabs in the browser, while the "Recover" action means recover the tags / tab groups / tabs from the "Recycle Bin" to the "List" home.',
  'home.help.content.7': '7. The "Ascending" and "Descending" only work for unstarred tab groups in the current category.',
  'home.help.content.8': '8. Tags / tab groups / tabs support drag-and-drop sorting. When a category/tab group is selected, it can be sorted using shortcut keys. The shortcut key mapping is shown in the table below:',

  'home.moveTo.missingTip': 'Please select a {type}',
  'home.moveTo.mergeLabel': 'Merge Duplicate Items ?',
  'home.moveTo.mergeTip.1': '1. If Checked, when moving tabs, the tabs will be de-duplicated with the same URL in the target group.',
  'home.moveTo.mergeTip.2': '2. If Checked, when moving a tab group, it will be merged to the group of the same name in the target category (tag).',
}
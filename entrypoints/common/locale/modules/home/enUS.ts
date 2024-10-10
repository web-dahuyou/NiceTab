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
  'home.searchTabAndUrl': 'Search tab and url',
  'home.moveAllGroupTo': 'Move All Group to ...',
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
  'home.copyLinks': 'Copy Links',

  'home.tag.remove': 'Remove',
  'home.tag.recover': 'Recover',
  'home.tag.countInfo': 'Current Counts',

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

  'home.help.content': `
    <li>The left-side list displays the tags, and the secondary menus represent the tab groups. The list supports searching for both tags and tab groups. The right-side panel displays all the tab groups and the tabs within each tab group.</li>
    <li>The tabs in the right-side panel support drag-and-drop sorting and cross-group movement. You can also drag the tabs from the right-side panel to the groups in the left-side list. Additionally, you can click the “Move To” button to move tab group and tabs.</li>
    <li>When a tab group is locked, the group and its tabs cannot be removed or moved out. However, tabs from other tab groups can be moved into the locked group. To remove a tab group, you need to first unlock it.</li>
    <li>When a tab group is starred, it will be placed at the top of the current category. Moving other tab groups to a position before the starred tab group will automatically star them as well. If a starred tab group is moved to a position after a non-starred tab group, the star status will be automatically released.</li>
    <li>The Staging Area is a special category, fixed at the top of the list. When sending tabs, they will be saved to the Staging Area.</li>
    <li>When opening a tab group, each of the tabs within the tab group will be opened in browser. If the "Automatically remove tabs from list when opening tabs or tab group" setting is enabled, the tabs will be removed from the list after they are opened.</li>
    <li>
      <strong>Left Click</strong>: this will open a new tab and jump to it.<br>
      <strong>Alt + Left Click</strong>：this will silently open a new tab and stay on the NiceTab page.
    </li>
    <li>The "Recover" action means recover the tags / tab groups / tabs from the "Recycle Bin" to the "List" home.</li>
    <li>The "Ascending" and "Descending" only work for unstarred tab groups in the current category.</li>
    <li><strong>Note</strong>: To ensure performance, when the number of tabs in the category exceeds a certain threshold, the right panel will enable virtual scrolling, displaying partial tab groups based on the scrolling position.</li>
    <li>Tags / tab groups / tabs support drag-and-drop sorting. When a category/tab group is selected, it can be sorted using shortcuts. The shortcuts are shown in the table below:</li>
  `,
  'home.help.hotkey.1': `The above shortcuts are only available for home page. In addition, the extension also registers browser shortcuts for several commonly used actions, (such as`,
  'home.help.hotkey.2': `); You can also go to the extension page by yourself and `,
  'home.help.hotkey.modify': `modify the shortcuts`,
  'home.help.hotkey.modifyTip': 'After modifying the shortcuts, they will take effect immediately. The shortcut key names in the ContextMenu will automatically update after switching browser tab.',

  'home.moveTo.missingTip': 'Please select a {type}',
  'home.moveTo.mergeLabel': 'Merge Duplicate Items ?',
  'home.moveTo.mergeTip.1': '1. If Checked, when moving tabs, the tabs will be de-duplicated with the same URL in the target group.',
  'home.moveTo.mergeTip.2': '2. If Checked, when moving a tab group, it will be merged to the group of the same name in the target category (tag).',
  'home.tip.tooManyTabs': 'The number of tabs exceeds the set value, the virtual scrolling is enabled.',
  'home.tip.addScope': 'The next version will add new features, which require additional authorization. After the new version is released, it will be automatically disabled. If you wish to continue using it, please manually enable it.',
}
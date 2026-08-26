import { LocaleKey } from './zhCN';

const ruRU: Record<LocaleKey, string> = {
  'settings.block.common': 'Общие',
  'settings.block.sendTabs': 'Отправка вкладок',
  'settings.block.openTabs': 'Открытие вкладок',
  'settings.block.pageTitleConfig': 'Заголовки страниц',
  'settings.block.globalSearch': 'Глобальный поиск',
  'settings.block.otherActions': 'Другие действия',
  'settings.block.display': 'Отображение',
  'settings.block.newtab': 'Новая вкладка',
  'settings.block.autoSync': 'Автосинхронизация',
  'settings.block.sync': 'Синхронизация',
  'settings.confirmTipContent':
    'Есть несохранённые изменения. Покинуть страницу?',
  'settings.language': 'Язык{mark}',
  'settings.themeType': 'Тема{mark}',
  'settings.openAdminTabAfterBrowserLaunch':
    'Открывать панель NiceTab при запуске браузера?',
  'settings.openAdminTabAfterBrowserLaunch.yes': 'Открывать автоматически (рекомендуется)',
  'settings.openAdminTabAfterBrowserLaunch.no': 'Не открывать',
  'settings.openAdminTabAfterWindowCreated':
    'Открывать панель NiceTab при создании нового окна?',
  'settings.openAdminTabAfterWindowCreated.yes': 'Открывать автоматически',
  'settings.openAdminTabAfterWindowCreated.no': 'Не открывать',
  'settings.autoPinAdminTab': 'Закреплять панель NiceTab?',
  'settings.autoPinAdminTab.yes': 'Закреплять автоматически (рекомендуется)',
  'settings.autoPinAdminTab.no': 'Не закреплять',
  'settings.restoreSnapshotAfterBrowserLaunch':
    'Восстанавливать ранее открытые вкладки при запуске браузера?',
  'settings.autoCreateSnapshotInterval':
    'Интервал автоматического создания снимка (минуты):',

  'settings.showSendTargetModal':
    'Показывать окно выбора папки при отправке вкладок?',
  'settings.showSendTargetModal.tooltip':
    'Если выбрано «Нет», вкладки сразу отправляются в буфер. На некоторых страницах окно выбора может не появиться даже при «Да».',
  'settings.allowSendPinnedTabs':
    'Отправлять закреплённые вкладки в NiceTab?',
  'settings.allowSendPinnedTabs.yes': 'Разрешить',
  'settings.allowSendPinnedTabs.no': 'Не отправлять (рекомендуется)',
  'settings.excludeDomainsForSending':
    'Не отправлять вкладки со следующих доменов:',
  'settings.excludeDomainsForSending.tooltip':
    'Несколько доменов можно разделить пробелами или переносами строк. Поддерживаются регулярные выражения.',
  'settings.excludeDomainsForSending.placeholder':
    'Несколько доменов можно разделить пробелами или переносами строк',
  'settings.openAdminTabAfterSendTabs':
    'Открывать панель NiceTab при отправке вкладок?',
  'settings.openAdminTabAfterSendTabs.yes': 'Открывать автоматически (рекомендуется)',
  'settings.openAdminTabAfterSendTabs.no': 'Не открывать',
  'settings.closeTabsAfterSendTabs':
    'Автоматически закрывать вкладки после отправки?',
  'settings.closeTabsAfterSendTabs.yes': 'Закрывать автоматически',
  'settings.closeTabsAfterSendTabs.no': 'Не закрывать',
  'settings.actionAutoCloseFlags':
    'Автоматически закрывать вкладки при выбранных действиях.',
  'settings.actionAutoCloseFlags.tooltip':
    'Действует, если «Автоматически закрывать вкладки после отправки» установлено в «Не закрывать».',
  'settings.createNewGroupOnSendSingleTab':
    'Создавать новую группу при отправке одной вкладки?',
  'settings.createNewGroupOnSendSingleTab.tooltip':
    'Если выбрано «Нет», вкладка будет отправлена в первую незакреплённую и незаблокированную группу в буфере.',
  'settings.allowDuplicateTabs':
    'Сохранять дубликаты вкладок при отправке?',
  'settings.allowDuplicateTabs.yes': 'Сохранять',
  'settings.allowDuplicateTabs.no':
    'Удалять дубликаты (для отправляемых вкладок и при объединении групп)',
  'settings.allowDuplicateGroups':
    'Сохранять дубликаты групп при отправке?',
  'settings.allowDuplicateGroups.yes': 'Сохранять',
  'settings.allowDuplicateGroups.no':
    'Объединять дубликаты групп (отправляемые группы с группами в буфере)',

  'settings.restoreInNewWindow': 'Открывать группу вкладок в новом окне?',
  'settings.deleteAfterRestore':
    'Удалять вкладки из списка NiceTab после открытия?',
  'settings.deleteAfterRestore.yes': 'Удалять (заблокированные вкладки остаются)',
  'settings.deleteAfterRestore.no': 'Оставлять в списке (рекомендуется)',
  'settings.discardWhenOpenTabs':
    'Автоматически усыплять вкладки при открытии нескольких?',
  'settings.silentOpenTabModifierKey':
    'Модификатор для открытия вкладки в фоне:',
  'settings.openTabModifierKey':
    'Модификатор для открытия вкладки на переднем плане:',
  'settings.openTabModifierKey.tooltip':
    'Открытие на переднем плане имеет приоритет. Если модификаторы совпадают, вкладка откроется на переднем плане.',
  'settings.openingTabsOrder': 'Порядок при открытии нескольких вкладок:',
  'settings.unnamedGroupRestoreAsGroup':
    'Восстанавливать безымянную группу как группу вкладок браузера?',
  'settings.namedGroupRestoreAsGroup':
    'Восстанавливать именованную группу как группу вкладок браузера?',

  'settings.pageTitleConfig': 'Подмена заголовка страницы:',
  'settings.pageTitleConfig.drawerTitle': 'Подмена заголовка страницы',

  'settings.globalSearchDeleteAfterOpen':
    'Удалять вкладки из списка NiceTab после открытия?',
  'settings.globalSearchDeleteAfterOpen.yes':
    'Удалять (заблокированные вкладки остаются)',
  'settings.globalSearchDeleteAfterOpen.no': 'Оставлять в списке (рекомендуется)',

  'settings.deleteUnlockedEmptyGroup':
    'Удалять пустые группы при очистке вкладок?',
  'settings.deleteUnlockedEmptyGroup.yes':
    'Удалять автоматически (заблокированные группы остаются)',
  'settings.deleteUnlockedEmptyGroup.no': 'Не удалять',
  'settings.confirmBeforeDeletingTabs': 'Подтверждать удаление вкладок?',
  'settings.confirmBeforeDeletingGroups': 'Подтверждать удаление групп вкладок?',
  'settings.linkTemplate': 'Шаблон копирования ссылок группы вкладок',
  'settings.linkTemplate.placeholder': 'Формат по умолчанию',
  'settings.linkTemplate.tooltip':
    'Шаблон для копирования ссылок в формате Mustache',
  'settings.tabCountThreshold': 'Порог числа вкладок в категории:',
  'settings.tabCountThreshold.tooltip':
    'Для производительности: если вкладок в категории больше порога, правая панель включит виртуальную прокрутку и будет показывать часть групп по позиции прокрутки.',
  'settings.groupInsertPosition':
    'Куда вставлять группы при переносе в целевую категорию:',
  'settings.groupInsertPosition.tooltip':
    '«Вверху» — группы вставляются в начало категории. «Внизу» — в конец.',
  'settings.tabInsertPosition':
    'Куда вставлять вкладки при переносе в целевую группу:',
  'settings.tabInsertPosition.tooltip':
    '«Вверху» — вкладки вставляются в начало группы. «Внизу» — в конец.',

  'settings.groupActionBtnStyle':
    'Стиль кнопок действий (для групп и вкладок):',
  'settings.groupActionBtnsCommonlyUsed':
    'Часто используемые кнопки действий группы:',
  'settings.groupActionBtnsCommonlyUsed.tooltip':
    'Выбранные кнопки отображаются снаружи, остальные свёрнуты в меню «Ещё».',
  'settings.showOpenedTabCount':
    'Показывать число открытых вкладок на значке расширения?',
  'settings.showPageContextMenus':
    'Показывать контекстное меню NiceTab на веб-страницах?',
  'settings.contextMenuConfig': 'Пункты контекстного меню:',
  'settings.contextMenuConfig.tooltip':
    'Выберите пункты и перетащите их для сортировки. Первые 5 отображаются снаружи, остальные свёрнуты в меню «Ещё».',
  'settings.popupModuleDisplays':
    'Модули, отображаемые в панели Popup',
  'settings.popupModuleDisplays.tooltip':
    'Если выбран хотя бы один модуль, при щелчке по значку откроется панель Popup. Иначе сразу отправится все вкладки.',
  'settings.autoExpandHomeTree':
    'Автоматически разворачивать дерево на главной?',
  'settings.newTabDisplay': 'Отображение новой вкладки:',
  'settings.newTabDisplay.tooltip':
    'Настройка страницы новой вкладки. «По умолчанию» вернёт стандартную страницу браузера.',
  'settings.newTabDisplay.homePage': 'Список NiceTab',
  'settings.newTabDisplay.niceNewtab': 'Новая вкладка NiceTab',
  'settings.newTabDisplay.default': 'По умолчанию (стандартная страница браузера)',
  'settings.pageWidthType': 'Ширина области содержимого:',
  'settings.pageWidthType.fixed': 'Фиксированная',
  'settings.pageWidthType.responsive': 'Адаптивная',
  'settings.showTabTitleTooltip':
    'Показывать подсказку при наведении на вкладку?',

  'settings.remoteSyncWithSettings':
    'Синхронизировать настройки вместе со списком вкладок?',
  'settings.autoSync': 'Включить автосинхронизацию?',
  'settings.autoSyncTimeUnit': 'Единица интервала автосинхронизации:',
  'settings.autoSyncTimeUnit.m': 'минуты',
  'settings.autoSyncTimeUnit.h': 'часы',
  'settings.autoSyncInterval': 'Интервал автосинхронизации ({unit}):',
  'settings.autoSyncTimeRanges': 'Периоды автосинхронизации:',
  'settings.autoSyncTimeRanges.addRange': 'Добавить период',
  'settings.autoSyncType': 'Тип автосинхронизации',
  'settings.autoSyncType.tooltip':
    'Объединяющая отправка не удаляет данные по diff: она объединяет удалённые и локальные данные и отправляет результат. Чтобы синхронизировать удаления, удалите элементы локально и вручную перезапишите удалённые данные.',
  'settings.syncType.autoPullMerge':
    'Автозагрузка (объединение): загрузить удалённые данные и объединить с локальными.',
  'settings.syncType.autoPullForce':
    'Автозагрузка (замена): заменить локальные данные.',
  'settings.syncType.autoPushMerge':
    'Автоотправка (объединение): объединить с локальными данными и отправить (рекомендуется).',
  'settings.syncType.autoPushForce':
    'Автоотправка (замена): заменить удалённые данные.',
  'settings.syncType.manualPullMerge':
    'Загрузить вручную (объединение): загрузить удалённые данные и объединить с локальными.',
  'settings.syncType.manualPullForce':
    'Загрузить вручную (замена): заменить локальные данные.',
  'settings.syncType.manualPushMerge':
    'Отправить вручную (объединение): объединить с локальными данными и отправить (рекомендуется).',
  'settings.syncType.manualPushForce':
    'Отправить вручную (замена): заменить удалённые данные.',
};

export default ruRU;

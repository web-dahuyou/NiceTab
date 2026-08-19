import { LocaleKey } from './zhCN';

const ruRU: Record<LocaleKey, string> = {
  'sync.settings': 'Настройки синхронизации',
  'sync.autoSync': 'Автосинхронизация',
  'sync.syncing': 'Синхронизация…',
  'sync.noAccessToken': 'Не задан access token',
  'sync.noGithubToken': 'Не задан GitHub access token',
  'sync.noGiteeToken': 'Не задан Gitee access token',
  'sync.syncType.auto': 'Автоматически',
  'sync.syncType.autoPullMerge': 'Автозагрузка (объединение)',
  'sync.syncType.autoPullForce': 'Автозагрузка (замена)',
  'sync.syncType.autoPushMerge': 'Автоотправка (объединение)',
  'sync.syncType.autoPushForce': 'Автоотправка (замена)',
  'sync.syncType.manualPullMerge': 'Загрузить вручную (объединение)',
  'sync.syncType.manualPullForce': 'Загрузить вручную (замена)',
  'sync.syncType.manualPushMerge': 'Отправить вручную (объединение)',
  'sync.syncType.manualPushForce': 'Отправить вручную (замена)',
  'sync.lastSyncTime': 'Последняя синхронизация',
  'sync.lastSyncType': 'Последний тип синхронизации',
  'sync.lastSyncResult': 'Последний результат',
  'sync.syncTime': 'Время синхронизации',
  'sync.syncType': 'Тип синхронизации',
  'sync.syncResult': 'Результат синхронизации',
  'sync.actionTip': 'Подтверждение действия',
  'sync.actionTip.manualPullForce':
    'Это действие заменит локальные данные. Продолжить?',
  'sync.actionTip.manualPushForce':
    'Это действие заменит удалённые данные. Продолжить?',
  'sync.tip.auto': 'Автосинхронизация путём объединения и отправки',
  'sync.tip.autoPullMerge':
    'Автоматически загружать удалённые данные и объединять с локальными.',
  'sync.tip.autoPullForce':
    'Автоматически загружать удалённые данные и заменять локальные.',
  'sync.tip.autoPushMerge':
    'Автоматически загружать удалённые данные, объединять с локальными и отправлять обратно.',
  'sync.tip.autoPushForce':
    'Автоматически отправлять локальные данные на удалённый сервер (с заменой).',
  'sync.tip.manualPullMerge': 'Загрузить удалённые данные и объединить с локальными.',
  'sync.tip.manualPullForce': 'Загрузить удалённые данные и заменить локальные.',
  'sync.tip.manualPushMerge':
    'Загрузить удалённые данные, объединить с локальными и отправить обратно.',
  'sync.tip.manualPushForce':
    'Отправить локальные данные на удалённый сервер (с заменой).',
  'sync.tip.resetStatus': 'Сброс статуса',
  'sync.tip.tokenChange':
    'Изменение access token очистит локальную историю синхронизации {type}',
  'sync.tip.syncHistory':
    'В истории синхронизации хранятся только последние 50 записей. Историю также можно очистить вручную.',
  'sync.tip.supportTip':
    'NiceTab синхронизирует список вкладок и настройки вместе. Раздельная синхронизация не поддерживается.',
  'sync.getYourToken': 'Получить или задать токен',
  'sync.syncHistory': 'История синхронизации',
  'sync.noSyncHistory': 'История синхронизации пуста',
  'sync.clearSyncHistory': 'Очистить историю синхронизации',
  'sync.removeDesc': 'Удалить этот элемент?',
  'sync.noWebdavConnectionUrl': 'Не задан URL WebDAV',
  'sync.pushToAllRemotes': 'Отправить во все удалённые хранилища (с заменой)',

  'sync.reason.contentTooLarge':
    'Удалённый файл слишком большой: gist API обрезал содержимое, объединение с локальными данными отменено',
  'sync.reason.authFailed': 'Ошибка авторизации',

  'sync.connectionName': 'Имя WebDAV',
  'sync.connectionUrl': 'URL WebDAV',
  'sync.username': 'Имя пользователя WebDAV',
  'sync.password': 'Пароль WebDAV',
  'sync.addConfig': 'Добавить конфигурацию',
  'sync.tip.connectionName': 'Имя для различения нескольких конфигураций WebDAV',
  'sync.tip.directory':
    'Каталог WebDAV, можно указать вложенные папки, например <strong>/dir/subdir</strong>',
  'sync.tip.filename':
    'Имя файла данных, можно использовать любое расширение, например <strong>nicetab-sync.txt</strong>',

  'sync.bakFilename': 'Имя файла резервной копии',
  'sync.tip.bakFilenameGists':
    'Имя файла удалённой резервной копии (может пригодиться)',
  'sync.bakDirectory': 'Каталог резервных копий',
  'sync.tip.bakDirectory':
    'Каталог удалённых резервных копий WebDAV. Можно указать вложенные папки, например <strong>/dir/subdir</strong>',
};

export default ruRU;

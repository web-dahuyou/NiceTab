import { LocaleKey } from './zhCN';

const ruRU: Record<LocaleKey, string> = {
  'importExport.import': 'Импорт',
  'importExport.export': 'Экспорт',
  'importExport.moduleTitle': `{action, select,
    import {Импорт}
    export {Экспорт}
    other {Импорт и экспорт}
  } вкладок`,
  'importExport.formatType': `Выберите формат {action, select,
    import {импорта}
    export {экспорта}
    other {''}
  }:`,
  'importExport.formatType.optionLabel': `{label}`,

  'importExport.importMode': 'Режим импорта:',
  'importExport.importMode.optionLabel': `{label, select,
    Append {Добавить}
    Overwrite {Заменить}
    Merge {Объединить}
    other {Добавить}
  }`,
  'importExport.importContent': 'Содержимое для импорта:',
  'importExport.importFromText': 'Импорт из текста',
  'importExport.importFromFile': 'Импорт из файла',
  'importExport.importFromHTML': 'Импорт из HTML',
  'importExport.importSuccess': 'Импорт выполнен',
  'importExport.importFailed': 'Ошибка импорта. Проверьте формат данных',

  'importExport.exportContent': 'Содержимое для экспорта:',
  'importExport.getContent': 'Сформировать содержимое',
  'importExport.copy': 'Копировать в буфер обмена',
  'importExport.exportToFile': 'Экспортировать в файл',
  'importExport.saveAsHtml': 'Сохранить как HTML',
  'importExport.CopySuccess': 'Скопировано',
  'importExport.CopyFailed': 'Не удалось скопировать',
  'importExport.settingsModuleTitle': 'Импорт и экспорт настроек',
};

export default ruRU;

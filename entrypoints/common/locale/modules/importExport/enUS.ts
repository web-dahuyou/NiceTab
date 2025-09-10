import { LocaleKey } from './zhCN';

const enUS: Record<LocaleKey, string> = {
  'importExport.import': 'Import',
  'importExport.export': 'Export',
  'importExport.moduleTitle': `{action, select,
    import {Import}
    export {Export}
    other {Import & Export}
  } Tabs`,
  'importExport.formatType': `Choose {action, select,
    import {Import}
    export {Export}
    other {''}
  } Format:`,
  'importExport.formatType.optionLabel': `{label}`,

  'importExport.importMode': 'Choose Import Mode:',
  'importExport.importMode.optionLabel': '{label}',
  'importExport.importContent': 'Content to Import:',
  'importExport.importFromText': 'Import from Text',
  'importExport.importFromFile': 'Import from File',
  'importExport.importFromHTML': 'Import from HTML',
  'importExport.importSuccess': 'Import Successful',
  'importExport.importFailed': 'Import Failed! Please check whether the format is correct',

  'importExport.exportContent': 'Content to Export:',
  'importExport.getContent': 'Get Content',
  'importExport.copy': 'Copy to Clipboard',
  'importExport.exportToFile': 'Export to Local File',
  'importExport.saveAsHtml': 'Save as HTML',
  'importExport.CopySuccess': 'Copy Successful',
  'importExport.CopyFailed': 'Copy Failed',
  'importExport.settingsModuleTitle': `Import/Export Settings`,
};

export default enUS;

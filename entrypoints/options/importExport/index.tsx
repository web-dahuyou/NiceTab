import { useCallback, useState } from 'react';
import { Form, Button, Radio, Input, Divider, Space, Upload, message } from 'antd';
import type { UploadProps, RadioChangeEvent } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils, settingsUtils } from '~/entrypoints/common/storage';
import {
  extContentFormatCheck,
  extContentImporter,
  extContentExporter,
  sendRuntimeMessage,
} from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import { initialValues, formatTypeOptions, importModeOptions } from './constants';

const StyledWrapper = styled.div`
  .module-title {
    margin-top: 24px;
    margin-bottom: 12px;
    font-size: 20px;
    font-weight: bold;
  }
`;

export default function ImportExport() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { $fmt } = useIntlUtls();
  const NiceGlobalContext = useContext(GlobalContext);
  const [exportContent, setExportContent] = useState('');
  const [formatType, setFormatType] = useState(1);
  const [importMode, setImportMode] = useState('append');
  const [exportFormatType, setExportFormatType] = useState(1);
  const [importLoading, setImportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [settingsImportLoading, setSettingsImportLoading] = useState(false);
  const [settingsDownloadLoading, setSettingsDownloadLoading] = useState(false);

  const importFileExtname = useMemo(() => {
    const option =
      formatTypeOptions.find((option) => option.type === formatType) ||
      formatTypeOptions[0];
    return option.extname;
  }, [formatType]);
  // 导入操作
  const handleImport = async (value?: string) => {
    const importContent = value || form.getFieldValue('importContent');
    setImportLoading(true);
    setTimeout(async () => {
      // 防止导入的内容与所选的格式不匹配，先自动识别格式
      const funcName = extContentFormatCheck(importContent) || 'niceTab';
      try {
        const tagList = extContentImporter?.[funcName]?.(importContent);
        await tabListUtils.importTags(tagList, importMode);

        messageApi.success(
          $fmt({ id: 'common.actionSuccess', values: { action: $fmt('common.import') } })
        );
        form.setFieldValue('importContent', '');
      } catch {
        messageApi.error($fmt('importExport.importFailed'));
      }
      setImportLoading(false);
    }, 500);
  };
  // 选择文件导入
  const handleSelectFile: UploadProps['beforeUpload'] = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      handleImport(content);
    };
    reader.readAsText(file);
    return false;
  };

  const onExportFormatTypeChange = (e: RadioChangeEvent) => {
    setExportFormatType(e.target.value);
  };

  // 获取导出文本内容
  const getExportContent = useCallback(async () => {
    const formatType = exportFormatType || 1;
    const exportTagList = await tabListUtils.exportTags();
    const formatOption = formatTypeOptions.find((option) => option.type === formatType);
    const funcName = formatOption?.funcName || 'niceTab';
    try {
      const content = extContentExporter?.[funcName]?.(exportTagList);
      setExportContent(content);
      return content;
    } catch (err) {
      console.error(err);
      return '';
    }
  }, [exportFormatType]);

  // 导出文件
  const handleDownload = useCallback(async () => {
    setDownloadLoading(true);
    setTimeout(async () => {
      const now = dayjs().format('YYYY-MM-DD_HHmmss');
      const { label, extname, fileType } =
        formatTypeOptions.find((item) => item.type == exportFormatType) ||
        formatTypeOptions[0];
      const fileName = `export_${label}_${now}.${extname}`;
      const content = await getExportContent();
      saveAs(new Blob([content], { type: `${fileType};charset=utf-8` }), fileName);
      setDownloadLoading(false);
    }, 500);
  }, [exportFormatType]);

  // 选择设置文件导入
  const handleSelectSettingsFile: UploadProps['beforeUpload'] = (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      setSettingsImportLoading(true);
      const content = reader.result as string;
      try {
        const settings = JSON.parse(content);
        await settingsUtils.setSettings(settings);
        NiceGlobalContext.setSettings(settings);
        sendRuntimeMessage({ msgType: 'setLocale', data: { locale: settings.language } });
        reloadOtherAdminPage();
        messageApi.success(
          $fmt({ id: 'common.actionSuccess', values: { action: $fmt('common.import') } })
        );
      } catch (err) {
        console.error(err);
      }
      setSettingsImportLoading(false);
    };
    reader.readAsText(file);
    return false;
  };

  // 导出设置文件
  const handleSettingsDownload = useCallback(async () => {
    setSettingsDownloadLoading(true);
    setTimeout(async () => {
      const now = dayjs().format('YYYY-MM-DD_HHmmss');
      const fileName = `export_nice-tab_settings_${now}.json`;
      const settings = await settingsUtils.getSettings();
      const content = JSON.stringify(settings);
      saveAs(new Blob([content], { type: `application/json;charset=utf-8` }), fileName);
      setSettingsDownloadLoading(false);
    }, 100);
  }, [exportFormatType]);

  return (
    <>
      {contextHolder}
      <StyledWrapper>
        {/* 标签导入 */}
        <Divider>
          {$fmt({ id: 'importExport.moduleTitle', values: { action: 'import' } })}
        </Divider>
        <Form
          form={form}
          name="imports"
          layout="vertical"
          initialValues={initialValues}
          autoComplete="off"
        >
          <Form.Item
            label={$fmt({ id: 'importExport.formatType', values: { action: 'import' } })}
            name="formatType"
          >
            <Radio.Group onChange={(e) => setFormatType(e.target.value)}>
              {formatTypeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {$fmt({
                    id: 'importExport.formatType.optionLabel',
                    values: { label: item.label },
                  })}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label={$fmt('importExport.importMode')} name="importMode">
            <Radio.Group onChange={(e) => setImportMode(e.target.value)}>
              {importModeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {$fmt({
                    id: 'importExport.importMode.optionLabel',
                    values: { label: item.label },
                  })}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label={$fmt('importExport.importContent')} name="importContent">
            <Input.TextArea autoSize={{ minRows: 8, maxRows: 16 }} />
          </Form.Item>
          <Form.Item>
            <Space size={12} align="center">
              <Button
                type="primary"
                loading={importLoading}
                onClick={() => handleImport()}
              >
                {$fmt('importExport.importFromText')}
              </Button>
              <Upload
                accept={`.${importFileExtname}`}
                showUploadList={false}
                beforeUpload={handleSelectFile}
              >
                <Button type="primary" loading={importLoading}>
                  {$fmt('importExport.importFromFile')}
                </Button>
              </Upload>
            </Space>
          </Form.Item>
        </Form>

        {/* 标签导出模块 */}
        <Divider>
          {$fmt({ id: 'importExport.moduleTitle', values: { action: 'export' } })}
        </Divider>
        <Form name="exports" layout="vertical" autoComplete="off">
          <Form.Item
            label={$fmt({ id: 'importExport.formatType', values: { action: 'export' } })}
          >
            <Radio.Group value={exportFormatType} onChange={onExportFormatTypeChange}>
              {formatTypeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {item.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Space size={12} align="center">
              <Button type="primary" loading={downloadLoading} onClick={handleDownload}>
                {$fmt('importExport.exportToFile')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </StyledWrapper>

      {/* 偏好设置导入模块 */}
      <Divider>{$fmt('importExport.settingsModuleTitle')}</Divider>
      <Form name="settingsImports" layout="vertical" autoComplete="off">
        <Form.Item>
          <Space size={12} align="center">
            <Upload
              accept={'.json'}
              showUploadList={false}
              beforeUpload={handleSelectSettingsFile}
            >
              <Button type="primary" loading={settingsImportLoading}>
                {$fmt('importExport.importFromFile')}
              </Button>
            </Upload>
            <Button
              type="primary"
              loading={settingsDownloadLoading}
              onClick={handleSettingsDownload}
            >
              {$fmt('importExport.exportToFile')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}

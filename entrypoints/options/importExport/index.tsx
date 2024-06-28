import React, { useCallback, useEffect, useState } from 'react';
import { Form, Button, Radio, Input, Divider, Space, Upload, message } from 'antd';
import type { FormProps, UploadProps } from 'antd';
import styled from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '~/entrypoints/common/storage';
import { initialValues, formatTypeOptions, importModeOptions } from './constants';
import { extContentImporter, extContentExporter } from './utils';


const StyledWrapper = styled.div`
  .module-title {
    margin-top: 24px;
    margin-bottom: 12px;
    font-size: 20px;
    font-weight: bold;
  }
`;

type CustomImportProps = {
  formatType: number | string;
  importContent: string;
};

export default function ImportExport() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { $fmt } = useIntlUtls();
  const [exportContent, setExportContent] = useState('');
  const [formatType, setFormatType] = useState(1);
  const [importMode, setImportMode] = useState('append');
  const [exportFormatType, setExportFormatType] = useState(1);

  // 导入操作
  const handleImport: FormProps<CustomImportProps>['onFinish'] = async (values) => {
    const { formatType, importContent } = values;
    const formatOption = formatTypeOptions.find(option => option.type === formatType);
    const funcName = formatOption?.funcName || 'niceTab';
    try {
      const tagList = extContentImporter?.[funcName]?.(importContent);
      await tabListUtils.importTags(tagList, importMode);
      getExportContent();
      messageApi.success($fmt('importExport.importSuccess'));
      form.setFieldValue('importContent', '');
    } catch {
      messageApi.error($fmt('importExport.importFailed'));
    }
  };
  // 选择文件导入
  const handleSelectFile: UploadProps['beforeUpload'] = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      handleImport({ formatType: 1, importContent: content });
    }
    reader.readAsText(file);
    return false;
  }
  // 获取导出文本内容
  const getExportContent = useCallback(async () => {
    const formatType = exportFormatType || 1;
    const exportTagList = await tabListUtils.exportTags();
    const formatOption = formatTypeOptions.find(option => option.type === formatType);
    const funcName = formatOption?.funcName || 'niceTab';
    try {
      const content = extContentExporter?.[funcName]?.(exportTagList);
      setExportContent(content);
    } catch (err) {
      console.error(err);
    };
  }, [exportFormatType]);
  // 复制到剪切板
  const handleCopy = (text: string, result: boolean) => {
    if (result) {
      messageApi.success($fmt('importExport.CopySuccess'));
    } else {
      messageApi.error($fmt('importExport.CopyFailed'));
    }
  }
  // 导出文件
  const handleDownload = useCallback(() => {
    const now = dayjs().format('YYYY-MM-DD_HHmmss');
    const ext = exportFormatType == 1 ? 'json' : 'txt';
    const fileType = exportFormatType == 1 ? 'application/json' : 'text/plain';
    const fileName = `export_${exportFormatType == 1 ? 'nice-tab' : 'one-tab'}_${now}.${ext}`;
    saveAs(new Blob([exportContent], { type: `${fileType};charset=utf-8` }), fileName);
  }, [exportFormatType, exportContent]);

  useEffect(() => {
    getExportContent();
  }, [exportFormatType]);

  useEffect(() => {
    getExportContent();
  }, []);

  return (
    <>
      {contextHolder}
      <StyledWrapper>
        <Divider>{$fmt({ id: 'importExport.moduleTitle', values: {action: 'import'}})}</Divider>
        <Form
          form={form}
          name="imports"
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleImport}
          autoComplete="off"
        >
          <Form.Item label={$fmt({ id: 'importExport.formatType', values: {action: 'import'}})} name="formatType">
            <Radio.Group onChange={(e) => setFormatType(e.target.value) }>
              {formatTypeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {$fmt({ id: 'importExport.formatType.optionLabel', values: {label: item.label}})}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label={$fmt('importExport.importMode')} name="importMode">
            <Radio.Group onChange={(e) => setImportMode(e.target.value) }>
              {importModeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {$fmt({ id: 'importExport.importMode.optionLabel', values: {label: item.label}})}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label={$fmt('importExport.importContent')} name="importContent">
            <Input.TextArea
              autoSize={{ minRows: 8, maxRows: 16 }}
            />
          </Form.Item>
          <Form.Item>
            <Space size={12} align="center">
              <Button type="primary" htmlType="submit">
                {$fmt('importExport.importFromText')}
              </Button>
              { +formatType === 1 && (
                <Upload accept=".json" showUploadList={false} beforeUpload={handleSelectFile}>
                  <Button type="primary"> {$fmt('importExport.importFromFile')} </Button>
                </Upload>
              ) }
            </Space>
          </Form.Item>
        </Form>

        {/* 导出模块 */}
        <Divider>{$fmt({ id: 'importExport.moduleTitle', values: {action: 'export'}})}</Divider>
        <Form
          name="exports"
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item label={$fmt({ id: 'importExport.formatType', values: {action: 'export'}})}>
            <Radio.Group value={exportFormatType} onChange={(e) => setExportFormatType(e.target.value) }>
              {formatTypeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {item.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label={$fmt('importExport.exportContent')}>
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              value={exportContent}
              style={{ color: '#999' }}
            />
          </Form.Item>
          <Form.Item>
            <Space size={12} align="center">
              <CopyToClipboard text={exportContent} onCopy={handleCopy}>
                <Button type="primary">{$fmt('importExport.copy')}</Button>
              </CopyToClipboard>
              <Button type="primary" onClick={handleDownload}>{$fmt('importExport.exportToFile')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </StyledWrapper>
    </>
  );
}

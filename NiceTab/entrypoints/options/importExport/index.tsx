import React, { useCallback, useEffect, useState } from 'react';
import { Form, Button, Radio, Input, Divider, Space, Upload, message } from 'antd';
import type { FormProps, UploadProps } from 'antd';
import styled from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { TabItem } from '~/entrypoints/types';
import { tabListUtils } from '~/entrypoints/common/storage';
import { initialValues, formatTypeOptions } from './constants';
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
  const [exportContent, setExportContent] = useState('');
  const [formatType, setFormatType] = useState(1);
  const [exportFormatType, setExportFormatType] = useState(1);

  // 导入操作
  const handleImport: FormProps<CustomImportProps>['onFinish'] = async (values) => {
    const { formatType, importContent } = values;
    const formatOption = formatTypeOptions.find(option => option.type === formatType);
    const funcName = formatOption?.funcName || 'niceTab';
    try {
      const tagList = extContentImporter?.[funcName]?.(importContent);
      await tabListUtils.importTags(tagList);
      getExportContent();
      messageApi.success('导入成功');
      form.setFieldValue('importContent', '');
    } catch {
      messageApi.error('导入失败，请检查格式是否正确');
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
      messageApi.success('复制成功');
    } else {
      messageApi.error('复制失败');
    }
  }
  // 导出NiceTab文件
  const handleDownload = (content: string) => {
    const now = dayjs().format('YYYY-MM-DD_HH:mm:ss');
    saveAs(new Blob([content], { type: 'application/json;charset=utf-8' }), `nice-tab-export_${now}.json`);
  }

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
        <Divider>标签导入</Divider>
        <Form
          form={form}
          name="imports"
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleImport}
          autoComplete="off"
        >
          <Form.Item label="选择导入格式：" name="formatType">
            <Radio.Group onChange={(e) => setFormatType(e.target.value) }>
              {formatTypeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {item.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label="填写导入内容：" name="importContent">
            <Input.TextArea
              autoSize={{ minRows: 8, maxRows: 16 }}
            />
          </Form.Item>
          <Form.Item>
            <Space size={12} align="center">
              <Button type="primary" htmlType="submit">
                从文本导入
              </Button>
              { +formatType === 1 && (
                <Upload accept=".json" showUploadList={false} beforeUpload={handleSelectFile}>
                  <Button type="primary"> 从文件导入 </Button>
                </Upload>
              ) }
            </Space>
          </Form.Item>
        </Form>

        {/* 导出模块 */}
        <Divider>标签导出</Divider>
        <Form
          name="exports"
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item label="选择导出格式：">
            <Radio.Group value={exportFormatType} onChange={(e) => setExportFormatType(e.target.value) }>
              {formatTypeOptions.map((item) => (
                <Radio value={item.type} key={item.type}>
                  {item.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label="导出内容：">
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              value={exportContent}
              style={{ color: '#999' }}
            />
          </Form.Item>
          <Form.Item>
            <Space size={12} align="center">
              <CopyToClipboard value={exportContent} onCopy={handleCopy}>
                <Button type="primary">复制到剪贴板</Button>
              </CopyToClipboard>
              <Button type="primary" onClick={() => handleDownload(exportContent)}>导出到本地</Button>
            </Space>
          </Form.Item>
        </Form>
      </StyledWrapper>
    </>
  );
}

import { useCallback, useState } from 'react';
import { Form, Button, Radio, Input, Divider, Space, Upload, message } from 'antd';
import type { FormProps, UploadProps, RadioChangeEvent } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
import { saveAs } from 'file-saver';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '~/entrypoints/common/storage';
import { extContentImporter, extContentExporter } from '~/entrypoints/common/utils';
import { initialValues, formatTypeOptions, importModeOptions } from './constants';

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
  const [importLoading, setImportLoading] = useState(false);
  // const [exportLoading, setExportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 导入操作
  const handleImport: FormProps<CustomImportProps>['onFinish'] = async (values) => {
    setImportLoading(true);
    setTimeout(async () => {
      const { formatType, importContent } = values;
      const formatOption = formatTypeOptions.find((option) => option.type === formatType);
      const funcName = formatOption?.funcName || 'niceTab';
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
      handleImport({ formatType, importContent: content });
    };
    reader.readAsText(file);
    return false;
  };

  const onExportFormatTypeChange = (e: RadioChangeEvent) => {
    setExportFormatType(e.target.value);
  };
  // const handlePreview = async () => {
  //   setExportLoading(true);
  //   setTimeout(async () => {
  //     await getExportContent();
  //     setExportLoading(false);
  //   }, 500);
  // };
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
  // 复制到剪切板
  const handleCopy = (text: string, result: boolean) => {
    if (result) {
      messageApi.success($fmt('importExport.CopySuccess'));
    } else {
      messageApi.error($fmt('importExport.CopyFailed'));
    }
  };
  // 导出文件
  const handleDownload = useCallback(async () => {
    setDownloadLoading(true);
    setTimeout(async () => {
      const now = dayjs().format('YYYY-MM-DD_HHmmss');
      const ext = exportFormatType == 1 ? 'json' : 'txt';
      const fileType = exportFormatType == 1 ? 'application/json' : 'text/plain';
      const fileName = `export_${
        exportFormatType == 1 ? 'nice-tab' : 'one-tab'
      }_${now}.${ext}`;
      const content = exportContent || (await getExportContent());
      saveAs(new Blob([content], { type: `${fileType};charset=utf-8` }), fileName);
      setDownloadLoading(false);
    }, 500);
  }, [exportFormatType]);

  // useEffect(() => {
  //   setTimeout(() => {
  //     getExportContent();
  //   }, 300);
  // }, [exportFormatType]);

  return (
    <>
      {contextHolder}
      <StyledWrapper>
        <Divider>
          {$fmt({ id: 'importExport.moduleTitle', values: { action: 'import' } })}
        </Divider>
        <Form
          form={form}
          name="imports"
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleImport}
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
              <Button type="primary" htmlType="submit" loading={importLoading}>
                {$fmt('importExport.importFromText')}
              </Button>
              <Upload
                accept={formatType === 1 ? '.json' : '.txt'}
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

        {/* 导出模块 */}
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
          {/* <Form.Item label={$fmt('importExport.exportContent')}>
            <Input.TextArea
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              value={exportContent}
              style={{ color: '#999' }}
            />
          </Form.Item> */}
          <Form.Item>
            <Space size={12} align="center">
              {/* <Button type="primary" loading={exportLoading} onClick={handlePreview}>
                {$fmt('importExport.getContent')}
              </Button>
              {exportContent && (
                <CopyToClipboard text={exportContent} onCopy={handleCopy}>
                  <Button type="primary">{$fmt('importExport.copy')}</Button>
                </CopyToClipboard>
              )} */}
              <Button type="primary" loading={downloadLoading} onClick={handleDownload}>
                {$fmt('importExport.exportToFile')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </StyledWrapper>
    </>
  );
}

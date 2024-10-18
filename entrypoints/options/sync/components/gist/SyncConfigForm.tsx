import { useEffect } from 'react';
import { Form, Button } from 'antd';
import type { FormProps } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SyncConfigProps } from '~/entrypoints/types';
import { syncUtils } from '~/entrypoints/common/storage';

import SyncConfigFormItem from './SyncConfigFormItem';

type SyncConfigFormProps = {
  syncConfig?: SyncConfigProps;
  onChange?: (data: SyncConfigProps) => void;
};

export default function SyncConfigFormGist({ onChange }: SyncConfigFormProps) {
  const { $fmt } = useIntlUtls();
  const [form] = Form.useForm();

  const onFinish: FormProps<SyncConfigProps>['onFinish'] = async (values) => {
    console.log('Save Success:', values);
    const newConfig = { ...syncUtils.initialConfig, ...values };

    onChange?.(newConfig);
    syncUtils.setConfig(values);
  };

  useEffect(() => {
    syncUtils.getConfig().then((config) => {
      console.log('sync config:', config);
      form?.setFieldsValue(config);
    });
  }, []);

  return (
    <>
      <Form
        form={form}
        name="sync-config-form"
        initialValues={syncUtils.initialConfig}
        autoComplete="off"
        onFinish={onFinish}
      >
        <SyncConfigFormItem form={form} type="github"></SyncConfigFormItem>
        <SyncConfigFormItem form={form} type="gitee"></SyncConfigFormItem>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {$fmt('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

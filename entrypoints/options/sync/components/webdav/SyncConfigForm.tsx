import { useEffect } from 'react';
import { Form, Button } from 'antd';
import type { FormProps } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SyncConfigWebDAVProps } from '~/entrypoints/types';
import { syncWebDAVUtils } from '~/entrypoints/common/storage';

import SyncConfigFormItems from './SyncConfigFormItems';

type SyncConfigFormProps = {
  syncConfig?: SyncConfigWebDAVProps;
  onChange?: (data: SyncConfigWebDAVProps) => void;
};

export default function SyncConfigForm({ onChange }: SyncConfigFormProps) {
  const { $fmt } = useIntlUtls();
  const [form] = Form.useForm();

  const onFinish: FormProps<SyncConfigWebDAVProps>['onFinish'] = async (values) => {
    console.log('Save Success:', values);
    const newConfig = { ...syncWebDAVUtils.initialConfig, ...values };

    onChange?.(newConfig);
    syncWebDAVUtils.setConfig(values);
  };

  useEffect(() => {
    syncWebDAVUtils.getConfig().then((config) => {
      form?.setFieldsValue(config);
    });
  }, []);

  return (
    <>
      <Form
        form={form}
        name="sync-config-form"
        initialValues={syncWebDAVUtils.initialConfig}
        autoComplete="off"
        onFinish={onFinish}
      >
        <SyncConfigFormItems form={form} key="infini-cloud"></SyncConfigFormItems>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {$fmt('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

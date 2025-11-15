import { useEffect } from 'react';
import { Form, Button } from 'antd';
import type { FormProps } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type {
  SyncConfigWebDAVProps,
  SyncConfigItemWebDAVProps,
} from '~/entrypoints/types';
import { syncWebDAVUtils } from '~/entrypoints/common/storage';
import { omit } from '~/entrypoints/common/utils';

import SyncConfigFormItems from './SyncConfigFormItems';

type SyncConfigFormProps = {
  syncConfig?: SyncConfigWebDAVProps;
  onChange?: (data: SyncConfigWebDAVProps) => void;
};

function formatConfigItem(item: SyncConfigItemWebDAVProps) {
  const keys: Array<keyof SyncConfigItemWebDAVProps> = [
    'webdavConnectionUrl',
    'username',
    'password',
    'directory',
    'filename_tabList',
    'filename_settings',
  ];

  return keys.reduce((result, key) => {
    result[key] = item[key]?.trim?.() || '';
    return result;
  }, item);
}

export default function SyncConfigForm({ onChange }: SyncConfigFormProps) {
  const { $fmt } = useIntlUtls();
  const [form] = Form.useForm();

  const onFinish: FormProps<SyncConfigWebDAVProps>['onFinish'] = async values => {
    const oldConfigListMap = syncWebDAVUtils?.config?.configList?.reduce<
      Record<string, SyncConfigItemWebDAVProps>
    >((result, item) => {
      result[item.key] = item;
      return result;
    }, {});

    let newConfigList = values?.configList?.map(item => {
      const newItem = {
        ...syncWebDAVUtils.createConfigItem(),
        ...(item.key ? item : omit(item, ['key'])),
      };
      return formatConfigItem({
        ...oldConfigListMap[newItem.key],
        ...newItem,
      });
    });

    const newConfig = {
      ...syncWebDAVUtils.initialConfig,
      ...values,
      configList: newConfigList,
    };

    await syncWebDAVUtils.setConfig(newConfig);
    onChange?.(newConfig);
    console.log('Save Success:', newConfig);
  };

  useEffect(() => {
    syncWebDAVUtils.getConfig().then(config => {
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

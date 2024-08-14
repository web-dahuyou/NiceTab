import { useRef, useEffect } from 'react';
import type { ReactElement } from 'react';
import { message, Typography, Divider, Form, Input, Switch, Button } from 'antd';
import { LinkOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { InputRef, FormProps } from 'antd';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SyncConfigProps } from '~/entrypoints/types';
import { syncUtils } from '~/entrypoints/common/storage';
import { tokenSettingsPageUrls } from './constants';

type SyncConfigFormProps = {
  syncConfig?: SyncConfigProps;
  onChange?: (data: SyncConfigProps) => void;
};

const StyledLink = styled.div`
  margin-bottom: 12px;
`;

export default function SyncConfigForm({ onChange }: SyncConfigFormProps) {
  const { $fmt } = useIntlUtls();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const giteeTokenInputRef = useRef<InputRef>(null);
  const githubTokenInputRef = useRef<InputRef>(null);

  const getFormTooltipOption = ({
    title,
    icon,
  }: {
    title: string;
    icon?: ReactElement;
  }) => ({
    title: <Typography.Text>{title}</Typography.Text>,
    icon: icon || <InfoCircleOutlined />,
    color: '#fff',
  });

  const onFinish: FormProps<SyncConfigProps>['onFinish'] = async (values) => {
    console.log('Save Success:', values);
    const newConfig = { ...syncUtils.initialConfig, ...values };

    onChange?.(newConfig);
    syncUtils.setConfig(values);
    messageApi.success($fmt('common.saveSuccess'));
  };

  useEffect(() => {
    syncUtils.getConfig().then((config) => {
      form?.setFieldsValue(config);
    });
  }, []);

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        name="sync-config-form"
        initialValues={syncUtils.initialConfig}
        autoComplete="off"
        onFinish={onFinish}
      >
        <Divider className="divider" orientation="center">
          Github {$fmt('common.config')}
        </Divider>
        <StyledLink>
          <Typography.Link href={tokenSettingsPageUrls.github} target="_blank">
            <LinkOutlined /> {$fmt('sync.getYourToken')}
          </Typography.Link>
        </StyledLink>
        <Form.Item<SyncConfigProps>
          label="Access Token"
          name={['github', 'accessToken']}
          tooltip={getFormTooltipOption({
            title: $fmt({ id: 'sync.tip.tokenChange', values: { type: 'github' } }),
          })}
        >
          <Input
            ref={githubTokenInputRef}
            onChange={(e) =>
              form?.setFieldValue(['github', 'accessToken'], e.target.value?.trim())
            }
          />
        </Form.Item>
        <Form.Item<SyncConfigProps>
          label={$fmt('sync.autoSync')}
          name={['github', 'autoSync']}
          tooltip={getFormTooltipOption({ title: $fmt('common.comingSoon') })}
        >
          <Switch disabled />
        </Form.Item>

        <Divider className="divider" orientation="center" style={{ marginTop: '30px' }}>
          Gitee {$fmt('common.config')}
        </Divider>
        <StyledLink>
          <Typography.Link href={tokenSettingsPageUrls.gitee} target="_blank">
            <LinkOutlined /> {$fmt('sync.getYourToken')}
          </Typography.Link>
        </StyledLink>
        <Form.Item<SyncConfigProps>
          label="Access Token"
          name={['gitee', 'accessToken']}
          tooltip={getFormTooltipOption({
            title: $fmt({ id: 'sync.tip.tokenChange', values: { type: 'gitee' } }),
          })}
        >
          <Input
            ref={giteeTokenInputRef}
            onChange={(e) =>
              form?.setFieldValue(['gitee', 'accessToken'], e.target.value?.trim())
            }
          />
        </Form.Item>
        <Form.Item<SyncConfigProps>
          label={$fmt('sync.autoSync')}
          name={['gitee', 'autoSync']}
          tooltip={getFormTooltipOption({ title: $fmt('common.comingSoon') })}
        >
          <Switch disabled />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {$fmt('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

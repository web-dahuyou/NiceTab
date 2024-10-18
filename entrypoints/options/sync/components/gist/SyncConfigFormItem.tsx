import { useRef } from 'react';
import type { ReactElement } from 'react';
import { theme, Flex, Typography, Divider, Form, Input } from 'antd';
import { LinkOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { InputRef, FormInstance } from 'antd';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SyncConfigProps, SyncRemoteType } from '~/entrypoints/types';
import { tokenSettingsPageUrls } from '../../constants';

type SyncConfigFormItemProps = {
  form: FormInstance<SyncConfigProps>;
  type: SyncRemoteType;
};

const StyledLink = styled.div`
  margin-bottom: 12px;
`;

const itemMap = {
  gitee: {
    title: 'Gitee',
  },
  github: {
    title: 'Github',
  },
};

export default function SyncConfigFormItem({ form, type }: SyncConfigFormItemProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const tokenInputRef = useRef<InputRef>(null);

  const getFormTooltipOption = ({
    title,
    icon,
  }: {
    title: string;
    icon?: ReactElement;
  }) => ({
    title: <Typography.Text>{title}</Typography.Text>,
    icon: icon || <InfoCircleOutlined />,
    color: token.colorBgContainer,
  });

  return (
    <>
      <Flex vertical>
        <Divider className="divider" orientation="center">
          {itemMap?.[type]?.title} {$fmt('common.config')}
        </Divider>
        <StyledLink>
          <Typography.Link href={tokenSettingsPageUrls[type]} target="_blank">
            <LinkOutlined /> {$fmt('sync.getYourToken')}
          </Typography.Link>
        </StyledLink>
        <Form.Item<SyncConfigProps>
          label="Access Token"
          name={[type, 'accessToken']}
          tooltip={getFormTooltipOption({
            title: $fmt({ id: 'sync.tip.tokenChange', values: { type } }),
          })}
        >
          <Input
            ref={tokenInputRef}
            onChange={(e) =>
              form?.setFieldValue([type, 'accessToken'], e.target.value?.trim())
            }
          />
        </Form.Item>
        {/* <Form.Item<SyncConfigProps>
          label={$fmt('sync.autoSync')}
          name={[type, 'autoSync']}
          tooltip={getFormTooltipOption({ title: $fmt('common.comingSoon') })}
        >
          <Switch disabled />
        </Form.Item> */}
      </Flex>
    </>
  );
}

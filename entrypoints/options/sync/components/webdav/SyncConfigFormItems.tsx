import type { ReactElement } from 'react';
import { theme, Flex, Typography, Form, Input, Button, Modal } from 'antd';
import { InfoCircleOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import type { SyncConfigWebDAVProps } from '~/entrypoints/types';

type SyncConfigFormItemProps = {
  form: FormInstance<SyncConfigWebDAVProps>;
};

const StyledConfigItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  .config-item-form-box {
    flex: 1;
    padding: 12px 8px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colorBorder};
  }
  .config-item-action-box {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    margin-left: 12px;
  }
`;

export default function SyncConfigFormItem({ form }: SyncConfigFormItemProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [modal, contextHolder] = Modal.useModal();

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
      {contextHolder}
      <Flex vertical>
        <Form.List name="configList">
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field) => (
                <StyledConfigItem key={field.key}>
                  <div className="config-item-form-box">
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Form.Item
                        name={[field.name, 'label']}
                        label={$fmt('sync.connectionName')}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: $fmt({
                              id: 'common.pleaseInput',
                              values: { label: $fmt('sync.connectionName') },
                            }),
                          },
                        ]}
                        tooltip={getFormTooltipOption({
                          title: $fmt('sync.tip.connectionName'),
                        })}
                      >
                        <Input placeholder={$fmt('sync.connectionName')} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'webdavConnectionUrl']}
                        label={$fmt('sync.connectionUrl')}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: $fmt({
                              id: 'common.pleaseInput',
                              values: { label: $fmt('sync.connectionUrl') },
                            }),
                          },
                        ]}
                      >
                        <Input placeholder={$fmt('sync.connectionUrl')} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'username']}
                        label={$fmt('sync.username')}
                      >
                        <Input placeholder={$fmt('sync.username')} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'password']}
                        label={$fmt('sync.password')}
                      >
                        <Input type="password" placeholder={$fmt('sync.password')} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'key']} hidden>
                        <Input />
                      </Form.Item>
                    </Form.Item>
                  </div>
                  <div className="config-item-action-box">
                    <StyledActionIconBtn
                      className="dynamic-delete-button"
                      title={$fmt('common.delete')}
                      $size={18}
                      $hoverColor={ENUM_COLORS.red}
                      onClick={() => {
                        const item = form?.getFieldValue('configList')?.[field.name];
                        if (!item.label && !item.webdavConnectionUrl) {
                          remove(field.name);
                        } else {
                          modal.confirm({
                            title: $fmt('home.removeTitle'),
                            content: $fmt('sync.removeDesc'),
                            onOk: () => remove(field.name),
                          });
                        }
                      }}
                    >
                      <MinusCircleOutlined />
                    </StyledActionIconBtn>
                  </div>
                </StyledConfigItem>
              ))}
              <Form.Item>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                  {$fmt('sync.addConfig')}
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>
      </Flex>
    </>
  );
}

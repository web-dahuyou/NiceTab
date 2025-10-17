import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { FormInstance, FormProps } from 'antd';
import { Form, Button, Drawer, Space, Input } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { ENUM_SETTINGS_PROPS, ENUM_COLORS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SettingsProps, PageTitleConfigItem } from '~/entrypoints/types';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import DrawerTitle from '~/entrypoints/options/components/DrawerTitle';

const { PAGE_TITLE_CONFIG } = ENUM_SETTINGS_PROPS;

type Props = {
  form: FormInstance<SettingsProps>;
  value?: PageTitleConfigItem[];
  onChange?: (v: PageTitleConfigItem[]) => void;
};

type InnerFormProps = {
  configList: PageTitleConfigItem[];
};

const StyledConfigItem = styled.div`
  position: relative;
  width: 100%;
  display: flex;

  .config-item-form-box {
    flex: 1;
    display: flex;
    align-items: center;
    .config-item-url {
      flex: 1;
    }
    .config-item-title {
      flex: 0 0 240px;
      margin-left: 12px;
    }
  }
  .config-item-action-box {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    margin-left: 12px;
    margin-top: 6px;
  }
`;

export default function PageTitleConfig({ form, onChange }: Props) {
  const { $fmt, locale } = useIntlUtls();
  const [innerForm] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

  const pageTitleConfig = Form.useWatch(PAGE_TITLE_CONFIG, form) || [];
  const innerFormValue = useMemo(() => {
    const configList =
      pageTitleConfig && pageTitleConfig.length > 0
        ? pageTitleConfig
        : [{ url: '', title: '' }];

    return { configList };
  }, [pageTitleConfig]);

  const onFinish: FormProps<InnerFormProps>['onFinish'] = async values => {
    onChange?.(values.configList);
    form.setFieldsValue({
      [PAGE_TITLE_CONFIG]: values.configList,
    });
    setDrawerVisible(false);
  };

  return (
    <div>
      <Space size={24}>
        <Button size="middle" onClick={() => setDrawerVisible(true)}>
          {$fmt('common.edit')}
        </Button>
        <div style={{ color: ENUM_COLORS.volcano }}>
          {$fmt({
            id: 'common.itemCount',
            values: { count: pageTitleConfig.length || 0 },
          })}
        </div>
      </Space>
      <Drawer
        title={
          <DrawerTitle title={$fmt(`settings.pageTitleConfig.drawerTitle`)}>
            <Button type="primary" htmlType="submit" onClick={() => innerForm.submit()}>
              {$fmt('common.confirm')}
            </Button>
          </DrawerTitle>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={800}
      >
        <Form
          form={innerForm}
          name="page-title-form"
          initialValues={innerFormValue}
          autoComplete="off"
          onFinish={onFinish}
        >
          <Form.List name="configList">
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(field => (
                  <StyledConfigItem key={field.key}>
                    <div className="config-item-form-box">
                      <Form.Item
                        className="config-item-url"
                        name={[field.name, 'url']}
                        label={$fmt('common.url')}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: $fmt({
                              id: 'common.pleaseInput',
                              values: { label: $fmt('common.url') },
                            }),
                          },
                        ]}
                      >
                        <Input placeholder={$fmt('common.url')} />
                      </Form.Item>
                      <Form.Item
                        className="config-item-title"
                        name={[field.name, 'title']}
                        label={$fmt('common.title')}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: $fmt({
                              id: 'common.pleaseInput',
                              values: { label: $fmt('common.title') },
                            }),
                          },
                        ]}
                      >
                        <Input placeholder={$fmt('common.title')} />
                      </Form.Item>
                    </div>

                    <div className="config-item-action-box">
                      <StyledActionIconBtn
                        className="dynamic-delete-button"
                        title={$fmt('common.delete')}
                        $size={18}
                        $hoverColor={ENUM_COLORS.red}
                        onClick={() => {
                          remove(field.name);
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

          {/* <Form.Item>
            <Button type="primary" htmlType="submit">
              {$fmt('common.confirm')}
            </Button>
          </Form.Item> */}
        </Form>
      </Drawer>
    </div>
  );
}

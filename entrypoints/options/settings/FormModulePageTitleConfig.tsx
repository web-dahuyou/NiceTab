import styled from 'styled-components';
import { Form, Button, Select, Input } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { ENUM_SETTINGS_PROPS, ENUM_COLORS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SettingsProps } from '~/entrypoints/types';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';

const { PAGE_TITLE_CONFIG } = ENUM_SETTINGS_PROPS;

const StyledConfigItem = styled.div`
  display: flex;

  .config-item-form-box {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    .config-item-select {
      flex: 0 0 130px;
    }
    .config-item-url {
      flex: 2;
    }
    .config-item-title {
      flex: 1;
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

export default function FormModulePageTitleConfig(
  props: FormItemProps & { form: FormInstance<SettingsProps> },
) {
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;

  const options = useMemo(() => {
    return [
      {
        label: $fmt('common.equal'),
        value: 'equal',
      },
      {
        label: $fmt('common.startsWith'),
        value: 'startsWith',
      },
      {
        label: $fmt('common.endsWith'),
        value: 'endsWith',
      },
      {
        label: $fmt('common.contains'),
        value: 'contains',
      },
      {
        label: $fmt('common.regex'),
        value: 'regex',
      },
    ];
  }, [$fmt]);

  return (
    <Form.Item noStyle {...formItemProps}>
      <Form.List name={PAGE_TITLE_CONFIG}>
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(field => (
              <StyledConfigItem key={field.key}>
                <div className="config-item-form-box">
                  <Form.Item
                    className="config-item-select"
                    name={[field.name, 'mode']}
                    initialValue="equal"
                    layout="horizontal"
                  >
                    <Select options={options} placeholder={$fmt('common.matchMode')} />
                  </Form.Item>
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
                    layout="horizontal"
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
                    layout="horizontal"
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
    </Form.Item>
  );
}

import { Space, Form, Input, InputNumber, Radio, Typography, theme } from 'antd';
import type { FormItemProps } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import QuickActions from './QuickActions';

const {
  DELETE_UNLOCKED_EMPTY_GROUP,
  CONFIRM_BEFORE_DELETING_TABS,
  LINK_TEMPLATE,
  TAB_COUNT_THRESHOLD,
} = ENUM_SETTINGS_PROPS;

const defaultTemplate = String.raw`{{url}} | {{title}}`;

export default function FormModule(formItemProps: FormItemProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  const [form] = Form.useForm();

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 是否删除未锁定的空标签组 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${DELETE_UNLOCKED_EMPTY_GROUP}`,
          values: { mark: '：' },
        })}
        name={DELETE_UNLOCKED_EMPTY_GROUP}
        {...formItemProps}
      >
        <Radio.Group>
          <Radio value={true}>
            {$fmt(`settings.${DELETE_UNLOCKED_EMPTY_GROUP}.yes`)}
          </Radio>
          <Radio value={false}>
            {$fmt(`settings.${DELETE_UNLOCKED_EMPTY_GROUP}.no`)}
          </Radio>
        </Radio.Group>
      </Form.Item>
      {/* 删除标签页前是否需要确认 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${CONFIRM_BEFORE_DELETING_TABS}`,
          values: { mark: '：' },
        })}
        name={CONFIRM_BEFORE_DELETING_TABS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 单个分类中标签页数量超过预定值则开启虚拟滚动 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${TAB_COUNT_THRESHOLD}`,
          values: { mark: '：' },
        })}
        name={TAB_COUNT_THRESHOLD}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${TAB_COUNT_THRESHOLD}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <InputNumber
          min={100}
          max={800}
          step={10}
          keyboard={true}
          style={{ width: '300px' }}
        />
      </Form.Item>

      {/* 复制链接的格式 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${LINK_TEMPLATE}`)}
        // name={LINK_TEMPLATE} // 注意在嵌套的Form.item中设置了name, 这里不要设置name
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>{$fmt(`settings.${LINK_TEMPLATE}.tooltip`)}</Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Space wrap>
          <Form.Item<SettingsProps> name={LINK_TEMPLATE} noStyle>
            <Input
              style={{ width: '300px' }}
              placeholder={`${$fmt(
                `settings.${LINK_TEMPLATE}.placeholder`
              )}: ${defaultTemplate}`}
            />
          </Form.Item>
          <QuickActions
            onChange={(val) => {
              console.log('val', val);
              form.setFieldValue(LINK_TEMPLATE, val);
            }}
          ></QuickActions>
        </Space>
      </Form.Item>
    </Form.Item>
  );
}

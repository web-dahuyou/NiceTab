import { Space, Form, Input, InputNumber, Radio, Typography, theme } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import QuickActions from './QuickActions';

const {
  DELETE_UNLOCKED_EMPTY_GROUP,
  CONFIRM_BEFORE_DELETING_TABS,
  LINK_TEMPLATE,
  TAB_COUNT_THRESHOLD,
  GROUP_INSERT_POSITION,
  TAB_INSERT_POSITION,
} = ENUM_SETTINGS_PROPS;

const defaultTemplate = String.raw`{{url}} | {{title}}`;

export default function FormModuleOtherActions(
  props: FormItemProps & { form: FormInstance<SettingsProps> }
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;

  const onQuickActionChange = useCallback(
    (val: string) => {
      // console.log('val', val);
      form.setFieldsValue({ [LINK_TEMPLATE]: val });
    },
    [form]
  );

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
      {/* <Form.Item<SettingsProps>
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
      </Form.Item> */}

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
          <QuickActions onChange={onQuickActionChange}></QuickActions>
        </Space>
      </Form.Item>

      {/* 标签组插入位置 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${GROUP_INSERT_POSITION}`)}
        name={GROUP_INSERT_POSITION}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${GROUP_INSERT_POSITION}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Radio.Group>
          <Radio value="top">{$fmt('common.top')}</Radio>
          <Radio value="bottom">{$fmt('common.bottom')}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 标签页插入位置 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${TAB_INSERT_POSITION}`)}
        name={TAB_INSERT_POSITION}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${TAB_INSERT_POSITION}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Radio.Group>
          <Radio value="top">{$fmt('common.top')}</Radio>
          <Radio value="bottom">{$fmt('common.bottom')}</Radio>
        </Radio.Group>
      </Form.Item>
    </Form.Item>
  );
}

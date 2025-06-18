import { useMemo } from 'react';
import { Form, Input, Checkbox, Radio, Typography, theme } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import { type LocaleKeys } from '~/entrypoints/common/locale';
import type { SettingsProps } from '~/entrypoints/types';
import {
  SEND_TAB_ACTION_NAMES,
  ENUM_SETTINGS_PROPS,
} from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

const {
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  ACTION_AUTO_CLOSE_FLAGS,
  SHOW_SEND_TARGET_MODAL,
  ALLOW_SEND_PINNED_TABS,
  EXCLUDE_DOMAINS_FOR_SENDING,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
} = ENUM_SETTINGS_PROPS;

export default function FormModuleSend(
  props: FormItemProps & { form: FormInstance<SettingsProps> }
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;

  // 发送标签页自动关闭标签页的操作选项
  const actionAutoCloseFlagOptions = useMemo(() => {
    return SEND_TAB_ACTION_NAMES.map((actionName) => {
      return {
        label: $fmt({ id: `common.${actionName}` as LocaleKeys }),
        value: actionName,
      };
    });
  }, [$fmt]);

  const closeTabsAfterSendTabs = Form.useWatch(CLOSE_TABS_AFTER_SEND_TABS, form);

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 是否展示目录选择弹窗 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SHOW_SEND_TARGET_MODAL}`)}
        name={SHOW_SEND_TARGET_MODAL}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${SHOW_SEND_TARGET_MODAL}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
        {...formItemProps}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt(`common.no`)}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 是否发送固定标签页 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${ALLOW_SEND_PINNED_TABS}`,
          values: { mark: '：' },
        })}
        name={ALLOW_SEND_PINNED_TABS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`settings.${ALLOW_SEND_PINNED_TABS}.yes`)}</Radio>
          <Radio value={false}>{$fmt(`settings.${ALLOW_SEND_PINNED_TABS}.no`)}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 排除的域名 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${EXCLUDE_DOMAINS_FOR_SENDING}`,
          values: { mark: '：' },
        })}
        name={EXCLUDE_DOMAINS_FOR_SENDING}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${EXCLUDE_DOMAINS_FOR_SENDING}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Input.TextArea
          style={{ width: '500px' }}
          autoSize={{ minRows: 3, maxRows: 8 }}
          placeholder={$fmt(`settings.${EXCLUDE_DOMAINS_FOR_SENDING}.placeholder`)}
        />
      </Form.Item>
      {/* 发送标签页后是否打开管理后台 */}
      <Form.Item<SettingsProps>
        label={
          <div>
            {$fmt({
              id: `settings.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}`,
              values: { mark: '：' },
            })}
          </div>
        }
        name={OPEN_ADMIN_TAB_AFTER_SEND_TABS}
      >
        <Radio.Group>
          <Radio value={true}>
            {$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}.yes`)}
          </Radio>
          <Radio value={false}>
            {$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}.no`)}
          </Radio>
        </Radio.Group>
      </Form.Item>
      {/* 发送标签页后是否关闭标签页 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${CLOSE_TABS_AFTER_SEND_TABS}`,
          values: { mark: '：' },
        })}
        name={CLOSE_TABS_AFTER_SEND_TABS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`settings.${CLOSE_TABS_AFTER_SEND_TABS}.yes`)}</Radio>
          <Radio value={false}>{$fmt(`settings.${CLOSE_TABS_AFTER_SEND_TABS}.no`)}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 发送标签页各种操作单独控制, 当 `发送标签页后是否关闭标签页` 设置为保留标签页时生效 */}
      <Form.Item
        label={$fmt(`settings.${ACTION_AUTO_CLOSE_FLAGS}`)}
        name={ACTION_AUTO_CLOSE_FLAGS}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${ACTION_AUTO_CLOSE_FLAGS}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Checkbox.Group
          options={actionAutoCloseFlagOptions}
          disabled={closeTabsAfterSendTabs}
        ></Checkbox.Group>
      </Form.Item>
      {/* 发送标签页时-是否允许重复的标签组 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${ALLOW_DUPLICATE_GROUPS}`,
          values: { mark: '：' },
        })}
        name={ALLOW_DUPLICATE_GROUPS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`settings.${ALLOW_DUPLICATE_GROUPS}.yes`)}</Radio>
          <Radio value={false}>{$fmt(`settings.${ALLOW_DUPLICATE_GROUPS}.no`)}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 发送标签页时-是否允许重复的标签页 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${ALLOW_DUPLICATE_TABS}`,
          values: { mark: '：' },
        })}
        name={ALLOW_DUPLICATE_TABS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`settings.${ALLOW_DUPLICATE_TABS}.yes`)}</Radio>
          <Radio value={false}>{$fmt(`settings.${ALLOW_DUPLICATE_TABS}.no`)}</Radio>
        </Radio.Group>
      </Form.Item>
    </Form.Item>
  );
}

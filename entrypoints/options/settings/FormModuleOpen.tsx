import { Form, Radio, Typography, theme } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getKeysByOS } from '~/entrypoints/common/utils';
import usePermission from '~/entrypoints/common/hooks/getPermission';
import useTooltipOption from '@/entrypoints/common/hooks/tooltipOption';

const {
  RESTORE_IN_NEW_WINDOW,
  DELETE_AFTER_RESTORE,
  SILENT_OPEN_TAB_MODIFIER_KEY,
  OPEN_TAB_MODIFIER_KEY,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
  DISCARD_WHEN_OPEN_TABS,
  OPENING_TABS_ORDER,
} = ENUM_SETTINGS_PROPS;

const modifierKeyLabels = getKeysByOS();

export default function FormModuleOpen(
  props: FormItemProps & { form: FormInstance<SettingsProps> },
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;
  const { isFirefoxTabGroupSupported, hasTabGroupsPermission } = usePermission();
  const { getFormTooltipOption } = useTooltipOption();

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 是否在新窗口打开标签组 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${RESTORE_IN_NEW_WINDOW}`,
          values: { mark: '：' },
        })}
        name={RESTORE_IN_NEW_WINDOW}
        {...formItemProps}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 打开标签页/标签组时是否从列表中删除 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${DELETE_AFTER_RESTORE}`,
          values: { mark: '：' },
        })}
        name={DELETE_AFTER_RESTORE}
      >
        <Radio.Group>
          <Radio value={false}>{$fmt(`settings.${DELETE_AFTER_RESTORE}.no`)}</Radio>
          <Radio value={true}>{$fmt(`settings.${DELETE_AFTER_RESTORE}.yes`)}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 是否以休眠方式打开标签页 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${DISCARD_WHEN_OPEN_TABS}`,
          values: { mark: '：' },
        })}
        name={DISCARD_WHEN_OPEN_TABS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`common.yes`)}</Radio>
          <Radio value={false}>{$fmt(`common.no`)}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 静默打开标签页修饰键 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SILENT_OPEN_TAB_MODIFIER_KEY}`)}
        name={SILENT_OPEN_TAB_MODIFIER_KEY}
      >
        <Radio.Group>
          <Radio value="alt">{modifierKeyLabels.alt.symbol}</Radio>
          <Radio value="cmdOrCtrl">{modifierKeyLabels.cmd.symbol}</Radio>
          <Radio value="shift">{modifierKeyLabels.shift.symbol}</Radio>
          <Radio value="">{$fmt('common.none')}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 激活打开标签页修饰键 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${OPEN_TAB_MODIFIER_KEY}`)}
        name={OPEN_TAB_MODIFIER_KEY}
        tooltip={getFormTooltipOption({
          title: $fmt(`settings.${OPEN_TAB_MODIFIER_KEY}.tooltip`),
        })}
      >
        <Radio.Group>
          <Radio value="alt">{modifierKeyLabels.alt.symbol}</Radio>
          <Radio value="cmdOrCtrl">{modifierKeyLabels.cmd.symbol}</Radio>
          <Radio value="shift">{modifierKeyLabels.shift.symbol}</Radio>
          <Radio value="">{$fmt('common.none')}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 批量打开标签页的顺序 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${OPENING_TABS_ORDER}`)}
        name={OPENING_TABS_ORDER}
      >
        <Radio.Group>
          <Radio value="default">{$fmt(`common.default`)}</Radio>
          <Radio value="reverse">{$fmt(`common.reverse`)}</Radio>
        </Radio.Group>
      </Form.Item>
      {(!import.meta.env.FIREFOX ||
        (isFirefoxTabGroupSupported && hasTabGroupsPermission)) && (
        <>
          {/* 是否以标签组形式恢复未命名标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt(`settings.${UNNAMED_GROUP_RESTORE_AS_GROUP}`)}
            name={UNNAMED_GROUP_RESTORE_AS_GROUP}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>
          {/* 是否以标签组形式恢复已命名标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt(`settings.${NAMED_GROUP_RESTORE_AS_GROUP}`)}
            name={NAMED_GROUP_RESTORE_AS_GROUP}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>
        </>
      )}
    </Form.Item>
  );
}

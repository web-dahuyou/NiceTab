import { Form, Radio, Typography, theme } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getKeysByOS } from '~/entrypoints/common/utils';

const {
  RESTORE_IN_NEW_WINDOW,
  DELETE_AFTER_RESTORE,
  SILENT_OPEN_TAB_MODIFIER_KEY,
  OPEN_TAB_MODIFIER_KEY,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
} = ENUM_SETTINGS_PROPS;

const modifierKeyLabels = getKeysByOS();

export default function FormModule() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  return (
    <>
      {/* 是否在新窗口打开标签组 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${RESTORE_IN_NEW_WINDOW}`,
          values: { mark: '：' },
        })}
        name={RESTORE_IN_NEW_WINDOW}
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
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${OPEN_TAB_MODIFIER_KEY}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Radio.Group>
          <Radio value="alt">{modifierKeyLabels.alt.symbol}</Radio>
          <Radio value="cmdOrCtrl">{modifierKeyLabels.cmd.symbol}</Radio>
          <Radio value="shift">{modifierKeyLabels.shift.symbol}</Radio>
          <Radio value="">{$fmt('common.none')}</Radio>
        </Radio.Group>
      </Form.Item>
      {!import.meta.env.FIREFOX && (
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
    </>
  );
}

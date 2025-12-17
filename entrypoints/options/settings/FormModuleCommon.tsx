import { Form, Radio, Slider } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

const {
  LANGUAGE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED,
  AUTO_PIN_ADMIN_TAB,
  RESTORE_SNAPSHOT_AFTER_BROWSER_LAUNCH,
  AUTO_CREATE_SNAPSHOT_INTERVAL,
} = ENUM_SETTINGS_PROPS;

export default function FormModuleCommon(
  props: FormItemProps & { form: FormInstance<SettingsProps> },
) {
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;

  return (
    <Form.Item noStyle {...formItemProps}>
      <Form.Item<SettingsProps>
        label={$fmt({ id: `settings.${LANGUAGE}`, values: { mark: '：' } })}
        name={LANGUAGE}
      >
        <Radio.Group>
          <Radio value="zh-CN"> 中文简体 </Radio>
          <Radio value="en-US"> English </Radio>
        </Radio.Group>
      </Form.Item>

      {/* 启动浏览器时是否自动打开NiceTab管理后台 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}`)}
        name={OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}
      >
        <Radio.Group>
          <Radio value={true}>
            {$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}.yes`)}
          </Radio>
          <Radio value={false}>
            {$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}.no`)}
          </Radio>
        </Radio.Group>
      </Form.Item>

      {/* 新开窗口时是否自动打开NiceTab管理后台 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED}`)}
        name={OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED}
      >
        <Radio.Group>
          <Radio value={true}>
            {$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED}.yes`)}
          </Radio>
          <Radio value={false}>
            {$fmt(`settings.${OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED}.no`)}
          </Radio>
        </Radio.Group>
      </Form.Item>

      {/* 是否固定管理后台 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${AUTO_PIN_ADMIN_TAB}`,
          values: { mark: '：' },
        })}
        name={AUTO_PIN_ADMIN_TAB}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`settings.${AUTO_PIN_ADMIN_TAB}.yes`)}</Radio>
          <Radio value={false}>{$fmt(`settings.${AUTO_PIN_ADMIN_TAB}.no`)}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 启动浏览器时是否自动恢复自动保存的快照 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${RESTORE_SNAPSHOT_AFTER_BROWSER_LAUNCH}`)}
        name={RESTORE_SNAPSHOT_AFTER_BROWSER_LAUNCH}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt(`common.yes`)}</Radio>
          <Radio value={false}>{$fmt(`common.no`)}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 自动保存快照间隔时间 */}
      {/* <Form.Item<SettingsProps>
        label={$fmt(`settings.${AUTO_CREATE_SNAPSHOT_INTERVAL}`)}
      >
        <Form.Item<SettingsProps> name={AUTO_CREATE_SNAPSHOT_INTERVAL}>
          <Slider
            min={0.5}
            max={120}
            step={1}
            tooltip={{
              open: true,
              placement: 'bottom',
              autoAdjustOverflow: false,
            }}
          />
        </Form.Item>
      </Form.Item> */}
    </Form.Item>
  );
}

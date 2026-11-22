import { Form, InputNumber, Radio, Slider } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import {
  ENUM_SETTINGS_PROPS,
  scheduledSnapshotIntervalRange,
  scheduledSnapshotLimitRange,
} from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import useTooltipOption from '~/entrypoints/common/hooks/tooltipOption';

const {
  RESTORE_SNAPSHOT_AFTER_BROWSER_LAUNCH,
  SCHEDULED_SNAPSHOTS_ENABLED,
  SCHEDULED_SNAPSHOT_INTERVAL,
  SCHEDULED_SNAPSHOT_LIMIT,
} = ENUM_SETTINGS_PROPS;

export default function FormModuleSnapshot(
  props: FormItemProps & { form: FormInstance<SettingsProps>; savedLimit?: number },
) {
  const { $fmt } = useIntlUtls();
  const { getFormTooltipOption } = useTooltipOption();
  const { form, savedLimit, ...formItemProps } = props;
  const enabled = Form.useWatch(SCHEDULED_SNAPSHOTS_ENABLED, form);

  const restoreEmptyLimit = () => {
    if (form.getFieldValue(SCHEDULED_SNAPSHOT_LIMIT) == null) {
      form.setFieldValue(SCHEDULED_SNAPSHOT_LIMIT, savedLimit);
    }
  };

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 启动浏览器时是否恢复快照 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${RESTORE_SNAPSHOT_AFTER_BROWSER_LAUNCH}`)}
        name={RESTORE_SNAPSHOT_AFTER_BROWSER_LAUNCH}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 启用定时快照 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SCHEDULED_SNAPSHOTS_ENABLED}`)}
        name={SCHEDULED_SNAPSHOTS_ENABLED}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 定时快照采集间隔（分钟） */}
      <Form.Item<SettingsProps> label={$fmt(`settings.${SCHEDULED_SNAPSHOT_INTERVAL}`)}>
        <Form.Item<SettingsProps> name={SCHEDULED_SNAPSHOT_INTERVAL}>
          <Slider
            {...scheduledSnapshotIntervalRange}
            tooltip={{
              open: !props.hidden,
              placement: 'bottom',
              autoAdjustOverflow: false,
            }}
            disabled={!enabled}
          />
        </Form.Item>
      </Form.Item>
      {/* 所有窗口合计保留的定时快照数量 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SCHEDULED_SNAPSHOT_LIMIT}`)}
        name={SCHEDULED_SNAPSHOT_LIMIT}
        tooltip={getFormTooltipOption({
          title: $fmt('settings.scheduledSnapshotLimit.tooltip'),
        })}
      >
        <InputNumber
          {...scheduledSnapshotLimitRange}
          precision={0}
          changeOnBlur
          onBlur={restoreEmptyLimit}
          disabled={!enabled || browser.extension.inIncognitoContext}
        />
      </Form.Item>
    </Form.Item>
  );
}

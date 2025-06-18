import { Space, Form, Radio, Typography, Slider, theme } from 'antd';
import type { FormItemProps, RadioChangeEvent, FormInstance } from 'antd';
import type { AutoSyncTimeUnits, SettingsProps } from '~/entrypoints/types';
import type { LocaleKeys } from '~/entrypoints/common/locale';
import {
  ENUM_SETTINGS_PROPS,
  defaultAutoSyncRelation,
} from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { settingsUtils } from '~/entrypoints/common/storage';
import { useSyncType } from '../sync/hooks/syncType';

const { AUTO_SYNC, AUTO_SYNC_INTERVAL, AUTO_SYNC_TIME_UNIT, AUTO_SYNC_TYPE } =
  ENUM_SETTINGS_PROPS;

export default function FormModuleSync(
  props: FormItemProps & { form: FormInstance<SettingsProps> }
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  const { form, ...formItemProps } = props;
  const { autoSyncTimeUnitOptions, autoSyncTypeOptions } = useSyncType();

  const autoSync = Form.useWatch(AUTO_SYNC, form);
  const timeUnit = Form.useWatch(AUTO_SYNC_TIME_UNIT, form);

  const [minuteValue, setMinuteValue] = useState<number>(defaultAutoSyncRelation.m);
  const [hourValue, setHourValue] = useState<number>(defaultAutoSyncRelation.h);

  const getTimeUnitOption = useCallback(
    (timeUnit: AutoSyncTimeUnits) => {
      const option =
        autoSyncTimeUnitOptions.find((option) => option.type === timeUnit) ||
        autoSyncTimeUnitOptions[0];
      return option || {};
    },
    [autoSyncTimeUnitOptions]
  );

  const timeUnitOption = useMemo(() => {
    return getTimeUnitOption(timeUnit || 'm');
  }, [autoSyncTimeUnitOptions, timeUnit]);

  const handleTimeUnitChange = useCallback(
    (e: RadioChangeEvent) => {
      const timeUnit = e.target.value;
      const option = getTimeUnitOption(timeUnit);
      let interval = form.getFieldValue(AUTO_SYNC_INTERVAL);

      if (timeUnit === 'm') {
        interval = minuteValue;
        if (interval < option.min) interval = option.min;
        if (interval > option.max) interval = option.max;
        setMinuteValue(interval);
      } else if (timeUnit === 'h') {
        interval = hourValue;
        if (interval < option.min) interval = option.min;
        if (interval > option.max) interval = option.max;
        setHourValue(interval);
      }

      form.setFieldsValue({
        [AUTO_SYNC_INTERVAL]: interval,
      });
    },
    [form, minuteValue, hourValue]
  );

  const handleIntervalChange = useCallback(
    (val: number) => {
      const autoSyncTimeUnit = form.getFieldValue?.(AUTO_SYNC_TIME_UNIT);
      if (autoSyncTimeUnit === 'm') {
        setMinuteValue(val);
      } else {
        setHourValue(val);
      }
    },
    [form, minuteValue, hourValue]
  );

  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      const { autoSyncTimeUnit, autoSyncInterval } = settings || {};

      if (autoSyncTimeUnit === 'm') {
        setMinuteValue(autoSyncInterval || defaultAutoSyncRelation.m);
      } else if (autoSyncTimeUnit === 'h') {
        setHourValue(autoSyncInterval || defaultAutoSyncRelation.h);
      }
    });
  }, []);

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 是否开启自动同步 */}
      <Form.Item<SettingsProps> label={$fmt(`settings.${AUTO_SYNC}`)} name={AUTO_SYNC}>
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
      {/* 同步基础步长 */}
      <Form.Item<SettingsProps>
        name={AUTO_SYNC_TIME_UNIT}
        label={$fmt(`settings.${AUTO_SYNC_TIME_UNIT}`)}
      >
        <Radio.Group disabled={!autoSync} onChange={handleTimeUnitChange}>
          {autoSyncTimeUnitOptions.map((item) => (
            <Radio key={item.type} value={item.type}>
              {item.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
      {/* 自动同步间隔时间 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${AUTO_SYNC_INTERVAL}`,
          values: {
            unit: $fmt(`common.${timeUnitOption.unit}` as LocaleKeys),
          },
        })}
      >
        {/* 嵌套一下没有别的意思，只是为了给slider的tooltip留出点空间 */}
        <Form.Item<SettingsProps> name={AUTO_SYNC_INTERVAL}>
          <Slider
            min={timeUnitOption.min}
            max={timeUnitOption.max}
            step={timeUnitOption.step}
            tooltip={{
              open: true,
              placement: 'bottom',
              autoAdjustOverflow: false,
            }}
            disabled={!autoSync}
            onChange={handleIntervalChange}
          />
        </Form.Item>
      </Form.Item>
      {/* 自动同步方式 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${AUTO_SYNC_TYPE}`)}
        name={AUTO_SYNC_TYPE}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${AUTO_SYNC_TYPE}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Radio.Group disabled={!autoSync}>
          <Space direction="vertical">
            {autoSyncTypeOptions.map((item) => (
              <Radio key={item.type} value={item.type}>
                {item.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Form.Item>
    </Form.Item>
  );
}

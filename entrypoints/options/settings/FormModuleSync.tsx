import { Space, Form, Radio, Button, Typography, TimePicker, Slider, theme } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { FormItemProps, RadioChangeEvent, FormInstance } from 'antd';
import type { AutoSyncTimeUnits, SettingsProps, TimeRange } from '~/entrypoints/types';
import type { LocaleKeys } from '~/entrypoints/common/locale';
import {
  ENUM_SETTINGS_PROPS,
  defaultAutoSyncRelation,
} from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { settingsUtils } from '~/entrypoints/common/storage';
import useTooltipOption from '@/entrypoints/common/hooks/tooltipOption';
import { useSyncType } from '../sync/hooks/syncType';

const {
  REMOTE_SYNC_WITH_SETTINGS,
  AUTO_SYNC,
  AUTO_SYNC_INTERVAL,
  AUTO_SYNC_TIME_UNIT,
  AUTO_SYNC_TIME_RANGES,
  AUTO_SYNC_TYPE,
} = ENUM_SETTINGS_PROPS;

export default function FormModuleSync(
  props: FormItemProps & { form: FormInstance<SettingsProps> },
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { getFormTooltipOption } = useTooltipOption();

  const { form, ...formItemProps } = props;
  const { autoSyncTimeUnitOptions, autoSyncTypeOptions } = useSyncType();

  const autoSync = Form.useWatch(AUTO_SYNC, form);
  const timeUnit = Form.useWatch(AUTO_SYNC_TIME_UNIT, form);
  const timeRanges = Form.useWatch(AUTO_SYNC_TIME_RANGES, form);

  const [minuteValue, setMinuteValue] = useState<number>(defaultAutoSyncRelation.m);
  const [hourValue, setHourValue] = useState<number>(defaultAutoSyncRelation.h);

  const timeRangesValue = useMemo(() => {
    return (timeRanges || []).map<[Dayjs | null, Dayjs | null]>(range => [
      range?.[0] ? dayjs(range?.[0], 'HH:mm') : null,
      range?.[1] ? dayjs(range?.[1], 'HH:mm') : null,
    ]);
  }, [timeRanges]);

  const getTimeUnitOption = useCallback(
    (timeUnit: AutoSyncTimeUnits) => {
      const option =
        autoSyncTimeUnitOptions.find(option => option.type === timeUnit) ||
        autoSyncTimeUnitOptions[0];
      return option || {};
    },
    [autoSyncTimeUnitOptions],
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
    [form, minuteValue, hourValue],
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
    [form, minuteValue, hourValue],
  );

  useEffect(() => {
    settingsUtils.getSettings().then(settings => {
      const { autoSyncTimeUnit, autoSyncInterval } = settings || {};
      const option = getTimeUnitOption(autoSyncTimeUnit || 'm');
      let interval =
        autoSyncInterval || defaultAutoSyncRelation[option.type as AutoSyncTimeUnits];

      if (interval < option.min) interval = option.min;
      if (interval > option.max) interval = option.max;
      if (autoSyncTimeUnit === 'm') {
        setMinuteValue(interval);
      } else if (autoSyncTimeUnit === 'h') {
        setHourValue(interval);
      }
      form.setFieldsValue({
        [AUTO_SYNC_INTERVAL]: interval,
      });
    });
  }, []);

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 远程同步时，偏好设置是否一起同步 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${REMOTE_SYNC_WITH_SETTINGS}`)}
        name={REMOTE_SYNC_WITH_SETTINGS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
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
          {autoSyncTimeUnitOptions.map(item => (
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
      {/* 自动同步开启时段 */}
      <Form.Item
        label={$fmt(`settings.${AUTO_SYNC_TIME_RANGES}`)}
        style={{ marginBottom: 0 }}
      >
        <Form.List name={AUTO_SYNC_TIME_RANGES}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(field => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item validateTrigger={['onBlur']} style={{ marginBottom: 0 }}>
                    <TimePicker.RangePicker
                      value={timeRangesValue[field.name]}
                      format="HH:mm"
                      minuteStep={15}
                      inputReadOnly
                      disabled={!autoSync}
                      onCalendarChange={(dates, dateStrings) => {
                        const newValue = [...timeRangesValue].map(range => {
                          return range.map(
                            value => value?.format('HH:mm') || '',
                          ) as TimeRange;
                        });
                        newValue.splice(field.name, 1, dateStrings);

                        form.setFieldsValue({
                          [AUTO_SYNC_TIME_RANGES]: newValue,
                        });
                      }}
                    />
                  </Form.Item>
                  {fields.length > 1 && autoSync && (
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  disabled={!autoSync}
                  onClick={() => add()}
                >
                  {$fmt(`settings.${AUTO_SYNC_TIME_RANGES}.addRange`)}
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

      {/* 自动同步方式 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${AUTO_SYNC_TYPE}`)}
        name={AUTO_SYNC_TYPE}
        tooltip={getFormTooltipOption({
          title: $fmt(`settings.${AUTO_SYNC_TYPE}.tooltip`),
        })}
      >
        <Radio.Group disabled={!autoSync}>
          <Space direction="vertical">
            {autoSyncTypeOptions.map(item => (
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

import { Space, Form, Radio, Typography, Slider, theme } from 'antd';
import type { FormItemProps } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { useSyncType } from '../sync/hooks/syncType';

const { AUTO_SYNC, AUTO_SYNC_INTERVAL, AUTO_SYNC_TYPE } = ENUM_SETTINGS_PROPS;

export default function FormModuleSync(formItemProps: FormItemProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { autoSyncTypeOptions } = useSyncType();

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 是否开启自动同步 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${AUTO_SYNC}`)}
        name={AUTO_SYNC}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item noStyle dependencies={[AUTO_SYNC]}>
        {({ getFieldValue }) => {
          return (
            <>
              {/* 自动同步间隔时间 */}
              <Form.Item<SettingsProps> label={$fmt(`settings.${AUTO_SYNC_INTERVAL}`)}>
                {/* 嵌套一下没有别的意思，只是为了给slider的tooltip留出点空间 */}
                <Form.Item<SettingsProps> name={AUTO_SYNC_INTERVAL}>
                  <Slider
                    min={5}
                    max={100}
                    step={5}
                    tooltip={{
                      open: true,
                      placement: 'bottom',
                      autoAdjustOverflow: false,
                    }}
                    disabled={!getFieldValue(AUTO_SYNC)}
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
                <Radio.Group disabled={!getFieldValue(AUTO_SYNC)}>
                  <Space direction="vertical">
                    {autoSyncTypeOptions.map((item) => (
                      <Radio key={item.type} value={item.type}>
                        {item.label}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>
            </>
          );
        }}
      </Form.Item>
    </Form.Item>
  );
}

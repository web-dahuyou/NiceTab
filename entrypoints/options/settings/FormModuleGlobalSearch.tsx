import { Form, Radio, theme } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

const { GLOBAL_SEARCH_DELETE_AFTER_OPEN } = ENUM_SETTINGS_PROPS;

export default function FormModuleGlobalSearch(
  props: FormItemProps & { form: FormInstance<SettingsProps> }
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 打开标签页时是否从列表中删除 */}
      <Form.Item<SettingsProps>
        label={$fmt({
          id: `settings.${GLOBAL_SEARCH_DELETE_AFTER_OPEN}`,
          values: { mark: '：' },
        })}
        name={GLOBAL_SEARCH_DELETE_AFTER_OPEN}
      >
        <Radio.Group>
          <Radio value={false}>
            {$fmt(`settings.${GLOBAL_SEARCH_DELETE_AFTER_OPEN}.no`)}
          </Radio>
          <Radio value={true}>
            {$fmt(`settings.${GLOBAL_SEARCH_DELETE_AFTER_OPEN}.yes`)}
          </Radio>
        </Radio.Group>
      </Form.Item>
    </Form.Item>
  );
}

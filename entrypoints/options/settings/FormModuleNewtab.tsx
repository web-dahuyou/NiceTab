import { Form, Radio } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import useTooltipOption from '~/entrypoints/common/hooks/tooltipOption';

const { NEW_TAB_DISPLAY, SEARCH_ENGINES } = ENUM_SETTINGS_PROPS;

export default function FormModuleNewtab(
  props: FormItemProps & {
    form: FormInstance<SettingsProps>;
    onChange?: (val?: any) => void;
  },
) {
  const { $fmt } = useIntlUtls();
  const { form, onChange, ...formItemProps } = props;

  const { getFormTooltipOption } = useTooltipOption();

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 新标签页显示方式 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${NEW_TAB_DISPLAY}`)}
        name={NEW_TAB_DISPLAY}
        tooltip={getFormTooltipOption({
          title: $fmt(`settings.${NEW_TAB_DISPLAY}.tooltip`),
        })}
      >
        <Radio.Group>
          <Radio value="default">{$fmt(`settings.${NEW_TAB_DISPLAY}.default`)}</Radio>
          <Radio value="niceNewtab">
            {$fmt(`settings.${NEW_TAB_DISPLAY}.niceNewtab`)}
          </Radio>
          <Radio value="homePage">{$fmt(`settings.${NEW_TAB_DISPLAY}.homePage`)}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 搜索引擎配置 */}
      {/* TODO: 搜索引擎表单配置暂时不添加 */}
      {/* <Form.Item<SettingsProps>
        label={$fmt(`settings.${SEARCH_ENGINES}`)}
        name={SEARCH_ENGINES}
      >
      </Form.Item> */}
    </Form.Item>
  );
}

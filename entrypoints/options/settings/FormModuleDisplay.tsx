import { useMemo } from 'react';
import { Form, Checkbox, Radio, Typography, theme } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { POPUP_MODULE_NAMES, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

const {
  SHOW_OPENED_TAB_COUNT,
  SHOW_PAGE_CONTEXT_MENUS,
  POPUP_MODULE_DISPLAYS,
  AUTO_EXPAND_HOME_TREE,
  MAIN_CONTENT_WIDTH_TYPE,
  SHOW_TAB_TITLE_TOOLTIP,
} = ENUM_SETTINGS_PROPS;

export default function FormModuleDisplay() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  // popup面板显示模块选项
  const popupModuleDisplayOptions = useMemo(() => {
    return POPUP_MODULE_NAMES.map((moduleName) => {
      return {
        label: $fmt({ id: `common.${moduleName}` }),
        value: moduleName,
      };
    });
  }, [$fmt]);

  return (
    <>
      {/* 扩展图标上是否展示当前打开的标签页数 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SHOW_OPENED_TAB_COUNT}`)}
        name={SHOW_OPENED_TAB_COUNT}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 网页中是否显示NiceTab右键菜单 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SHOW_PAGE_CONTEXT_MENUS}`)}
        name={SHOW_PAGE_CONTEXT_MENUS}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* popup面板中模块设置 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${POPUP_MODULE_DISPLAYS}`)}
        name={POPUP_MODULE_DISPLAYS}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${POPUP_MODULE_DISPLAYS}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <Checkbox.Group options={popupModuleDisplayOptions}></Checkbox.Group>
      </Form.Item>

      {/* 进入列表页时，是否自动展开全部节点 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${AUTO_EXPAND_HOME_TREE}`)}
        name={AUTO_EXPAND_HOME_TREE}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 页面主内容宽度设置 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${MAIN_CONTENT_WIDTH_TYPE}`)}
        name={MAIN_CONTENT_WIDTH_TYPE}
      >
        <Radio.Group>
          <Radio value="fixed">{$fmt(`settings.${MAIN_CONTENT_WIDTH_TYPE}.fixed`)}</Radio>
          <Radio value="responsive">
            {$fmt(`settings.${MAIN_CONTENT_WIDTH_TYPE}.responsive`)}
          </Radio>
        </Radio.Group>
      </Form.Item>

      {/* 是否显示标签页标题的tooltip */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SHOW_TAB_TITLE_TOOLTIP}`)}
        name={SHOW_TAB_TITLE_TOOLTIP}
      >
        <Radio.Group>
          <Radio value={true}>{$fmt('common.yes')}</Radio>
          <Radio value={false}>{$fmt('common.no')}</Radio>
        </Radio.Group>
      </Form.Item>
    </>
  );
}

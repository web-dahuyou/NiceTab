import { useMemo } from 'react';
import { Form, Checkbox, Radio, Typography, theme } from 'antd';
import type { FormItemProps, FormInstance } from 'antd';
import type { SettingsProps } from '~/entrypoints/types';
import { POPUP_MODULE_NAMES, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { groupActionOptions } from '~/entrypoints/options/home/constants';
import ContextMenuConfig from './ContextMenuConfig';

const {
  GROUP_ACTION_BTN_STYLE,
  GROUP_ACTION_BTNS_COMMONLY_USED,
  SHOW_OPENED_TAB_COUNT,
  SHOW_PAGE_CONTEXT_MENUS,
  CONTEXT_MENU_CONFIG,
  POPUP_MODULE_DISPLAYS,
  AUTO_EXPAND_HOME_TREE,
  MAIN_CONTENT_WIDTH_TYPE,
  SHOW_TAB_TITLE_TOOLTIP,
} = ENUM_SETTINGS_PROPS;

export default function FormModuleDisplay(
  props: FormItemProps & { form: FormInstance<SettingsProps> },
) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { form, ...formItemProps } = props;

  // popup面板显示模块选项
  const popupModuleDisplayOptions = useMemo(() => {
    return POPUP_MODULE_NAMES.map(moduleName => {
      return {
        label: $fmt({ id: `common.${moduleName}` }),
        value: moduleName,
      };
    });
  }, [$fmt]);

  // 标签组按钮选项
  const groupActionBtnOptions = useMemo(() => {
    return groupActionOptions.map(option => {
      return {
        label: $fmt(option.labelKey),
        value: option.actionName,
      };
    });
  }, [$fmt]);

  return (
    <Form.Item noStyle {...formItemProps}>
      {/* 标签组和标签页操作按钮样式 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${GROUP_ACTION_BTN_STYLE}`)}
        name={GROUP_ACTION_BTN_STYLE}
        {...formItemProps}
      >
        <Radio.Group>
          <Radio value="text">{$fmt('common.text')}</Radio>
          <Radio value="icon">{$fmt('common.icon')}</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 设置常用的标签组按钮 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${GROUP_ACTION_BTNS_COMMONLY_USED}`)}
        name={GROUP_ACTION_BTNS_COMMONLY_USED}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${GROUP_ACTION_BTNS_COMMONLY_USED}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
        {...formItemProps}
      >
        <Checkbox.Group options={groupActionBtnOptions}></Checkbox.Group>
      </Form.Item>

      {/* 扩展图标上是否展示当前打开的标签页数 */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${SHOW_OPENED_TAB_COUNT}`)}
        name={SHOW_OPENED_TAB_COUNT}
        {...formItemProps}
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

      {/* 右键菜单配置（可选择并排序） */}
      <Form.Item<SettingsProps>
        label={$fmt(`settings.${CONTEXT_MENU_CONFIG}`)}
        name={CONTEXT_MENU_CONFIG}
        tooltip={{
          color: token.colorBgElevated,
          title: (
            <Typography.Text>
              {$fmt(`settings.${CONTEXT_MENU_CONFIG}.tooltip`)}
            </Typography.Text>
          ),
          styles: { root: { maxWidth: '320px', width: '320px' } },
        }}
      >
        <ContextMenuConfig form={form} />
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
    </Form.Item>
  );
}

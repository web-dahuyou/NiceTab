import { useContext, useEffect, useMemo } from 'react';
import {
  Space,
  Form,
  Divider,
  Input,
  InputNumber,
  Checkbox,
  Button,
  Radio,
  Typography,
  Slider,
  Modal,
  theme,
  message,
} from 'antd';
import type { FormProps } from 'antd';
import styled from 'styled-components';
import { isEqual } from 'lodash-es';
import { useBlocker } from 'react-router-dom';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils } from '~/entrypoints/common/storage';
import {
  SEND_TAB_ACTION_NAMES,
  POPUP_MODULE_NAMES,
  ENUM_SETTINGS_PROPS,
  defaultLanguage,
} from '~/entrypoints/common/constants';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import { getKeysByOS, sendRuntimeMessage } from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import { StickyBox } from '~/entrypoints/common/components/StickyBox';
import QuickActions from './QuickActions';
import { useSyncType } from '../sync/hooks/syncType';

const {
  LANGUAGE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  ACTION_AUTO_CLOSE_FLAGS,
  SHOW_SEND_TARGET_MODAL,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TABS,
  EXCLUDE_DOMAINS_FOR_SENDING,
  RESTORE_IN_NEW_WINDOW,
  DELETE_AFTER_RESTORE,
  SILENT_OPEN_TAB_MODIFIER_KEY,
  OPEN_TAB_MODIFIER_KEY,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
  DELETE_UNLOCKED_EMPTY_GROUP,
  CONFIRM_BEFORE_DELETING_TABS,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
  LINK_TEMPLATE,
  TAB_COUNT_THRESHOLD,
  SHOW_OPENED_TAB_COUNT,
  SHOW_PAGE_CONTEXT_MENUS,
  POPUP_MODULE_DISPLAYS,
  AUTO_EXPAND_HOME_TREE,
  MAIN_CONTENT_WIDTH_TYPE,
  AUTO_SYNC,
  AUTO_SYNC_INTERVAL,
  AUTO_SYNC_TYPE,
} = ENUM_SETTINGS_PROPS;

const module = 'settings'; // locale module name
const defaultTemplate = String.raw`{{url}} | {{title}}`;

const modifierKeyLabels = getKeysByOS();

const StyledHeaderActionWrapper = styled.div`
  .header-action-btns {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
  }
`;

export default function Settings() {
  const NiceGlobalContext = useContext(GlobalContext);
  const { token } = theme.useToken();
  const { $fmt, locale } = useIntlUtls();
  const [messageApi, msgContextHolder] = message.useMessage();

  const [form] = Form.useForm();
  const { autoSyncTypeOptions } = useSyncType();

  const [initialFormValues, setInitialFormValues] = useState<SettingsProps>();
  // 使用 useBlocker 拦截路由离开
  const blocker = useBlocker(() => {
    const fieldsValues: SettingsProps = form.getFieldsValue();
    for (let [key, value] of Object.entries(fieldsValues)) {
      const _isEqual = isEqual(value, initialFormValues?.[key as keyof SettingsProps]);

      if (!_isEqual) return true;
    }

    return false;
  });

  // 发送标签页自动关闭标签页的操作选项
  const actionAutoCloseFlagOptions = useMemo(() => {
    return SEND_TAB_ACTION_NAMES.map((actionName) => {
      return {
        label: $fmt({ id: `common.${actionName}` }),
        value: actionName,
      };
    });
  }, [$fmt]);

  // popup面板显示模块选项
  const popupModuleDisplayOptions = useMemo(() => {
    return POPUP_MODULE_NAMES.map((moduleName) => {
      return {
        label: $fmt({ id: `common.${moduleName}` }),
        value: moduleName,
      };
    });
  }, [$fmt]);

  const onFinish: FormProps<SettingsProps>['onFinish'] = async (values) => {
    console.log('Save Success:', values);
    const newSettings = { ...settingsUtils.initialSettings, ...values };

    await settingsUtils.setSettings(newSettings);
    NiceGlobalContext.setSettings(newSettings);
    sendRuntimeMessage({ msgType: 'setLocale', data: { locale: newSettings.language } });
    reloadOtherAdminPage();

    const customMessages = getCustomLocaleMessages(
      newSettings.language || defaultLanguage
    );
    messageApi.success(customMessages['common.saveSuccess']);
    setInitialFormValues((values) => ({
      ...values,
      ...newSettings,
    }));
  };

  useEffect(() => {
    form?.setFieldValue(LANGUAGE, locale);
  }, [locale]);

  const { urlParams } = useUrlParams();
  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      setInitialFormValues(settings);
      form?.setFieldsValue(settings);
      NiceGlobalContext.setSettings(settings);
    });
  }, [urlParams]);
  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      setInitialFormValues(settings);
      form?.setFieldsValue(settings);
    });
  }, []);

  return (
    <>
      {msgContextHolder}
      <Modal
        title={$fmt('common.confirmReminder')}
        open={blocker.state === 'blocked'}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        {$fmt('settings.confirmTipContent')}
      </Modal>
      <div className="settings-wrapper">
        <Form
          form={form}
          name="settings"
          layout="vertical"
          autoComplete="off"
          onFinish={onFinish}
        >
          <StickyBox topGap={60} fullWidth bgColor={token.colorBgContainer}>
            <StyledHeaderActionWrapper>
              <Space className="header-action-btns">
                <Button type="primary" htmlType="submit">
                  {$fmt('common.save')}
                </Button>
              </Space>
            </StyledHeaderActionWrapper>
          </StickyBox>
          <Form.Item<SettingsProps>
            label={$fmt({ id: `${module}.${LANGUAGE}`, values: { mark: '：' } })}
            name={LANGUAGE}
          >
            <Radio.Group>
              <Radio value="zh-CN"> 中文简体 </Radio>
              <Radio value="en-US"> English </Radio>
            </Radio.Group>
          </Form.Item>
          {/* 启动浏览器时是否自动打开NiceTab管理后台 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}`,
              values: { mark: '：' },
            })}
            name={OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}
          >
            <Radio.Group>
              <Radio value={true}>
                {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}.yes`)}
              </Radio>
              <Radio value={false}>
                {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}.no`)}
              </Radio>
            </Radio.Group>
          </Form.Item>
          {/* 是否固定管理后台 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${AUTO_PIN_ADMIN_TAB}`,
              values: { mark: '：' },
            })}
            name={AUTO_PIN_ADMIN_TAB}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt(`${module}.${AUTO_PIN_ADMIN_TAB}.yes`)}</Radio>
              <Radio value={false}>{$fmt(`${module}.${AUTO_PIN_ADMIN_TAB}.no`)}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* ******************* 发送标签页相关设置 ******************* */}
          <Divider>{$fmt('settings.block.sendTabs')}</Divider>
          {/* 是否展示目录选择弹窗 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${SHOW_SEND_TARGET_MODAL}`)}
            name={SHOW_SEND_TARGET_MODAL}
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${SHOW_SEND_TARGET_MODAL}.tooltip`)}
                </Typography.Text>
              ),
              styles: { root: { maxWidth: '320px', width: '320px' } },
            }}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt(`common.no`)}</Radio>
            </Radio.Group>
          </Form.Item>
          {/* 是否发送固定标签页 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${ALLOW_SEND_PINNED_TABS}`,
              values: { mark: '：' },
            })}
            name={ALLOW_SEND_PINNED_TABS}
          >
            <Radio.Group>
              <Radio value={true}>
                {$fmt(`${module}.${ALLOW_SEND_PINNED_TABS}.yes`)}
              </Radio>
              <Radio value={false}>
                {$fmt(`${module}.${ALLOW_SEND_PINNED_TABS}.no`)}
              </Radio>
            </Radio.Group>
          </Form.Item>
          {/* 排除的域名 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${EXCLUDE_DOMAINS_FOR_SENDING}`,
              values: { mark: '：' },
            })}
            name={EXCLUDE_DOMAINS_FOR_SENDING}
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${EXCLUDE_DOMAINS_FOR_SENDING}.tooltip`)}
                </Typography.Text>
              ),
              styles: { root: { maxWidth: '320px', width: '320px' } },
            }}
          >
            <Input.TextArea
              style={{ width: '500px' }}
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder={$fmt(`${module}.${EXCLUDE_DOMAINS_FOR_SENDING}.placeholder`)}
            />
          </Form.Item>
          {/* 发送标签页后是否打开管理后台 */}
          <Form.Item<SettingsProps>
            label={
              <div>
                {$fmt({
                  id: `${module}.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}`,
                  values: { mark: '：' },
                })}
              </div>
            }
            name={OPEN_ADMIN_TAB_AFTER_SEND_TABS}
          >
            <Radio.Group>
              <Radio value={true}>
                {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}.yes`)}
              </Radio>
              <Radio value={false}>
                {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}.no`)}
              </Radio>
            </Radio.Group>
          </Form.Item>
          {/* 发送标签页后是否关闭标签页 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${CLOSE_TABS_AFTER_SEND_TABS}`,
              values: { mark: '：' },
            })}
            name={CLOSE_TABS_AFTER_SEND_TABS}
          >
            <Radio.Group>
              <Radio value={true}>
                {$fmt(`${module}.${CLOSE_TABS_AFTER_SEND_TABS}.yes`)}
              </Radio>
              <Radio value={false}>
                {$fmt(`${module}.${CLOSE_TABS_AFTER_SEND_TABS}.no`)}
              </Radio>
            </Radio.Group>
          </Form.Item>
          {/* 发送标签页各种操作单独控制, 当 `发送标签页后是否关闭标签页` 设置为保留标签页时生效 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues[CLOSE_TABS_AFTER_SEND_TABS] !==
              currentValues[CLOSE_TABS_AFTER_SEND_TABS]
            }
          >
            {({ getFieldValue }) => {
              return !getFieldValue(CLOSE_TABS_AFTER_SEND_TABS) ? (
                <Form.Item
                  label={$fmt(`${module}.${ACTION_AUTO_CLOSE_FLAGS}`)}
                  name={ACTION_AUTO_CLOSE_FLAGS}
                  tooltip={{
                    color: token.colorBgElevated,
                    title: (
                      <Typography.Text>
                        {$fmt(`${module}.${ACTION_AUTO_CLOSE_FLAGS}.tooltip`)}
                      </Typography.Text>
                    ),
                    styles: { root: { maxWidth: '320px', width: '320px' } },
                  }}
                >
                  <Checkbox.Group options={actionAutoCloseFlagOptions}></Checkbox.Group>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
          {/* 发送标签页时-是否允许重复的标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${ALLOW_DUPLICATE_GROUPS}`,
              values: { mark: '：' },
            })}
            name={ALLOW_DUPLICATE_GROUPS}
          >
            <Radio.Group>
              <Radio value={true}>
                {$fmt(`${module}.${ALLOW_DUPLICATE_GROUPS}.yes`)}
              </Radio>
              <Radio value={false}>
                {$fmt(`${module}.${ALLOW_DUPLICATE_GROUPS}.no`)}
              </Radio>
            </Radio.Group>
          </Form.Item>

          {/* 发送标签页时-是否允许重复的标签页 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${ALLOW_DUPLICATE_TABS}`,
              values: { mark: '：' },
            })}
            name={ALLOW_DUPLICATE_TABS}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt(`${module}.${ALLOW_DUPLICATE_TABS}.yes`)}</Radio>
              <Radio value={false}>{$fmt(`${module}.${ALLOW_DUPLICATE_TABS}.no`)}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* ******************* 打开标签页相关设置 ******************* */}
          <Divider>{$fmt('settings.block.openTabs')}</Divider>
          {/* 是否在新窗口打开标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${RESTORE_IN_NEW_WINDOW}`,
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
              id: `${module}.${DELETE_AFTER_RESTORE}`,
              values: { mark: '：' },
            })}
            name={DELETE_AFTER_RESTORE}
          >
            <Radio.Group>
              <Radio value={false}>{$fmt(`${module}.${DELETE_AFTER_RESTORE}.no`)}</Radio>
              <Radio value={true}>{$fmt(`${module}.${DELETE_AFTER_RESTORE}.yes`)}</Radio>
            </Radio.Group>
          </Form.Item>
          {/* 静默打开标签页修饰键 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${SILENT_OPEN_TAB_MODIFIER_KEY}`)}
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
            label={$fmt(`${module}.${OPEN_TAB_MODIFIER_KEY}`)}
            name={OPEN_TAB_MODIFIER_KEY}
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${OPEN_TAB_MODIFIER_KEY}.tooltip`)}
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
          {/* 是否以标签组形式恢复未命名标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${UNNAMED_GROUP_RESTORE_AS_GROUP}`)}
            name={UNNAMED_GROUP_RESTORE_AS_GROUP}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>
          {/* 是否以标签组形式恢复已命名标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${NAMED_GROUP_RESTORE_AS_GROUP}`)}
            name={NAMED_GROUP_RESTORE_AS_GROUP}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* ******************* 其他操作相关设置 ******************* */}
          <Divider>{$fmt('settings.block.otherActions')}</Divider>
          {/* 是否删除未锁定的空标签组 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${DELETE_UNLOCKED_EMPTY_GROUP}`,
              values: { mark: '：' },
            })}
            name={DELETE_UNLOCKED_EMPTY_GROUP}
          >
            <Radio.Group>
              <Radio value={true}>
                {$fmt(`${module}.${DELETE_UNLOCKED_EMPTY_GROUP}.yes`)}
              </Radio>
              <Radio value={false}>
                {$fmt(`${module}.${DELETE_UNLOCKED_EMPTY_GROUP}.no`)}
              </Radio>
            </Radio.Group>
          </Form.Item>
          {/* 删除标签页前是否需要确认 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${CONFIRM_BEFORE_DELETING_TABS}`,
              values: { mark: '：' },
            })}
            name={CONFIRM_BEFORE_DELETING_TABS}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 单个分类中标签页数量超过预定值则开启虚拟滚动 */}
          <Form.Item<SettingsProps>
            label={$fmt({
              id: `${module}.${TAB_COUNT_THRESHOLD}`,
              values: { mark: '：' },
            })}
            name={TAB_COUNT_THRESHOLD}
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${TAB_COUNT_THRESHOLD}.tooltip`)}
                </Typography.Text>
              ),
              styles: { root: { maxWidth: '320px', width: '320px' } },
            }}
          >
            <InputNumber
              min={100}
              max={800}
              step={10}
              keyboard={true}
              style={{ width: '300px' }}
            />
          </Form.Item>

          {/* 复制链接的格式 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${LINK_TEMPLATE}`)}
            // name={LINK_TEMPLATE} // 注意在嵌套的Form.item中设置了name, 这里不要设置name
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${LINK_TEMPLATE}.tooltip`)}
                </Typography.Text>
              ),
              styles: { root: { maxWidth: '320px', width: '320px' } },
            }}
          >
            <Space wrap>
              <Form.Item<SettingsProps> name={LINK_TEMPLATE} noStyle>
                <Input
                  style={{ width: '300px' }}
                  placeholder={`${$fmt(
                    `${module}.${LINK_TEMPLATE}.placeholder`
                  )}: ${defaultTemplate}`}
                />
              </Form.Item>
              <QuickActions
                onChange={(val) => {
                  console.log('val', val);
                  form.setFieldValue(LINK_TEMPLATE, val);
                }}
              ></QuickActions>
            </Space>
          </Form.Item>

          {/* ******************* 展示相关设置 ******************* */}
          <Divider>{$fmt('settings.block.display')}</Divider>
          {/* 扩展图标上是否展示当前打开的标签页数 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${SHOW_OPENED_TAB_COUNT}`)}
            name={SHOW_OPENED_TAB_COUNT}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 网页中是否显示NiceTab右键菜单 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${SHOW_PAGE_CONTEXT_MENUS}`)}
            name={SHOW_PAGE_CONTEXT_MENUS}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* popup面板中模块设置 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${POPUP_MODULE_DISPLAYS}`)}
            name={POPUP_MODULE_DISPLAYS}
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${POPUP_MODULE_DISPLAYS}.tooltip`)}
                </Typography.Text>
              ),
              styles: { root: { maxWidth: '320px', width: '320px' } },
            }}
          >
            <Checkbox.Group options={popupModuleDisplayOptions}></Checkbox.Group>
          </Form.Item>

          {/* 进入列表页时，是否自动展开全部节点 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${AUTO_EXPAND_HOME_TREE}`)}
            name={AUTO_EXPAND_HOME_TREE}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 页面主内容宽度设置 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${MAIN_CONTENT_WIDTH_TYPE}`)}
            name={MAIN_CONTENT_WIDTH_TYPE}
          >
            <Radio.Group>
              <Radio value="fixed">
                {$fmt(`settings.${MAIN_CONTENT_WIDTH_TYPE}.fixed`)}
              </Radio>
              <Radio value="responsive">
                {$fmt(`settings.${MAIN_CONTENT_WIDTH_TYPE}.responsive`)}
              </Radio>
            </Radio.Group>
          </Form.Item>

          {/* ******************* 远程同步相关设置 ******************* */}
          <Divider>{$fmt('settings.block.autoSync')}</Divider>
          {/* 是否开启自动同步 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${AUTO_SYNC}`)}
            name={AUTO_SYNC}
          >
            <Radio.Group>
              <Radio value={true}>{$fmt('common.yes')}</Radio>
              <Radio value={false}>{$fmt('common.no')}</Radio>
            </Radio.Group>
          </Form.Item>
          {/* 自动同步间隔时间 */}
          <Form.Item<SettingsProps> label={$fmt(`${module}.${AUTO_SYNC_INTERVAL}`)}>
            {/* 嵌套一下没有别的意思，只是为了给slider的tooltip留出点空间 */}
            <Form.Item<SettingsProps> name={AUTO_SYNC_INTERVAL}>
              <Slider
                min={5}
                max={100}
                step={5}
                tooltip={{ open: true, placement: 'bottom', autoAdjustOverflow: false }}
              />
            </Form.Item>
          </Form.Item>
          {/* 自动同步方式 */}
          <Form.Item<SettingsProps>
            label={$fmt(`${module}.${AUTO_SYNC_TYPE}`)}
            name={AUTO_SYNC_TYPE}
            tooltip={{
              color: token.colorBgElevated,
              title: (
                <Typography.Text>
                  {$fmt(`${module}.${AUTO_SYNC_TYPE}.tooltip`)}
                </Typography.Text>
              ),
              styles: { root: { maxWidth: '320px', width: '320px' } },
            }}
          >
            <Radio.Group>
              <Space direction="vertical">
                {autoSyncTypeOptions.map((item) => (
                  <Radio key={item.type} value={item.type}>
                    {item.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          {/* ******************* 保存 ******************* */}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {$fmt('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}

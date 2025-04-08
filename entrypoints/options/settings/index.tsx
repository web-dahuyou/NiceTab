import { useContext, useEffect } from 'react';
import { Space, Form, Divider, Button, Modal, theme, message } from 'antd';
import type { FormProps } from 'antd';
import styled from 'styled-components';
import { isEqual } from 'lodash-es';
import { useBlocker } from 'react-router-dom';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils } from '~/entrypoints/common/storage';
import { ENUM_SETTINGS_PROPS, defaultLanguage } from '~/entrypoints/common/constants';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import { sendRuntimeMessage } from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import { StickyBox } from '~/entrypoints/common/components/StickyBox';

import FormModuleCommon from './FormModuleCommon';
import FormModuleSend from './FormModuleSend';
import FormModuleOpen from './FormModuleOpen';
import FormModuleDisplay from './FormModuleDisplay';
import FormModuleSync from './FormModuleSync';
import FormModuleOtherActions from './FormModuleOtherActions';

const { LANGUAGE } = ENUM_SETTINGS_PROPS;

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

  const onFinish: FormProps<SettingsProps>['onFinish'] = async (values) => {
    const settings = await settingsUtils.getSettings();
    const newSettings = { ...settingsUtils.initialSettings, ...settings, ...values };
    console.log('Save Success: newSettings', newSettings);

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

          {/* ******************* 通用设置 ******************* */}
          <FormModuleCommon></FormModuleCommon>

          {/* ******************* 发送标签页相关设置 ******************* */}
          <Divider>{$fmt('settings.block.sendTabs')}</Divider>
          <FormModuleSend></FormModuleSend>

          {/* ******************* 打开标签页相关设置 ******************* */}
          <Divider>{$fmt('settings.block.openTabs')}</Divider>
          <FormModuleOpen></FormModuleOpen>

          {/* ******************* 其他操作相关设置 ******************* */}
          <Divider>{$fmt('settings.block.otherActions')}</Divider>
          <FormModuleOtherActions></FormModuleOtherActions>

          {/* ******************* 展示相关设置 ******************* */}
          <Divider>{$fmt('settings.block.display')}</Divider>
          <FormModuleDisplay></FormModuleDisplay>

          {/* ******************* 远程同步相关设置 ******************* */}
          <Divider>{$fmt('settings.block.autoSync')}</Divider>
          <FormModuleSync></FormModuleSync>

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

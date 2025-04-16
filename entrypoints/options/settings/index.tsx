import { useContext, useState, useEffect, useMemo } from 'react';
import { Menu, Form, Button, Modal, message } from 'antd';
import type { MenuProps, FormProps } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { isEqual } from 'lodash-es';
import { useBlocker } from 'react-router-dom';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils } from '~/entrypoints/common/storage';
import { ENUM_SETTINGS_PROPS, defaultLanguage } from '~/entrypoints/common/constants';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import { sendRuntimeMessage, classNames } from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import StickyFooter from '~/entrypoints/common/components/StickyFooter';

import FormModuleCommon from './FormModuleCommon';
import FormModuleSend from './FormModuleSend';
import FormModuleOpen from './FormModuleOpen';
import FormModuleDisplay from './FormModuleDisplay';
import FormModuleSync from './FormModuleSync';
import FormModuleOtherActions from './FormModuleOtherActions';
import {
  StyledSidebarWrapper,
  StyledMainWrapper,
  StyledFooterWrapper,
} from './Settings.styled';

const { LANGUAGE } = ENUM_SETTINGS_PROPS;

type MenuItem = Required<MenuProps>['items'][number];

export default function Settings() {
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt, locale } = useIntlUtls();
  const [messageApi, msgContextHolder] = message.useMessage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [form] = Form.useForm();

  const [currModule, setCurrModule] = useState<string>('common');
  const blockModuleOptions: MenuItem[] = useMemo(() => {
    return [
      {
        key: 'common',
        label: $fmt('settings.block.common'),
        icon: <SettingOutlined />,
      },
      {
        key: 'sendTabs',
        label: $fmt('settings.block.sendTabs'),
        icon: <SettingOutlined />,
      },
      {
        key: 'openTabs',
        label: $fmt('settings.block.openTabs'),
        icon: <SettingOutlined />,
      },
      {
        key: 'otherActions',
        label: $fmt('settings.block.otherActions'),
        icon: <SettingOutlined />,
      },
      {
        key: 'display',
        label: $fmt('settings.block.display'),
        icon: <SettingOutlined />,
      },
      {
        key: 'autoSync',
        label: $fmt('settings.block.autoSync'),
        icon: <SettingOutlined />,
      },
    ];
  }, [$fmt]);

  const onModuleChange: MenuProps['onClick'] = (e) => {
    setCurrModule(e.key || 'common');
  };

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
        centered
        open={blocker.state === 'blocked'}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        {$fmt('settings.confirmTipContent')}
      </Modal>
      <StyledMainWrapper
        className={classNames('sync-wrapper', sidebarCollapsed && 'collapsed')}
        $collapsed={sidebarCollapsed}
        $sidebarWidth={240}
      >
        <StyledSidebarWrapper
          className="sidebar"
          $collapsed={sidebarCollapsed}
          $sidebarWidth={240}
        >
          <div
            className={classNames('sidebar-inner-box', sidebarCollapsed && 'collapsed')}
          >
            <div className="sidebar-inner-content">
              <Menu
                mode="vertical"
                items={blockModuleOptions}
                onClick={onModuleChange}
              ></Menu>
            </div>
          </div>
        </StyledSidebarWrapper>
        <div className="main-content-wrapper settings-wrapper">
          <Form
            form={form}
            name="settings"
            layout="vertical"
            autoComplete="off"
            onFinish={onFinish}
          >
            {/* ******************* 通用设置 ******************* */}
            {currModule === 'common' && <FormModuleCommon />}

            {/* ******************* 发送标签页相关设置 ******************* */}
            {currModule === 'sendTabs' && <FormModuleSend />}

            {/* ******************* 打开标签页相关设置 ******************* */}
            {currModule === 'openTabs' && <FormModuleOpen />}

            {/* ******************* 其他操作相关设置 ******************* */}
            {currModule === 'otherActions' && <FormModuleOtherActions />}

            {/* ******************* 展示相关设置 ******************* */}
            {currModule === 'display' && <FormModuleDisplay />}

            {/* ******************* 远程同步相关设置 ******************* */}
            {currModule === 'autoSync' && <FormModuleSync />}

            {/* ******************* 保存 ******************* */}
            <StickyFooter bottomGap={0} fullWidth>
              <StyledFooterWrapper>
                <Button type="primary" htmlType="submit">
                  {$fmt('common.save')}
                </Button>
              </StyledFooterWrapper>
            </StickyFooter>
          </Form>
        </div>
      </StyledMainWrapper>
    </>
  );
}

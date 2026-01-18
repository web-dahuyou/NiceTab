import { useContext, useState, useEffect, useMemo } from 'react';
import { Menu, Form, Button, Badge, Modal, theme, message } from 'antd';
import type { MenuProps, FormProps } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { isEqual, debounce } from 'lodash-es';
import { useBlocker } from 'react-router-dom';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { SettingsProps, TimeRange } from '~/entrypoints/types';
import { settingsUtils } from '~/entrypoints/common/storage';
import {
  ENUM_SETTINGS_PROPS,
  defaultLanguage,
  defaultTimeRange,
} from '~/entrypoints/common/constants';
import {
  GlobalContext,
  useIntlUtls,
  eventEmitter,
} from '~/entrypoints/common/hooks/global';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import { sendRuntimeMessage, classNames } from '~/entrypoints/common/utils';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
// import StickyFooter from '~/entrypoints/common/components/StickyFooter';

import SidebarBaseBtn from '~/entrypoints/options/components/SidebarBaseBtn';
import ToggleSidebarBtn from '../components/ToggleSidebarBtn';

import FormModuleCommon from './FormModuleCommon';
import FormModuleSend from './FormModuleSend';
import FormModuleOpen from './FormModuleOpen';
import FormModulePageTitle from './FormModulePageTitleConfig';
import FormModuleGlobalSearch from './FormModuleGlobalSearch';
import FormModuleOtherActions from './FormModuleOtherActions';
import FormModuleDisplay from './FormModuleDisplay';
import FormModuleSync from './FormModuleSync';
import {
  StyledSidebarWrapper,
  StyledMainWrapper,
  // StyledFooterWrapper,
} from './Settings.styled';

const { LANGUAGE, AUTO_SYNC_TIME_RANGES } = ENUM_SETTINGS_PROPS;

type MenuItem = Required<MenuProps>['items'][number];

function handleTimeRanges(timeRanges?: TimeRange[]): TimeRange[] {
  return (timeRanges || []).map(range => [
    range?.[0] || defaultTimeRange[0],
    range?.[1] || defaultTimeRange[1],
  ]);
}

export default function Settings() {
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt, locale } = useIntlUtls();
  const [messageApi, msgContextHolder] = message.useMessage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const { token } = theme.useToken();

  const onCollapseChange = (status: boolean) => {
    setSidebarCollapsed(status);
  };

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
        key: 'pageTitleConfig',
        label: $fmt('settings.block.pageTitleConfig'),
        icon: <SettingOutlined />,
      },
      {
        key: 'globalSearch',
        label: $fmt('settings.block.globalSearch'),
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
        key: 'sync',
        label: $fmt('settings.block.sync'),
        icon: <SettingOutlined />,
      },
    ];
  }, [$fmt]);

  const onModuleChange: MenuProps['onClick'] = e => {
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

  const handleFinish: FormProps<SettingsProps>['onFinish'] = async values => {
    const settings = await settingsUtils.getSettings();
    const newSettings = {
      ...settingsUtils.initialSettings,
      ...settings,
      ...values,
      [AUTO_SYNC_TIME_RANGES]: handleTimeRanges(values[AUTO_SYNC_TIME_RANGES]),
    };
    console.log('Save Success: newSettings', newSettings);
    form.setFieldsValue(newSettings);

    await settingsUtils.setSettings(newSettings);
    NiceGlobalContext.setSettings(newSettings);
    sendRuntimeMessage({ msgType: 'setLocale', data: { locale: newSettings.language } });
    sendRuntimeMessage({
      msgType: 'setThemeType',
      data: { themeType: newSettings.themeType },
    });
    reloadOtherAdminPage();

    const customMessages = getCustomLocaleMessages(
      newSettings.language || defaultLanguage,
    );
    messageApi.success(customMessages['common.saveSuccess']);
    setInitialFormValues(values => ({
      ...values,
      ...newSettings,
    }));
    setHasChanged(false);
  };

  const onFinish = useMemo(() => debounce(handleFinish, 500), [handleFinish]);

  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const handleValuesChange = () => {
    setHasChanged(true);
    form?.validateFields().catch(err => {
      console.log('form-valid-err', err);
    });
  };

  const onValuesChange = useMemo(
    () => debounce(handleValuesChange, 500),
    [handleValuesChange],
  );

  const handleSave = () => {
    form?.submit();
  };

  useEffect(() => {
    form.setFieldsValue({ [LANGUAGE]: locale });
  }, [locale]);

  const { urlParams } = useUrlParams();
  useEffect(() => {
    settingsUtils.getSettings().then(settings => {
      setInitialFormValues(settings);
      form?.setFieldsValue(settings);
      NiceGlobalContext.setSettings(settings);
    });
  }, [urlParams, NiceGlobalContext.themeType]);
  useEffect(() => {
    settingsUtils.getSettings().then(settings => {
      setInitialFormValues(settings);
      form?.setFieldsValue(settings);
    });

    eventEmitter.on('settings:values-change', onValuesChange);
    return () => {
      eventEmitter.off('settings:values-change', onValuesChange);
    };
  }, []);

  return (
    <>
      {msgContextHolder}
      <Modal
        title={$fmt('common.confirmReminder')}
        centered
        open={blocker.state === 'blocked'}
        okText={$fmt('common.yes')}
        cancelText={$fmt('common.cancel')}
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
            <div className="sidebar-action-box">
              <ToggleSidebarBtn
                collapsed={sidebarCollapsed}
                onCollapseChange={onCollapseChange}
              />
              <Badge
                dot={hasChanged}
                status="processing"
                color={token.colorPrimary}
                offset={[-4, 4]}
              >
                <SidebarBaseBtn
                  title={$fmt('common.save')}
                  icon={<SaveOutlined />}
                  blink={hasChanged}
                  onClick={handleSave}
                />
              </Badge>
            </div>
            <div className="sidebar-inner-content">
              <Menu
                selectedKeys={[currModule]}
                mode="vertical"
                items={blockModuleOptions}
                onClick={onModuleChange}
              />
            </div>
          </div>
        </StyledSidebarWrapper>
        <div className="main-content-wrapper settings-wrapper">
          <Form
            form={form}
            name="settings"
            key={urlParams.randomId}
            layout="vertical"
            autoComplete="off"
            onFinish={onFinish}
            onValuesChange={onValuesChange}
          >
            {/* ******************* 通用设置 ******************* */}
            <FormModuleCommon hidden={currModule !== 'common'} form={form} />

            {/* ******************* 发送标签页相关设置 ******************* */}
            <FormModuleSend hidden={currModule !== 'sendTabs'} form={form} />

            {/* ******************* 打开标签页相关设置 ******************* */}
            <FormModuleOpen hidden={currModule !== 'openTabs'} form={form} />

            {/* ******************* 网页标题相关设置 ******************* */}
            <FormModulePageTitle hidden={currModule !== 'pageTitleConfig'} form={form} />

            {/* ******************* 全局搜索相关设置 ******************* */}
            <FormModuleGlobalSearch hidden={currModule !== 'globalSearch'} form={form} />

            {/* ******************* 其他操作相关设置 ******************* */}
            <FormModuleOtherActions hidden={currModule !== 'otherActions'} form={form} />

            {/* ******************* 展示相关设置 ******************* */}
            <FormModuleDisplay hidden={currModule !== 'display'} form={form} />

            {/* ******************* 远程同步相关设置 ******************* */}
            <FormModuleSync hidden={currModule !== 'sync'} form={form} />
          </Form>
        </div>
      </StyledMainWrapper>
    </>
  );
}

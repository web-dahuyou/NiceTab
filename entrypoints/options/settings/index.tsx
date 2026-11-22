import { useContext, useState, useEffect, useMemo } from 'react';
import { Menu, Form, Button, Badge, Modal, theme, message } from 'antd';
import type { MenuProps, FormProps } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { isEqual, debounce } from 'lodash-es';
import { useBlocker } from 'react-router-dom';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { SettingsProps, TimeRange } from '~/entrypoints/types';
import { settingsUtils, snapshotUtils } from '~/entrypoints/common/storage';
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
import { requestSnapshotAction } from '~/entrypoints/common/utils/runtimeMsg';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
// import StickyFooter from '~/entrypoints/common/components/StickyFooter';

import SidebarBaseBtn from '~/entrypoints/options/components/SidebarBaseBtn';

import FormModuleCommon from './FormModuleCommon';
import FormModuleSend from './FormModuleSend';
import FormModuleOpen from './FormModuleOpen';
import FormModulePageTitle from './FormModulePageTitleConfig';
import FormModuleGlobalSearch from './FormModuleGlobalSearch';
import FormModuleOtherActions from './FormModuleOtherActions';
import FormModuleDisplay from './FormModuleDisplay';
import FormModuleNewtab from './FormModuleNewtab';
import FormModuleSnapshot from './FormModuleSnapshot';
import FormModuleSync from './FormModuleSync';
import {
  StyledSidebarWrapper,
  StyledMainWrapper,
  // StyledFooterWrapper,
} from './Settings.styled';

const { LANGUAGE, SCHEDULED_SNAPSHOT_LIMIT, AUTO_SYNC_TIME_RANGES } = ENUM_SETTINGS_PROPS;

type MenuItem = Required<MenuProps>['items'][number];

function handleTimeRanges(timeRanges?: TimeRange[]): TimeRange[] {
  return (timeRanges || []).map(range => [
    range?.[0] || defaultTimeRange[0],
    range?.[1] || defaultTimeRange[1],
  ]);
}

async function getFormSettings() {
  const [settings, limit] = await Promise.all([
    settingsUtils.getSettings(),
    snapshotUtils.getScheduledLimit(),
  ]);
  return { ...settings, [SCHEDULED_SNAPSHOT_LIMIT]: limit };
}

export default function Settings() {
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt, locale } = useIntlUtls();
  const [messageApi, msgContextHolder] = message.useMessage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const { token } = theme.useToken();

  const onCollapseChange = (status: boolean) => {
    setSidebarCollapsed(status);
  };
  const onSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
  };

  const [form] = Form.useForm();
  const [modal, modalContext] = Modal.useModal();

  const [currModule, setCurrModule] = useState<string>('common');
  const blockModuleOptions: MenuItem[] = useMemo(() => {
    const _options: MenuItem[] = [
      {
        key: 'common',
        label: $fmt('settings.block.common'),
      },
      {
        key: 'sendTabs',
        label: $fmt('settings.block.sendTabs'),
      },
      {
        key: 'openTabs',
        label: $fmt('settings.block.openTabs'),
      },
      {
        key: 'pageTitleConfig',
        label: $fmt('settings.block.pageTitleConfig'),
      },
      {
        key: 'otherActions',
        label: $fmt('settings.block.otherActions'),
      },
      {
        key: 'display',
        label: $fmt('settings.block.display'),
      },
      {
        key: 'newtab',
        label: $fmt('settings.block.newtab'),
      },
      {
        key: 'snapshot',
        label: $fmt('settings.block.snapshot'),
      },
      {
        key: 'sync',
        label: $fmt('settings.block.sync'),
      },
      {
        key: 'globalSearch',
        label: $fmt('settings.block.globalSearch'),
      },
    ];

    return _options.map(item => ({ ...item, icon: <SettingOutlined /> }) as MenuItem);
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
    const { [SCHEDULED_SNAPSHOT_LIMIT]: limit, ...generalValues } = values;
    const newSettings = {
      ...settings,
      ...generalValues,
      [AUTO_SYNC_TIME_RANGES]: handleTimeRanges(values[AUTO_SYNC_TIME_RANGES]),
    };
    if (
      !browser.extension.inIncognitoContext &&
      typeof limit === 'number' &&
      initialFormValues &&
      limit !== initialFormValues[SCHEDULED_SNAPSHOT_LIMIT]
    ) {
      try {
        let result = await requestSnapshotAction({ action: 'setLimit', limit });
        while (result.status === 'confirm') {
          const confirmedIds = result.recordIds;
          const confirmed = await modal.confirm({
            title: $fmt('common.confirmReminder'),
            content: $fmt({
              id: 'settings.snapshotTrimConfirm',
              values: { count: confirmedIds.length },
            }),
          });
          // 取消裁剪时继续保存其他设置，随后读回本机上限。
          if (!confirmed) break;
          result = await requestSnapshotAction({
            action: 'setLimit',
            limit,
            confirmedIds,
          });
        }
        if (result.status === 'failed') throw new Error('Unable to save snapshot limit');
      } catch (error) {
        console.warn('Unable to save snapshot limit', error);
        messageApi.error(
          $fmt({ id: 'common.actionFailed', values: { action: $fmt('common.save') } }),
        );
        return;
      }
    }
    console.log('Save Success: newSettings', newSettings);

    await settingsUtils.setSettings(newSettings);
    const savedSettings = settingsUtils.settings;
    const savedFormValues = {
      ...savedSettings,
      [SCHEDULED_SNAPSHOT_LIMIT]: await snapshotUtils.getScheduledLimit(),
    };
    const {
      language = defaultLanguage,
      themeType = settingsUtils.initialSettings.themeType,
    } = savedSettings;
    form.setFieldsValue(savedFormValues);
    NiceGlobalContext.setSettings(savedSettings);
    sendRuntimeMessage({ msgType: 'setLocale', data: { locale: language } });
    sendRuntimeMessage({
      msgType: 'setThemeType',
      data: { themeType },
    });
    reloadOtherAdminPage();

    const customMessages = getCustomLocaleMessages(language);
    messageApi.success(customMessages['common.saveSuccess']);
    setInitialFormValues(values => ({
      ...values,
      ...savedFormValues,
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
    getFormSettings().then(settings => {
      setInitialFormValues(settings);
      form?.setFieldsValue(settings);
      NiceGlobalContext.setSettings(settings);
    });
  }, [urlParams, NiceGlobalContext.themeType]);
  useEffect(() => {
    getFormSettings().then(settings => {
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
      {modalContext}
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
        style={
          {
            '--sidebar-grid-col': `${sidebarCollapsed ? 0 : sidebarWidth}px`,
            '--right-panel-grid-col': '0px',
          } as React.CSSProperties
        }
      >
        <StyledSidebarWrapper
          className="sidebar"
          collapsed={sidebarCollapsed}
          sidebarWidth={sidebarWidth}
          initialWidth={240}
          onCollapseChange={onCollapseChange}
          onWidthChange={onSidebarWidthChange}
          sideActionBox={
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
          }
          innerContent={
            <Menu
              selectedKeys={[currModule]}
              mode="vertical"
              items={blockModuleOptions}
              onClick={onModuleChange}
            />
          }
        />
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

            {/* ******************* 新标签页相关设置 ******************* */}
            <FormModuleNewtab hidden={currModule !== 'newtab'} form={form} />

            {/* ******************* 快照设置 ******************* */}
            <FormModuleSnapshot
              hidden={currModule !== 'snapshot'}
              form={form}
              savedLimit={initialFormValues?.[SCHEDULED_SNAPSHOT_LIMIT]}
            />

            {/* ******************* 远程同步相关设置 ******************* */}
            <FormModuleSync hidden={currModule !== 'sync'} form={form} />
          </Form>
        </div>
      </StyledMainWrapper>
    </>
  );
}

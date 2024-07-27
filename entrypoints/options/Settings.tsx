import React, { useContext, useEffect, useState } from 'react';
import { Form, Button, Radio, message } from 'antd';
import type { FormProps } from 'antd';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils } from '~/entrypoints/common/storage';
import { ENUM_SETTINGS_PROPS, defaultLanguage } from '~/entrypoints/common/constants';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';

const {
  LANGUAGE,
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TABS,
  DELETE_AFTER_RESTORE,
  DELETE_UNLOCKED_EMPTY_GROUP,
  ALLOW_DUPLICATE_TABS,
  ALLOW_DUPLICATE_GROUPS,
} = ENUM_SETTINGS_PROPS;

const module = 'settings'; // locale module name

export default function Settings() {
  const NiceGlobalContext = useContext(GlobalContext);
  const { $fmt, locale } = useIntlUtls();
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm();
  const onFinish: FormProps<SettingsProps>['onFinish'] = async (values) => {
    console.log('Save Success:', values);
    const newSettings = { ...settingsUtils.initialSettings, ...values };

    await settingsUtils.setSettings(newSettings);
    NiceGlobalContext.setLocale(newSettings.language);
    const customMessages = getCustomLocaleMessages(newSettings.language || defaultLanguage);
    messageApi.success(customMessages['common.saveSuccess']);
  };

  useEffect(() => {
    form?.setFieldValue(LANGUAGE, locale);
  }, [locale]);
  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      form?.setFieldsValue(settings);
    });
  }, []);

  return <>
    { contextHolder }
    <div className="settings-wrapper">
      <Form
        form={form}
        name="settings"
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item<SettingsProps>
          label={$fmt({id: `${module}.${LANGUAGE}`, values: {mark: '：'}})}
          name={LANGUAGE}
        >
          <Radio.Group>
            <Radio value="zh-CN"> 中文简体 </Radio>
            <Radio value="en-US"> English </Radio>
          </Radio.Group>
        </Form.Item>
        {/* 启动浏览器时是否自动打开NiceTab管理后台 */}
        <Form.Item<SettingsProps>
          label={$fmt({id: `${module}.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}`, values: {mark: '：'}})}
          name={OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}.yes`)} </Radio>
            <Radio value={false}> {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>
        {/* 是否固定管理后台 */}
        <Form.Item<SettingsProps>
          label={$fmt({id: `${module}.${AUTO_PIN_ADMIN_TAB}`, values: {mark: '：'}})}
          name={AUTO_PIN_ADMIN_TAB}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${AUTO_PIN_ADMIN_TAB}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${AUTO_PIN_ADMIN_TAB}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>
        {/* 是否发送固定标签页 */}
        <Form.Item<SettingsProps>
          label={$fmt({ id: `${module}.${ALLOW_SEND_PINNED_TABS}`, values: {mark: '：'}})}
          name={ALLOW_SEND_PINNED_TABS}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${ALLOW_SEND_PINNED_TABS}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${ALLOW_SEND_PINNED_TABS}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>
        {/* 发送标签页后是否打开管理后台 */}
        {/* <Form.Item<SettingsProps>
          label={<div>{$fmt({ id: `${module}.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}`, values: {mark: '：'}})}：</div>}
          name={OPEN_ADMIN_TAB_AFTER_SEND_TABS}
          style={{ display: 'none' }}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${OPEN_ADMIN_TAB_AFTER_SEND_TABS}.no`)} </Radio>
          </Radio.Group>
        </Form.Item> */}
        {/* 发送标签页后是否关闭标签页 */}
        <Form.Item<SettingsProps>
          label={$fmt({ id: `${module}.${CLOSE_TABS_AFTER_SEND_TABS}`, values: {mark: '：'}})}
          name={CLOSE_TABS_AFTER_SEND_TABS}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${CLOSE_TABS_AFTER_SEND_TABS}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${CLOSE_TABS_AFTER_SEND_TABS}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>
        {/* 恢复标签页/标签组时是否从列表中删除 */}
        <Form.Item<SettingsProps>
          label={$fmt({ id: `${module}.${DELETE_AFTER_RESTORE}`, values: {mark: '：'}})}
          name={DELETE_AFTER_RESTORE}
        >
          <Radio.Group>
            <Radio value={false}> {$fmt(`${module}.${DELETE_AFTER_RESTORE}.no`)} </Radio>
            <Radio value={true}> {$fmt(`${module}.${DELETE_AFTER_RESTORE}.yes`)}</Radio>
          </Radio.Group>
        </Form.Item>
        {/* 是否删除未锁定的空标签组 */}
        <Form.Item<SettingsProps>
          label={$fmt({ id: `${module}.${DELETE_UNLOCKED_EMPTY_GROUP}`, values: {mark: '：'}})}
          name={DELETE_UNLOCKED_EMPTY_GROUP}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${DELETE_UNLOCKED_EMPTY_GROUP}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${DELETE_UNLOCKED_EMPTY_GROUP}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>

        {/* 是否允许重复的标签组 */}
        <Form.Item<SettingsProps>
          label={$fmt({ id: `${module}.${ALLOW_DUPLICATE_GROUPS}`, values: {mark: '：'}})}
          name={ALLOW_DUPLICATE_GROUPS}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${ALLOW_DUPLICATE_GROUPS}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${ALLOW_DUPLICATE_GROUPS}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>

        {/* 是否允许重复的标签页 */}
        <Form.Item<SettingsProps>
          label={$fmt({ id: `${module}.${ALLOW_DUPLICATE_TABS}`, values: {mark: '：'}})}
          name={ALLOW_DUPLICATE_TABS}
        >
          <Radio.Group>
            <Radio value={true}> {$fmt(`${module}.${ALLOW_DUPLICATE_TABS}.yes`)}</Radio>
            <Radio value={false}> {$fmt(`${module}.${ALLOW_DUPLICATE_TABS}.no`)} </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {$fmt('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  </>
}

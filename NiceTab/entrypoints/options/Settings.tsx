import React, { useEffect, useState } from 'react';
import { Form, Button, Radio, message } from 'antd';
import type { FormProps } from 'antd';
import styled from 'styled-components';
import type { SettingsProps } from '~/entrypoints/types';
import { settingsUtils } from '~/entrypoints/common/storage';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';

const {
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TAB,
  DELETE_AFTER_RESTORE,
} = ENUM_SETTINGS_PROPS;

const StyledWrapper = styled.div``;

export default function Settings() {
  const [messageApi, contextHolder] = message.useMessage();
  const [visible, setVisible] = useState(false);
  const [initialSettings, setInitialSettings] = useState<SettingsProps>(
    settingsUtils.initialSettings
  );
  const [form] = Form.useForm();
  const onFinish: FormProps<SettingsProps>['onFinish'] = async (values) => {
    // console.log('Save Success:', values);
    await settingsUtils.setSettings(values);
    messageApi.success('保存成功');
  };

  useEffect(() => {
    settingsUtils.getSettings().then((settings) => {
      setInitialSettings(settings);
      // form.setFieldsValue(settings);
      setVisible(true);
    });
  }, []);

  return <>
    { contextHolder }
    { visible && (
      <StyledWrapper className="settings-wrapper">
        <Form
          form={form}
          name="settings"
          layout="vertical"
          initialValues={initialSettings}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<SettingsProps>
            label="启动浏览器时是否自动打开NiceTab管理后台："
            name={OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH}
          >
            <Radio.Group>
              <Radio value={false}> 不自动打开NiceTab管理后台 </Radio>
              <Radio value={true}> 自动打开NiceTab管理后台（推荐） </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<SettingsProps>
            label="是否固定NiceTab管理后台："
            name={AUTO_PIN_ADMIN_TAB}
          >
            <Radio.Group>
              <Radio value={false}> 不自动固定NiceTab管理后台 </Radio>
              <Radio value={true}> 自动固定NiceTab管理后台（推荐）</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<SettingsProps>
            label="发送标签页时-是否发送固定标签页到NiceTab："
            name={ALLOW_SEND_PINNED_TAB}
          >
            <Radio.Group>
              <Radio value={false}> 不要发送固定标签页 </Radio>
              <Radio value={true}> 允许发送固定标签页 </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<SettingsProps>
            label="发送标签页时-是否打开NiceTab管理后台："
            name={OPEN_ADMIN_TAB_AFTER_SEND_TABS}
          >
            <Radio.Group>
              <Radio value={false}> 不要自动打开NiceTab管理后台 </Radio>
              <Radio value={true}> 自动打开NiceTab管理后台 </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<SettingsProps>
            label="发送标签页时-是否自动关闭标签页："
            name={CLOSE_TABS_AFTER_SEND_TABS}
          >
            <Radio.Group>
              <Radio value={false}> 不要自动关闭标签页 </Radio>
              <Radio value={true}> 自动关闭标签页 </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<SettingsProps>
            label="恢复标签页/标签组时："
            name={DELETE_AFTER_RESTORE}
          >
            <Radio.Group>
              <Radio value={false}> 保留在NiceTab列表中（推荐） </Radio>
              <Radio value={true}> 从NiceTab列表中删除（保留固定标签页）</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </StyledWrapper>
    )}
  </>
}

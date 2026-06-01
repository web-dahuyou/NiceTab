import { useRef, useCallback, useEffect, useContext } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import type { InputRef } from 'antd';
import { ContentGlobalContext } from '~/entrypoints/content/context';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

type CreateFormProps = {
  name?: string;
};

interface ModalProps {
  visible: boolean;
  createType: 'tag' | 'tabGroup';
  onOk?: (name: string) => void;
  onCancel?: () => void;
}

export default function NodeCreateModal({
  visible = false,
  createType,
  onOk,
  onCancel,
}: ModalProps) {
  const { $fmt } = useIntlUtls();
  const contentContext = useContext(ContentGlobalContext);
  const [form] = Form.useForm();
  const nameInputRef = useRef<InputRef>(null);

  const title = createType === 'tag' ? $fmt('home.addTag') : $fmt('home.createTabGroup');

  // 确认
  const handleModalConfirm = useCallback(() => {
    form
      .validateFields()
      .then(() => {
        const { name } = form.getFieldsValue();
        onOk?.(name);
        form.resetFields();
      })
      .catch(() => {
        console.log('必填项校验失败');
      });
  }, [onOk, form]);

  // 取消
  const handleModalCancel = useCallback(() => {
    form.resetFields();
    onCancel?.();
  }, [onCancel, form]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 30);
    }
  }, [visible, form]);

  return (
    <Modal
      title={title}
      width={400}
      centered
      getContainer={() => contentContext.rootWrapper}
      open={visible}
      onOk={handleModalConfirm}
      onCancel={handleModalCancel}
    >
      <Form
        form={form}
        name="node-create-form"
        autoComplete="off"
        onFinish={handleModalConfirm}
      >
        <Form.Item<CreateFormProps>
          label={$fmt('common.name')}
          name={'name'}
          rules={[{ required: true }]}
        >
          <Input ref={nameInputRef} maxLength={40} />
        </Form.Item>

        <Form.Item style={{ display: 'none' }}>
          <Button type="primary" htmlType="submit">
            {$fmt('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

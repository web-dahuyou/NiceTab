import { useRef, useCallback, useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import type { InputRef } from 'antd';
import { TabItem } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

type EditTabFormProps = {
  title?: string;
  url?: string;
};

interface ModalProps {
  visible: boolean;
  data: TabItem;
  type?: 'edit' | 'add';
  title?: string;
  onOk?: (newData: TabItem) => void;
  onCancel?: () => void;
}

export default function TabItemEditModal({
  visible = false,
  data,
  type = 'edit',
  title,
  onOk,
  onCancel,
}: ModalProps) {
  const { $fmt } = useIntlUtls();
  const [form] = Form.useForm();
  const titleInputRef = useRef<InputRef>(null);

  const modalTitle = useMemo(() => {
    if (title) return title;
    const typeLabel = type === 'edit' ? $fmt('common.edit') : $fmt('common.add');
    return `${typeLabel} ${$fmt('home.tab')}`;
  }, [title, type, $fmt]);

  // 确认编辑
  const handleModalConfirm = useCallback(() => {
    form
      .validateFields()
      .then(() => {
        const newData = form.getFieldsValue();
        onOk?.({ ...data, ...newData });
      })
      .catch(() => {
        console.log('必填项校验失败');
      });
  }, [data, onOk]);
  // 取消编辑
  const handleModalCancel = useCallback(() => {
    form.resetFields();
    onCancel?.();
  }, []);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 30);
    }
  }, [visible]);

  return (
    <Modal
      title={modalTitle}
      width={600}
      centered
      open={visible}
      onOk={handleModalConfirm}
      onCancel={handleModalCancel}
    >
      <Form
        form={form}
        name="edit-tab-form"
        initialValues={data}
        autoComplete="off"
        onFinish={handleModalConfirm}
      >
        <Form.Item<EditTabFormProps>
          label={$fmt('common.name')}
          name={'title'}
          rules={[{ required: true }]}
        >
          <Input ref={titleInputRef} />
        </Form.Item>
        <Form.Item<EditTabFormProps>
          label={$fmt('common.url')}
          name={'url'}
          rules={[{ required: true }]}
        >
          <Input />
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

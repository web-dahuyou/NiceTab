import { useCallback } from 'react';
import { theme, Modal, Form, Input } from 'antd';
import { TabItem } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import { StyledModalContent } from './TabListItem.styled';


type EditTabFormProps = {
  title?: string;
  url?: string;
};

interface ModalProps {
  visible: boolean;
  data: TabItem;
  onOk?: (newData: TabItem) => void;
  onCancel?: () => void;
}

export default function TabItemEditModal({
  visible = false,
  data,
  onOk,
  onCancel,
}: ModalProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [form] = Form.useForm();

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

  return (
    <Modal
      title={`${$fmt('common.edit')} - ${$fmt('home.tab')}`}
      width={600}
      open={visible}
      onOk={handleModalConfirm}
      onCancel={handleModalCancel}
    >
      <StyledModalContent>
        <Form form={form} name="edit-tab-form" initialValues={data} autoComplete="off">
          <Form.Item<EditTabFormProps>
            label={$fmt('common.name')}
            name={'title'}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item<EditTabFormProps>
            label={$fmt('common.url')}
            name={'url'}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </StyledModalContent>
    </Modal>
  );
}

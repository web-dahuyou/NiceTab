import { Popconfirm } from 'antd';

type ConfirmProps = {
  title: string,
  description: string,
  okText?: string,
  cancelText?: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  children?: React.ReactNode
}
export default function Confirm({
  title, description, okText, cancelText, onConfirm, onCancel,
  children
}: ConfirmProps) {
  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={() => onConfirm?.()}
      onCancel={() => onCancel?.()}
      okText={okText || '确认'}
      cancelText={cancelText || '取消'}
    >
      {children}
    </Popconfirm>
  )
}
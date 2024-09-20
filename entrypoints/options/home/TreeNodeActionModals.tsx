import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';
import type {
  RenderTreeNodeActionProps,
  MoveToCallbackProps,
} from './types';

export interface ModalViewProps {
  open: boolean;
  actionParams?: RenderTreeNodeActionProps;
  onCancel?: () => void;
}

export function useTreeNodeAction(actionFn?: (props: RenderTreeNodeActionProps) => void) {
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [moveToModalVisible, setMoveToModalVisible] = useState(false);
  const [actionParams, setActionParams] = useState<RenderTreeNodeActionProps>();
  const onAction = useCallback(
    (props: RenderTreeNodeActionProps) => {
      setActionParams(props);
      if (props.actionName === 'remove') {
        setRemoveModalVisible(true);
      } else if (props.actionName === 'moveTo') {
        setMoveToModalVisible(true);
      } else {
        actionFn?.(props);
      }
    },
    [actionFn]
  );

  const closeModal = useCallback((type: RenderTreeNodeActionProps['actionName']) => {
    setActionParams(undefined as any);
    if (type === 'remove') {
      setRemoveModalVisible(false);
    } else if (type === 'moveTo') {
      setMoveToModalVisible(false);
    }
  }, []);

  return {
    onAction,
    actionParams,
    removeModalVisible,
    moveToModalVisible,
    closeModal,
  };
}

// 删除分类、标签组
export function RemoveActionModal({
  open = false,
  actionParams,
  onOk,
  onCancel,
}: ModalViewProps & {
  onOk?: (props: RenderTreeNodeActionProps) => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { $fmt } = useIntlUtls();
  const removeDesc = useMemo(() => {
    const { node } = actionParams || {};
    const typeName = $fmt(`home.${node?.type || 'tag'}`);
    return $fmt({
      id: 'home.removeDesc',
      values: {
        type: `${typeName}${node?.title ? ` <strong>[${node.title}]</strong>` : ''}`,
      },
    });
  }, [actionParams?.node]);

  const handleOk = useCallback(() => {
    setModalVisible(false);
    onOk?.(actionParams!);
  }, [actionParams, onOk]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    setModalVisible(open);
  }, [open]);

  return modalVisible ? (
    <Modal
      title={$fmt('home.removeTitle')}
      width={400}
      open={modalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div dangerouslySetInnerHTML={{ __html: removeDesc }}></div>
    </Modal>
  ) : null;
}
// 移动到弹窗
export function MoveToActionModal({
  open = false,
  actionParams,
  onOk,
  onCancel,
}: ModalViewProps & {
  onOk?: ({ moveData, targetData }: MoveToCallbackProps) => void;
}) {
  const { modalVisible, openModal, onConfirm, onClose, moveData } = useMoveTo();

  const handleOpen = useCallback(() => {
    const { node } = actionParams || {};
    openModal({ tagId: node?.key as string });
  }, [actionParams, openModal]);

  useEffect(() => {
    handleOpen();
  }, [open]);

  return modalVisible ? (
    <MoveToModal
      visible={modalVisible}
      moveData={moveData}
      onOk={(targetData) => {
        onConfirm(() => {
          onOk?.({ targetData });
        });
      }}
      onCancel={() => {
        onClose();
        onCancel?.();
      }}
    />
  ) : null;
}

import { useState } from "react";
import type { MoveDataProps } from '../types';

export default function useMoveTo() {
  const [modalVisible, setModalVisible] = useState(false);
  const [moveData, setMoveData] = useState<MoveDataProps>();

  // 打开移动到弹窗
  const openModal = ({ tagId, groupId, tabs }: MoveDataProps) => {
    setMoveData({ tagId, groupId, tabs });
    setModalVisible(true);
  };
  const onConfirm = (callback?: () => void) => {
    setModalVisible(false);
    callback?.();
  }
  // 关闭移动到弹窗
  const onClose = () => {
    setModalVisible(false);
  };

  return {
    modalVisible,
    setModalVisible,
    openModal,
    onConfirm,
    onClose,
    moveData
  };
}
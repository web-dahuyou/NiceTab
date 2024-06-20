import { useEffect, useCallback, useState } from "react";
import { useIntlUtls } from '~/entrypoints/common/hooks';
import type { MoveDataProps } from '../types';

export default function useMoveTo() {
  const { $fmt } = useIntlUtls();
  const [modalVisible, setModalVisible] = useState(false);
  const [moveData, setMoveData] = useState<MoveDataProps>();

  // 打开移动到弹窗
  const openModal = ({ groupId, tabs }: MoveDataProps) => {
    setMoveData({ groupId, tabs });
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

  useEffect(() => {

  }, []);

  return {
    modalVisible,
    setModalVisible,
    openModal,
    onConfirm,
    onClose,
    moveData
  };
}
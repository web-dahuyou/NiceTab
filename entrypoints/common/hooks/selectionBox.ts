import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { getOSInfo } from '~/entrypoints/common/utils';

const osInfo = getOSInfo();

// 框选样式组件
export const StyledSelectionBox = styled.div`
  position: absolute;
  border: 1px dashed ${(props) => props.theme.colorPrimary || '#1890ff'};
  background-color: ${(props) =>
    props.theme.type === 'light'
      ? 'rgba(24, 144, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.3)'};
  z-index: 10;
  pointer-events: none;
`;

export interface SelectionBoxDataProps extends React.CSSProperties {
  left: number;
  top: number;
  width: number;
  height: number;
  display: string;
}

export function checkIsIntersecting(
  selectionBoxData: SelectionBoxDataProps,
  target: HTMLElement
) {
  if (!target) return false;
  const { left, top, width, height } = target.getBoundingClientRect();

  return (
    selectionBoxData.left < left + width &&
    selectionBoxData.left + selectionBoxData.width > left &&
    selectionBoxData.top < top + height &&
    selectionBoxData.top + selectionBoxData.height > top
  );
}

export const initialSelectionBoxData = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  display: 'none',
};

export default function useGlobalSelectionBox({
  isAllowed,
  disabledSelectors = [],
  onMouseDown,
  onMouseUp,
}: {
  isAllowed?: boolean;
  disabledSelectors?: string[];
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}) {
  // 框选相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelectMoving, setIsSelectMoving] = useState(false);
  const [actionType, setActionType] = useState<'default' | 'meta'>('default');
  const [selectionStartData, setSelectionStartData] = useState({ x: 0, y: 0 });
  const [selectionEndData, setSelectionEndData] = useState({ x: 0, y: 0 });
  const [selectionBoxData, setSelectionBoxData] = useState<SelectionBoxDataProps>({
    ...initialSelectionBoxData,
  });

  // 处理框选逻辑
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      // 如果标签组被锁定或者不是左键点击，则不处理
      if (e.button !== 0 || !isAllowed) {
        setIsSelecting(false);
        return;
      }

      // 如果点击的是标签页中的复选框或其他元素，不启动框选
      for (let selector of disabledSelectors) {
        if ((e.target as HTMLElement)?.closest(selector)) {
          setIsSelecting(false);
          return;
        }
      }

      // 获取列表容器的位置信息
      const startX = e.clientX;
      const startY = e.clientY;

      // 设置选择起点和状态
      setSelectionStartData({ x: startX, y: startY });
      setSelectionEndData({ x: startX, y: startY });

      setSelectionBoxData({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        display: 'block',
      });
      setIsSelecting(true);
      const metaKey = osInfo.isMac ? 'meta' : 'ctrl';
      const isPressingMetaKey = !!e?.[`${metaKey}Key`];
      setActionType(isPressingMetaKey ? 'meta' : 'default');
    },
    [isAllowed]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      // 更新选择框的终点
      setSelectionEndData({ x: currentX, y: currentY });

      // 计算选择框的位置和大小
      const left = Math.min(selectionStartData.x, currentX);
      const top = Math.min(selectionStartData.y, currentY);
      const width = Math.abs(currentX - selectionStartData.x);
      const height = Math.abs(currentY - selectionStartData.y);

      setSelectionBoxData({ left, top, width, height, display: 'block' });
      setIsSelectMoving(true);
    },
    [isSelecting, selectionStartData]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;

    // 重置选择状态和选择框
    setIsSelecting(false);
    setIsSelectMoving(false);
    setSelectionBoxData({ ...initialSelectionBoxData });
    onMouseUp?.();
  }, [isSelecting]);

  // 添加和移除事件监听器
  useEffect(() => {
    // 添加鼠标点击、移动和抬起事件监听
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // 移除事件监听
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    isSelecting,
    isSelectMoving,
    actionType,
    selectionBoxData,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

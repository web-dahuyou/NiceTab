import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDragResizeOptions {
  initialWidth: number;
  currWidth: number;
  minWidth?: number;
  maxWidth?: number;
  /** 面板位置，决定拖拽方向 */
  position?: 'left' | 'right';
  onWidthChange?: (width: number) => void;
}

export default function useDragResize({
  initialWidth,
  currWidth = 240,
  minWidth = 240,
  maxWidth = 600,
  position = 'left',
  onWidthChange,
}: UseDragResizeOptions) {
  const [width, setWidth] = useState(currWidth);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const onWidthChangeRef = useRef(onWidthChange);
  onWidthChangeRef.current = onWidthChange;
  // 跟踪最新 width，供 onMouseUp 读取
  const widthRef = useRef(width);
  widthRef.current = width;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStateRef.current = { startX: e.clientX, startWidth: width };
      setDragging(true);

      const body = document.body;
      const prevSelect = body.style.userSelect;
      body.style.userSelect = 'none';

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragStateRef.current) return;
        const { startX, startWidth } = dragStateRef.current;
        const delta = startX - ev.clientX;
        const newWidth = position === 'left' ? startWidth - delta : startWidth + delta;
        const clamped = Math.min(maxWidth, Math.max(minWidth, newWidth));
        setWidth(clamped);
        onWidthChangeRef.current?.(clamped);
      };

      const onMouseUp = () => {
        dragStateRef.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        body.style.userSelect = prevSelect;
        setDragging(false);
        // 拖拽结束后通知外部最终宽度
        onWidthChangeRef.current?.(widthRef.current);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [width, position, minWidth, maxWidth],
  );

  useEffect(() => {
    setWidth(currWidth);
  }, [currWidth]);

  // 拖拽期间在 body 上添加 class，用于禁用 CSS transition
  useEffect(() => {
    if (dragging) {
      document.body.classList.add('dragging-resize');
    } else {
      document.body.classList.remove('dragging-resize');
    }
    return () => document.body.classList.remove('dragging-resize');
  }, [dragging]);

  return { width, dragging, onMouseDown, dragHandleRef };
}

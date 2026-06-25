import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

export type FlexibleOptionItem = {
  key: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

export default function FlexibleBtnList({
  list = [],
  gap = 8,
  moreBtnContent,
}: {
  list: FlexibleOptionItem[];
  gap?: number;
  moreBtnContent?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreBtnMeasureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(list.length);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // 计算可见项数量
  const calcVisibleCount = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    const moreBtnMeasure = moreBtnMeasureRef.current;
    if (!container || !measure) return;

    const containerWidth = container.offsetWidth;
    const moreBtnWidth = moreBtnMeasure ? moreBtnMeasure.offsetWidth : 0;

    const items = measure.children;
    // 最后一个子元素是 moreBtn 的测量元素，排除掉
    const itemCount = items.length - 1;
    let totalWidth = 0;
    let count = itemCount;

    for (let i = 0; i < itemCount; i++) {
      const itemWidth = (items[i] as HTMLElement).offsetWidth;
      const nextWidth = totalWidth + itemWidth + (i > 0 ? gap : 0);

      // 如果加上当前项后超出容器，需要预留"更多"按钮的空间
      const needMoreBtn = i < itemCount - 1;
      const limit = needMoreBtn ? containerWidth - moreBtnWidth - gap : containerWidth;

      if (nextWidth > limit) {
        count = i;
        break;
      }
      totalWidth = nextWidth;
    }

    // 至少显示一项
    setVisibleCount(Math.max(count, itemCount === 0 ? 0 : 1));
  }, [list, gap]);

  // 监听容器尺寸变化，防抖 200ms
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        calcVisibleCount();
      }, 200);
    });

    observer.observe(container);
    // 初始计算
    calcVisibleCount();

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [calcVisibleCount]);

  // list 变化时重新计算
  useEffect(() => {
    setVisibleCount(list.length);
    // 延迟到下一帧，确保测量元素已渲染
    requestAnimationFrame(() => {
      calcVisibleCount();
    });
  }, [list, calcVisibleCount]);

  const overflowItems = useMemo(() => list.slice(visibleCount), [list, visibleCount]);
  const visibleItems = useMemo(() => list.slice(0, visibleCount), [list, visibleCount]);

  const dropdownItems = useMemo(
    () =>
      overflowItems.map(item => ({
        key: item.key,
        label: item.content,
        disabled: item.disabled,
        onClick: item.onClick,
      })),
    [overflowItems],
  );

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', width: '100%' }}
    >
      {/* 可见项 */}
      {visibleItems.map((item, index) => (
        <div
          key={item.key}
          onClick={item.disabled ? undefined : item.onClick}
          style={{
            flexShrink: 0,
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? 0.5 : 1,
            marginLeft: index > 0 ? gap : 0,
          }}
        >
          {item.content}
        </div>
      ))}

      {/* 更多按钮 */}
      {overflowItems.length > 0 && (
        <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
          <div
            style={{
              flexShrink: 0,
              marginLeft: gap,
              cursor: 'pointer',
            }}
          >
            {moreBtnContent || <MoreOutlined />}
          </div>
        </Dropdown>
      )}

      {/* 隐藏测量区域 */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: 0,
          overflow: 'hidden',
          display: 'flex',
          whiteSpace: 'nowrap',
        }}
      >
        {list.map((item, index) => (
          <div key={item.key} style={{ marginLeft: index > 0 ? gap : 0 }}>
            {item.content}
          </div>
        ))}
        {/* 测量更多按钮宽度 */}
        <div ref={moreBtnMeasureRef} style={{ marginLeft: gap }}>
          {moreBtnContent || <MoreOutlined />}
        </div>
      </div>
    </div>
  );
}

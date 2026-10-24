import { useCallback } from 'react';
import { Flex } from 'antd';
import { classNames } from '~/entrypoints/common/utils';
import { StyledColorItem } from '~/entrypoints/common/style/Common.styled';
import type { ColorItem } from '~/entrypoints/types';

// 主题色列表
export default function ColorList({
  colors,
  activeKey,
  onItemClick,
  gap = 6,
  ...props
}: {
  colors: ColorItem[];
  activeKey?: ColorItem['key'];
  onItemClick?: (item: ColorItem) => void;
  gap?: number;
  [key: string]: any;
}) {
  const isActive = useCallback(
    (item: ColorItem) => {
      return item.key === activeKey;
    },
    [activeKey],
  );

  return (
    <Flex className="color-list" wrap="wrap" gap={gap} style={props.style}>
      {colors.map(item => (
        <StyledColorItem
          className={classNames('color-item', isActive(item) && 'active')}
          key={item.key}
          style={{ background: item.color }}
          onClick={() => onItemClick?.(item)}
        ></StyledColorItem>
      ))}
    </Flex>
  );
}

import { useCallback } from 'react';
import { theme, Flex } from 'antd';
import { classNames } from '~/entrypoints/common/utils';
import { StyledColorItem } from '~/entrypoints/common/style/Common.styled';
import type { ColorItem } from '~/entrypoints/types';

// 主题色列表
export default function ColorList({
  colors,
  onItemClick,
  gap = 6,
  ...props
}: {
  colors: ColorItem[];
  onItemClick?: (color: string) => void;
  gap?: number;
  [key: string]: any;
}) {
  const { token } = theme.useToken();
  const isActive = useCallback(
    (item: ColorItem) => {
      return token?.[`${item.key}6`] === token?.colorPrimary;
    },
    [token]
  );

  return (
    <Flex className="color-list" wrap="wrap" gap={gap} style={props.style}>
      {colors.map((item) => (
        <StyledColorItem
          className={classNames('color-item', isActive(item) && 'active')}
          key={item.key}
          style={{ background: item.color }}
          onClick={() => onItemClick?.(item.color)}
        ></StyledColorItem>
      ))}
    </Flex>
  );
}

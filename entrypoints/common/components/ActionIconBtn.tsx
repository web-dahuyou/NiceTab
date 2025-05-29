import type { ActionBtnStyle } from '~/entrypoints/types';
import { classNames } from '~/entrypoints/common/utils';
import {
  StyledActionIconBtn,
  StyledActionTextBtn,
} from '~/entrypoints/common/style/Common.styled';

export interface ActionBtnProps {
  className?: string;
  label?: string;
  btnStyle?: ActionBtnStyle;
  size?: number;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export default function ActionIconBtn({
  className,
  label,
  btnStyle = 'icon',
  size,
  disabled,
  onClick,
  children,
}: ActionBtnProps) {
  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
  }, [disabled, onClick]);

  return btnStyle === 'icon' ? (
    <StyledActionIconBtn
      className={classNames(className, disabled && 'disabled')}
      $size={size}
      title={label}
      onClick={handleClick}
    >
      {children}
    </StyledActionIconBtn>
  ) : (
    <StyledActionTextBtn
      className={classNames(className, disabled && 'disabled')}
      onClick={handleClick}
    >
      {children || label}
    </StyledActionTextBtn>
  );
}

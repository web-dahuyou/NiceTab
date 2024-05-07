import { useEffect, useRef, useState } from 'react';
import { theme, Input } from 'antd';
import type { InputProps, InputRef } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import {
  StyledEllipsis,
  StyledActionIconBtn,
} from '~/entrypoints/common/style/Common.styled';

const StyledWrapper = styled.div<{$maxWidth?: string | number, $fontSize?: string | number}>`
  display: flex;
  align-items: center;
  max-width: ${props => props.$maxWidth ? `${props.$maxWidth}px` : '100%'};
  gap: 4px;
  .text-readonly {
    font-size: ${props => props.$fontSize || 14}px;
    color: #666;
    ${StyledEllipsis}
  }
  input {
    width: 100%;
  }
`;

type CustomStyleProps = {
  maxWidth?: string | number;
  fontSize?: string | number;
  iconSize?: string | number;
}

export default function EditInput({
  type = 'text',
  value,
  maxLength,
  maxWidth,
  fontSize = 14,
  iconSize = 16,
  onValueChange,
  ...otherProps
}: InputProps & CustomStyleProps & { value: string; onValueChange: (value?: string) => void; }) {
  const { token } = theme.useToken();
  const inputRef = useRef<InputRef>(null);
  const [innerValue, setInnerValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const onFocus = () => {
    setIsEditing(true);
  };
  const onBlur = () => {
    const newValue = inputRef?.current?.input?.value || '';
    setInnerValue(newValue);
    onValueChange?.(newValue);
    setIsEditing(false);
  }
  const onPressEnter = () => {
    const newValue = inputRef?.current?.input?.value || '';
    setInnerValue(newValue);
    onValueChange?.(newValue);
    setIsEditing(false);
  }
  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 10);
  };

  useEffect(() => {
    setInnerValue(value);
  }, [value]);
  return (
    <StyledWrapper className="edit-input-wrapper" $maxWidth={maxWidth} $fontSize={fontSize}>
      {isEditing ? (
        <Input
          ref={inputRef}
          size="small"
          defaultValue={innerValue}
          maxLength={maxLength}
          variant={isEditing ? 'outlined' : 'borderless'}
          readOnly={!isEditing}
          onFocus={onFocus}
          onBlur={onBlur}
          onPressEnter={onPressEnter}
          {...otherProps}
        />
      ) : (
        <>
          <span className="text-readonly">{innerValue}</span>
          <StyledActionIconBtn
            $size={iconSize}
            $hoverColor={token.colorPrimaryHover}
            onClick={handleClick}
          >
            <EditOutlined />
          </StyledActionIconBtn>
        </>
      )}
    </StyledWrapper>
  );
}

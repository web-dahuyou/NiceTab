import React, { useEffect, useRef, useState } from 'react';
import { theme, Input } from 'antd';
import type { InputProps, InputRef } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import styled from 'styled-components';
import {
  StyledEllipsis,
  StyledActionIconBtn,
} from '~/entrypoints/common/style/Common.styled';

const StyledWrapper = styled.div<{
  $maxWidth?: string | number;
  $fontSize?: string | number;
}>`
  display: flex;
  align-items: center;
  max-width: ${(props) => (props.$maxWidth ? `${props.$maxWidth}px` : '100%')};
  gap: 4px;
  .text-readonly {
    font-size: ${(props) => props.$fontSize || 14}px;
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
};

export default function EditInput({
  type = 'text',
  value,
  disabled,
  maxLength,
  maxWidth,
  fontSize = 14,
  iconSize = 16,
  onValueChange,
  stopPropagation = true,
  onEditingStatusChange,
  ...otherProps
}: InputProps &
  CustomStyleProps & {
    value: string;
    onValueChange: (value?: string) => void;
    onEditingStatusChange?: (status: boolean) => void;
    stopPropagation?: boolean;
  }) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const inputRef = useRef<InputRef>(null);
  const [innerValue, setInnerValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const onFocus = () => {
    setIsEditing(true);
    onEditingStatusChange?.(true);
  };
  const onBlur = () => {
    const newValue = inputRef?.current?.input?.value || '';
    setInnerValue(newValue);
    onValueChange?.(newValue);
    setIsEditing(false);
    onEditingStatusChange?.(false);
  };
  const onPressEnter = () => {
    const newValue = inputRef?.current?.input?.value || '';
    setInnerValue(newValue);
    onValueChange?.(newValue);
    setIsEditing(false);
    onEditingStatusChange?.(false);
  };
  const handleClick = (e: React.MouseEvent) => {
    stopPropagation && e.stopPropagation();
    setIsEditing(true);
    onEditingStatusChange?.(true);
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 10);
  };

  useEffect(() => {
    setInnerValue(value);
  }, [value]);
  return (
    <StyledWrapper
      className="edit-input-wrapper"
      $maxWidth={maxWidth}
      $fontSize={fontSize}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          size="small"
          defaultValue={innerValue}
          maxLength={maxLength}
          variant={isEditing ? 'outlined' : 'borderless'}
          readOnly={!isEditing}
          draggable={false}
          onFocus={onFocus}
          onBlur={onBlur}
          onPressEnter={onPressEnter}
          {...otherProps}
        />
      ) : (
        <>
          <span className="text-readonly" title={innerValue}>
            {innerValue}
          </span>
          {!disabled && (
            <StyledActionIconBtn
              $size={iconSize}
              $hoverColor={token.colorPrimaryHover}
              title={$fmt('common.edit')}
              onClick={handleClick}
            >
              <EditOutlined />
            </StyledActionIconBtn>
          )}
        </>
      )}
    </StyledWrapper>
  );
}

import { useEffect, useRef, useState } from 'react';
import { theme, Input } from 'antd';
import type { InputProps, InputRef } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import {
  StyledEllipsis,
  StyledActionIconBtn,
} from '~/entrypoints/common/style/Common.styled';

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  max-width: 170px;
  gap: 4px;
  .text-readonly {
    font-size: 20px;
    color: #666;
    ${StyledEllipsis}
  }
  input {
    width: 100%;
  }
`;

const { useToken } = theme;

export default function EditInput({
  type = 'text',
  value,
  maxLength,
  onValueChange,
  ...otherProps
}: InputProps & { value: string; onValueChange: (value?: string) => void; }) {
  const { token } = useToken();
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

  return (
    <StyledWrapper className="edit-input-wrapper">
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
            $size="16"
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

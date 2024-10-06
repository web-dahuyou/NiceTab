import React, { ReactNode, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

const StyledStickyInner = styled.div<{
  $width?: number | string;
  $left?: number | string;
  $bottom: number | string;
  $bgColor?: string;
  $paddingX?: number | string;
}>`
  position: relative;
  width: 100%;
  padding: 0 ${(props) => props.$paddingX || 0}px;
  background: ${(props) => props.$bgColor || props?.theme?.colorBgContainer || '#fff'};
  &.fixed {
    position: fixed;
    width: ${(props) => (props.$width ? `${props.$width}px` : '100%')};
    left: ${(props) => `${props.$left || 0}px`};
    bottom: ${(props) => `${props.$bottom || 0}px`};
    box-shadow: 0 -3px 12px 3px ${(props) => (props?.theme?.type === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)')};
    z-index: 10;
  }
`;

interface StickyFooterProps {
  children: ReactNode;
  bottomGap?: number;
  fullWidth?: boolean;
  bgColor?: string;
  paddingX?: number | string;
}

export default function StickyFooter({
  children,
  bottomGap = 0,
  fullWidth = false,
  bgColor,
  paddingX = 0,
}: StickyFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [wrapperBounds, setWrapperBounds] = useState({
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const handleInit = () => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;
    const { left, width } = wrapper.getBoundingClientRect();
    const { height } = inner.getBoundingClientRect();
    wrapper.style.height = `${height}px`;
    setWrapperBounds({ bottom: 0, left, width, height });
  };

  useEffect(() => {
    handleInit();
    window.addEventListener('resize', handleInit);
    return () => {
      window.removeEventListener('resize', handleInit);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="sticky-footer-wrapper">
      <StyledStickyInner
        ref={innerRef}
        className="sticky-footer-inner fixed"
        $width={fullWidth ? '' : wrapperBounds.width}
        $left={fullWidth ? 0 : wrapperBounds.left}
        $bottom={bottomGap}
        $bgColor={bgColor}
        $paddingX={fullWidth ? 24 : paddingX}
      >
        {children}
      </StyledStickyInner>
    </div>
  );
}

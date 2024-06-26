import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { classNames } from '~/entrypoints/common/utils';

const StyledStickyInner = styled.div<{
  $top: number | string;
  $width?: number | string;
  $left?: number | string;
  $bgColor?: string;
  $paddingX?: number | string;
}>`
  position: relative;
  width: 100%;
  background: ${(props) => props.$bgColor || '#fff'};
  &.fixed {
    position: fixed;
    width: ${(props) => props.$width ? `${props.$width}px` : '100%'};
    top: ${(props) => `${props.$top || 0}px`};
    left: ${(props) => `${props.$left || 0}px`};
    padding: ${(props) => `0 ${props.$paddingX || 0}px`};
    box-shadow: 0 2px 12px 1px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }
`;

interface StickyBoxProps {
  children: ReactNode;
  topGap?: number;
  fullWidth?: boolean;
  bgColor?: string;
  paddingX?: number;
}

export function StickyBox({ children, topGap = 0, fullWidth = false, bgColor = '#fff', paddingX = 0 }: StickyBoxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [wrapperBounds, setWrapperBounds] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [fixed, setFixed] = useState(false);

  const handleScroll = () => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;
    const { top, left, width } = wrapper.getBoundingClientRect();
    const { height } = inner.getBoundingClientRect();
    wrapper.style.height = `${height}px`;
    setWrapperBounds({ top, left, width, height });

    setFixed(top <= topGap);
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;
    const { top, left, width } = wrapper.getBoundingClientRect();
    const { height } = inner.getBoundingClientRect();
    wrapper.style.height = `${height}px`;
    setWrapperBounds({ top, left, width, height });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="sticky-box-wrapper">
      <StyledStickyInner
        ref={innerRef}
        className={classNames('sticky-box-inner', fixed && 'fixed')}
        $width={fullWidth ? '100%' : wrapperBounds.width}
        $left={fullWidth ? 0 : wrapperBounds.left}
        $top={topGap}
        $bgColor={bgColor}
        $paddingX={fullWidth ? wrapperBounds.left : paddingX}
      >
        {children}
      </StyledStickyInner>
    </div>
  );
}

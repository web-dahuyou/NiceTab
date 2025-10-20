import React from 'react';
import styled from 'styled-components';

const StyledDrawerTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export default function DrawerTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <StyledDrawerTitleWrapper>
      <div className="title">{title}</div>
      {children && <div className="extra">{children}</div>}
    </StyledDrawerTitleWrapper>
  );
}

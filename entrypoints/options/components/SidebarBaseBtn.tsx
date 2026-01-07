import { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

const StyledActionBtn = styled.div<{ $blink?: boolean }>`
  display: inline-block;
  transform-origin: center;
  will-change: opacity, transform;
  ${props => (props.$blink ? 'animation: nt-blink 1s ease-in-out infinite;' : '')}

  @keyframes nt-blink {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

export default function SidebarBaseBtn({
  title,
  icon,
  onClick,
  blink,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  blink?: boolean;
}) {
  const { $fmt } = useIntlUtls();

  return (
    <StyledActionBtn $blink={blink} title={title} onClick={onClick}>
      <Button icon={icon}></Button>
    </StyledActionBtn>
  );
}

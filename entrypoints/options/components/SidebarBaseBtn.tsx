import { ReactNode } from 'react';
import { Button } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function SidebarBaseBtn({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  const { $fmt } = useIntlUtls();

  return (
    <div className="action-icon" title={title} onClick={onClick}>
      <Button icon={icon}></Button>
    </div>
  );
}

import { useCallback } from 'react';
import { Button } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function ToggleSidebarBtn({
  collapsed = false,
  position = 'left',
  onCollapseChange,
}: {
  collapsed?: boolean;
  position?: 'left' | 'right';
  onCollapseChange?: (status: boolean) => void;
}) {
  const { $fmt } = useIntlUtls();

  const handleToggle = useCallback(() => {
    onCollapseChange?.(!collapsed);
  }, [collapsed]);

  return (
    <div
      className="action-icon"
      title={$fmt(`common.${collapsed ? 'expand' : 'collapse'}`)}
      style={{
        transform: `rotate(${position === 'left' ? 0 : 180}deg)`,
      }}
      onClick={handleToggle}
    >
      <Button
        icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
      ></Button>
    </div>
  );
}

import { useCallback } from 'react';
import { Button } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function ToggleSidebarBtn({
  collapsed = false,
  onCollapseChange,
}: {
  collapsed?: boolean;
  onCollapseChange?: (status: boolean) => void;
}) {
  const { $fmt } = useIntlUtls();

  const handleToggle = useCallback(() => {
    onCollapseChange?.(!collapsed);
  }, [collapsed]);

  return (
    <div
      className="action-icon"
      title={$fmt({
        id: `home.${collapsed ? 'expand' : 'collapse'}`,
        values: { name: $fmt('common.sidebar') },
      })}
      onClick={handleToggle}
    >
      <Button
        icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
      ></Button>
    </div>
  );
}

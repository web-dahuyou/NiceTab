import { useState, useCallback } from 'react';
import { theme, Button } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function ToggleSidebarBtn({
  onCollapseChange,
}: {
  onCollapseChange?: (status: boolean) => void;
}) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleToggle = useCallback(() => {
    setCollapsed(!collapsed);
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

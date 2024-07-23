import { useState, useCallback } from 'react';
import { theme } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
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
      className="toggle-icon"
      title={$fmt({
        id: `home.${collapsed ? 'expand' : 'collapse'}`,
        values: { name: $fmt('common.sidebar') },
      })}
      onClick={handleToggle}
    >
      <StyledActionIconBtn
        className="btn-collapse"
        $size={14}
        $color="#999"
        $hoverColor="#999"
        $hoverScale={1}
      >
        {collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
      </StyledActionIconBtn>
    </div>
  );
}

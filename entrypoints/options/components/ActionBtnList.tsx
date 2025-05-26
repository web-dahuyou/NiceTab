import { theme, Space, Divider, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { ActionBtnStyle } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import ActionIconBtn from '~/entrypoints/common/components/ActionIconBtn.tsx';

export interface ActionOptionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  validator?: () => boolean;
  onClick?: () => void;
}

export default function ActionBtnList({
  actionBtnStyle = 'text',
  outerList = [],
  innerList = [],
  iconSize = 16,
}: {
  actionBtnStyle?: ActionBtnStyle;
  outerList: ActionOptionItem[];
  innerList?: ActionOptionItem[];
  iconSize?: number;
}) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  return (
    <Space
      className="group-action-btns"
      size={actionBtnStyle === 'text' ? 0 : 20}
      split={
        actionBtnStyle === 'text' ? (
          <Divider type="vertical" style={{ background: token.colorBorder }} />
        ) : null
      }
    >
      {outerList.map((item) => (
        <ActionIconBtn
          className="action-btn"
          key={item.key}
          label={item.label}
          btnStyle={actionBtnStyle}
          size={iconSize}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          {actionBtnStyle === 'icon' ? item.icon : item.label}
        </ActionIconBtn>
      ))}
      {innerList.length > 0 && (
        <Dropdown menu={{ items: innerList }}>
          <span className="action-btn">
            <ActionIconBtn
              label={$fmt('common.more')}
              btnStyle={actionBtnStyle}
              size={iconSize}
            >
              {actionBtnStyle === 'icon' ? <MoreOutlined /> : $fmt('common.more')}
            </ActionIconBtn>
          </span>
        </Dropdown>
      )}
    </Space>
  );
}

import type { GetProp, MenuProps } from 'antd';
import { theme, Space, Divider, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

import { ActionBtnStyle } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

import ActionDropdown from './ActionDropdown';
import ActionIconBtn from './ActionIconBtn.tsx';

type menuItem = GetProp<MenuProps, 'items'>[number];
export type ActionOptionItem = menuItem & {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  hoverColor?: string;
  validator?: () => boolean;
  onClick?: () => void;
} & (
    | { btnType?: 'btn'; menuItems?: never }
    | { btnType: 'dropdown'; menuItems: NonNullable<MenuProps['items']> }
  );

export function toMenuItems(items: ActionOptionItem[]) {
  return items.map(({ btnType, menuItems, ...item }) => {
    if (btnType !== 'dropdown') return item;
    return {
      key: item.key,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      onTitleClick: ({ domEvent }: { domEvent: React.MouseEvent }) =>
        domEvent.stopPropagation(),
      children: menuItems,
    };
  });
}

export default function ActionBtnList({
  actionBtnStyle = 'text',
  outerList = [],
  innerList = [],
  iconSize = 16,
  gap = 20,
}: {
  actionBtnStyle?: ActionBtnStyle;
  outerList: ActionOptionItem[];
  innerList?: ActionOptionItem[];
  iconSize?: number;
  gap?: number;
}) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  return (
    <Space
      className="group-action-btns"
      align="center"
      size={actionBtnStyle === 'text' ? 0 : gap}
      split={
        actionBtnStyle === 'text' ? (
          <Divider type="vertical" style={{ background: token.colorBorder }} />
        ) : null
      }
    >
      {outerList.map(item => {
        const button = (
          <ActionIconBtn
            key={item.key}
            className="action-btn"
            label={item.label}
            btnStyle={actionBtnStyle}
            hoverColor={item.hoverColor}
            size={iconSize}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            {actionBtnStyle === 'icon' ? item.icon : item.label}
          </ActionIconBtn>
        );
        return item.btnType === 'dropdown' ? (
          <ActionDropdown
            key={item.key}
            items={item.menuItems}
            label={item.label}
            disabled={item.disabled}
          >
            {button}
          </ActionDropdown>
        ) : (
          button
        );
      })}
      {innerList.length > 0 && (
        <Dropdown
          menu={{
            items: toMenuItems(innerList),
            triggerSubMenuAction: 'click',
          }}
          destroyPopupOnHide
        >
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

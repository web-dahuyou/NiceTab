import React, { useCallback } from 'react';
import { theme, Tooltip, Typography, Menu, type MenuProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

type MenuItemType = Required<MenuProps>['items'][number] & {
  label: React.ReactNode;
  tip?: React.ReactNode;
};

export default function useMenus() {
  const { token } = theme.useToken();

  const createMenus = useCallback(
    (items: MenuItemType[]) => {
      return items?.map(item => ({
        ...item,
        label: item.tip ? (
          <div>
            {item.label}
            <Tooltip
              color={token.colorBgContainer}
              title={<Typography.Text>{item.tip}</Typography.Text>}
              styles={{ root: { maxWidth: '300px', width: '300px' } }}
            >
              <QuestionCircleOutlined style={{ marginLeft: '4px' }} />
            </Tooltip>
          </div>
        ) : (
          item.label
        ),
      }));
    },
    [token.colorBgContainer],
  );

  return {
    createMenus,
  };
}

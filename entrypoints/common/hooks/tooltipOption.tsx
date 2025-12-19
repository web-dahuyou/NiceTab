import type { ReactElement } from 'react';
import { theme, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

export default function useTooltipOption() {
  const { token } = theme.useToken();

  const getFormTooltipOption = ({
    title,
    icon,
    width = 320,
  }: {
    title: string;
    icon?: ReactElement;
    width?: number;
  }) => ({
    title: <Typography.Text>{title}</Typography.Text>,
    icon: icon || <QuestionCircleOutlined />,
    color: token.colorBgElevated,
    styles: { root: { maxWidth: `${width}px`, width: `${width}px` } },
  });

  return {
    getFormTooltipOption,
  };
}

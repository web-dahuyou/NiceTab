import Icon from '@ant-design/icons';
import type { GetProps } from 'antd';
import ThemeSvg from '~/assets/icon/theme.svg?react';
import TimeAscendingSvg from '~/assets/icon/time-asc.svg?react';
import TimeDescendingSvg from '~/assets/icon/time-desc.svg?react';
import RepeatSvg from '~/assets/icon/repeat.svg?react';

export type CustomIconComponentProps = GetProps<typeof Icon>;

// 主题图标
export const IconTheme = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={ThemeSvg} {...props} />
);
// 时间升序图标
export const IconTimeAscending = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={TimeAscendingSvg} {...props} />
);
// 时间降序图标
export const IconTimeDescending = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={TimeDescendingSvg} {...props} />
);
// 复制图标
export const IconRepeat = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={RepeatSvg} {...props} />
);

export default {
  IconTheme,
  IconTimeAscending,
  IconTimeDescending,
  IconRepeat,
};

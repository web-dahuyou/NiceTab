import { theme } from 'antd';
import { ENUM_COLORS, THEME_COLOR_NAMES } from '~/entrypoints/common/constants';
import type { ColorItem, ThemeColors } from '@/entrypoints/types';

export default function useThemeColors() {
  const token = theme.useToken();

  const ENUM_COLORS: Record<ThemeColors, string> = useMemo(() => {
    return THEME_COLOR_NAMES.reduce((map, name) => {
      const colorItem = (token as any)?.[name];
      if (typeof colorItem === 'string') {
        map[name] = colorItem;
      } else {
        map[name] = colorItem?.primary || colorItem?.[6] || ENUM_COLORS?.[name];
      }
      return map;
    }, {} as Record<ThemeColors, string>);
  }, [token]);

  const THEME_COLORS: ColorItem[] = useMemo(() => {
    return THEME_COLOR_NAMES.map((name) => {
      const colorItem = (token as any)?.[name];
      if (typeof colorItem === 'string') return { key: name, color: colorItem };
      return {
        key: name,
        color: colorItem?.primary || colorItem?.[6] || ENUM_COLORS?.[name],
      };
    });
  }, [token]);

  return { ENUM_COLORS, THEME_COLORS };
}

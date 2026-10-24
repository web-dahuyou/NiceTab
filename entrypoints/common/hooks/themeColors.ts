import { useContext, useMemo } from 'react';
import { GlobalContext } from '~/entrypoints/common/hooks/global';
import { getThemeColorList } from '~/entrypoints/common/constants';
import type { ColorItem } from '~/entrypoints/types';

// 主题色列表（按当前亮色/暗色模式解析对应的色值列表）
export default function useThemeColors() {
  const { themeTypeConfig } = useContext(GlobalContext);
  const themeMode = themeTypeConfig?.type === 'dark' ? 'dark' : 'light';

  const THEME_COLORS: ColorItem[] = useMemo(
    () => getThemeColorList(themeMode),
    [themeMode],
  );

  return { THEME_COLORS };
}

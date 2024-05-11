import { createContext } from 'react';
import type { ThemeProps } from '~/entrypoints/types';
import { themeUtils } from '~/entrypoints/common/storage';
import { ENUM_COLORS } from './constants';

export const ThemeContext = createContext({
  colorPrimary: ENUM_COLORS.primary,
  setThemeData: (themeData: Partial<ThemeProps>) => {
    themeUtils.setThemeData(themeData);
  },
});

export default {
  ThemeContext,
};

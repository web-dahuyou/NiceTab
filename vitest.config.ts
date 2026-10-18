import type { WxtViteConfig } from 'wxt';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  // @ts-ignore
  plugins: [WxtVitest()],
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'entrypoints/common/**/**',
      ],
      exclude: [
        'entrypoints/**/__tests__/**',
        'entrypoints/**/*.test.*',
        'entrypoints/**/*.spec.*',
        'entrypoints/types/**',
        'entrypoints/**/main.tsx',
        'entrypoints/**/*.styled.*',
        'entrypoints/common/locale/modules/**',
        'entrypoints/common/style/modules/**',
        'entrypoints/common/alarms/modules/**',
        'entrypoints/common/components/modules/**',
        'entrypoints/common/hooks/modules/**',
      ],
    },
  },
});

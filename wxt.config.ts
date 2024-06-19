import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  manifest: {
    name: 'Nice Tab Manager | 标签页管理器',
    permissions: ['storage', 'tabs', 'contextMenus', 'unlimitedStorage', 'idle'],
    homepage_url: 'https://github.com/web-dahuyou/NiceTab',
    // host_permissions: ['<all_urls>'],
  },
  vite: () => ({
    plugins: [react()],
  }),
});

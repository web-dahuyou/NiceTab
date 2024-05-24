import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  manifest: {
    name: 'Nice-Tab',
    permissions: ['storage', 'tabs', 'contextMenus', 'unlimitedStorage', 'idle', 'notifications'],
    host_permissions: ['<all_urls>'],
  },
  vite: () => ({
    plugins: [react()],
  }),
});

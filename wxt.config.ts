import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Nice Tab Manager | 标签页管理器',
    permissions: ['storage', 'tabs', 'tabGroups', 'contextMenus', 'unlimitedStorage'],
    homepage_url: 'https://github.com/web-dahuyou/NiceTab',
    // host_permissions: ['<all_urls>'],
  },
});

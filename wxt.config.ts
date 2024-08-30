import { defineConfig } from 'wxt';

export default defineConfig({
  // entrypointLoader: 'jiti',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Nice Tab Manager | 标签页管理器',
    permissions: ['storage', 'tabs', 'tabGroups', 'contextMenus', 'unlimitedStorage'],
    homepage_url: 'https://github.com/web-dahuyou/NiceTab',
    // host_permissions: ['<all_urls>'],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
      sandbox:
        "sandbox allow-scripts; script-src 'self' 'unsafe-eval' https://api.github.com https://gitee.com; object-src 'self'",
    },
  },
});

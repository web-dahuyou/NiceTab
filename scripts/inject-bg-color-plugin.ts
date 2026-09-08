import { readFileSync } from 'fs';
import { resolve } from 'path';
import { indent } from './utils';

/**
 * Vite 插件：将 init-bg-color.js 的内容内联注入到 HTML 的 <head> 中
 * 用于防止页面加载时主题切换导致的闪烁
 */
export function injectBgColorPlugin(): any {
  const scriptPath = resolve(__dirname, '../entrypoints/common/init-bg-color.js');
  let scriptContent = '';

  return {
    name: 'inject-bg-color',
    configResolved() {
      scriptContent = readFileSync(scriptPath, 'utf-8');
    },
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        return html.replace(
          '</title>',
          `</title>\n    <script>\n${indent(scriptContent, 6)}\n    </script>\n`
        );
      },
    },
  };
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import GithubSlugger from 'github-slugger';
import yargsParser from 'yargs-parser';

// 适配 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pageTitleMap = {
  GUIDE: 'User Guide',
  'GUIDE-zh': '用户指南',
};

// 复制 GitHub Markdown 样式到 public/docs/css/github-markdown.css
function ensureGithubCss() {
  const githubCssSrcPath = path.resolve(
    __dirname,
    '../node_modules/github-markdown-css/github-markdown.css',
  );
  const docsCssDir = path.resolve(__dirname, '../public/docs/css');
  const githubCssDistPath = path.resolve(docsCssDir, 'github-markdown.css');
  if (!fs.existsSync(docsCssDir)) {
    fs.mkdirSync(docsCssDir, { recursive: true });
  }
  if (fs.existsSync(githubCssSrcPath)) {
    fs.copyFileSync(githubCssSrcPath, githubCssDistPath);
  }
}

// GitHub 风格 HTML 外壳
function wrapWithHtml({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="./css/github-markdown.css" />
  <style>
    body { display: flex; justify-content: center; padding: 20px; background-color: #fff; }
    .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; width: 100%; padding: 45px; }
    @media (max-width: 767px) { .markdown-body { padding: 15px; } }
  </style>
</head>
<body>
  <article class="markdown-body">${bodyHtml}</article>
</body>
</html>`;
}

// 解析并收集 markdown 中引用到的 .md 链接（含 markdown 链接与行内 HTML 链接）
function collectReferencedMarkdownPaths(markdownContent, currentDir) {
  const results = new Set();

  // Markdown 形式: [text](./foo.md#bar)
  const mdLinkRegex = /\]\(([^\)]+?\.md)(#[^\)]*)?\)/gi;
  let m;
  while ((m = mdLinkRegex.exec(markdownContent))) {
    const rel = m[1];
    const resolved = path.resolve(currentDir, rel);
    results.add(resolved);
  }

  // HTML 形式: <a href="./foo.md#bar">
  const htmlHrefRegex = /href=["']([^"']+?\.md)(#[^"']*)?["']/gi;
  let h;
  while ((h = htmlHrefRegex.exec(markdownContent))) {
    const rel = h[1];
    const resolved = path.resolve(currentDir, rel);
    results.add(resolved);
  }

  return Array.from(results);
}

// 将 .md/.md#xxx 链接重写为 .html（锚点原样保留），并把 #hash 片段从编码还原为原文
function rewriteMdLinksToHtml(html) {
  const replaceHref = href => {
    // 仅处理以 .md 结尾（或包含 .md#fragment）的链接
    if (/\.md($|#)/i.test(href)) {
      return href.replace(/\.md(#[^\s"'>)]*)?/i, (all, frag) => `.html${frag ?? ''}`);
    }
    return href;
  };

  let nextHtml = html.replace(/href=("|')(.*?)(\1)/gi, (full, quote, url) => {
    const next = replaceHref(url);
    return `href=${quote}${next}${quote}`;
  });

  // 解码以 # 开头的中文锚点，保持可读（仅处理 hash 片段，避免影响外链）
  nextHtml = nextHtml.replace(/href=("|')#([^"']+)(\1)/gi, (full, quote, frag) => {
    try {
      const decoded = decodeURIComponent(frag);
      return `href=${quote}#${decoded}${quote}`;
    } catch (_) {
      return full;
    }
  });

  return nextHtml;
}

// 为生成后的 HTML 标题添加 GitHub 风格的 id（或覆盖已有 id）
function addGithubHeadingIds(html) {
  const slugger = new GithubSlugger();
  const decodeEntities = s =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  return html.replace(
    /<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g,
    (m, level, attrs = '', inner) => {
      const text = decodeEntities(inner.replace(/<[^>]*>/g, '')).trim();
      const id = slugger.slug(text);
      let newAttrs = attrs || '';
      if (/\sid=/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(/\sid=("|')[^"']*(\1)/i, ` id="${id}"`);
      } else {
        newAttrs = `${newAttrs ? newAttrs + ' ' : ' '}id="${id}"`;
      }
      return `<h${level}${newAttrs}>${inner}</h${level}>`;
    },
  );
}

// 针对单个 Markdown 文件进行转换
function convertSingleMarkdown(mdAbsPath, processedSet) {
  if (!fs.existsSync(mdAbsPath)) return;
  if (processedSet.has(mdAbsPath)) return; // 防重复
  processedSet.add(mdAbsPath);

  const mdDir = path.dirname(mdAbsPath);
  const mdBase = path.basename(mdAbsPath);
  const baseNameNoExt = mdBase.replace(/\.md$/i, '');
  // 将转换后的 HTML 文件创建到 public/docs 目录
  const docsDir = path.resolve(__dirname, '../public/docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const outHtmlPath = path.resolve(docsDir, `${baseNameNoExt}.html`);

  const markdown = fs.readFileSync(mdAbsPath, 'utf8');

  // 收集被引用的其他 .md
  const referenced = collectReferencedMarkdownPaths(markdown, mdDir);

  marked.setOptions({
    gfm: true,
    breaks: false,
    tables: true,
    pedantic: false,
    smartLists: true,
    smartypants: false,
  });

  let htmlBody = marked.parse(markdown);

  // 为标题补充/替换 GitHub 风格 id
  htmlBody = addGithubHeadingIds(htmlBody);

  // 将 .md 链接重写为 .html
  htmlBody = rewriteMdLinksToHtml(htmlBody);

  const wrapped = wrapWithHtml({
    title: pageTitleMap[baseNameNoExt] || '用户指南',
    bodyHtml: htmlBody,
  });
  fs.writeFileSync(outHtmlPath, wrapped, 'utf8');
  console.log(`Generated: ${outHtmlPath}`);

  // 递归转换被引用的 .md 文件（若存在）
  for (const refAbs of referenced) {
    if (fs.existsSync(refAbs) && /\.md$/i.test(refAbs)) {
      convertSingleMarkdown(refAbs, processedSet);
    }
  }
}

function main() {
  ensureGithubCss();

  const args = yargsParser(process.argv.slice(2));
  // 支持传入文件或多个文件，默认为 GUIDE-zh.md
  const inputs = args._ && args._.length > 0 ? args._ : ['GUIDE-zh.md'];

  const processed = new Set();

  for (const inputRel of inputs) {
    const mdAbsPath = path.resolve(__dirname, '..', inputRel);
    convertSingleMarkdown(mdAbsPath, processed);
  }
}

main();

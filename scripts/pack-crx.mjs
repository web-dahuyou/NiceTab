import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crx3 from 'crx3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.output', 'chrome-mv3');
const manifestPath = path.join(outDir, 'manifest.json');
// 私钥存放在 .output 目录（已 gitignore）
const keyPath = path.join(root, '.output', 'nice-tab.pem');

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ 未找到构建产物 ${manifestPath}，请先执行 pnpm build`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const version = manifest.version;
const crxPath = path.join(root, '.output', `nice-tab-${version}-chrome.crx`);

if (!fs.existsSync(keyPath)) {
  console.log(`🔑 未找到私钥，将自动生成: ${keyPath}`);
}

console.log('⚠️  该脚本只是方便本地生成crx测试安装包（非生产正式包），正式发布去Chrome Web Store 开发者面板上传zip包');

crx3([manifestPath], { keyPath, crxPath })
  .then((info) => {
    console.log('✅ CRX 打包完成:');
    console.log(`   文件: ${crxPath}`);
    console.log(`   版本: ${version}`);
    console.log(`   appId: ${info.appId}`);
    console.log('   安装方式: 开启 chrome://extensions 开发者模式后，将 .crx 文件拖入扩展管理页');
  })
  .catch((err) => {
    console.error('❌ CRX 打包失败:', err);
    process.exit(1);
  });

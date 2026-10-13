/**
 * 静态站点构建脚本
 *
 * 帽子云（MaoziYun）检测到 package.json 会按 Node 项目构建，
 * 流程是：npm install → npm run build → 把 build/ 目录作为站点根目录发布。
 * 因此必须真实产出 build/ 目录，否则报 "/src/build": not found。
 *
 * 做法：把需要发布的文件复制到 build/
 *   - 保留：*.html、images/、robots.txt、sitemap.xml、验证文件
 *   - 排除：package.json、package-lock.json、node_modules、.git、构建脚本本身
 *
 * 用 Node 实现，保证 Windows 本地与 Linux 容器行为一致。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'build');

// 需要排除的文件/目录
const EXCLUDE_NAMES = new Set([
  'node_modules',
  '.git',
  'build',
  'package.json',
  'package-lock.json',
  'build.js',
  '.gitignore',
  '.DS_Store',
]);

/** 需要原样发布的文件（精确匹配） */
const INCLUDE_FILES = new Set([
  'index.html',
  'recruit.html',
  'robots.txt',
  'sitemap.xml',
  'BingSiteAuth.xml',
  'baidu_verify.html',
  'baidu_verify_codeva-4Zqh2i052L.html',
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  // 清理旧的 build 目录，保证产物干净
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  let count = 0;

  // 1) 发布清单里的页面与配置
  for (const f of INCLUDE_FILES) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(OUT, f));
      count++;
    } else {
      console.warn(`  [skip] 缺少 ${f}`);
    }
  }

  // 2) 图片等静态资源目录
  const imgDir = path.join(ROOT, 'images');
  if (fs.existsSync(imgDir)) {
    copyDir(imgDir, path.join(OUT, 'images'));
    const imgs = fs.readdirSync(imgDir).length;
    console.log(`  images/ 已复制 ${imgs} 个文件`);
    count += imgs;
  }

  // 3) 兜底：把根目录下未排除的其他文件也带上，避免漏发
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (EXCLUDE_NAMES.has(entry.name)) continue;
    if (INCLUDE_FILES.has(entry.name)) continue;
    fs.copyFileSync(path.join(ROOT, entry.name), path.join(OUT, entry.name));
    console.log(`  附加: ${entry.name}`);
    count++;
  }

  console.log(`build 完成：共 ${count} 个文件 → build/`);
}

main();

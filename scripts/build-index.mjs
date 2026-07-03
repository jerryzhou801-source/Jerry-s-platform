/* 发布时自动运行:扫描 reports/ 和 trades/ 里的 .md 文件,
 * 读取每篇开头的 --- 标题/日期/摘要 ---,生成 index.json(按日期倒序)。
 * 您不需要手动碰 index.json —— Netlify 每次发布会自动跑这个脚本。
 * 仅用 Node 自带功能,无需安装任何依赖。 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function parseFrontmatter(text) {
  text = text.replace(/^﻿/, '');
  const m = /^---\s*\n([\s\S]*?)\n---/.exec(text);
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const mm = /^([A-Za-z0-9_]+)\s*:\s*(.*)$/.exec(line);
      if (mm) meta[mm[1].trim()] = mm[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return meta;
}

function buildIndex(dir) {
  let files;
  try { files = readdirSync(dir); } catch { return; }
  const items = files.filter(f => f.toLowerCase().endsWith('.md')).map(file => {
    const meta = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
    const dateFromName = (file.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
    return {
      title: meta.title || file.replace(/\.md$/, ''),
      date: meta.date || dateFromName,
      file,
      summary: meta.summary || ''
    };
  });
  items.sort((a, b) => (a.date < b.date ? 1 : -1));   // 日期从新到旧
  writeFileSync(join(dir, 'index.json'), JSON.stringify(items, null, 2) + '\n');
  console.log(`[build-index] ${dir}: 生成 ${items.length} 条`);
}

buildIndex('reports');
buildIndex('trades');

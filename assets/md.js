/* 轻量 Markdown 渲染器(本地,不联网、不依赖外部库)
 * 暴露两个函数:
 *   parseFrontmatter(text) -> { meta:{...}, body:"..." }  解析文件开头的 --- 元信息 ---
 *   renderMarkdown(text)   -> HTML 字符串
 * 支持:标题 # ~ ######、加粗 **、斜体 *、行内代码 `、链接、图片、
 *      无序列表 - / *、有序列表 1.、引用 >、代码块 ```、分隔线 ---、表格 | |。 */
(function (global) {
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 解析 YAML 风格 frontmatter(简单键值:title/date/summary 等)
  function parseFrontmatter(text) {
    text = String(text).replace(/^﻿/, '');            // 去掉可能的 BOM
    var m = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(text);
    if (!m) return { meta: {}, body: text };
    var meta = {};
    m[1].split('\n').forEach(function (line) {
      var mm = /^([A-Za-z0-9_一-龥]+)\s*:\s*(.*)$/.exec(line);
      if (mm) {
        var v = mm[2].trim().replace(/^["']|["']$/g, '');
        meta[mm[1].trim()] = v;
      }
    });
    return { meta: meta, body: text.slice(m[0].length) };
  }

  function inline(s) {
    s = esc(s);
    // 图片 ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" />');
    // 链接 [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // 行内代码 `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // 加粗 **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 斜体 *text*
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  }

  function renderMarkdown(text) {
    var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    var out = [], i = 0;

    function flushList(tag, items) {
      out.push('<' + tag + '>' + items.map(function (t) {
        return '<li>' + inline(t) + '</li>';
      }).join('') + '</' + tag + '>');
    }

    while (i < lines.length) {
      var line = lines[i];

      // 代码块 ```
      if (/^```/.test(line)) {
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }
      // 空行
      if (/^\s*$/.test(line)) { i++; continue; }
      // 分隔线
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr />'); i++; continue; }
      // 标题
      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) { out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); i++; continue; }
      // 引用
      if (/^\s*>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
        continue;
      }
      // 表格 |...|...| 后跟 |---|---|
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]*\|[\s:|-]*$/.test(lines[i + 1])) {
        var head = line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
          rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }));
          i++;
        }
        var t = '<table><thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        rows.forEach(function (r) { t += '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; });
        out.push(t + '</tbody></table>');
        continue;
      }
      // 无序列表
      if (/^\s*[-*]\s+/.test(line)) {
        var ul = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { ul.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
        flushList('ul', ul);
        continue;
      }
      // 有序列表
      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { ol.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
        flushList('ol', ol);
        continue;
      }
      // 普通段落(连续非空行合并)
      var para = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) &&
             !/^(#{1,6}\s|\s*>|\s*[-*]\s|\s*\d+\.\s|```|\s*\|)/.test(lines[i]) &&
             !/^\s*(-{3,}|\*{3,})\s*$/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      out.push('<p>' + inline(para.join(' ')) + '</p>');
    }
    return out.join('\n');
  }

  global.parseFrontmatter = parseFrontmatter;
  global.renderMarkdown = renderMarkdown;
})(window);

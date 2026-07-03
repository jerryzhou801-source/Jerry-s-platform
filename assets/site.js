/* 列表页 / 阅读页共用逻辑(报告、交易日志都用它) */
(function (global) {
  function byDateDesc(a, b) { return String(a.date) < String(b.date) ? 1 : -1; }

  // 列表页:读取 <dir>/index.json,按日期倒序渲染
  function renderList(opts) {
    var dir = opts.dir, articlePage = opts.articlePage, mount = document.getElementById(opts.mountId);
    fetch(dir + '/index.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('读取清单失败'); return r.json(); })
      .then(function (items) {
        items = (items || []).slice().sort(byDateDesc);
        if (!items.length) { mount.innerHTML = '<div class="empty">还没有内容。</div>'; return; }
        var ul = document.createElement('ul');
        ul.className = 'list';
        items.forEach(function (it) {
          var li = document.createElement('li');
          var href = articlePage + '?file=' + encodeURIComponent(it.file);
          li.innerHTML =
            '<span class="item-date">' + (it.date || '') + '</span>' +
            '<a class="item-title" href="' + href + '">' + (it.title || it.file) + '</a>' +
            (it.summary ? '<div class="item-sum">' + it.summary + '</div>' : '');
          ul.appendChild(li);
        });
        mount.innerHTML = '';
        mount.appendChild(ul);
      })
      .catch(function (e) { mount.innerHTML = '<div class="empty">加载失败:' + e.message + '</div>'; });
  }

  // 阅读页:根据 ?file= 读取单篇 Markdown 并渲染
  function renderArticle(opts) {
    var dir = opts.dir, listPage = opts.listPage;
    var mount = document.getElementById(opts.mountId);
    var file = new URLSearchParams(location.search).get('file');
    if (!file || /[\/\\]/.test(file)) {   // 只允许纯文件名,防目录穿越
      mount.innerHTML = '<div class="empty">没有指定文章。<a href="' + listPage + '">返回列表</a></div>';
      return;
    }
    fetch(dir + '/' + encodeURIComponent(file) + '?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('读取文章失败(' + r.status + ')'); return r.text(); })
      .then(function (text) {
        var fm = parseFrontmatter(text);
        var title = fm.meta.title || file.replace(/\.md$/, '');
        var date = fm.meta.date || '';
        document.title = title + ' · 研究笔记';
        mount.innerHTML =
          '<a class="back-link" href="' + listPage + '">← 返回列表</a>' +
          '<article class="article">' +
          (date ? '<p class="a-date">' + date + '</p>' : '') +
          '<div class="article-body">' + renderMarkdown(fm.body) + '</div>' +
          '</article>';
      })
      .catch(function (e) {
        mount.innerHTML = '<a class="back-link" href="' + listPage + '">← 返回列表</a>' +
          '<div class="empty">加载失败:' + e.message + '</div>';
      });
  }

  global.renderList = renderList;
  global.renderArticle = renderArticle;
})(window);

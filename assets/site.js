/* 列表页 / 阅读页共用逻辑(报告、交易日志都用它),支持中英双语过滤 */
(function (global) {
  function byDateDesc(a, b) { return String(a.date) < String(b.date) ? 1 : -1; }
  function lang() { return (global.i18n ? i18n.getLang() : 'zh'); }
  function tr(key, zh) { return global.i18n ? i18n.t(key) : zh; }

  // 列表页:读取 <dir>/index.json,按当前语言过滤 + 日期倒序渲染;切换语言时重绘
  function renderList(opts) {
    var dir = opts.dir, articlePage = opts.articlePage, mount = document.getElementById(opts.mountId);
    fetch(dir + '/index.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('读取清单失败'); return r.json(); })
      .then(function (all) {
        function draw() {
          var items = (all || []).filter(function (it) { return (it.lang || 'zh') === lang(); }).sort(byDateDesc);
          if (!items.length) { mount.innerHTML = '<div class="empty">' + tr('list_empty', '还没有内容。') + '</div>'; return; }
          var html = '<ul class="list">';
          items.forEach(function (it) {
            var href = articlePage + '?file=' + encodeURIComponent(it.file);
            html += '<li>' +
              '<span class="item-date">' + (it.date || '') + '</span>' +
              '<a class="item-title" href="' + href + '">' + (it.title || it.file) + '</a>' +
              (it.summary ? '<div class="item-sum">' + it.summary + '</div>' : '') +
              '</li>';
          });
          mount.innerHTML = html + '</ul>';
        }
        draw();
        document.addEventListener('langchange', draw);
      })
      .catch(function (e) { mount.innerHTML = '<div class="empty">加载失败:' + e.message + '</div>'; });
  }

  // 阅读页:根据 ?file= 读取单篇 Markdown 并渲染(文章本身已是某种语言,只翻译“返回”按钮)
  function renderArticle(opts) {
    var dir = opts.dir, listPage = opts.listPage;
    var mount = document.getElementById(opts.mountId);
    var file = new URLSearchParams(location.search).get('file');
    if (!file || /[\/\\]/.test(file)) {
      mount.innerHTML = '<div class="empty">没有指定文章。<a href="' + listPage + '">' + tr('back', '← 返回列表') + '</a></div>';
      return;
    }
    fetch(dir + '/' + encodeURIComponent(file) + '?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('读取文章失败(' + r.status + ')'); return r.text(); })
      .then(function (text) {
        var fm = parseFrontmatter(text);
        var title = fm.meta.title || file.replace(/\.md$/, '');
        var date = fm.meta.date || '';
        document.title = title + ' · 研究笔记';
        function draw() {
          mount.innerHTML =
            '<a class="back-link" href="' + listPage + '">' + tr('back', '← 返回列表') + '</a>' +
            '<article class="article">' +
            (date ? '<p class="a-date">' + date + '</p>' : '') +
            '<div class="article-body">' + renderMarkdown(fm.body) + '</div>' +
            '</article>';
        }
        draw();
        document.addEventListener('langchange', draw);
      })
      .catch(function (e) {
        mount.innerHTML = '<a class="back-link" href="' + listPage + '">' + tr('back', '← 返回列表') + '</a>' +
          '<div class="empty">加载失败:' + e.message + '</div>';
      });
  }

  global.renderList = renderList;
  global.renderArticle = renderArticle;
})(window);

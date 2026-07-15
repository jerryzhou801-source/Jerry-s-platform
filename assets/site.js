/* 列表页 / 阅读页共用逻辑(报告、交易日志都用它),支持中英双语过滤 */
(function (global) {
  function byDateDesc(a, b) { return String(a.date) < String(b.date) ? 1 : -1; }
  function lang() { return (global.i18n ? i18n.getLang() : 'zh'); }
  function tr(key, zh) { return global.i18n ? i18n.t(key) : zh; }

  // 去掉开头的 --- frontmatter ---,只留正文(用于搜索,不依赖 md.js)
  function stripFrontmatter(text) {
    return String(text).replace(/^﻿/, '').replace(/^---\s*\n[\s\S]*?\n---\s*/, '');
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  // 列表页:读取 <dir>/index.json,按语言过滤 + 日期倒序;带关键词搜索(标题/摘要/正文)。
  // 正文按需抓取当前语言的 .md 并缓存(渐进式:先出标题/摘要命中,正文加载完再补上)。
  function renderList(opts) {
    var dir = opts.dir, articlePage = opts.articlePage, mount = document.getElementById(opts.mountId);
    fetch(dir + '/index.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('读取清单失败'); return r.json(); })
      .then(function (all) {
        var query = '';
        var bodyCache = {};   // file -> 正文(小写),用于搜索

        mount.innerHTML =
          '<div class="list-search">' +
            '<input id="listSearch" type="search" autocomplete="off" spellcheck="false" />' +
            '<span id="listSearchInfo" class="ls-info"></span>' +
          '</div>' +
          '<div id="listResults"></div>';
        var input = document.getElementById('listSearch');
        var results = document.getElementById('listResults');
        var info = document.getElementById('listSearchInfo');

        function curItems() {
          return (all || []).filter(function (it) { return (it.lang || 'zh') === lang(); }).sort(byDateDesc);
        }
        function haystack(it) {
          var base = ((it.title || '') + ' ' + (it.summary || '')).toLowerCase();
          return (bodyCache[it.file] != null) ? (base + ' ' + bodyCache[it.file]) : base;
        }
        // 抓取当前语言里尚未缓存正文的文章(幂等;切换语言会补抓新语言的)
        function ensureBodies() {
          var todo = curItems().filter(function (it) { return bodyCache[it.file] == null; });
          if (!todo.length) return Promise.resolve();
          return Promise.all(todo.map(function (it) {
            return fetch(dir + '/' + encodeURIComponent(it.file) + '?t=' + Date.now())
              .then(function (r) { return r.ok ? r.text() : ''; })
              .then(function (text) { bodyCache[it.file] = stripFrontmatter(text).toLowerCase(); })
              .catch(function () { bodyCache[it.file] = ''; });
          }));
        }

        function draw() {
          var q = query.trim().toLowerCase();
          var items = curItems();
          if (q) items = items.filter(function (it) { return haystack(it).indexOf(q) >= 0; });
          if (!items.length) {
            results.innerHTML = '<div class="empty">' +
              (query.trim() ? tr('search_none', '没有匹配的文章。') : tr('list_empty', '还没有内容。')) + '</div>';
          } else {
            var html = '<ul class="list">';
            items.forEach(function (it) {
              var href = articlePage + '?file=' + encodeURIComponent(it.file);
              html += '<li>' +
                '<span class="item-date">' + (it.date || '') + '</span>' +
                '<a class="item-title" href="' + href + '">' + (it.title || it.file) + '</a>' +
                (it.summary ? '<div class="item-sum">' + it.summary + '</div>' : '') +
                '</li>';
            });
            results.innerHTML = html + '</ul>';
          }
          info.textContent = query.trim()
            ? (lang() === 'en' ? (items.length + ' found') : ('找到 ' + items.length + ' 篇'))
            : '';
        }

        function applyLangText() { input.placeholder = tr('search_ph', '搜索标题 / 摘要 / 正文…'); }

        var onType = debounce(function () {
          query = input.value;
          draw();                                          // 先按标题/摘要即时过滤
          if (query.trim()) ensureBodies().then(draw);     // 正文抓好后补上正文命中
        }, 140);
        input.addEventListener('input', onType);

        applyLangText();
        draw();
        document.addEventListener('langchange', function () {
          applyLangText();
          draw();
          if (query.trim()) ensureBodies().then(draw);
        });
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

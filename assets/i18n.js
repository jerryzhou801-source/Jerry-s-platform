/* 中英双语层:界面文字翻译 + 语言切换(记住选择,存 localStorage) */
(function (global) {
  var STR = {
    site_name:   { zh: '研究笔记', en: 'Research Notes' },
    tagline:     { zh: '油籽 · 植物油 · 生物柴油', en: 'Oilseeds · Vegoils · Biodiesel' },

    title_home:    { zh: '研究笔记 · 首页', en: 'Research Notes · Home' },
    title_reports: { zh: '报告 · 研究笔记', en: 'Reports · Research Notes' },
    title_prices:  { zh: '价格 · 研究笔记', en: 'Prices · Research Notes' },
    title_trades:  { zh: '交易日志 · 研究笔记', en: 'Trade Log · Research Notes' },
    title_about:   { zh: '关于我 · 研究笔记', en: 'About · Research Notes' },
    nav_home:    { zh: '首页', en: 'Home' },
    nav_reports: { zh: '报告', en: 'Reports' },
    nav_prices:  { zh: '价格', en: 'Prices' },
    nav_trades:  { zh: '交易日志', en: 'Trade Log' },
    nav_about:   { zh: '关于我', en: 'About' },

    home_kicker: { zh: '研究记录', en: 'Research Notes' },
    home_h1:     { zh: '市场观察,每日一记', en: 'Daily Market Notes' },
    home_p:      { zh: '这里记录我对油籽、植物油与生物柴油市场的每日观察、价格跟踪与交易复盘。',
                   en: 'Daily observations, price tracking and trade reviews across the oilseeds, vegetable oils and biodiesel markets.' },

    feat_reports_k: { zh: '每日 · 每周', en: 'Daily · Weekly' },
    feat_reports_h: { zh: '报告', en: 'Reports' },
    feat_reports_b: { zh: '阅读报告', en: 'Read reports' },
    feat_prices_k:  { zh: '手动维护', en: 'Hand-updated' },
    feat_prices_h:  { zh: '价格走势', en: 'Prices' },
    feat_prices_b:  { zh: '查看价格', en: 'View prices' },
    feat_trades_k:  { zh: '记录 · 复盘', en: 'Log · Review' },
    feat_trades_h:  { zh: '交易日志', en: 'Trade Log' },
    feat_trades_b:  { zh: '查看日志', en: 'View log' },
    feat_about_k:   { zh: '简介 · 联系', en: 'Bio · Contact' },
    feat_about_h:   { zh: '关于我', en: 'About' },
    feat_about_b:   { zh: '了解更多', en: 'Learn more' },

    reports_title: { zh: '报告', en: 'Reports' },
    reports_sub:   { zh: '每日简报与周报,按日期从新到旧排列。', en: 'Daily briefs and weekly notes, newest first.' },
    trades_title:  { zh: '交易日志', en: 'Trade Log' },
    trades_sub:    { zh: '自己的交易记录与复盘,按日期从新到旧排列。', en: 'My own trade records and reviews, newest first.' },
    prices_title:  { zh: '价格走势', en: 'Prices' },
    prices_sub_html: { zh: '各品种价格折线图 · 手动维护。涨为<span style="color:var(--up);font-weight:700">红</span>、跌为<span style="color:var(--down);font-weight:700">绿</span>。',
                       en: 'Line charts per instrument · hand-updated. Up in <span style="color:var(--up);font-weight:700">red</span>, down in <span style="color:var(--down);font-weight:700">green</span>.' },
    about_title:   { zh: '关于我', en: 'About' },

    price_latest:  { zh: '最新数据日期:', en: 'Latest data: ' },
    price_species: { zh: ' 个品种', en: ' instruments' },
    price_species_pre: { zh: '(共 ', en: '(' },
    price_species_suf: { zh: ')', en: ')' },
    price_updated_on: { zh: '更新于 ', en: 'Updated ' },
    price_flat:    { zh: '持平', en: 'flat' },
    price_disclaimer: {
      zh: '说明:本页价格均由本人从市场公开渠道收集整理,仅供参考、观察趋势之用,不代表市场公允价或可成交价格,请勿据此交易或作为决策依据。',
      en: 'Note: All prices on this page are gathered by me from public market sources, for reference and trend-watching only. They are not fair-value or tradeable prices — please do not trade on them or rely on them for decisions.'
    },
    price_none:    { zh: 'prices.json 里还没有任何品种。', en: 'No instruments in prices.json yet.' },

    list_empty:    { zh: '还没有内容。', en: 'Nothing here yet.' },
    back:          { zh: '← 返回列表', en: '← Back' },
    foot:          { zh: '内容仅供个人研究记录,不构成投资建议。', en: 'Personal research notes only. Not investment advice.' }
  };

  function getLang() { try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; } }
  function setLang(l) { try { localStorage.setItem('lang', l); } catch (e) {} apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: l })); }
  function t(key) { var e = STR[key]; return e ? (e[getLang()] || e.zh) : key; }

  function apply() {
    var lang = getLang();
    document.documentElement.lang = (lang === 'en' ? 'en' : 'zh');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'); if (STR[k]) el.textContent = STR[k][lang] || STR[k].zh;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html'); if (STR[k]) el.innerHTML = STR[k][lang] || STR[k].zh;
    });
    var btn = document.getElementById('langToggle');
    if (btn) btn.textContent = lang === 'en' ? '中文' : 'EN';
    var tk = document.body && document.body.getAttribute('data-i18n-title');
    if (tk && STR[tk]) document.title = STR[tk][lang] || STR[tk].zh;
  }

  function init() {
    var btn = document.getElementById('langToggle');
    if (btn) btn.addEventListener('click', function () { setLang(getLang() === 'en' ? 'zh' : 'en'); });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.i18n = { getLang: getLang, setLang: setLang, t: t, apply: apply };
})(window);

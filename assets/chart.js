/* 极简折线图(SVG,本地,不联网、不依赖任何外部库)
 * 用法:priceChartSVG([{日期:"2026-07-01", 数值:520}, ...]) → 返回一段 <svg> 字符串
 * 数据按日期从旧到新排列;涨(末>首)描红,跌描绿。 */
(function (global) {
  function priceChartSVG(points) {
    const pts = (points || []).filter(function (p) {
      return p && p.数值 !== null && p.数值 !== undefined && !isNaN(Number(p.数值));
    }).map(function (p) { return { d: String(p.日期), v: Number(p.数值) }; });

    // viewBox 固定,靠 CSS 让它横向自适应;vector-effect 保证线条粗细恒定
    const W = 600, H = 120, padX = 8, padT = 14, padB = 12;
    if (pts.length === 0) {
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
        '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" fill="#9aa1ac" font-size="13">暂无数据</text></svg>';
    }

    const vals = pts.map(function (p) { return p.v; });
    let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }            // 单点或全等,给一点上下空间
    const rng = max - min;
    const n = pts.length;
    const x = function (i) { return padX + (n === 1 ? (W - 2 * padX) / 2 : (i * (W - 2 * padX)) / (n - 1)); };
    const y = function (v) { return padT + (1 - (v - min) / rng) * (H - padT - padB); };

    // 折线颜色 = 当天涨跌(与卡片箭头一致)。从计算样式取 --up/--down 的实际颜色,
    // 这样会随语言翻转(中文涨红跌绿 / 英文涨绿跌红),且不依赖 SVG 属性里 var() 的解析。
    const _cs = getComputedStyle(document.documentElement);
    const _UP = (_cs.getPropertyValue('--up') || '').trim() || '#b0472f';
    const _DOWN = (_cs.getPropertyValue('--down') || '').trim() || '#5f7d3b';
    const _FAINT = '#9aa1ac';
    let color = _FAINT;
    if (n >= 2) {
      const d = pts[n - 1].v - pts[n - 2].v;
      color = d > 1e-9 ? _UP : (d < -1e-9 ? _DOWN : _FAINT);
    }

    let line = '', area = '';
    pts.forEach(function (p, i) {
      const cx = x(i).toFixed(1), cy = y(p.v).toFixed(1);
      line += (i === 0 ? 'M' : 'L') + cx + ' ' + cy + ' ';
      area += (i === 0 ? 'M' + cx + ' ' + y(min).toFixed(1) + ' L' : 'L') + cx + ' ' + cy + ' ';
    });
    area += 'L' + x(n - 1).toFixed(1) + ' ' + y(min).toFixed(1) + ' Z';

    const lastX = x(n - 1).toFixed(1), lastY = y(pts[n - 1].v).toFixed(1);
    const gid = 'g' + Math.floor((min + max + n) * 10);   // 稳定的渐变 id(不用随机数)

    return '' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.16"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#' + gid + ')" stroke="none"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" ' +
      'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + lastX + '" cy="' + lastY + '" r="3.2" fill="' + color + '" ' +
      'vector-effect="non-scaling-stroke"/>' +
      '</svg>';
  }

  global.priceChartSVG = priceChartSVG;

  // 多序列叠加折线图(用于远期曲线等多合约面板)
  var PALETTE = ['#5c6a3d', '#b0472f', '#c8a67f', '#6d7a80', '#82705c', '#8f9a6a'];
  global.CHART_PALETTE = PALETTE;

  function multiChartSVG(seriesArr) {
    var W = 600, H = 140, padX = 8, padT = 12, padB = 12;
    var parsed = (seriesArr || []).map(function (s) {
      return (s['历史'] || s.history || []).filter(function (p) {
        return p && p['数值'] != null && !isNaN(Number(p['数值']));
      }).map(function (p) { return { t: Date.parse(p['日期']), v: Number(p['数值']) }; });
    });
    var all = parsed.reduce(function (a, b) { return a.concat(b); }, []);
    if (!all.length) {
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><text x="' + (W / 2) +
        '" y="' + (H / 2) + '" text-anchor="middle" fill="#a99f8d" font-size="13">暂无数据</text></svg>';
    }
    var vs = all.map(function (p) { return p.v; }), ts = all.map(function (p) { return p.t; });
    var minV = Math.min.apply(null, vs), maxV = Math.max.apply(null, vs);
    if (minV === maxV) { minV -= 1; maxV += 1; }
    var minT = Math.min.apply(null, ts), maxT = Math.max.apply(null, ts);
    var spanT = (maxT - minT) || 1, rng = maxV - minV;
    var x = function (t) { return padX + (t - minT) / spanT * (W - 2 * padX); };
    var y = function (v) { return padT + (1 - (v - minV) / rng) * (H - padT - padB); };

    var paths = '';
    parsed.forEach(function (pts, i) {
      if (!pts.length) return;
      var d = '';
      pts.forEach(function (p, j) { d += (j === 0 ? 'M' : 'L') + x(p.t).toFixed(1) + ' ' + y(p.v).toFixed(1) + ' '; });
      paths += '<path d="' + d + '" fill="none" stroke="' + PALETTE[i % PALETTE.length] +
        '" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">' + paths + '</svg>';
  }
  global.multiChartSVG = multiChartSVG;
})(window);

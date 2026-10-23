
(function () {
  var canvas = document.querySelector('[data-hero-field]');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d', { alpha: false });
  var LANES = [
    { x: 0.43, y: 0.28, a: -55 },
    { x: 0.63, y: 0.28, a: -45 },
    { x: 0.65, y: 0.65, a: -8 },
    { x: 0.68, y: 0.89, a: 12 },
    { x: 0.58, y: 1.04, a: 60 }
  ];
  
  var CFG = {
    bg: '#ffffff', dpr: Math.min(2, window.devicePixelRatio || 1),
    cycle: 6.0, count: 5,
    wStart: 0.32, depth: 2, aspect: 0.75, radius: 0.06,
    fadeIn: 0.15, fadeFrom: 0.70, fieldFade: 2200
  };
  var SRC = ['hs-smoke-cafe.webp?v=2', 'hf-koekie-box.webp', 'hf-kikuyu-plans.webp',
    'hf-smoke-menu.webp', 'hs-soetkoek.webp?v=2', 'hf-kikuyu-services.webp',
    'hf-smoke-flavour.webp', 'hf-koekie-donut.webp', 'hs-kikuyu.webp?v=2',
    'hf-smoke-find.webp', 'hf-kikuyu-quote.webp'];
  
  var images = [];
  function loadImages() {
    if (images.length) return;
    images = SRC.map(function (src) {
      var i = new Image(); i.decoding = 'async'; i.src = 'assets/' + src;
      i.addEventListener('load', function () { if (reduced) refresh(); });
      return i;
    });
  }
  var ready = function (img) { return img.complete && img.naturalWidth > 0; };

  var frac = function (n) { return n - Math.floor(n); };
  
  var cards = [];
  for (var i = 0; i < CFG.count; i++) {
    var L = LANES[(i * 2) % LANES.length];
    cards.push({ lane: L, a: L.a * Math.PI / 180, tx: 0, ty: 0, offset: i / CFG.count });
  }
  var headline = document.querySelector('.hero h1');
  var W = 1, H = 1;
  function resize() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    var top = H * 0.3, hh = H * 0.25;
    if (headline) {
      var hr = headline.getBoundingClientRect();
      top = hr.top - r.top; hh = hr.height;
    }
    cards.forEach(function (c) { c.tx = W * c.lane.x; c.ty = top + hh * c.lane.y; });
    canvas.width = W * CFG.dpr; canvas.height = H * CFG.dpr;
    ctx.setTransform(CFG.dpr, 0, 0, CFG.dpr, 0, 0);
  }

  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var clamp01 = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t; };
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawCover(img, x, y, w, h) {
    var sw = img.naturalWidth, sh = sw * (h / w);
    if (sh > img.naturalHeight) { sh = img.naturalHeight; sw = sh * (w / h); }
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, sh, x, y, w, h);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 759px)');
  var t0 = performance.now(), raf = 0, onScreen = true;
  var list = [];

  function frame(now) {
    raf = 0;
    var since = now - t0;
    var elapsed = reduced ? 1.5 : since / 1000;
    var fieldIn = reduced ? 1 : smooth(clamp01(since / CFG.fieldFade));

    ctx.fillStyle = CFG.bg;
    ctx.fillRect(0, 0, W, H);

    var w0 = CFG.wStart * W;
    list.length = 0;
    for (var j = 0; j < cards.length; j++) {
      var c = cards[j];
      var run = elapsed / CFG.cycle + c.offset, life = frac(run);
      
      var k = Math.floor(run) * CFG.count - j, n = images.length;
      var img = images[((k % n) + n) % n];
      var cos = Math.cos(c.a), sin = Math.sin(c.a);
      
      var hw = w0 * 0.55, hh0 = w0 * CFG.aspect * 0.55, reach = Infinity;
      if (cos > 0.01) reach = Math.min(reach, (W - c.tx + hw) / cos);
      if (sin < -0.01) reach = Math.min(reach, (c.ty + hh0) / -sin);
      if (sin > 0.01) reach = Math.min(reach, (H - c.ty + hh0) / sin);
      var s = 1 / (1 + CFG.depth * life), sEnd = 1 / (1 + CFG.depth);
      var d = (s - sEnd) / (1 - sEnd);
      var rise = smooth(clamp01(life / CFG.fadeIn));
      var away = smooth(clamp01((life - CFG.fadeFrom) / (1 - CFG.fadeFrom)));
      list.push({ img: img, life: life, alpha: rise * (1 - away), w: w0 * s,
        px: c.tx + cos * reach * d, py: c.ty + sin * reach * d });
    }
    
    list.sort(function (a, b) { return b.life - a.life; });

    for (var d = 0; d < list.length; d++) {
      var e = list[d];
      if (!ready(e.img) || e.w < 1 || e.alpha <= 0.01) continue;
      var w = e.w, h = w * CFG.aspect, x = e.px - w / 2, y = e.py - h / 2;
      ctx.save();
      ctx.globalAlpha = e.alpha * fieldIn;
      roundRect(x, y, w, h, w * CFG.radius);
      ctx.save(); ctx.clip(); drawCover(e.img, x, y, w, h); ctx.restore();
      
      ctx.strokeStyle = 'rgba(0,0,0,.10)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    if (!reduced) start();
  }

  function start() {
    if (!raf && onScreen && phone.matches && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function refresh() {
    stop();
    if (!phone.matches) return;
    loadImages();
    resize();
    if (reduced) { frame(performance.now()); return; }
    start();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      onScreen = en[0].isIntersecting;
      if (onScreen) start(); else stop();
    }).observe(canvas.closest('.hero-wrap') || canvas);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if (phone.addEventListener) phone.addEventListener('change', refresh);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(refresh, 150); });
  refresh();
})();

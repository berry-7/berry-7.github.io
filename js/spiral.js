
(function () {
  var stage = document.querySelector('[data-spiral-stage]');
  if (!stage) return;

  var gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger || !window.MotionPathPlugin) {
    console.warn('[spiral] GSAP or plugins missing — leaving the static list in place');
    return;
  }
  gsap.registerPlugin(window.ScrollTrigger, window.MotionPathPlugin);

  var section = document.querySelector('#work');
  var pinEl = document.querySelector('[data-spiral-pin]');
  var wordmark = document.querySelector('[data-spiral-word]');
  var leftTitle = document.querySelector('[data-spiral-left]');
  var rightTitle = document.querySelector('[data-spiral-right]');
  var discEl = document.querySelector('[data-spiral-disc]');
  var sideDisc = document.querySelector('[data-spiral-side-disc]');
  var counterEl = document.querySelector('[data-spiral-counter]');
  var linkEl = document.querySelector('[data-spiral-link]');
  var cards = Array.prototype.slice.call(stage.querySelectorAll('[data-spiral-card]'));
  var N = cards.length;
  if (!N) return;

  var PROJECTS = cards.map(function (c) {
    return {
      left: c.getAttribute('data-left'),
      right: c.getAttribute('data-right'),
      disc: c.getAttribute('data-disc'),
      href: c.getAttribute('data-href'),
      side: c.getAttribute('data-disc-side') === 'right' ? 1 : -1
    };
  });

  var CONFIG = {
    scaleStart: 0.34,     // size at the edge
    scaleEnd: 1.0,        // size once centred
    curveIntensity: 0.34, // how hard the arc bows
    spiralDir: 1,         // rotational direction of the bow
    offBuffer: 60,        // px past the edge, so nothing peeks at rest
    convergeFrac: 0.46    // share of the scroll spent converging
  };
  var EDGE_SETS = {
    2: [{ x: -1.0, y: -0.28 }, { x: 1.0, y: 0.28 }],
    
    3: [{ x: -0.5, y: -1.0 }, { x: 0.5, y: -1.0 }, { x: 0.15, y: 1.0 }],
    
    4: [{ x: -0.5, y: -1.0 }, { x: 0.5, y: -1.0 }, { x: 0.15, y: 1.0 }, { x: 1.0, y: 0.35 }]
  };
  var EDGES = EDGE_SETS[Math.min(Math.max(N, 2), 4)];
  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  var COUNT_LABEL = (WORDS[N] || String(N)) + (N === 1 ? ' build' : ' builds');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vw = function () { return window.innerWidth; };
  var vh = function () { return window.innerHeight; };
  var cardSize = function () {
    var c = cards[0];
    return { w: c.offsetWidth || vw() * 0.44, h: c.offsetHeight || vw() * 0.44 * 0.8 };
  };

  function arcPath(edge) {
    var s = cardSize();
    var sx = edge.x * (vw() / 2);
    var sy = edge.y * (vh() / 2);
    if (Math.abs(edge.x) >= 0.9) sx += Math.sign(edge.x) * (s.w * CONFIG.scaleStart / 2 + CONFIG.offBuffer);
    if (Math.abs(edge.y) >= 0.9) sy += Math.sign(edge.y) * (s.h * CONFIG.scaleStart / 2 + CONFIG.offBuffer);
    var dx = -sx, dy = -sy;
    var len = Math.hypot(dx, dy) || 1;
    var px = (-dy / len) * CONFIG.spiralDir;
    var py = (dx / len) * CONFIG.spiralDir;
    var bow = len * CONFIG.curveIntensity;
    return [
      { x: sx, y: sy },
      { x: sx + dx * 0.5 + px * bow, y: sy + dy * 0.5 + py * bow },
      { x: 0, y: 0 }
    ];
  }

  function marginX() { return (cardSize().w / 2 + vw() / 2) / 2; }

  function setTitle(i) {
    var p = PROJECTS[i];
    
    if (leftTitle && !leftTrack) leftTitle.textContent = p.side > 0 ? p.left + ' ' + p.right : '';
    if (rightTitle && !rightTrack) rightTitle.textContent = p.side < 0 ? p.left + ' ' + p.right : '';
    if (discEl) discEl.textContent = p.disc;
    if (sideDisc) {
      
      sideDisc.textContent = p.disc;
      sideDisc.style.width = Math.max(160, Math.min(320, (vw() - cardSize().w) / 2 - 56)) + 'px';
      gsap.set(sideDisc, { xPercent: -50, yPercent: -50, x: p.side * marginX() });
    }
    if (counterEl) counterEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    if (linkEl) {
      linkEl.setAttribute('href', p.href);
      linkEl.setAttribute('aria-label', 'View the ' + p.left + ' ' + p.right + ' build');
    }
  }

  function setStart() {
    cards.forEach(function (el, i) {
      var p = arcPath(EDGES[i % EDGES.length]);
      
      gsap.set(el, { xPercent: -50, yPercent: -50, x: p[0].x, y: p[0].y,
        scale: CONFIG.scaleStart, opacity: 1, zIndex: N - i });
    });
    gsap.set(wordmark, { xPercent: -50, yPercent: -50, x: 0, y: 0, opacity: 1, scale: 1 });
    gsap.set([leftTitle, rightTitle], { xPercent: -50, yPercent: -50, x: 0, opacity: 0 });
    gsap.set([discEl, sideDisc].filter(Boolean), { opacity: 0 });
  }
  if (prefersReduced) {
    stage.classList.add('is-static');
    cards.forEach(function (el) { gsap.set(el, { clearProps: 'all' }); });
    setTitle(0);
    return;
  }
  stage.classList.add('is-live');
  var wrap = document.querySelector('.spiral');
  if (wrap) wrap.classList.add('is-live');
  var panels = [];
  for (var pk = 1; pk < N; pk++) {
    var panel = document.createElement('div');
    panel.className = 'spiral-panel' + (pk % 2 ? ' is-wash' : '');
    panel.style.zIndex = String(10 + pk);
    var inner = document.createElement('div');
    inner.className = 'spiral-panel-in';
    panel.appendChild(inner);
    var pa = document.createElement('a');
    pa.className = 'spiral-panel-card';
    pa.href = PROJECTS[pk].href;
    pa.tabIndex = -1;                 
    pa.setAttribute('aria-hidden', 'true');
    var pimg = cards[pk].querySelector('img').cloneNode();
    pimg.alt = '';
    pimg.removeAttribute('loading');
    pa.appendChild(pimg);
    inner.appendChild(pa);
    stage.appendChild(panel);
    panels.push({ el: panel, inner: inner, v: 100 });
  }
  
  function makeTrack(el, sideSign) {
    if (!el) return null;
    el.textContent = '';
    var t = document.createElement('span');
    t.className = 'spiral-track';
    PROJECTS.forEach(function (p) {
      var c = document.createElement('span');
      c.className = 'spiral-cell';
      if (-p.side === sideSign) {
        [p.left, p.right].forEach(function (w) {
          var l = document.createElement('span');
          l.className = 'spiral-line';
          l.textContent = w;
          c.appendChild(l);
        });
      }
      t.appendChild(c);
    });
    el.appendChild(t);
    return t;
  }
  var leftTrack = makeTrack(leftTitle, -1);
  var rightTrack = makeTrack(rightTitle, 1);
  
  function setReveal(p) {
    p.el.style.transform = 'translate3d(0,' + p.v + '%,0)';
    p.inner.style.transform = 'translate3d(0,' + (-p.v) + '%,0)';
  }

  var built = false;
  function build() {
    window.ScrollTrigger.getAll().forEach(function (t) { if (t.vars.id === 'spiral') t.kill(); });
    setStart();
    panels.forEach(function (p) { p.v = 100; setReveal(p); });
    if (leftTrack) gsap.set([leftTrack, rightTrack], { yPercent: 0 });
    setTitle(0);
    
    if (counterEl) counterEl.textContent = COUNT_LABEL;

    var conv = CONFIG.convergeFrac;
    var cycle = 1 - conv;
    
    var titleIn = cycle * 0.12;
    var unit = (cycle - titleIn) / (2 * N - 1);
    var current = -1;
    function syncLabel(t) {
      if (t.time() <= conv * 0.92) {
        if (counterEl) counterEl.textContent = COUNT_LABEL;
        current = -1;
        return;
      }
      
      var k = 0;
      panels.forEach(function (p) { if (p.v < 50) k++; });
      if (k !== current) { current = k; setTitle(k); }
    }

    var tl = gsap.timeline({
      onUpdate: function () { syncLabel(this); },
      scrollTrigger: {
        id: 'spiral',
        trigger: pinEl || section,
        start: 'top top',
        end: '+=' + (vh() * (N + 1.6)),
        pin: '[data-spiral-pin]',
        
        scrub: true,
        anticipatePin: 1,
        
        onToggle: function (st) { document.documentElement.classList.toggle('in-spiral', st.isActive); }
      }
    });

    cards.forEach(function (el, i) {
      var p = arcPath(EDGES[i % EDGES.length]);
      tl.to(el, {
        motionPath: { path: p, curviness: 1.25, autoRotate: false },
        scale: CONFIG.scaleEnd,
        ease: 'power2.inOut',
        duration: conv
      }, 0);
    });
    
    tl.fromTo(leftTitle, { opacity: 0, x: 0 }, { opacity: 1, x: -marginX(), ease: 'power3.out', duration: titleIn }, conv);
    tl.fromTo(rightTitle, { opacity: 0, x: 0 }, { opacity: 1, x: marginX(), ease: 'power3.out', duration: titleIn }, conv);
    tl.to([discEl, sideDisc].filter(Boolean), { opacity: 1, duration: titleIn }, conv);
    var wipeDur = unit;
    panels.forEach(function (p, i) {
      var at = conv + titleIn + unit * (2 * i + 1);
      tl.to(p, { v: 0, ease: 'none', duration: wipeDur, onUpdate: function () { setReveal(p); } }, at);
      if (leftTrack) {
        tl.to([leftTrack, rightTrack], { yPercent: -100 * (i + 1) / N, ease: 'none', duration: wipeDur }, at);
      }
      
      if (sideDisc) {
        tl.to(sideDisc, { opacity: 0, ease: 'none', duration: wipeDur * 0.3 }, at);
        tl.to(sideDisc, { opacity: 1, ease: 'none', duration: wipeDur * 0.3 }, at + wipeDur * 0.7);
      }
    });
    tl.to(stage, { duration: 0.001 }, 1.0);
    built = true;
  }

  if (document.readyState === 'complete') build();
  else window.addEventListener('load', build);

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (built) build(); }, 220);
  });
})();


(function () {
  'use strict';
  var host = location.hostname;
  var LOCAL = host === '' || host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!LOCAL && location.search.indexOf('notes=1') < 0) return;

  var KEY = 'tlhogi-moves-v2';
  
  var cssLink = document.querySelector('link[href*="css/site.css"]');
  var CSSV = cssLink ? (cssLink.getAttribute('href').split('?v=')[1] || '') : '';
  var moves = {};
  try { moves = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { moves = {}; }
  
  try {
    var v1 = JSON.parse(localStorage.getItem('tlhogi-moves-v1') || 'null');
    if (v1 && !localStorage.getItem(KEY)) {
      Object.keys(v1).forEach(function (b) {
        var m = v1[b];
        moves[b] = {};
        moves[b]['[data-stack]'] = { tx: m.tx, ty: m.ty, scale: m.scale, rotate: m.rotate || 0,
          label: 'hero card stack', css: m.css, at: m.at };
      });
      store();
    }
  } catch (e) {}
  function store() { try { localStorage.setItem(KEY, JSON.stringify(moves)); } catch (e) {} }
  function bp() {
    var w = window.innerWidth;
    if (w < 560) return { id: 'phone', label: 'phone (under 560)' };
    if (w < 760) return { id: 'wide', label: 'wide phone (560-759)' };
    if (w <= 900) return { id: 'tablet', label: 'tablet (760-900)' };
    return { id: 'desktop', label: 'desktop (over 900)' };
  }

  var RED = '#C43F3C';
  var css = document.createElement('style');
  css.textContent = [
    '.mv-hover{position:fixed;z-index:2147483000;pointer-events:none;outline:1.5px dashed ' + RED + ';',
      'outline-offset:2px;background:rgba(196,63,60,.05);border-radius:4px;display:none}',
    '.mv-pad{position:fixed;z-index:2147483100;cursor:grab;touch-action:none;display:none;',
      'outline:2px dashed ' + RED + ';outline-offset:4px;border-radius:8px;background:rgba(196,63,60,.08)}',
    '.mv-pad:active{cursor:grabbing}',
    '.mv-name{position:absolute;left:-4px;bottom:100%;margin-bottom:8px;white-space:nowrap;',
      'background:' + RED + ';color:#fff;font:600 11px/1 system-ui,sans-serif;padding:5px 7px;border-radius:6px;',
      'pointer-events:none}',
    '.mv-dot{position:absolute;right:-12px;bottom:-12px;width:22px;height:22px;border-radius:50%;',
      'background:' + RED + ';border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:nwse-resize;',
      'touch-action:none}',
    '.mv-rot{position:absolute;left:50%;top:-40px;width:22px;height:22px;margin-left:-11px;border-radius:50%;',
      'background:#fff;border:3px solid ' + RED + ';box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:grab;touch-action:none}',
    '.mv-rot::after{content:"";position:absolute;left:50%;top:100%;width:2px;height:18px;margin-left:-1px;',
      'background:' + RED + '}',
    '.mv-tip{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);z-index:2147483200;',
      'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);',
      'background:#1B1512;color:#fff;border-radius:16px;padding:8px 8px 8px 14px;',
      'font:600 12.5px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
    '.mv-tip button{border:0;border-radius:999px;padding:7px 12px;cursor:pointer;',
      'font:600 12px/1 system-ui,sans-serif;background:#fff;color:#1B1512}',
    '.mv-tip button.mv-go{background:' + RED + ';color:#fff}',
    '.mv-tip button[disabled]{opacity:.4;cursor:default}',
    '.mv-tip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46ch}',
    
    '@media (max-width:859px){.mv-tip{bottom:138px}}'
  ].join('');
  document.head.appendChild(css);
  function isUi(el) {
    return !el || el === document.documentElement || el === document.body ||
      !!(el.closest && el.closest('.mv-pad,.mv-tip,.mv-hover,[class^="sn-"],[class*=" sn-"]'));
  }
  
  function selectorFor(el) {
    if (el.id) return '#' + el.id;
    var parts = [];
    var n = el;
    while (n && n.nodeType === 1 && n !== document.body) {
      if (n.id) { parts.unshift('#' + n.id); break; }
      var tag = n.tagName.toLowerCase();
      var i = 1, s = n;
      while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
      parts.unshift(tag + ':nth-of-type(' + i + ')');
      n = n.parentElement;
    }
    if (!parts.length || parts[0].charAt(0) !== '#') parts.unshift('body');
    return parts.join(' > ');
  }
  
  function labelFor(el) {
    var cls = (el.getAttribute('class') || '').split(/\s+/).filter(function (c) { return c && !/^(rv|in|mag)$/.test(c); })[0];
    var name = el.tagName.toLowerCase() + (cls ? '.' + cls : '');
    var alt = el.getAttribute('alt');
    var txt = (alt || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32);
    return txt ? name + ' "' + txt + (txt.length === 32 ? '...' : '') + '"' : name;
  }
  function animated(el) {
    var a = el.getAnimations ? el.getAnimations() : [];
    return a.some(function (x) { return x.constructor && x.constructor.name === 'CSSAnimation'; });
  }
  var base = new WeakMap();   // the element's own translate/scale/rotate, before ours
  function baseOf(el) {
    if (base.has(el)) return base.get(el);
    var t = el.style.translate, s = el.style.scale, r = el.style.rotate;
    el.style.translate = ''; el.style.scale = ''; el.style.rotate = '';
    var c = getComputedStyle(el);
    var tp = c.translate === 'none' ? [0, 0] : c.translate.split(' ').map(parseFloat);
    var b = { tx: tp[0] || 0, ty: tp[1] || 0,
      sc: c.scale === 'none' ? 1 : parseFloat(c.scale) || 1,
      rot: c.rotate === 'none' ? 0 : parseFloat(c.rotate) || 0 };
    el.style.translate = t; el.style.scale = s; el.style.rotate = r;
    base.set(el, b);
    return b;
  }
  function paint(el, m) {
    var b = baseOf(el);
    var moved = m && (m.tx || m.ty || m.scale !== 1 || m.rotate);
    el.style.translate = moved ? (b.tx + m.tx) + 'px ' + (b.ty + m.ty) + 'px' : '';
    el.style.scale = moved ? String(b.sc * m.scale) : '';
    el.style.rotate = moved ? (b.rot + m.rotate) + 'deg' : '';
  }
  var draft = {};
  var painted = [];
  function loadFor(b) {
    painted.forEach(function (el) { paint(el, null); });
    painted = [];
    draft = {};
    var saved = moves[b.id] || {};
    Object.keys(saved).forEach(function (sel) {
      var m = saved[sel];
      if (m.css !== CSSV) return;
      draft[sel] = { tx: m.tx, ty: m.ty, scale: m.scale, rotate: m.rotate || 0, label: m.label };
      var el = document.querySelector(sel);
      if (el) { paint(el, draft[sel]); painted.push(el); }
    });
  }
  var on = false, btn = null, tip = null, hov = null, pad = null, nameTag = null, dot = null, rotDot = null;
  var sel = null, selEl = null, drag = null, raf = 0;

  function build() {
    hov = document.createElement('div'); hov.className = 'mv-hover';
    pad = document.createElement('div'); pad.className = 'mv-pad'; pad.title = 'Drag to move';
    nameTag = document.createElement('div'); nameTag.className = 'mv-name';
    dot = document.createElement('div'); dot.className = 'mv-dot'; dot.title = 'Drag to resize';
    rotDot = document.createElement('div'); rotDot.className = 'mv-rot';
    rotDot.title = 'Drag to rotate (Shift snaps to 15 degrees)';
    pad.appendChild(nameTag); pad.appendChild(dot); pad.appendChild(rotDot);
    document.body.appendChild(hov); document.body.appendChild(pad);

    var center = function () {
      var r = selEl.getBoundingClientRect();
      return { cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
    };
    pad.addEventListener('pointerdown', function (e) {
      if (e.target === dot || e.target === rotDot) return;
      e.preventDefault(); pad.setPointerCapture(e.pointerId);
      var m = draft[sel];
      drag = { kind: 'move', x: e.clientX, y: e.clientY, tx: m.tx, ty: m.ty };
    });
    dot.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation(); dot.setPointerCapture(e.pointerId);
      var c = center();
      drag = { kind: 'size', cx: c.cx, cy: c.cy, d: Math.hypot(e.clientX - c.cx, e.clientY - c.cy) || 1, sc: draft[sel].scale };
    });
    rotDot.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation(); rotDot.setPointerCapture(e.pointerId);
      var c = center();
      drag = { kind: 'turn', cx: c.cx, cy: c.cy, a: Math.atan2(e.clientY - c.cy, e.clientX - c.cx), rot: draft[sel].rotate };
    });
    var moveFn = function (e) {
      if (!drag || !sel) return;
      var m = draft[sel];
      if (drag.kind === 'move') {
        m.tx = Math.round(drag.tx + e.clientX - drag.x);
        m.ty = Math.round(drag.ty + e.clientY - drag.y);
      } else if (drag.kind === 'turn') {
        var a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
        var deg = drag.rot + (a - drag.a) * 180 / Math.PI;
        deg = ((deg + 540) % 360) - 180;
        m.rotate = e.shiftKey ? Math.round(deg / 15) * 15 : Math.round(deg);
      } else {
        var d = Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy);
        m.scale = Math.round(Math.min(3, Math.max(0.3, drag.sc * d / drag.d)) * 100) / 100;
      }
      paint(selEl, m);
      if (painted.indexOf(selEl) < 0) painted.push(selEl);
      drawTip();
    };
    var upFn = function () { drag = null; };
    [pad, dot, rotDot].forEach(function (n) {
      n.addEventListener('pointermove', moveFn);
      n.addEventListener('pointerup', upFn);
      n.addEventListener('pointercancel', upFn);
    });
  }
  function place(box, el, pad8) {
    if (!el || !el.isConnected) { box.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
    box.style.width = Math.max(r.width, pad8 ? 8 : 0) + 'px';
    box.style.height = Math.max(r.height, pad8 ? 8 : 0) + 'px';
  }
  var hoverEl = null;
  function tick() {
    if (!on) return;
    place(pad, selEl, true);
    if (hoverEl && hoverEl !== selEl) place(hov, hoverEl); else hov.style.display = 'none';
    raf = requestAnimationFrame(tick);
  }

  function pickAt(x, y) {
    var list = document.elementsFromPoint(x, y);
    for (var i = 0; i < list.length; i++) if (!isUi(list[i])) return list[i];
    return null;
  }
  function select(el) {
    if (!el) return;
    var note = '';
    if (animated(el) && el.parentElement && !isUi(el.parentElement)) { el = el.parentElement; note = ' (its parent: it animates)'; }
    selEl = el;
    sel = selectorFor(el);
    if (!draft[sel]) draft[sel] = { tx: 0, ty: 0, scale: 1, rotate: 0, label: labelFor(el) };
    nameTag.textContent = draft[sel].label + note;
    drawTip();
  }
  function onMove(e) { if (!drag) hoverEl = pickAt(e.clientX, e.clientY); }
  function onDown(e) {
    if (isUi(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    select(pickAt(e.clientX, e.clientY));
  }
  function swallow(e) { if (!isUi(e.target)) { e.preventDefault(); e.stopPropagation(); } }

  function arm() {
    document.dispatchEvent(new CustomEvent('tlhogi-tool', { detail: 'move' }));
    on = true;
    btn.setAttribute('data-on', '1');
    btn.classList.remove('sn-ghost');
    btn.textContent = 'Moving (Esc)';
    if (!pad) build();
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('click', swallow, true);
    tip = document.createElement('div');
    tip.className = 'mv-tip';
    document.body.appendChild(tip);
    drawTip();
    raf = requestAnimationFrame(tick);
  }

  function disarm() {
    on = false; drag = null; sel = null; selEl = null; hoverEl = null;
    cancelAnimationFrame(raf);
    if (btn) { btn.removeAttribute('data-on'); btn.classList.add('sn-ghost'); btn.textContent = 'Move'; }
    document.removeEventListener('pointermove', onMove, true);
    document.removeEventListener('pointerdown', onDown, true);
    document.removeEventListener('click', swallow, true);
    if (pad) { pad.style.display = 'none'; hov.style.display = 'none'; }
    if (tip) { tip.remove(); tip = null; }
    
    loadFor(bp());
  }

  document.addEventListener('tlhogi-tool', function (e) { if (on && e.detail !== 'move') disarm(); });

  function savedCount() {
    var n = 0;
    Object.keys(moves).forEach(function (b) {
      Object.keys(moves[b]).forEach(function (s) { if (moves[b][s].css === CSSV) n++; });
    });
    return n;
  }

  function drawTip() {
    if (!tip) return;
    var b = bp();
    var what = sel ? 'Moving <b>' + esc(draft[sel].label) + '</b>' : 'Click anything to pick it';
    tip.innerHTML = '<span>' + what + ' &middot; ' + b.label + '</span>' +
      '<button data-a="parent"' + (sel ? '' : ' disabled') + '>Parent</button>' +
      '<button data-a="undo"' + (sel ? '' : ' disabled') + '>Reset this</button>' +
      '<button class="mv-go" data-a="save">Save this breakpoint</button>' +
      '<button data-a="copy">Copy for Claude (' + savedCount() + ')</button>' +
      '<button data-a="done">Done</button>';
    tip.querySelectorAll('button').forEach(function (bt) {
      bt.addEventListener('click', function () { act(bt.getAttribute('data-a'), bt); });
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  function act(a, b) {
    var cur = bp();
    if (a === 'parent') {
      if (selEl && selEl.parentElement && !isUi(selEl.parentElement)) {
        var p = selEl.parentElement;
        var m = draft[sel];
        if (m && !m.tx && !m.ty && m.scale === 1 && !m.rotate) delete draft[sel];
        select(p);
      }
    } else if (a === 'undo') {
      if (!sel) return;
      draft[sel] = { tx: 0, ty: 0, scale: 1, rotate: 0, label: draft[sel].label };
      paint(selEl, null);
      if (moves[cur.id]) { delete moves[cur.id][sel]; store(); }
      drawTip();
    } else if (a === 'save') {
      var out = {};
      Object.keys(draft).forEach(function (s) {
        var d = draft[s];
        if (!d.tx && !d.ty && d.scale === 1 && !d.rotate) return;
        var el = document.querySelector(s);
        var r = el ? el.getBoundingClientRect() : null;
        out[s] = { tx: d.tx, ty: d.ty, scale: d.scale, rotate: d.rotate, label: d.label, css: CSSV,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          rect: r ? { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } : null,
          at: new Date().toISOString() };
      });
      moves[cur.id] = out;
      store();
      drawTip();
      flash(tip.querySelector('[data-a="save"]'), 'Saved');
    } else if (a === 'copy') {
      copy(b);
    } else if (a === 'done') {
      disarm();
    }
  }

  function flash(b, text) {
    if (!b) return;
    var was = b.textContent;
    b.textContent = text;
    setTimeout(function () { if (b.isConnected) b.textContent = was; }, 1600);
  }

  function payload() {
    var lines = [], n = 0;
    ['phone', 'wide', 'tablet', 'desktop'].forEach(function (k) {
      var set = moves[k] || {};
      Object.keys(set).forEach(function (s) {
        var m = set[s];
        if (m.css !== CSSV) return;
        n++;
        lines.push(n + '. ' + m.label + ' @ ' + k + (m.viewport ? ', set at ' + m.viewport.w + 'x' + m.viewport.h : '') +
          '\n   selector: ' + s +
          '\n   moved ' + (m.tx >= 0 ? '+' : '') + m.tx + ', ' + (m.ty >= 0 ? '+' : '') + m.ty + ' px, scale ' + m.scale + ', rotated ' + (m.rotate || 0) + ' deg' +
          (m.rect ? '\n   ends up at page x ' + m.rect.x + ', y ' + m.rect.y + ', ' + m.rect.w + 'x' + m.rect.h : ''));
      });
    });
    if (!n) return 'TLHOGI moves: none saved.';
    return 'TLHOGI moves (' + n + '):\n\n' + lines.join('\n\n') + '\n\nTurn these into CSS for each breakpoint.';
  }

  function copy(b) {
    var text = payload();
    var done = function () { flash(b, 'Copied. Paste it to Claude.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }
  function mount() {
    var bar = document.querySelector('.sn-bar');
    if (!bar) return false;
    btn = document.createElement('button');
    btn.className = 'sn-btn sn-ghost';
    btn.id = 'sn-move';
    btn.title = 'Move, resize or rotate anything on the page (Alt+M)';
    btn.textContent = 'Move';
    bar.insertBefore(btn, bar.firstChild);
    btn.addEventListener('click', function () { if (on) disarm(); else arm(); });
    return true;
  }

  document.addEventListener('keydown', function (e) {
    if (e.target && /^(TEXTAREA|INPUT)$/.test(e.target.tagName)) return;
    if (on && e.key === 'Escape') { if (sel) { sel = null; selEl = null; drawTip(); } else disarm(); return; }
    if (on && e.altKey && e.key === 'ArrowUp') { e.preventDefault(); act('parent'); return; }
    if (e.altKey && e.key.toLowerCase() === 'm') { if (on) disarm(); else arm(); }
  });
  var lastBp = bp().id, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var b = bp();
      if (b.id !== lastBp) { lastBp = b.id; sel = null; selEl = null; loadFor(b); }
      drawTip();
    }, 120);
  });
  if (document.readyState === 'complete') loadFor(bp());
  else window.addEventListener('load', function () { loadFor(bp()); });
  if (!mount()) {
    
    var tries = 0;
    var iv = setInterval(function () { if (mount() || ++tries > 40) clearInterval(iv); }, 100);
  }
  window.__tlhogiMoves = { payload: payload, get: function () { return moves; } };
})();

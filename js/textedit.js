
(function () {
  'use strict';
  var host = location.hostname;
  var LOCAL = host === '' || host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!LOCAL && location.search.indexOf('notes=1') < 0) return;

  var KEY = 'tlhogi-text-v1';
  var cssLink = document.querySelector('link[href*="css/site.css"]');
  var CSSV = cssLink ? (cssLink.getAttribute('href').split('?v=')[1] || '') : '';
  var data = { styles: {}, words: {} };
  try { data = JSON.parse(localStorage.getItem(KEY) || 'null') || data; } catch (e) {}
  data.styles = data.styles || {}; data.words = data.words || {};
  function store() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  function bp() {
    var w = window.innerWidth;
    if (w < 560) return { id: 'phone', label: 'phone (under 560)' };
    if (w < 760) return { id: 'wide', label: 'wide phone (560-759)' };
    if (w <= 900) return { id: 'tablet', label: 'tablet (760-900)' };
    return { id: 'desktop', label: 'desktop (over 900)' };
  }
  var KNOBS = [
    { k: 'fontSize', name: 'Size', min: 10, max: 140, step: 1, unit: 'px' },
    { k: 'lineHeight', name: 'Line height', min: 0.8, max: 2.2, step: 0.01, unit: '' },
    { k: 'letterSpacing', name: 'Spacing', min: -0.1, max: 0.2, step: 0.005, unit: 'em' },
    { k: 'maxWidth', name: 'Wrap width', min: 120, max: 1400, step: 2, unit: 'px' }
  ];
  var INKS = [['#000', 'ink'], ['#767676', 'mute'], ['#b8b8b8', 'faint'], ['#fff', 'white']];
  var PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'maxWidth', 'color'];
  var CSSNAME = { fontSize: 'font-size', fontWeight: 'font-weight', lineHeight: 'line-height',
    letterSpacing: 'letter-spacing', maxWidth: 'max-width', color: 'color' };

  var RED = '#C43F3C';
  var css = document.createElement('style');
  css.textContent = [
    '.tx-hover{position:fixed;z-index:2147483000;pointer-events:none;outline:1.5px dashed ' + RED + ';',
      'outline-offset:2px;background:rgba(196,63,60,.05);border-radius:4px;display:none}',
    '.tx-sel{position:fixed;z-index:2147483050;pointer-events:none;outline:2px solid ' + RED + ';',
      'outline-offset:4px;border-radius:6px;display:none}',
    '.tx-panel{position:fixed;right:16px;bottom:74px;z-index:2147483200;width:300px;max-width:calc(100vw - 24px);',
      'background:#1B1512;color:#fff;border-radius:16px;padding:14px;font:600 12px/1.3 system-ui,sans-serif;',
      'box-shadow:0 8px 24px rgba(0,0,0,.35);max-height:calc(100vh - 110px);overflow:auto}',
    '.tx-panel .tx-what{font-weight:700;margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.tx-row{display:grid;grid-template-columns:78px 1fr 52px;gap:8px;align-items:center;margin:7px 0}',
    '.tx-row input[type=range]{width:100%;accent-color:' + RED + '}',
    '.tx-row output{text-align:right;font-variant-numeric:tabular-nums;color:#ddd}',
    '.tx-seg{display:flex;gap:6px}',
    '.tx-seg button,.tx-btns button{border:0;border-radius:999px;padding:7px 11px;cursor:pointer;',
      'font:600 12px/1 system-ui,sans-serif;background:#fff;color:#1B1512}',
    '.tx-seg button[aria-pressed=true]{background:' + RED + ';color:#fff}',
    '.tx-ink{width:24px;height:24px;border-radius:50%;border:2px solid #555;cursor:pointer;padding:0}',
    '.tx-ink[aria-pressed=true]{outline:2px solid ' + RED + ';outline-offset:2px}',
    '.tx-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}',
    '.tx-btns button.tx-go{background:' + RED + ';color:#fff}',
    '.tx-btns button[disabled]{opacity:.4;cursor:default}',
    '.tx-hint{color:#aaa;font-weight:500;margin-top:8px}',
    '[data-tx-editing]{outline:2px dashed ' + RED + '!important;outline-offset:3px;cursor:text!important;',
      '-webkit-user-select:text!important;user-select:text!important}',
    
    '@media (max-width:859px){.tx-panel{bottom:138px;right:12px;left:12px;width:auto;max-height:42vh}',
      '.tx-panel.tx-top{top:12px;bottom:auto}}',
    '.tx-panel.tx-mini{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 14px;max-height:none}',
    '.tx-panel.tx-mini .tx-what{margin:0;flex:1}',
    '.tx-panel.tx-mini .tx-btns{margin:0}'
  ].join('');
  document.head.appendChild(css);
  function isUi(el) {
    return !el || el === document.documentElement || el === document.body ||
      !!(el.closest && el.closest('.tx-panel,.tx-hover,.tx-sel,.mv-pad,.mv-tip,.mv-hover,[class^="sn-"],[class*=" sn-"]'));
  }
  function selectorFor(el) {
    if (el.id) return '#' + el.id;
    var parts = [], n = el;
    while (n && n.nodeType === 1 && n !== document.body) {
      if (n.id) { parts.unshift('#' + n.id); break; }
      var i = 1, s = n;
      while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
      parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      n = n.parentElement;
    }
    if (!parts.length || parts[0].charAt(0) !== '#') parts.unshift('body');
    return parts.join(' > ');
  }
  function labelFor(el) {
    var cls = (el.getAttribute('class') || '').split(/\s+/).filter(function (c) { return c && !/^(rv|in|mag)$/.test(c); })[0];
    var txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (txt ? ' "' + txt + (txt.length === 30 ? '...' : '') + '"' : '');
  }
  
  function textHost(el) {
    var n = el;
    while (n && !isUi(n) && n.parentElement && getComputedStyle(n).display === 'inline') n = n.parentElement;
    return n;
  }
  function hasText(el) { return el && /\S/.test(el.textContent || ''); }
  var draft = {};      // selector -> { props..., label }
  var touched = [];
  function paint(el, d) {
    PROPS.forEach(function (p) { el.style[p] = d && d[p] != null ? d[p] : ''; });
  }
  function loadFor(b) {
    touched.forEach(function (el) { paint(el, null); });
    touched = []; draft = {};
    var set = data.styles[b.id] || {};
    Object.keys(set).forEach(function (s) {
      var m = set[s];
      if (m.css !== CSSV) return;
      draft[s] = JSON.parse(JSON.stringify(m));
      var el = document.querySelector(s);
      if (el) { paint(el, draft[s]); touched.push(el); }
    });
    Object.keys(data.words).forEach(function (s) {
      var w = data.words[s], el = document.querySelector(s);
      if (el && el.innerHTML === w.from) el.innerHTML = w.html;
    });
  }
  var on = false, btn = null, panel = null, hov = null, selBox = null, raf = 0;
  var sel = null, selEl = null, hoverEl = null, editing = false, wordsFrom = null;

  function build() {
    hov = document.createElement('div'); hov.className = 'tx-hover';
    selBox = document.createElement('div'); selBox.className = 'tx-sel';
    document.body.appendChild(hov); document.body.appendChild(selBox);
  }
  function place(box, el) {
    if (!el || !el.isConnected) { box.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
    box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
  }
  function small() { return window.innerWidth < 860; }
  function tick() {
    if (!on) return;
    place(selBox, selEl);
    if (panel && small()) {
      var vv = window.visualViewport;
      if (editing) {
        panel.classList.remove('tx-top');
        panel.style.top = ((vv ? vv.offsetTop : 0) + 8) + 'px';
        panel.style.bottom = 'auto';
      } else if (selEl) {
        
        var r = selEl.getBoundingClientRect();
        var above = r.top - 24, below = innerHeight - 138 - r.bottom - 12;
        var top = above > below;
        panel.classList.toggle('tx-top', top);
        panel.style.top = ''; panel.style.bottom = '';
        panel.style.maxHeight = Math.max(150, Math.min(innerHeight * 0.42, top ? above : below)) + 'px';
      } else {
        panel.classList.remove('tx-top');
        panel.style.top = ''; panel.style.bottom = ''; panel.style.maxHeight = '';
      }
    }
    if (hoverEl && hoverEl !== selEl && !editing) place(hov, hoverEl); else hov.style.display = 'none';
    raf = requestAnimationFrame(tick);
  }
  function pickAt(x, y) {
    var list = document.elementsFromPoint(x, y);
    for (var i = 0; i < list.length; i++) {
      if (isUi(list[i])) continue;
      var h = textHost(list[i]);
      if (hasText(h)) return h;
    }
    return null;
  }

  function onMove(e) { if (!editing) hoverEl = pickAt(e.clientX, e.clientY); }
  function onDown(e) {
    if (isUi(e.target)) return;
    if (editing && selEl && selEl.contains(e.target)) return;  // let the caret land
    e.preventDefault(); e.stopPropagation();
    if (editing) stopEditing();
    select(pickAt(e.clientX, e.clientY));
  }
  function swallow(e) {
    if (isUi(e.target)) return;
    if (editing && selEl && selEl.contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
  }

  function select(el) {
    if (!el) return;
    selEl = el; sel = selectorFor(el);
    if (!draft[sel]) draft[sel] = { label: labelFor(el) };
    if (touched.indexOf(el) < 0) touched.push(el);
    drawPanel();
  }

  function arm() {
    document.dispatchEvent(new CustomEvent('tlhogi-tool', { detail: 'text' }));
    on = true;
    btn.setAttribute('data-on', '1'); btn.classList.remove('sn-ghost'); btn.textContent = 'Text (Esc)';
    if (!hov) build();
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('click', swallow, true);
    panel = document.createElement('div'); panel.className = 'tx-panel';
    document.body.appendChild(panel);
    drawPanel();
    raf = requestAnimationFrame(tick);
  }
  function disarm() {
    if (editing) stopEditing();
    on = false; sel = null; selEl = null; hoverEl = null;
    cancelAnimationFrame(raf);
    if (btn) { btn.removeAttribute('data-on'); btn.classList.add('sn-ghost'); btn.textContent = 'Text'; }
    document.removeEventListener('pointermove', onMove, true);
    document.removeEventListener('pointerdown', onDown, true);
    document.removeEventListener('click', swallow, true);
    if (hov) { hov.style.display = 'none'; selBox.style.display = 'none'; }
    if (panel) { panel.remove(); panel = null; }
    loadFor(bp());   // unsaved style changes are dropped
  }
  document.addEventListener('tlhogi-tool', function (e) { if (on && e.detail !== 'text') disarm(); });
  function startEditing() {
    if (!selEl) return;
    editing = true;
    wordsFrom = (data.words[sel] && data.words[sel].from) || selEl.innerHTML;
    selEl.setAttribute('contenteditable', 'true');
    selEl.setAttribute('data-tx-editing', '');
    selEl.focus();
    if (small()) {
      
      setTimeout(function () {
        var r = selEl.getBoundingClientRect();
        var vv = window.visualViewport, vh = vv ? vv.height : innerHeight;
        var want = 64, dy = r.top - want;
        if (r.top < want || r.bottom > vh - 12) window.scrollTo({ top: scrollY + dy, behavior: 'instant' });
      }, 350);
    }
    drawPanel();
  }
  function stopEditing() {
    if (!selEl) { editing = false; return; }
    selEl.removeAttribute('contenteditable');
    selEl.removeAttribute('data-tx-editing');
    if (selEl.innerHTML !== wordsFrom) {
      data.words[sel] = { from: wordsFrom, html: selEl.innerHTML, label: labelFor(selEl),
        text: selEl.textContent.replace(/\s+/g, ' ').trim() };
      store();
    }
    editing = false;
    drawPanel();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function count() {
    var n = Object.keys(data.words).length;
    Object.keys(data.styles).forEach(function (b) {
      Object.keys(data.styles[b]).forEach(function (s) { if (data.styles[b][s].css === CSSV) n++; });
    });
    return n;
  }
  function drawPanel() {
    if (!panel) return;
    var b = bp();
    panel.classList.toggle('tx-mini', !!(editing && small()));
    if (editing && small()) {
      panel.innerHTML = '<div class="tx-what">Editing words</div>' +
        '<div class="tx-btns"><button class="tx-go" data-a="words">Done editing</button></div>';
      wire(); return;
    }
    if (!selEl) {
      panel.innerHTML = '<div class="tx-what">Click any text to adjust it</div>' +
        '<div class="tx-hint">' + b.label + '. Links do not fire while Text is on.</div>' +
        '<div class="tx-btns"><button data-a="copy">Copy for Claude (' + count() + ')</button>' +
        '<button data-a="done">Done</button></div>';
      wire(); return;
    }
    var c = getComputedStyle(selEl);
    var d = draft[sel];
    var cur = {
      fontSize: parseFloat(c.fontSize),
      lineHeight: c.lineHeight === 'normal' ? 1.2 : parseFloat(c.lineHeight) / parseFloat(c.fontSize),
      letterSpacing: c.letterSpacing === 'normal' ? 0 : parseFloat(c.letterSpacing) / parseFloat(c.fontSize),
      maxWidth: c.maxWidth === 'none' ? Math.round(selEl.getBoundingClientRect().width) : parseFloat(c.maxWidth)
    };
    var rows = KNOBS.map(function (k) {
      var v = Math.round(cur[k.k] * 1000) / 1000;
      return '<label class="tx-row"><span>' + k.name + '</span>' +
        '<input type="range" data-k="' + k.k + '" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + v + '">' +
        '<output>' + v + k.unit + '</output></label>';
    }).join('');
    var w = String(c.fontWeight);
    var ink = c.color;
    panel.innerHTML = '<div class="tx-what">' + esc(d.label) + '</div>' + rows +
      '<div class="tx-row"><span>Weight</span><div class="tx-seg">' +
        ['500', '600'].map(function (x) { return '<button data-w="' + x + '" aria-pressed="' + (w === x) + '">' + x + '</button>'; }).join('') +
      '</div><span></span></div>' +
      '<div class="tx-row"><span>Ink</span><div class="tx-seg">' +
        INKS.map(function (x) {
          var probe = document.createElement('i'); probe.style.color = x[0];
          document.body.appendChild(probe); var rgb = getComputedStyle(probe).color; probe.remove();
          return '<button class="tx-ink" title="' + x[1] + '" data-ink="' + x[0] + '" style="background:' + x[0] + '" aria-pressed="' + (rgb === ink) + '"></button>';
        }).join('') +
      '</div><span></span></div>' +
      '<div class="tx-btns">' +
        '<button data-a="words">' + (editing ? 'Stop editing words' : 'Edit words') + '</button>' +
        '<button data-a="parent">Parent</button>' +
        '<button data-a="undo">Reset this</button>' +
        '<button class="tx-go" data-a="save">Save this breakpoint</button>' +
        '<button data-a="copy">Copy for Claude (' + count() + ')</button>' +
        '<button data-a="done">Done</button>' +
      '</div>' +
      '<div class="tx-hint">' + b.label + (editing ? '. Type on the page; words apply at every size.' : '') + '</div>';
    wire();
  }
  function wire() {
    panel.querySelectorAll('input[type=range]').forEach(function (r) {
      r.addEventListener('input', function () {
        var k = r.getAttribute('data-k');
        var knob = KNOBS.filter(function (x) { return x.k === k; })[0];
        var v = parseFloat(r.value);
        draft[sel][k] = k === 'lineHeight' ? String(v) : v + knob.unit;
        paint(selEl, draft[sel]);
        r.nextElementSibling.textContent = v + knob.unit;
      });
    });
    panel.querySelectorAll('[data-w]').forEach(function (bt) {
      bt.addEventListener('click', function () { draft[sel].fontWeight = bt.getAttribute('data-w'); paint(selEl, draft[sel]); drawPanel(); });
    });
    panel.querySelectorAll('[data-ink]').forEach(function (bt) {
      bt.addEventListener('click', function () { draft[sel].color = bt.getAttribute('data-ink'); paint(selEl, draft[sel]); drawPanel(); });
    });
    panel.querySelectorAll('[data-a]').forEach(function (bt) {
      bt.addEventListener('click', function () { act(bt.getAttribute('data-a'), bt); });
    });
  }

  function act(a, b) {
    var cur = bp();
    if (a === 'words') { if (editing) stopEditing(); else startEditing(); }
    else if (a === 'parent') {
      if (editing) stopEditing();
      var p = selEl && selEl.parentElement;
      if (p && !isUi(p)) select(p);
    } else if (a === 'undo') {
      if (editing) stopEditing();
      draft[sel] = { label: draft[sel].label };
      paint(selEl, null);
      if (data.styles[cur.id]) delete data.styles[cur.id][sel];
      if (data.words[sel]) { selEl.innerHTML = data.words[sel].from; delete data.words[sel]; }
      store(); drawPanel();
    } else if (a === 'save') {
      if (editing) stopEditing();
      var out = {};
      Object.keys(draft).forEach(function (s) {
        var d = draft[s], any = false, rec = { label: d.label, css: CSSV,
          viewport: { w: window.innerWidth, h: window.innerHeight }, at: new Date().toISOString() };
        PROPS.forEach(function (p) { if (d[p] != null) { rec[p] = d[p]; any = true; } });
        if (any) out[s] = rec;
      });
      data.styles[cur.id] = out;
      store(); drawPanel();
      flash(panel.querySelector('[data-a="save"]'), 'Saved');
    } else if (a === 'copy') copy(b);
    else if (a === 'done') disarm();
  }
  function flash(b, text) {
    if (!b) return;
    var was = b.textContent; b.textContent = text;
    setTimeout(function () { if (b.isConnected) b.textContent = was; }, 1600);
  }

  function payload() {
    var lines = [], n = 0;
    ['phone', 'wide', 'tablet', 'desktop'].forEach(function (k) {
      var set = data.styles[k] || {};
      Object.keys(set).forEach(function (s) {
        var m = set[s];
        if (m.css !== CSSV) return;
        n++;
        var props = PROPS.filter(function (p) { return m[p] != null; })
          .map(function (p) { return CSSNAME[p] + ': ' + (p === 'lineHeight' ? m[p] : m[p]); }).join('; ');
        lines.push(n + '. ' + m.label + ' @ ' + k + ', set at ' + m.viewport.w + 'x' + m.viewport.h +
          '\n   selector: ' + s + '\n   ' + props);
      });
    });
    Object.keys(data.words).forEach(function (s) {
      var w = data.words[s];
      n++;
      lines.push(n + '. WORDS ' + w.label + ' (every breakpoint)\n   selector: ' + s +
        '\n   new text: "' + w.text + '"\n   new html: ' + w.html.replace(/\s+/g, ' ').trim());
    });
    if (!n) return 'TLHOGI text: nothing saved.';
    return 'TLHOGI text changes (' + n + '):\n\n' + lines.join('\n\n') +
      '\n\nPut the styles into site.css per breakpoint, the words into index.html and COPY.md.';
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
    btn.id = 'sn-text';
    btn.title = 'Adjust any text: size, weight, spacing, ink, words (Alt+T)';
    btn.textContent = 'Text';
    var move = document.getElementById('sn-move');
    bar.insertBefore(btn, move ? move.nextSibling : bar.firstChild);
    btn.addEventListener('click', function () { if (on) disarm(); else arm(); });
    return true;
  }

  document.addEventListener('keydown', function (e) {
    if (editing) { if (e.key === 'Escape') { e.preventDefault(); stopEditing(); } return; }
    if (e.target && /^(TEXTAREA|INPUT)$/.test(e.target.tagName)) return;
    if (on && e.key === 'Escape') { if (sel) { sel = null; selEl = null; drawPanel(); } else disarm(); return; }
    if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); if (on) disarm(); else arm(); }
  });

  var lastBp = bp().id, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var b = bp();
      if (b.id !== lastBp) { lastBp = b.id; if (editing) stopEditing(); sel = null; selEl = null; loadFor(b); }
      drawPanel();
    }, 120);
  });

  if (document.readyState === 'complete') loadFor(bp());
  else window.addEventListener('load', function () { loadFor(bp()); });
  if (!mount()) {
    var tries = 0;
    var iv = setInterval(function () { if (mount() || ++tries > 60) clearInterval(iv); }, 100);
  }
  window.__tlhogiText = { payload: payload, get: function () { return data; } };
})();


(function () {
  'use strict';
  if (window.__smokeNotes) return;
  var host = location.hostname;
  var LOCAL = host === '' || host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!LOCAL && location.search.indexOf('notes=1') < 0) return;

  window.__smokeNotes = true;
  var BUILD = '2026-09-16.3';

  function boom(where, err) {
    try { console.error('[smoke-notes] ' + where, err); } catch (e) {}
    try {
      var id = 'sn-boom';
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;' +
          'background:#C43F3C;color:#fff;padding:10px 14px;box-sizing:border-box;' +
          'font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap';
        document.body.appendChild(el);
      }
      el.textContent = 'review layer broke in ' + where + ' (build ' + BUILD + ')\n' +
        ((err && (err.stack || err.message)) || String(err)) +
        '\n\nTell Claude this text.';
    } catch (e) {}
  }
  function guard(where, fn) {
    return function () {
      try { return fn.apply(this, arguments); }
      catch (err) { boom(where, err); }
    };
  }

  var KEY = 'tlhogi-notes-v1';
  var notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { notes = []; }
  
  notes.forEach(function (n) { if (!n.kind) n.kind = 'element'; });

  var INK = '#C43F3C';
  var mode = null;           
  function selectorFor(el) {
    if (el.id) return '#' + el.id;
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && parts.length < 4) {
      var part = node.tagName.toLowerCase();
      var cls = (node.getAttribute('class') || '')
        .split(/\s+/).filter(function (c) { return c && c.indexOf('sn-') !== 0; });
      if (cls.length) part += '.' + cls.slice(0, 2).join('.');
      var parent = node.parentElement;
      if (parent) {
        var same = [].filter.call(parent.children, function (c) { return c.tagName === node.tagName; });
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      if (node.id) { parts[0] = '#' + node.id; break; }
      node = parent;
      if (node === document.body) break;
    }
    return parts.join(' > ');
  }

  function sectionFor(el) {
    var s = el.closest('section, header, footer');
    if (!s) return 'page';
    return s.id || (s.getAttribute('class') || '').split(/\s+/)[0] || s.tagName.toLowerCase();
  }

  function snippet(el) {
    if (el.tagName === 'IMG') return '[image] ' + (el.getAttribute('alt') || el.src.split('/').pop());
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 70 ? t.slice(0, 70) + '...' : t;
  }

  function activeTab() {
    var t = document.querySelector('.pick[aria-selected="true"]');
    return t ? t.getAttribute('data-cat') : null;
  }
  var css = document.createElement('style');
  css.textContent = [
    '.sn-bar{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;gap:8px;',
      'font:600 13px/1.2 system-ui,sans-serif}',
    '.sn-btn{background:#1B1512;color:#fff;border:0;border-radius:999px;padding:11px 17px;',
      'cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3);font:inherit}',
    '.sn-btn[data-on="1"]{background:#C43F3C}',
    '.sn-btn.sn-ghost{background:#fff;color:#1B1512;border:1px solid rgba(0,0,0,.15)}',
    '.sn-btn:focus-visible{outline:3px solid #C43F3C;outline-offset:2px}',
    '.sn-arm *{cursor:crosshair !important}',
    '.sn-hi{outline:2px solid #C43F3C !important;outline-offset:2px !important;',
      'background:rgba(196,63,60,.10) !important}',
    '.sn-ink{position:absolute;left:0;top:0;pointer-events:none;z-index:2147482500;overflow:visible}',
    '.sn-catch{position:fixed;inset:0;z-index:2147482800;cursor:crosshair;touch-action:none;',
      'background:transparent}',
    '.sn-catch::after{content:"";position:absolute;inset:0;border:2px solid rgba(196,63,60,.55);',
      'pointer-events:none}',
    '.sn-tip{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);z-index:2147483200;',
      'background:#1B1512;color:#fff;border-radius:999px;padding:9px 16px;',
      'font:600 12.5px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}',
    '.sn-pin{position:absolute;z-index:2147482000;width:24px;height:24px;border-radius:50%;',
      'background:#C43F3C;color:#fff;font:700 12px/24px system-ui,sans-serif;text-align:center;',
      'box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;transform:translate(-50%,-50%)}',
    '.sn-panel{position:fixed;right:16px;bottom:70px;z-index:2147483000;width:340px;max-height:64vh;',
      'overflow:auto;background:#fff;color:#1B1512;border-radius:14px;padding:14px;',
      'box-shadow:0 18px 50px rgba(0,0,0,.32);font:13px/1.45 system-ui,sans-serif;display:none}',
    '.sn-panel[data-open="1"]{display:block}',
    
    '@media (max-width:859px){.sn-bar{bottom:calc(84px + env(safe-area-inset-bottom,0px));right:12px}',
      '.sn-btn{padding:9px 13px}.sn-panel{bottom:134px;right:12px;width:auto;left:12px}',
      '.sn-tip{bottom:138px}}',
    '.sn-row{border-bottom:1px solid rgba(0,0,0,.09);padding:9px 0;display:flex;gap:9px}',
    '.sn-row b{color:#C43F3C;flex:none}',
    '.sn-row p{margin:0;flex:1}',
    '.sn-row small{display:block;color:#777;margin-top:3px;word-break:break-all}',
    '.sn-kind{display:inline-block;font:700 10px/1 system-ui,sans-serif;letter-spacing:.06em;',
      'text-transform:uppercase;color:#fff;background:#1B1512;border-radius:4px;padding:3px 5px;',
      'margin-right:5px;vertical-align:1px}',
    '.sn-x{border:0;background:none;color:#999;cursor:pointer;font-size:15px;line-height:1;flex:none}',
    '.sn-empty{color:#888;padding:8px 0}',
    '.sn-ask{position:fixed;z-index:2147483600;background:#fff;border-radius:12px;padding:12px;',
      'box-shadow:0 18px 50px rgba(0,0,0,.35);width:290px;font:13px system-ui,sans-serif}',
    '.sn-ask textarea{width:100%;height:64px;border:1px solid rgba(0,0,0,.2);border-radius:8px;',
      'padding:8px;font:13px system-ui,sans-serif;resize:none;box-sizing:border-box}',
    '.sn-ask div{margin-top:8px;display:flex;gap:6px;justify-content:flex-end}',
    '.sn-ask small{color:#777;display:block;margin-bottom:6px}',
    '.sn-build{align-self:center;font:600 10px/1 system-ui,sans-serif;color:#1B1512;',
      'background:rgba(255,255,255,.85);border-radius:5px;padding:4px 6px;opacity:.75}'
  ].join('');
  document.head.appendChild(css);
  var bar = document.createElement('div');
  bar.className = 'sn-bar';
  bar.innerHTML =
    '<button class="sn-btn sn-ghost" id="sn-list">Notes (<span id="sn-n">0</span>)</button>' +
    '<button class="sn-btn sn-ghost" id="sn-pencil" title="Draw on the page (Alt+P)">Pencil</button>' +
    '<button class="sn-btn" id="sn-arm" title="Click an element (Alt+N)">Add note</button>' +
    '<span class="sn-build" title="build">' + BUILD + '</span>';
  document.body.appendChild(bar);

  var panel = document.createElement('div');
  panel.className = 'sn-panel';
  document.body.appendChild(panel);
  var ink = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ink.setAttribute('class', 'sn-ink');
  ink.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(ink);

  var armBtn = document.getElementById('sn-arm');
  var pencilBtn = document.getElementById('sn-pencil');
  var listBtn = document.getElementById('sn-list');
  var countEl = document.getElementById('sn-n');

  function sizeInk() {
    var d = document.documentElement;
    var w = Math.max(d.scrollWidth, document.body ? document.body.scrollWidth : 0);
    var h = Math.max(d.scrollHeight, document.body ? document.body.scrollHeight : 0);
    ink.setAttribute('width', w);
    ink.setAttribute('height', h);
    ink.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    ink.style.width = w + 'px';
    ink.style.height = h + 'px';
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) {}
    countEl.textContent = notes.length;
    drawPins();
    drawInk();
    drawPanel();
  }
  function pathFor(pts) {
    if (!pts.length) return '';
    if (pts.length < 3) {
      return 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join('L');
    }
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2;
      var my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += 'Q' + pts[i][0] + ',' + pts[i][1] + ' ' + mx + ',' + my;
    }
    var last = pts[pts.length - 1];
    return d + 'L' + last[0] + ',' + last[1];
  }
  function paint(pts, opacity, group) {
    var d = pathFor(pts);
    if (!d) return;
    [['#fff', 7, 0.9], [INK, 3.4, 1]].forEach(function (spec) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', spec[0]);
      p.setAttribute('stroke-width', spec[1]);
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('opacity', spec[2] * opacity);
      group.appendChild(p);
    });
  }

  function drawInk() {
    sizeInk();
    ink.textContent = '';
    var saved = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    saved.setAttribute('class', 'sn-ink-saved');
    ink.appendChild(saved);
    notes.forEach(function (n) {
      if (n.kind !== 'pencil' || !n.strokes) return;
      n.strokes.forEach(function (s) { paint(s, 0.55, saved); });
    });
    var liveG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    liveG.setAttribute('class', 'sn-ink-live');
    ink.appendChild(liveG);
    return liveG;
  }
  function boxOf(strokeList) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    strokeList.forEach(function (s) {
      s.forEach(function (p) {
        if (p[0] < x0) x0 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[0] > x1) x1 = p[0];
        if (p[1] > y1) y1 = p[1];
      });
    });
    if (x0 === Infinity) return null;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function drawPins() {
    [].forEach.call(document.querySelectorAll('.sn-pin'), function (p) { p.remove(); });
    notes.forEach(function (n, i) {
      var left, top;
      if (n.kind === 'pencil') {
        if (!n.box) return;
        left = n.box.x;
        top = n.box.y;
      } else {
        var el;
        try { el = document.querySelector(n.sel); } catch (e) { el = null; }
        if (!el) return;
        var r = el.getBoundingClientRect();
        left = r.left + window.scrollX + 10;
        top = r.top + window.scrollY + 10;
      }
      var pin = document.createElement('div');
      pin.className = 'sn-pin';
      pin.textContent = i + 1;
      pin.title = n.text;
      pin.style.left = left + 'px';
      pin.style.top = top + 'px';
      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        panel.setAttribute('data-open', '1');
      });
      document.body.appendChild(pin);
    });
  }
  function payloadFor(n, i) {
    if (n.kind === 'pencil') {
      var b = n.box || { x: 0, y: 0, w: 0, h: 0 };
      var crossed = (n.crosses || []).map(function (c) { return c.sel; }).join(', ') || 'nothing resolvable';
      return (i + 1) + '. [' + (n.section || 'page') + '] PENCIL: ' + n.text +
        '\n   drawn at: ' + n.viewport.w + 'x' + n.viewport.h + ', scrollY ' + Math.round(n.scrollY) +
        (n.tab ? ', menu tab "' + n.tab + '"' : '') +
        '\n   ink box (document px): x ' + Math.round(b.x) + '..' + Math.round(b.x + b.w) +
        ', y ' + Math.round(b.y) + '..' + Math.round(b.y + b.h) +
        '\n   strokes cross: ' + crossed +
        '\n   render: note-' + (i + 1) + '.png';
    }
    return (i + 1) + '. [' + n.section + '] ' + n.text +
      '\n   element: ' + n.tag + '  selector: ' + n.sel +
      '\n   content: ' + n.snippet;
  }

  function drawPanel() {
    if (!notes.length) {
      panel.innerHTML = '<p class="sn-empty">No notes yet. <b>Add note</b> to point at an element, ' +
        'or <b>Pencil</b> to draw on the page.</p>';
      return;
    }
    panel.innerHTML = '';
    notes.forEach(function (n, i) {
      var row = document.createElement('div');
      row.className = 'sn-row';
      row.innerHTML = '<b>' + (i + 1) + '</b><p></p>' +
        '<button class="sn-x" title="Delete">&times;</button>';
      var p = row.querySelector('p');
      var kind = document.createElement('span');
      kind.className = 'sn-kind';
      kind.textContent = n.kind === 'pencil' ? 'pencil' : 'element';
      p.appendChild(kind);
      p.appendChild(document.createTextNode(n.text));
      var s = document.createElement('small');
      if (n.kind === 'pencil') {
        var crossed = (n.crosses || []).map(function (c) { return c.sel; }).slice(0, 2).join(', ');
        s.textContent = (n.section || 'page') + ' | over ' + (crossed || 'open space') +
          ' | ' + n.strokes.length + ' stroke' + (n.strokes.length === 1 ? '' : 's');
      } else {
        s.textContent = n.section + ' | ' + n.snippet;
      }
      p.appendChild(s);
      row.querySelector('.sn-x').addEventListener('click', function () {
        notes.splice(i, 1); save();
      });
      panel.appendChild(row);
    });

    var copy = document.createElement('button');
    copy.className = 'sn-btn';
    copy.style.cssText = 'width:100%;margin-top:12px';
    copy.textContent = 'Copy for Claude';
    copy.addEventListener('click', function () {
      var out = notes.map(payloadFor).join('\n\n');
      var payload = 'TLHOGI change notes (' + notes.length + '):\n\n' + out;
      if (notes.some(function (n) { return n.kind === 'pencil'; })) {
        payload += '\n\nPencil notes need rendering before they mean anything: ' +
          'save the .json and run scripts/render_notes.py against it.';
      }
      navigator.clipboard.writeText(payload).then(function () {
        copy.textContent = 'Copied. Paste it to Claude.';
        setTimeout(function () { copy.textContent = 'Copy for Claude'; }, 2200);
      }, function () {
        var ta = document.createElement('textarea');
        ta.value = payload; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        copy.textContent = 'Copied.';
      });
    });
    panel.appendChild(copy);

    var dl = document.createElement('button');
    dl.className = 'sn-btn sn-ghost';
    dl.style.cssText = 'width:100%;margin-top:7px';
    dl.textContent = 'Save .json (for the render)';
    dl.addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({
        page: location.pathname,
        savedAt: new Date().toISOString(),
        notes: notes
      }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      var url = URL.createObjectURL(blob);
      a.href = url;
      a.download = 'tlhogi-notes.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      dl.textContent = 'Saved to Downloads.';
      setTimeout(function () { dl.textContent = 'Save .json (for the render)'; }, 2600);
    });
    panel.appendChild(dl);
  }
  var hovered = null;
  function clearHi() { if (hovered) hovered.classList.remove('sn-hi'); hovered = null; }

  function onOver(e) {
    if (mode !== 'element') return;
    var t = e.target;
    if (t.closest('.sn-bar,.sn-panel,.sn-ask,.sn-pin')) return;
    clearHi();
    hovered = t; t.classList.add('sn-hi');
  }

  function onClick(e) {
    if (mode !== 'element') return;
    if (e.target.closest('.sn-bar,.sn-panel,.sn-ask,.sn-pin')) return;
    e.preventDefault(); e.stopPropagation();
    askElement(e.target, e.clientX, e.clientY);
  }

  function composer(x, y, label, onSave, onCancel) {
    var box = document.createElement('div');
    box.className = 'sn-ask';
    box.style.left = Math.max(8, Math.min(x, window.innerWidth - 305)) + 'px';
    box.style.top = Math.max(8, Math.min(y, window.innerHeight - 160)) + 'px';
    box.innerHTML = '<small></small><textarea placeholder="What should change here?"></textarea>' +
      '<div><button class="sn-btn sn-ghost" data-c>Cancel</button><button class="sn-btn" data-s>Save</button></div>';
    box.querySelector('small').textContent = label;
    document.body.appendChild(box);
    var ta = box.querySelector('textarea');
    ta.focus();
    function close(cancelled) {
      box.remove();
      if (cancelled && onCancel) onCancel();
    }
    box.querySelector('[data-c]').addEventListener('click', function () { close(true); });
    box.querySelector('[data-s]').addEventListener('click', function () {
      var v = ta.value.trim();
      if (v) { onSave(v); close(false); } else { close(true); }
    });
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) box.querySelector('[data-s]').click();
      if (ev.key === 'Escape') { ev.stopPropagation(); close(true); }
    });
    return box;
  }

  function askElement(el, x, y) {
    disarm();
    el.classList.add('sn-hi');
    composer(x, y, el.tagName.toLowerCase() + ' | ' + snippet(el), function (v) {
      notes.push({ kind: 'element', text: v, sel: selectorFor(el), tag: el.tagName.toLowerCase(),
                   section: sectionFor(el), snippet: snippet(el) });
      el.classList.remove('sn-hi');
      save();
    }, function () { el.classList.remove('sn-hi'); });
  }
  var catcher = null, tip = null, live = null;
  var strokes = [], current = null, drawing = false;

  function docPoint(e) {
    return [
      Math.round((e.clientX + window.scrollX) * 10) / 10,
      Math.round((e.clientY + window.scrollY) * 10) / 10
    ];
  }

  function redrawLive() {
    if (!live) return;
    live.textContent = '';
    strokes.forEach(function (s) { paint(s, 1, live); });
    if (current && current.length) paint(current, 1, live);
  }

  function tipText() {
    if (!tip) return;
    tip.textContent = strokes.length
      ? strokes.length + ' stroke' + (strokes.length === 1 ? '' : 's') + ' — Enter to write the note, Ctrl+Z undo, Esc cancel'
      : 'Draw on the page. Enter when done, Esc to cancel.';
  }

  function onDown(e) {
    if (mode !== 'pencil') return;
    e.preventDefault();
    drawing = true;
    try { catcher.setPointerCapture(e.pointerId); } catch (err) {}
    current = [docPoint(e)];
    redrawLive();
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    var p = docPoint(e);
    var last = current[current.length - 1];
    
    if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 2) return;
    current.push(p);
    redrawLive();
  }

  function onUp(e) {
    if (!drawing) return;
    drawing = false;
    try { catcher.releasePointerCapture(e.pointerId); } catch (err) {}
    if (current && current.length > 1) strokes.push(current);
    else if (current && current.length === 1) strokes.push([current[0], [current[0][0] + 1, current[0][1] + 1]]);
    current = null;
    redrawLive();
    tipText();
  }
  function mediaBoxes() {
    return [].slice.call(document.querySelectorAll('img, svg, picture, video, canvas'))
      .filter(function (el) { return !el.closest('.sn-bar,.sn-panel,.sn-ask,.sn-pin,.sn-ink'); })
      .map(function (el) { return { el: el, r: el.getBoundingClientRect() }; })
      .filter(function (m) { return m.r.width > 8 && m.r.height > 8; });
  }

  function crossesFor(strokeList) {
    var was = catcher ? catcher.style.display : null;
    if (catcher) catcher.style.display = 'none';
    var media = mediaBoxes();
    var seen = [], out = [];
    strokeList.forEach(function (s) {
      for (var i = 0; i < s.length; i += 3) {
        var cx = s[i][0] - window.scrollX;
        var cy = s[i][1] - window.scrollY;
        if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) continue;

        var cands = document.elementsFromPoint(cx, cy).filter(function (el) {
          if (!el || el.closest('.sn-bar,.sn-panel,.sn-ask,.sn-pin,.sn-ink')) return false;
          return el !== document.documentElement && el !== document.body;
        });
        media.forEach(function (m) {
          if (cx >= m.r.left && cx <= m.r.right && cy >= m.r.top && cy <= m.r.bottom &&
              cands.indexOf(m.el) < 0) cands.push(m.el);
        });
        if (!cands.length) continue;

        var best = null, bestArea = Infinity;
        cands.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var area = r.width * r.height;
          if (area > 0 && area < bestArea) { bestArea = area; best = el; }
        });
        if (!best || seen.indexOf(best) >= 0) continue;
        seen.push(best);
        out.push({ sel: selectorFor(best), snippet: snippet(best) });
      }
    });
    if (catcher) catcher.style.display = was;
    return out;
  }

  function finishPencil() {
    if (!strokes.length) { disarm(); return; }
    var box = boxOf(strokes);
    var crosses = crossesFor(strokes);
    var anchor = crosses.length ? crosses[0].sel : 'open space';
    
    var sec = 'page';
    if (crosses.length) {
      var first = null;
      try { first = document.querySelector(crosses[0].sel); } catch (e) {}
      if (first) sec = sectionFor(first);
    }
    var kept = strokes.slice();
    var vp = { w: window.innerWidth, h: window.innerHeight };
    var sy = window.scrollY;
    var tab = activeTab();

    var cx = Math.min(box.x - window.scrollX, window.innerWidth - 305);
    var cy = Math.min(box.y + box.h + 12 - window.scrollY, window.innerHeight - 160);
    composer(cx, cy, kept.length + ' stroke' + (kept.length === 1 ? '' : 's') + ' over ' + anchor,
      function (v) {
        notes.push({ kind: 'pencil', text: v, strokes: kept, box: box,
                     viewport: vp, scrollY: sy, tab: tab, crosses: crosses, section: sec });
        strokes = [];
        disarm();
        save();
      },
      function () { strokes = []; disarm(); save(); });
  }
  function lenis(fn) {
    var l = window.__smokeLenis;
    if (l && typeof l[fn] === 'function') l[fn]();
  }

  function armElement() {
    disarm();
    mode = 'element';
    document.body.classList.add('sn-arm');
    armBtn.setAttribute('data-on', '1');
    armBtn.textContent = 'Click an element (Esc)';
  }

  function armPencil() {
    disarm();
    mode = 'pencil';
    pencilBtn.setAttribute('data-on', '1');
    pencilBtn.classList.remove('sn-ghost');
    pencilBtn.textContent = 'Drawing (Esc)';
    lenis('stop');

    strokes = []; current = null;
    live = drawInk();
    catcher = document.createElement('div');
    catcher.className = 'sn-catch';
    document.body.appendChild(catcher);
    catcher.addEventListener('pointerdown', guard('pointerdown', onDown));
    catcher.addEventListener('pointermove', guard('pointermove', onMove));
    catcher.addEventListener('pointerup', guard('pointerup', onUp));
    catcher.addEventListener('pointercancel', guard('pointercancel', onUp));
    tip = document.createElement('div');
    tip.className = 'sn-tip';
    document.body.appendChild(tip);
    tipText();
  }

  function disarm() {
    mode = null;
    drawing = false;
    document.body.classList.remove('sn-arm');
    armBtn.removeAttribute('data-on');
    armBtn.textContent = 'Add note';
    pencilBtn.removeAttribute('data-on');
    pencilBtn.classList.add('sn-ghost');
    pencilBtn.textContent = 'Pencil';
    if (catcher) { catcher.remove(); catcher = null; }
    if (tip) { tip.remove(); tip = null; }
    clearHi();
    lenis('start');
    live = drawInk();
  }

  armBtn.addEventListener('click', guard('the Add note button', function () {
    if (mode === 'element') disarm(); else armElement();
  }));
  pencilBtn.addEventListener('click', guard('the Pencil button', function () {
    if (mode === 'pencil') { if (strokes.length) finishPencil(); else disarm(); }
    else armPencil();
  }));
  listBtn.addEventListener('click', guard('the Notes button', function () {
    panel.setAttribute('data-open', panel.getAttribute('data-open') === '1' ? '0' : '1');
  }));

  document.addEventListener('mouseover', guard('element hover', onOver), true);
  document.addEventListener('click', guard('element click', onClick), true);
  document.addEventListener('keydown', guard('a keyboard shortcut', function (e) {
    if (e.target && /^(TEXTAREA|INPUT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') { strokes = []; disarm(); save(); return; }
    if (mode === 'pencil') {
      if (e.key === 'Enter') { e.preventDefault(); finishPencil(); return; }
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        strokes.pop();
        redrawLive();
        tipText();
        return;
      }
    }
    if (e.altKey && e.key.toLowerCase() === 'n') { if (mode === 'element') disarm(); else armElement(); }
    if (e.altKey && e.key.toLowerCase() === 'p') { if (mode === 'pencil') disarm(); else armPencil(); }
  }));

  window.addEventListener('resize', function () { drawPins(); drawInk(); });
  window.addEventListener('load', function () { drawPins(); drawInk(); });
  window.__smokeNotesDiag = function () {
    return {
      build: BUILD, mode: mode, notes: notes.length,
      strokesInProgress: strokes.length,
      hasLenis: !!window.__smokeLenis,
      inkAttached: !!document.querySelector('.sn-ink'),
      liveAttached: !!(live && document.contains(live)),
      catcher: !!document.querySelector('.sn-catch'),
      boom: !!document.getElementById('sn-boom')
    };
  };

  window.__smokeNotesApi = {
    armPencil: armPencil,
    disarm: disarm,
    getNotes: function () { return notes; },
    setNotes: function (n) { notes = n; save(); },
    paintInto: function (strokeList, opacity) {
      var g = drawInk();
      strokeList.forEach(function (s) { paint(s, opacity == null ? 1 : opacity, g); });
    }
  };

  save();
})();

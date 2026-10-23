
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var MENU = {
    meals: { note: 'Meal 2 and Meal 4 are printed identically on the in store menu. Worth confirming before this goes live.', items: [
      ['Meal 1','Pap, chakalaka and beef','The everyday plate.','R70'],
      ['Meal 2','Pap, chakalaka, wors and beef','Beef plus a length of wors.','R90'],
      ['Meal 3','Pap, chakalaka, 2 wings and beef','Two flame grilled wings.','R105'],
      ['Meal 4','Pap, chakalaka, wors and beef','As printed on the in store menu.','R90'],
      ['Meal 5','Pap, chakalaka, wors, wings and beef','Everything on one plate.','R130']]},
    sides: { note: 'Chips come free with every wrap.', items: [
      ['Side','Chips','Hand cut and salted.','R15'],
      ['Side','Greek salad','Feta, olives, peppers, cucumber.','R30']]},
    sphathlo: { note: 'Built on a quarter loaf with the chips packed inside.', items: [
      ['01','Cheese and polony','','R26'],['02','Cheese and vienna','','R28'],
      ['03','Cheese, egg and vienna','','R36'],['04','Cheese and russian','','R36'],
      ['05','Cheese, egg and russian','','R42'],['06','Cheese and steak','','R55'],
      ['07','Cheese, egg and steak','','R60'],['08','Cheese and rib','','R55'],
      ['09','Cheese, egg and rib','','R60'],['10','Cheese and burger','','R55'],
      ['11','Cheese, egg and burger','','R60'],['12','Cheese and fish','','R55'],
      ['13','Cheese, egg and fish','','R60']]},
    platters: { note: 'Give the shop notice for the bigger boards so they can get it right.', items: [
      ['For 1','Beef, wors, wing and pork chop','One of each, one board.','R160'],
      ['For 2','Everything, doubled','Beef, wors, wing and pork chop, twice over.','R300'],
      ['For 3','Everything, tripled','Beef, wors, wing and pork chop, three times.','R440'],
      ['For 4','Everything, four times over','Beef, wors, wing and pork chop, four times.','R580']]},
    wraps: { note: 'Every wrap comes with chips.', items: [
      ['01','Beef wrap and chips','','R75'],['02','Chicken wrap and chips','','R75'],
      ['03','Rib wrap and chips','','R75'],['04','Fish wrap and chips','','R80']]},
    combos: { note: 'Every combo includes chips and a Greek salad.', items: [
      ['01','Ribs, chips and salad','Basted and grilled.','R220'],
      ['02','Fish, chips and salad','','R170'],
      ['03','7 wings, wors, chips and salad','','R200'],
      ['04','Full chicken, chips and salad','A whole bird.','R200']]}
  };

  var list = document.getElementById('items');
  var note = document.getElementById('note');
  var panel = document.getElementById('panel');
  var tabs = [].slice.call(document.querySelectorAll('.pick'));
  
  var sheetName = document.getElementById('sheetName'), mbGo = document.getElementById('mbGo');
  var LABEL = { meals: ['Meals', 'a meal'], sphathlo: ['Sphathlo', 'a sphathlo'], wraps: ['Wraps', 'a wrap'],
                combos: ['Combos', 'a combo'], platters: ['Boards', 'a board'], sides: ['Chips and salad', 'a side'] };

  function render(cat) {
    var d = MENU[cat]; if (!d || !list) return;
    var frag = document.createDocumentFragment();
    d.items.forEach(function (r) {
      var li = document.createElement('li');
      var no = document.createElement('span'); no.className = 'no'; no.textContent = r[0];
      var body = document.createElement('div'); body.className = 'body';
      var nm = document.createElement('div'); nm.className = 'name'; nm.textContent = r[1];
      body.appendChild(nm);
      if (r[2]) { var ds = document.createElement('div'); ds.className = 'desc'; ds.textContent = r[2]; body.appendChild(ds); }
      var pr = document.createElement('span'); pr.className = 'price'; pr.textContent = r[3];
      li.appendChild(no); li.appendChild(body); li.appendChild(pr);
      frag.appendChild(li);
    });
    list.textContent = ''; list.appendChild(frag);
    if (note) note.textContent = d.note || '';
    if (hasST) ScrollTrigger.refresh();
  }

  function select(btn, focus) {
    tabs.forEach(function (t) {
      var on = t === btn;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    if (panel) panel.setAttribute('aria-labelledby', btn.id);
    var lab = LABEL[btn.dataset.cat];
    if (lab && sheetName) {
      sheetName.textContent = lab[0];
      mbGo.href = 'https://wa.me/27XXXXXXXXX?text=' + encodeURIComponent("Hi Smoke Cafe, I'd like to order " + lab[1] + ': ');
    }
    if (reduced || !panel) {
      render(btn.dataset.cat);
    } else {
      panel.style.transition = 'opacity 190ms ease, transform 190ms ease';
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(8px)';
      setTimeout(function () {
        render(btn.dataset.cat);
        panel.style.opacity = '1';
        panel.style.transform = 'none';
      }, 190);
    }
    if (focus) btn.focus();
  }

  tabs.forEach(function (t, i) {
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', function () {
      select(t, false);
      var r = panel && panel.getBoundingClientRect();
      if (r && (r.top > innerHeight * .85 || r.bottom < 0)) {
        if (lenis) lenis.scrollTo(panel, { offset: -110 });
        else panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });
  if (tabs.length) render('sphathlo');
  [].forEach.call(document.querySelectorAll('a[href^="#t-"]'), function (a) {
    a.addEventListener('click', function (e) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t || tabs.indexOf(t) < 0) return;
      e.preventDefault();
      select(t, false);
      
      var panel = document.querySelector('.mb__sheet') || document.getElementById('panel');
      setTimeout(function () {
        if (lenis) lenis.scrollTo(panel, { offset: -90 });
        else panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    });
  });
  var prWord = document.querySelector('.pr__w--b'), prFrameEl = document.querySelector('.pr__frame');
  if (prWord && prFrameEl) {
    var prPlace = function () {
      if (innerWidth < 760) { prFrameEl.style.left = ''; return; }
      var w = prWord.getBoundingClientRect(), sec = prFrameEl.offsetParent.getBoundingClientRect();
      prFrameEl.style.left = Math.round(w.left - sec.left + w.width / 2) + 'px';
    };
    prPlace();
    addEventListener('resize', prPlace);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(prPlace);
  }
  var burger = document.getElementById('burger');
  var sheet = document.getElementById('sheet');
  if (burger && sheet) {
    var sheetOpen = false, restoreTo = null, closeTimer = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function sheetFocusables() {
      return [].filter.call(sheet.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
      });
    }

    function lockScroll(on) {
      
      if (lenis) { if (on && lenis.stop) lenis.stop(); else if (!on && lenis.start) lenis.start(); }
      document.documentElement.classList.toggle('is-locked', on);
      
      document.documentElement.classList.toggle('is-sheet', on);
    }

    function openSheet() {
      if (sheetOpen) return;
      sheetOpen = true;
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      restoreTo = document.activeElement;
      sheet.hidden = false;
      
      requestAnimationFrame(function () { sheet.classList.add('is-open'); });
      burger.setAttribute('aria-expanded', 'true');
      lockScroll(true);
      var f = sheetFocusables();
      if (f.length) f[0].focus();
    }

    function closeSheet() {
      if (!sheetOpen) return;
      sheetOpen = false;
      sheet.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      lockScroll(false);
      if (restoreTo && restoreTo.focus) restoreTo.focus();
      else burger.focus();
      restoreTo = null;
      
      closeTimer = setTimeout(function () { sheet.hidden = true; closeTimer = null; }, 420);
    }

    burger.addEventListener('click', function () {
      if (sheetOpen) closeSheet(); else openSheet();
    });
    [].forEach.call(sheet.querySelectorAll('a[href^="#"]'), function (a) {
      a.addEventListener('click', closeSheet);
    });

    document.addEventListener('keydown', function (e) {
      if (!sheetOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
      if (e.key !== 'Tab') return;
      
      var f = sheetFocusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  if (reduced || !hasGSAP) {
    
    document.documentElement.classList.add('hvx-off');
    [].forEach.call(document.querySelectorAll('[data-rise]'), function (el) {
      el.style.opacity = 1; el.style.transform = 'none'; el.style.filter = 'none';
    });
    return;
  }
  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    
    window.__smokeLenis = lenis;
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  [].forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2 || id.indexOf('#t-') === 0) return; 
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });
  if (hasST) {
    gsap.utils.toArray('[data-rise]').forEach(function (el) {
      
      if (el.closest('.hero')) return;
      gsap.to(el, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
    if (document.querySelector('.mb')) {
      gsap.fromTo('.mb__sign', { yPercent: -35, rotation: -5, opacity: 0 },
        { yPercent: 0, rotation: 0, opacity: 1, duration: 1.6, ease: 'elastic.out(1,.45)', transformOrigin: '50% 0%',
          scrollTrigger: { trigger: '.mb', start: 'top 75%', once: true } });
      gsap.utils.toArray('.mb__deal, .mb__card, .mb__free').forEach(function (c, i) {
        var tl = gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 88%', once: true } });
        tl.fromTo(c, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out' });
        var food = c.querySelector('.mb__food'), tag = c.querySelector('.mb__tag, .mb__seal');
        if (food) tl.fromTo(food, { scale: .72, y: 30 }, { scale: 1, y: 0, duration: .9, ease: 'back.out(1.7)' }, .12);
        if (tag) tl.fromTo(tag, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: .6, ease: 'back.out(2.4)' }, .45);
      });
    }
    if (document.querySelector('.proof')) {
      var tilt = function (i, el) { return parseFloat(el.dataset.tilt) || 0; };
      var pt = gsap.timeline({ scrollTrigger: { trigger: '.proof', start: 'top 70%', once: true } });
      pt.fromTo('.pr__w--a', { xPercent: -70, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1, ease: 'expo.out' }, 0)
        .fromTo('.pr__w--c', { xPercent: 70, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1, ease: 'expo.out' }, 0)
        .fromTo('.pr__w--b', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, ease: 'expo.out' }, .1)
        
        .fromTo('.pr__frame', { y: -140, rotation: -12, opacity: 0 }, { y: 0, rotation: tilt, opacity: 1, duration: 1.3, ease: 'elastic.out(1,.6)' }, .25)
        .fromTo('.pr__grill', { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'expo.out' }, .35)
        .fromTo('.pr__pic', { scale: .6, rotation: function (i, el) { return tilt(i, el) - 14; }, opacity: 0 }, { scale: 1, rotation: tilt, opacity: 1, duration: .8, ease: 'back.out(1.8)', stagger: .12 }, .45)
        .fromTo('.pr__paint, .pr__stick, .pr__oval', { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2.2)', stagger: .09 }, .8);
      gsap.to('.pr__shots', { yPercent: -5, ease: 'none',
        scrollTrigger: { trigger: '.proof', start: 'top bottom', end: 'bottom top', scrub: .6 } });
    }
    gsap.utils.toArray('[data-para]').forEach(function (el) {
      var amt = parseFloat(el.dataset.para) || .08;
      gsap.to(el, {
        yPercent: -amt * 100, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    var island = document.getElementById('island');
    if (island) {
      ScrollTrigger.create({
        start: 'top -80',
        onUpdate: function (self) {
          island.style.background = self.progress > 0 || self.scroll() > 80
            ? 'rgba(18,16,14,.82)' : 'rgba(18,16,14,.62)';
        }
      });
    }

    heroStory();

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }
  function splitHeadline(el) {
    var lines = el.innerHTML.split(/<br\s*\/?>/i).map(function (s) {
      var d = document.createElement('div'); d.innerHTML = s; return d.textContent.trim();
    }).filter(Boolean);
    el.setAttribute('aria-label', lines.join(' '));
    el.textContent = '';
    var chars = [];
    lines.forEach(function (line) {
      var l = document.createElement('span');
      l.className = 'hl'; l.setAttribute('aria-hidden', 'true');
      line.split('').forEach(function (ch) {
        var c = document.createElement('span');
        c.className = 'hc'; c.textContent = ch === ' ' ? ' ' : ch;
        l.appendChild(c); chars.push(c);
      });
      el.appendChild(l);
    });
    return chars;
  }
  function ext(a, b) { for (var k in b) a[k] = b[k]; return a; }
  function wrapLine(el) {
    var s = document.createElement('span');
    while (el.firstChild) s.appendChild(el.firstChild);
    el.appendChild(s); return s;
  }
  function flameShaper(d0) {
    var nums = d0.match(/-?\d+(\.\d+)?/g).map(Number), base = [];
    for (var i = 0; i < nums.length; i += 2) base.push([nums[i], nums[i + 1]]);
    function at(x, y) { for (var k = 0; k < base.length; k++) if (base[k][0] === x && base[k][1] === y) return k; }
    
    var tongues = [
      [at(32.2, 212.6), 9, 16, 12, [0.83, 1.37, 2.11], 0.0],
      [at(228.7, 3.5), 12, 36, 6, [0.61, 1.13, 1.79], 2.1],
      [at(378.3, 227.3), 9, 16, 12, [0.97, 1.51, 2.33], 4.4]
    ];
    function wander(t, f, ph) {
      return Math.sin(t * f[0] * 6.283 + ph) * .5 + Math.sin(t * f[1] * 6.283 + ph * 1.7) * .3 + Math.sin(t * f[2] * 6.283 + ph * 2.9) * .2;
    }
    function shape(t, wind) {
      var p = base.map(function (q) { return q.slice(); });
      tongues.forEach(function (g) {
        var dx = wander(t, g[4], g[5]) * g[1], v = wander(t * 1.2, g[4], g[5] + 1.3), dy = v < 0 ? v * g[2] : v * g[3];
        p[g[0]][0] += dx; p[g[0]][1] += dy; p[g[0] + 1][0] += dx * .7; p[g[0] + 1][1] += dy * .7;
        g.now = p[g[0]];
      });
      var s = p.map(function (q) {
        var h = Math.max(0, (586 - q[1]) / 586);
        return (q[0] + wind * Math.pow(h, 1.6) * 90).toFixed(1) + ',' + q[1].toFixed(1);
      });
      var d = 'M' + s[0];
      for (var k = 1; k < s.length; k += 3) d += ' C' + s[k] + ' ' + s[k + 1] + ' ' + s[k + 2];
      return d;
    }
    return { tongues: tongues, shape: shape };
  }
  function navFlame() {
    var paths = document.querySelectorAll('.bar__badge .badge__fl');
    if (!paths.length) return;
    
    if (reduced) { var s = paths[0].ownerSVGElement; if (s.pauseAnimations) s.pauseAnimations(); return; }
    var shape = flameShaper(paths[0].getAttribute('d')).shape;
    var last = 0, wind = 0, t0 = performance.now() + 7000;   
    function loop(now) {
      requestAnimationFrame(loop);
      if (now - last < 1000 / 24 || document.hidden) return;
      last = now;
      var t = (now - t0) / 1000;
      wind += (Math.sin(t * .6) * .12 + Math.sin(t * 1.7) * .05 - wind) * .06;
      var d = shape(t, wind);
      paths[0].setAttribute('d', d); paths[1].setAttribute('d', d);
    }
    requestAnimationFrame(loop);
  }

  function slotFlame(hero, chars) {
    var svg = hero.querySelector('.hvx__flame');
    var gap = chars.filter(function (c) { return !c.textContent.trim(); })[0];
    if (!svg || !gap) return;
    gap.textContent = '';
    gap.classList.add('hvx__fc');
    gap.appendChild(svg);

    var paths = svg.querySelectorAll('.hvx__fl');
    var fire = flameShaper(paths[0].getAttribute('d')), tongues = fire.tongues, shape = fire.shape;
    var emberG = svg.querySelector('.hvx__embers'), embers = [], nextSpawn = 0;
    function spawn() {
      if (embers.length >= 6) return;
      var g = tongues[Math.random() < .5 ? 1 : (Math.random() < .5 ? 0 : 2)];
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      emberG.appendChild(el);
      embers.push({ el: el, x: g.now[0] + (Math.random() - .5) * 20, y: g.now[1] - 10,
        vx: (Math.random() - .5) * 30, vy: -(110 + Math.random() * 70),
        len: 16 + Math.random() * 14, age: 0, life: .9 + Math.random() * .6, sway: Math.random() * 6.283 });
    }
    function stepEmbers(dt, t) {
      for (var k = embers.length - 1; k >= 0; k--) {
        var e = embers[k];
        e.age += dt;
        if (e.age > e.life) { e.el.remove(); embers.splice(k, 1); continue; }
        var vx = e.vx + wind * 120 + Math.sin(t * 3 + e.sway) * 25;
        e.x += vx * dt; e.y += e.vy * dt;
        var sp = Math.hypot(vx, e.vy), q = e.age / e.life, l = e.len * (1 - q * .6);
        e.el.setAttribute('d', 'M' + e.x.toFixed(1) + ',' + e.y.toFixed(1) + ' l' + (vx / sp * l).toFixed(1) + ',' + (e.vy / sp * l).toFixed(1));
        e.el.setAttribute('opacity', (Math.min(1, q * 6) * (1 - q * q)).toFixed(2));
      }
    }

    var frame = hero.querySelector('.hvx__a');
    var target = 0, wind = 0, fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) addEventListener('pointermove', function (e) { target = ((e.clientX / innerWidth) - .5) * -1.6; }, { passive: true });
    var last = 0, prev = 0, t0 = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      if (now - last < 1000 / 24 || document.hidden || frame.style.visibility === 'hidden' || scrollY > innerHeight * 1.6) return;
      last = now;
      var t = (now - t0) / 1000, dt = Math.min(.1, t - prev); prev = t;
      wind += ((fine ? target : 0) + Math.sin(t * .6) * .12 + Math.sin(t * 1.7) * .05 - wind) * .06;
      var d = shape(t, wind);
      paths[0].setAttribute('d', d); paths[1].setAttribute('d', d);
      if (t > nextSpawn) { spawn(); nextSpawn = t + .25 + Math.random() * .45; }
      stepEmbers(dt, t);
    }
    requestAnimationFrame(loop);
  }

  function heroStory() {
    var hero = document.querySelector('.hero');
    var ground = hero && hero.querySelector('.hvx__ground');
    var html = document.documentElement;
    if (!hero || !ground || html.classList.contains('hvx-off')) return;
    html.classList.add('hvx-on');

    var h1 = hero.querySelector('h1');
    var note = hero.querySelector('.hero__note');
    var cta = hero.querySelector('.hero__cta');
    var bib = cta.querySelector('.bib');
    var cut = hero.querySelector('.hero__cut');
    var sticker = hero.querySelector('.hero__sticker');
    var blob = hero.querySelector('.hero__blob');
    var titleChars = splitHeadline(hero.querySelector('.hvx__title'));
    slotFlame(hero, titleChars);
    var lines = [].map.call(hero.querySelectorAll('[data-hvx-line]'), wrapLine);
    var h1Chars = splitHeadline(h1);
    var RED = getComputedStyle(html).getPropertyValue('--red-d').trim() || '#A82126';
    var BLACK = getComputedStyle(html).getPropertyValue('--black').trim() || '#150F0C';
    function A() {
      var W = hero.offsetWidth, H = hero.offsetHeight;
      var w = cut.offsetWidth, h = cut.offsetHeight;
      var s = Math.min(1.05, (.62 * H) / h, (.9 * W) / w);
      return { x: .5 * W - (cut.offsetLeft + w / 2), y: .54 * H - (cut.offsetTop + h / 2), scale: s };
    }
    
    function B() {
      return { left: blob.offsetLeft, top: blob.offsetTop, width: blob.offsetWidth, height: blob.offsetHeight,
               borderTopLeftRadius: getComputedStyle(blob).borderTopLeftRadius };
    }
    function full() {
      return { left: 0, top: 0, width: hero.offsetWidth, height: hero.offsetHeight, borderTopLeftRadius: '0px 0px' };
    }
    
    function C() {
      var gx = gsap.getProperty(cta, 'x'), gy = gsap.getProperty(cta, 'y');
      var r = cta.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      var bibW = bib.getBoundingClientRect().width;
      var left = r.left - gx - hr.left, top = r.top - gy - hr.top;
      var bottomGap = Math.max(18, Math.min(40, hero.offsetHeight * .045));
      return { x: (hero.offsetWidth - bibW) / 2 - left, y: hero.offsetHeight - bottomGap - bib.offsetHeight - top };
    }
    function paintGround(red) {
      hero.classList.toggle('on-red', red);
      hero.classList.toggle('on-light', !red);
    }
    paintGround(true);
    gsap.set(ground, ext({ right: 'auto', bottom: 'auto', autoAlpha: 1 }, full()));
    gsap.set(h1, { opacity: 1, y: 0, filter: 'none' });
    gsap.set(h1Chars, { yPercent: 115 });
    gsap.set(note, { opacity: 0, y: 18, filter: 'none' });
    gsap.set(cta, { opacity: 0, filter: 'none', x: 0, y: 0 });
    gsap.set(cta, { x: C().x, y: C().y });
    gsap.set(bib, { backgroundColor: BLACK });
    gsap.set(sticker, { visibility: 'visible', autoAlpha: 0, scale: 0 });
    gsap.set(cut, { opacity: 0, filter: 'none', x: A().x, y: A().y, scale: A().scale * .88 });
    var intro = gsap.timeline({ delay: .1 });
    intro
      .to(cut, { opacity: 1, scale: A().scale, duration: 1.3, ease: 'expo.out' }, 0)
      .from(titleChars, { yPercent: 115, duration: .9, ease: 'expo.out', stagger: .035 }, .2)
      .from(lines, { yPercent: 120, duration: .8, ease: 'expo.out', stagger: .08 }, .45)
      .to(cta, { opacity: 1, duration: .8, ease: 'power3.out' }, .7);
    var built = false;
    function build() {
      if (built) return;
      built = true;
      intro.progress(1);
      ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { removeEventListener(ev, build); });
      story();
      ScrollTrigger.refresh();
    }
    intro.eventCallback('onComplete', build);
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, build, { passive: true }); });

    function story() {
      var red = true;
      var tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: hero, start: 'top top',
          end: function () { return '+=' + Math.round(innerHeight * 1.1); },
          pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
          snap: { snapTo: 'labelsDirectional', inertia: false, duration: { min: .3, max: .8 }, delay: .12, ease: 'power1.inOut' },
          onUpdate: function (self) {
            
            var now = self.progress < .45;
            if (now !== red) { red = now; paintGround(red); }
          },
          
          onRefresh: function (self) {
            var t = self.progress;
            if (t <= .15) gsap.set(ground, full());
            if (t <= .2) gsap.set(cut, A());
            if (t <= .3) gsap.set(cta, C());
          }
        }
      });
      
      tl.addLabel('smoke', 0)
        .fromTo(titleChars, { yPercent: 0 }, { yPercent: 115, duration: .3, ease: 'power2.in', stagger: .02, immediateRender: false }, 0)
        .fromTo(lines, { yPercent: 0 }, { yPercent: 120, duration: .22, ease: 'power2.in', stagger: .04, immediateRender: false }, .1)
        
        .fromTo(hero.querySelector('.hvx__a'), { autoAlpha: 1 }, { autoAlpha: 0, duration: .08, ease: 'none', immediateRender: false }, .34)
        .fromTo(ground, full, ext({ duration: .5, immediateRender: false }, B()), .15)
        .fromTo(cut, { x: function () { return A().x; }, y: function () { return A().y; }, scale: function () { return A().scale; } },
                     { x: 0, y: 0, scale: 1, duration: .5, immediateRender: false }, .2)
        .fromTo(h1Chars, { yPercent: 115 }, { yPercent: 0, duration: .35, ease: 'power3.out', stagger: .02, immediateRender: false }, .5)
        .fromTo(cta, { x: function () { return C().x; }, y: function () { return C().y; } },
                     { x: 0, y: 0, duration: .45, immediateRender: false }, .3)
        .fromTo(bib, { backgroundColor: BLACK }, { backgroundColor: RED, duration: .3, immediateRender: false }, .45)
        .fromTo(note, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .25, ease: 'power2.out', immediateRender: false }, .62)
        .fromTo(sticker, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .25, ease: 'back.out(1.7)', immediateRender: false }, .7)
        
        .fromTo(ground, { autoAlpha: 1 }, { autoAlpha: 0, duration: .12, ease: 'none', immediateRender: false }, .86)
        .addLabel('hero', 1)
        .set({}, {}, 1);
    }
  }
  var magnet = document.getElementById('magnet');
  if (magnet && finePointer) {
    var raf = null, tx = 0, ty = 0;
    function apply() { magnet.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; raf = null; }
    magnet.addEventListener('mousemove', function (e) {
      var r = magnet.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 14;
      ty = ((e.clientY - r.top) / r.height - .5) * 10;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    magnet.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }
  var bar = document.querySelector('.bar');
  if (bar) {
    var barTick = null;
    function readGround() {
      barTick = null;
      var r = bar.getBoundingClientRect();
      
      var stack = document.elementsFromPoint(
        Math.round(r.width / 2), Math.round(r.top + r.height / 2));
      var sec = null;
      for (var i = 0; i < stack.length; i++) {
        if (bar.contains(stack[i])) continue;
        sec = stack[i].closest ? stack[i].closest('.on-dark,.on-light,.on-red') : null;
        if (sec) break;
      }
      var dark = sec ? (sec.classList.contains('on-dark') || sec.classList.contains('on-red')) : false;
      bar.classList.toggle('bar--light', dark);
      bar.classList.toggle('bar--red', !!sec && sec.classList.contains('on-red'));
      
      bar.classList.toggle('is-solid', (window.scrollY || pageYOffset) > 24);
    }
    function queueGround() { if (!barTick) barTick = requestAnimationFrame(readGround); }
    addEventListener('scroll', queueGround, { passive: true });
    addEventListener('resize', queueGround);
    readGround();
  }
  var dock = document.querySelector('.dock');
  if (dock && 'IntersectionObserver' in window) {
    var heroAskOut = false, closeIn = false;
    function settle() {
      dock.classList.toggle('is-up', heroAskOut && !closeIn);
    }
    if (magnet) {
      new IntersectionObserver(function (es) {
        heroAskOut = !es[0].isIntersecting; settle();
      }, { threshold: 0 }).observe(magnet);
    } else {
      heroAskOut = true;
    }
    var closing = document.querySelector('.close');
    if (closing) {
      new IntersectionObserver(function (es) {
        closeIn = es[0].isIntersecting; settle();
      }, { threshold: 0 }).observe(closing);
    }
    settle();
  }

  navFlame();
  window.addEventListener('pagehide', function () {
    if (hasST) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    if (lenis && lenis.destroy) lenis.destroy();
  });
})();

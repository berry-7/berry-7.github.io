
(function () {
  "use strict";

  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";
  var MOTION = !REDUCE && hasGSAP;
  var EASE = "expo.out";

  function $(s, ctx) { return (ctx || document).querySelector(s); }
  function $$(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }
  var WA = document.body.getAttribute("data-wa");
  var TEL = document.body.getAttribute("data-tel");
  
  $$("[data-call]").forEach(function (a) { a.href = "tel:" + TEL; });
  $$("[data-wa-msg]").forEach(function (a) {
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(a.getAttribute("data-wa-msg"));
    a.target = "_blank";
    a.rel = "noopener";
  });
  var burger = $("#burger"), sheet = $("#sheet");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.classList.toggle("open", open);
    if (open) sheet.removeAttribute("inert"); else sheet.setAttribute("inert", "");
    document.body.classList.toggle("menu-open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) { var first = $("nav a", sheet); if (first) first.focus(); }
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet.classList.contains("open")) { setMenu(false); burger.focus(); }
  });
  function wireRails() {
    $$(".rail").forEach(function (rail) {
      var track = rail.querySelector(".rail-track");
      if (!track) return;
      var x = 0;
      function max() {
        var pad = parseFloat(getComputedStyle(rail).paddingLeft) * 2;
        return Math.max(0, track.scrollWidth + pad - rail.clientWidth);
      }
      function set(v, animate) {
        x = Math.min(0, Math.max(-max(), v));
        if (MOTION && animate) gsap.to(track, { x: x, duration: .8, ease: EASE });
        else track.style.transform = "translate3d(" + x + "px,0,0)";
      }
      function step() {
        var c = track.firstElementChild;
        return c ? c.getBoundingClientRect().width + 14 : 300;
      }
      $$('[data-rail="' + rail.id + '"]').forEach(function (b) {
        b.addEventListener("click", function () { set(x - step() * +b.dataset.dir, true); });
      });
      rail.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); set(x - step(), true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); set(x + step(), true); }
      });

      var down = false, sx = 0, sp = 0;
      rail.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        down = true; sx = e.clientX; sp = x;
        rail.classList.add("drag"); rail.setPointerCapture(e.pointerId);
        if (MOTION) gsap.killTweensOf(track);
      });
      rail.addEventListener("pointermove", function (e) { if (down) set(sp + (e.clientX - sx), false); });
      function up(e) {
        if (!down) return;
        down = false; rail.classList.remove("drag");
        try { rail.releasePointerCapture(e.pointerId); } catch (_) {}
        set(x, true);
      }
      rail.addEventListener("pointerup", up);
      rail.addEventListener("pointercancel", up);
      addEventListener("resize", function () { set(x, false); });
    });
  }
  wireRails();
  (function () {
    var bar = $("#floatCall"), hero = $(".hero"), quote = $("#contact");
    if (!bar || !("IntersectionObserver" in window)) return;
    var pastHero = false, atQuote = false;
    function sync() {
      var show = pastHero && !atQuote;
      bar.classList.toggle("show", show);
      bar.setAttribute("aria-hidden", String(!show));
      bar.tabIndex = show ? 0 : -1;
    }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(function (es) { atQuote = es[0].isIntersecting; sync(); }, { threshold: .15 }).observe(quote);
  })();
  var lenis = null;
  function onScroll() {}

  if (!MOTION) return;
  gsap.registerPlugin(ScrollTrigger);

  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: .9, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      if (a.hasAttribute("data-wa-msg") || a.hasAttribute("data-call")) return;
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        var t = id.length > 1 && document.getElementById(id.slice(1));
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -20, duration: 1.2 });
      });
    });
  }
  function words(el) {
    var out = [];
    el.childNodes.forEach(function (node) {
      var em = node.nodeType === 1 && node.tagName === "EM";
      
      node.textContent.split(/[ \t\n\r]+/).forEach(function (w) { if (w) out.push({ w: w, em: em }); });
    });
    return out;
  }
  function splitLines(el) {
    if (!el._src) el._src = words(el);
    var ws = el._src;
    el.textContent = "";
    var probes = ws.map(function (o, i) {
      var s = document.createElement(o.em ? "em" : "span");
      s.style.display = "inline-block";
      s.textContent = o.w;
      el.appendChild(s);
      if (i < ws.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
    var lines = [], top = null;
    probes.forEach(function (s, i) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(ws[i]);
    });
    el.textContent = "";
    var inners = lines.map(function (line) {
      var outer = document.createElement("span");
      outer.className = "rv-line";
      var inner = document.createElement("span");
      line.forEach(function (o, k) {
        if (k) inner.appendChild(document.createTextNode(" "));
        if (o.em) { var e = document.createElement("em"); e.textContent = o.w; inner.appendChild(e); }
        else inner.appendChild(document.createTextNode(o.w));
      });
      outer.appendChild(inner);
      el.appendChild(outer);
      return inner;
    });
    var box = el.clientWidth + 2;
    var bad = inners.some(function (s) { return s.scrollWidth > box; });
    if (bad) {
      el.textContent = "";
      el._src.forEach(function (o, i) {
        if (i) el.appendChild(document.createTextNode(" "));
        if (o.em) { var e = document.createElement("em"); e.textContent = o.w; el.appendChild(e); }
        else el.appendChild(document.createTextNode(o.w));
      });
      return [el];
    }
    return inners;
  }
  var heroEls = $$(".hero [data-split]");
  function isHero(el) { return heroEls.indexOf(el) > -1; }
  var splits = new Map();
  function splitAll() {
    $$("[data-split]").forEach(function (el) { splits.set(el, splitLines(el)); });
  }
  splitAll();

  splits.forEach(function (lines, el) {
    if (isHero(el)) return;
    var fallback = lines[0] === el;
    gsap.set(lines, fallback ? { opacity: 0, y: 20 } : { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () {
        el._done = true;
        gsap.to(el._lines || lines, fallback
          ? { opacity: 1, y: 0, duration: .9, ease: EASE }
          : { yPercent: 0, duration: 1.05, ease: EASE, stagger: .08 });
      }
    });
  });
  var rsT;
  function resplit() {
    splits.forEach(function (_, el) {
      var lines = splitLines(el);
      el._lines = lines;
      splits.set(el, lines);
      if (el._done || isHero(el)) gsap.set(lines, { yPercent: 0, opacity: 1, y: 0 });
      else gsap.set(lines, lines[0] === el ? { opacity: 0, y: 20 } : { yPercent: 115 });
    });
    ScrollTrigger.refresh();
  }
  addEventListener("resize", function () { clearTimeout(rsT); rsT = setTimeout(resplit, 250); });

  $$(".rv").forEach(function (el) {
    if (el.closest(".hero")) return;
    gsap.set(el, { opacity: 0, y: 22 });
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true,
      onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: EASE }); } });
  });
  $$(".rv-block").forEach(function (el) {
    var k = Array.prototype.indexOf.call(el.parentNode.children, el);
    gsap.set(el, { opacity: 0, y: 30 });
    ScrollTrigger.create({ trigger: el.parentNode, start: "top 88%", once: true,
      onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: EASE, delay: k * .08 }); } });
  });

  $$(".rv-img").forEach(function (el) {
    var img = el.querySelector("img.on") || el.querySelector("img");
    ScrollTrigger.create({ trigger: el, start: "top 86%", once: true,
      onEnter: function () {
        gsap.to(el, { clipPath: "inset(0 0 0% 0)", duration: 1.25, ease: EASE });
        gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.6, ease: EASE, clearProps: "transform" });
      } });
  });
  gsap.to(".hero-media img", { yPercent: 8, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  var intro = [];
  heroEls.forEach(function (el) { intro = intro.concat(splits.get(el) || []); el._done = true; });
  var heroFallback = heroEls.some(function (el) { return (splits.get(el) || [])[0] === el; });
  gsap.set(intro, heroFallback ? { opacity: 0 } : { yPercent: 115 });
  gsap.set([".hero .rv", ".hnav"], { opacity: 0, y: 24 });
  gsap.timeline({ delay: .1 })
    .fromTo(".hero-media img", { scale: 1.2 }, { scale: 1, duration: 2.4, ease: EASE }, 0)
    .to(intro, heroFallback ? { opacity: 1, duration: .8 } : { yPercent: 0, duration: 1.15, ease: EASE, stagger: .1 }, .2)
    .to(".hnav", { opacity: 1, y: 0, duration: .9, ease: EASE }, .1)
    .to(".hero .rv", { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .12 }, .55);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { resplit(); });
  if (matchMedia("(pointer: fine)").matches) {
    $$(".cta, .rail-btn, .pill-solid, .tag-go").forEach(function (el) {
      var k = el.classList.contains("rail-btn") ? .35 : .22;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * k, y: (e.clientY - r.top - r.height / 2) * k, duration: .5, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", function () {
        gsap.to(el, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.4)" });
      });
    });
  }
})();

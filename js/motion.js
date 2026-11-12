
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;

  var M = window.TLM = {
    reduce: reduce,
    ease: "expo.out",
    step: 0.08,
    lenis: null,

    velocity: 0
  };

  if (gsap && ST) gsap.registerPlugin(ST);
  if (reduce) return;

  if (window.Lenis) {

    var lenis = new window.Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9,
      syncTouch: false });
    M.lenis = lenis;

    window.__smokeLenis = lenis;
    if (ST) lenis.on("scroll", ST.update);
    if (gsap) {
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    var root = document.documentElement;
    var NAV = ".nav, .nav-sheet, .bnav, .foot-links";
    var jumping = false;

    var LAND = function () { return window.innerWidth >= 810 ? 62 : 96; };

    var docTop = function (el) {
      var y = 0;
      for (var n = el; n; n = n.offsetParent) y += n.offsetTop;
      return y;
    };
    var landY = function (t) {

      if (t.querySelector("[data-spiral-pin]")) {
        var sp = ST && ST.getById && ST.getById("spiral");
        if (sp) return Math.max(0, sp.start);
      }
      var hs = t.querySelectorAll(".eyebrow, h2");
      for (var i = 0; i < hs.length; i++) {
        if (hs[i].offsetParent && hs[i].offsetHeight > 0) {
          return Math.max(0, docTop(hs[i]) - LAND());
        }
      }
      return Math.max(0, t.getBoundingClientRect().top + window.scrollY - 10);
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (jumping) return;
      var y = landY(t);
      if (!document.startViewTransition || e.detail === 0 || !a.closest(NAV) ||
          Math.abs(y - window.scrollY) < 8) {
        lenis.scrollTo(y);
        return;
      }
      jumping = true;
      root.classList.add("vt-jump");
      var vt = document.startViewTransition(function () {
        lenis.scrollTo(y, { immediate: true, force: true });
        if (ST) ST.update();
      });
      var done = function () {
        jumping = false;
        root.classList.remove("vt-jump");
      };
      vt.finished.then(done, done);

      setTimeout(function () {
        if (!jumping) return;
        try { vt.skipTransition(); } catch (err) {}
        done();
      }, 2000);
    });
  }

  var lastY = window.scrollY;
  var tick = function () {
    var y = window.scrollY;
    var v = M.velocity + ((y - lastY) - M.velocity) * 0.25;
    M.velocity = Math.abs(v) < 0.01 ? 0 : v;
    lastY = y;
  };
  if (gsap) gsap.ticker.add(tick);
  else (function f() { tick(); requestAnimationFrame(f); })();

  var placeOf = function () {
    var secs = document.querySelectorAll("section, footer");
    for (var i = 0; i < secs.length; i++) {
      var s = secs[i];
      var b = s.parentNode && s.parentNode.classList.contains("pin-spacer") ? s.parentNode : s;
      var r = b.getBoundingClientRect();
      if (r.bottom > 0 && r.height > 0) return { el: b, sec: s, f: Math.max(0, -r.top) / r.height };
    }
    return null;
  };
  var place = null, holding = false, restT = 0, settleT = 0;
  var cw = document.documentElement.clientWidth;
  addEventListener("scroll", function () {
    if (holding) return;
    clearTimeout(restT);
    restT = setTimeout(function () { place = window.scrollY > 0 ? placeOf() : null; }, 150);
  }, { passive: true });
  var putBack = function () {
    holding = false;
    if (!place) return;
    var s = place.sec;
    var b = s.parentNode && s.parentNode.classList.contains("pin-spacer") ? s.parentNode : s;
    if (!b.isConnected) return;
    var r = b.getBoundingClientRect();
    var y = Math.round(window.scrollY + r.top + place.f * r.height);
    if (Math.abs(y - window.scrollY) < 2) return;
    if (M.lenis) M.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  };

  var later = function () { clearTimeout(settleT); settleT = setTimeout(putBack, 350); };
  addEventListener("resize", function () {
    var w = document.documentElement.clientWidth;
    if (w === cw) return;
    cw = w;
    holding = true;
    clearTimeout(restT);
    later();
  });
  if (ST) ST.addEventListener("refresh", function () { if (holding) later(); });
})();

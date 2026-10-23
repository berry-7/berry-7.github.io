
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
    var lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
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
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -10 });
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
})();

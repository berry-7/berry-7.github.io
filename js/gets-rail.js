
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var rail = document.querySelector(".gets");
  if (!rail) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);

  var lvh = function () {
    var probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100lvh;width:0;visibility:hidden";
    document.body.appendChild(probe);
    var h = probe.offsetHeight || innerHeight;
    probe.remove();
    return h;
  };

  var INTRO = 0.12;
  var SNAP = true;
  var DEPTH = 3;

  var start = function () {
  var M = window.TLM || {};
  var mm = gsap.matchMedia();
  mm.add("(max-width: 560px)", function () {
    var section = rail.closest(".getsec") || rail;
    var head = section.querySelector(".getsec-head");
    var lead = head && head.querySelector(".lead");
    var cards = Array.prototype.slice.call(rail.querySelectorAll(":scope > .get"));
    var N = cards.length, T = N - 1;
    if (N < 2) return;
    rail.classList.add("is-stack");
    rail.scrollLeft = 0;

    var num = document.createElement("div");
    num.className = "gets-num";
    num.setAttribute("aria-hidden", "true");
    var col = document.createElement("div");
    col.className = "gets-num-col";
    for (var k = 1; k <= N; k++) {
      var s = document.createElement("span");
      s.textContent = (k < 10 ? "0" : "") + k;
      col.appendChild(s);
    }
    num.appendChild(col);

    var h2 = head && head.querySelector("h2");
    if (h2) h2.appendChild(num); else if (head) head.appendChild(num);

    var draws = cards.map(function (c) {
      var ps = c.querySelectorAll(".get-ic path[stroke]");
      if (!window.DrawSVGPlugin || !ps.length) return null;
      return gsap.fromTo(ps, { drawSVG: "0%" }, { drawSVG: "100%", ease: "none", paused: true });
    });

    var state = { q: 0 };
    var paint = function () {

      var q = state.q, step = (cards[0].offsetWidth || 300) + 14;
      cards.forEach(function (card, i) {
        var rel = i - q;
        var off = Math.min(Math.abs(rel), 1);
        var tx = rel * step, ty = off * 10, sc = 1 - 0.08 * off;
        var rot = Math.max(-1, Math.min(1, rel)) * 3;
        var dim = 0.42 * off;
        var z = 100 - Math.round(Math.abs(rel) * 10);
        card.style.setProperty("--tx", tx.toFixed(1) + "px");
        card.style.setProperty("--ty", ty.toFixed(1) + "px");
        card.style.setProperty("--cs", sc.toFixed(3));
        card.style.setProperty("--cr", rot.toFixed(2) + "deg");
        card.style.setProperty("--cd", Math.min(dim, 1).toFixed(3));
        card.style.setProperty("--cz", String(z));

        if (draws[i]) draws[i].progress(rel <= 0 ? 1 : Math.max(0, 1 - rel));
      });
      col.style.setProperty("--nq", q.toFixed(4));
    };

    var stepPx = function () { return Math.max(320, Math.round(innerHeight * 0.45)); };
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin: section,
        start: function () {

          if (section.offsetHeight <= lvh() + 1) return "top top";
          return section.offsetHeight < innerHeight ? "center center" : "bottom bottom";
        },
        end: function () { return "+=" + Math.round(stepPx() * T * (1 + INTRO)); },
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: paint,
        onRefresh: paint,

        refreshPriority: -1
      }
    });

    if (lead) tl.to(lead, { opacity: 0, ease: "none", duration: INTRO }, 0);
    tl.to(rail, { y: function () {
      return lead ? -(lead.offsetHeight + (parseFloat(getComputedStyle(lead).marginTop) || 0)) * 0.7 : 0;
    }, ease: "none", duration: INTRO }, 0);

    tl.to(state, { q: T, ease: "none", duration: 1 }, INTRO);

    var snapTimer = 0, snapping = false;
    var stopAt = function (i) {
      var st = tl.scrollTrigger;
      return st.start + (st.end - st.start) * (INTRO + i / T) / (1 + INTRO);
    };
    var trySnap = function () {
      var st = tl.scrollTrigger, L = M.lenis;
      if (!SNAP || !L || snapping || !st || !st.isActive) return;
      if (st.progress < INTRO / (1 + INTRO) * 0.5 || st.progress > 0.999) return;
      if (Math.abs(M.velocity || 0) > 0.6) { snapTimer = setTimeout(trySnap, 120); return; }
      var y = window.scrollY, best = stopAt(0);
      for (var i = 1; i < N; i++) if (Math.abs(stopAt(i) - y) < Math.abs(best - y)) best = stopAt(i);
      if (Math.abs(best - y) < 3) return;
      snapping = true;
      L.scrollTo(best, { duration: 0.6, easing: function (t) { return 1 - Math.pow(1 - t, 3); },
        onComplete: function () { snapping = false; } });
      setTimeout(function () { snapping = false; }, 1000);
    };
    var onLenis = function () { clearTimeout(snapTimer); if (!snapping) snapTimer = setTimeout(trySnap, 160); };
    if (SNAP && M.lenis) M.lenis.on("scroll", onLenis);

    paint();
    ScrollTrigger.refresh();

    return function () {
      clearTimeout(snapTimer);
      if (M.lenis && M.lenis.off) M.lenis.off("scroll", onLenis);
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
      draws.forEach(function (d) { if (d) { d.progress(1); d.kill(); } });
      gsap.set(rail, { clearProps: "transform" });
      cards.forEach(function (c) {
        ["--tx", "--ty", "--cs", "--cr", "--cd", "--cz"].forEach(function (p) { c.style.removeProperty(p); });
      });
      if (lead) gsap.set(lead, { clearProps: "opacity" });
      num.remove();
      rail.classList.remove("is-stack");
    };
  });
  };

  if (document.readyState === "complete") start();
  else addEventListener("load", function () { setTimeout(start, 0); });
})();

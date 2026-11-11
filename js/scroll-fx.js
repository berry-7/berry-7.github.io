
(function () {
  "use strict";
  var M = window.TLM || {};
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST || M.reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ST);

  var root = document.documentElement;
  root.classList.add("fx");

  var PRI = -3;
  var px = function (n) { return n.toFixed(1) + "px"; };

  var start = function () {
    var mm = gsap.matchMedia();

    var leak = document.querySelector(".leak-cards");
    var now = leak && leak.querySelector(".lcard.now");
    var after = leak && leak.querySelector(".lcard.after");
    if (now && after) {
      var tick = after.querySelector(".lcard-mark");
      mm.add({ wide: "(min-width: 761px)", narrow: "(max-width: 760px)" }, function (ctx) {
        var wide = ctx.conditions.wide;
        leak.classList.add("leak-scene");
        gsap.timeline({ scrollTrigger: { trigger: leak, start: "top bottom", end: "center center",
            scrub: true, refreshPriority: PRI } })
          .fromTo(now, { rotation: -11, y: 40 }, { rotation: -3, y: 0, ease: "none" });

        gsap.set(after, { yPercent: 118, rotation: 12, opacity: 0 });
        if (tick) gsap.set(tick, { scale: 0.6, opacity: 0 });
        var tl = gsap.timeline({ scrollTrigger: { trigger: leak, start: "center center",
            end: "+=" + (wide ? 90 : 75) + "%", pin: true, scrub: true, anticipatePin: 1,
            refreshPriority: -0.5 } });
        tl.to(now, { xPercent: wide ? -32 : -4, rotation: -7, scale: 0.92, opacity: 0.6,
              ease: "none", duration: 1 }, 0)
          .to(after, { yPercent: 0, xPercent: wide ? 28 : 3, rotation: 3, opacity: 1,
              ease: "none", duration: 1 }, 0);
        if (tick) tl.to(tick, { scale: 1, opacity: 1, ease: "none", duration: 0.3 }, 0.75);
        tl.to({}, { duration: 0.25 });
        return function () { leak.classList.remove("leak-scene"); };
      });
    }

    var gs = document.querySelector(".getsec");
    var bg = gs && gs.querySelector(".getsec-bg");
    if (bg) {
      mm.add({ wide: "(min-width: 761px)", narrow: "(max-width: 760px)" }, function (ctx) {
        var wide = ctx.conditions.wide;
        var X = function () { return wide ? px(Math.min(72, innerWidth * 0.05)) : "12px"; };
        var R = wide ? "40px" : "26px";
        gsap.fromTo(bg, { "--gi-x": X, "--gi-t": wide ? "56px" : "28px", "--gi-r": R },
          { "--gi-x": "0px", "--gi-t": "0px", "--gi-r": "0px", ease: "none",
            scrollTrigger: { trigger: gs, start: "top bottom", end: "top 14%", scrub: true,
              invalidateOnRefresh: true, refreshPriority: PRI } });
        gsap.fromTo(bg, { "--gi-x": "0px", "--gi-r": "0px" },
          { "--gi-x": X, "--gi-r": R, ease: "none", immediateRender: false,
            scrollTrigger: { trigger: gs, start: "bottom 70%", end: "bottom top", scrub: true,
              invalidateOnRefresh: true, refreshPriority: PRI } });
      });
    }

    mm.add("(min-width: 901px)", function () {
      root.classList.add("fx-depth");
      gsap.utils.toArray("[data-depth]").forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-depth")) || 0.05;
        gsap.fromTo(el, { "--py": function () { return px(innerHeight * d); } },
          { "--py": function () { return px(-innerHeight * d); }, ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top",
              scrub: true, invalidateOnRefresh: true, refreshPriority: PRI } });
      });
      var close = document.querySelector(".close-photo");
      var cimg = close && close.querySelector(".close-bg img");
      if (cimg) {
        gsap.fromTo(cimg, { "--py": function () { return px(-innerHeight * 0.04); } },
          { "--py": function () { return px(innerHeight * 0.04); }, ease: "none",
            scrollTrigger: { trigger: close, start: "top bottom", end: "bottom top",
              scrub: true, invalidateOnRefresh: true, refreshPriority: PRI } });
      }
      return function () { root.classList.remove("fx-depth"); };
    });

    var mark = document.querySelector(".foot-mark:not(.fn-rise) span");
    var body = document.querySelector(".page-body");
    var foot = document.querySelector("footer");
    if (mark && body && foot) {
      var setY = gsap.quickSetter(mark, "yPercent");
      var lastP = -1, fh = 1;
      var measureFoot = function () { fh = Math.max(1, Math.min(foot.offsetHeight, innerHeight)); };
      measureFoot();
      addEventListener("resize", measureFoot);

      var last = body.lastElementChild, near = false;
      if (last && "IntersectionObserver" in window) {
        new IntersectionObserver(function (e) { near = e[0].isIntersecting; }).observe(last);
      } else near = true;
      gsap.ticker.add(function () {
        if (!near && lastP === 0) return;
        var shown = innerHeight - body.getBoundingClientRect().bottom;
        var p = Math.min(1, Math.max(0, shown / fh));
        if (Math.abs(p - lastP) < 0.0005) return;
        lastP = p;
        setY(62 * (1 - p));
      });
    }

    ST.sort();
    ST.refresh();
  };

  if (document.readyState === "complete") setTimeout(start, 0);
  else addEventListener("load", function () { setTimeout(start, 0); });
})();

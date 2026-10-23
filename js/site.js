
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FADE = false;

  var heroWrap = document.querySelector(".hero-wrap");
  var hero = heroWrap && heroWrap.querySelector(".hero");

  if (hero && !reduce) {
    root.classList.add("curtain");
    if (FADE) root.classList.add("fade");
    var oneCol = matchMedia("(max-width:900px)");
    var hold = 1;
    var measureHero = function () {
      root.classList.remove("no-pin");
      heroWrap.style.removeProperty("--hero-h");
      var h = hero.offsetHeight;
      if (oneCol.matches) {
        if (h > window.innerHeight) root.classList.add("no-pin");
        else heroWrap.style.setProperty("--hero-h", h + "px");
      }
      hold = Math.max(1, h);
    };
    measureHero();
    
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureHero);
    var queued = false, lastHero = "";
    var paint = function () {
      queued = false;
      var p = Math.min(1, Math.max(0, window.scrollY / hold));
      var fade = root.classList.contains("fade");
      var v = (fade ? 1 - p : 1 - p * 0.06).toFixed(4);
      if (v === lastHero) return;
      lastHero = v;
      hero.style.setProperty(fade ? "--hero-o" : "--hero-s", v);
    };
    
    var heroOn = true;
    var onScroll = function () {
      if (queued || !heroOn) return;
      queued = true;
      requestAnimationFrame(paint);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        heroOn = e[0].isIntersecting;
        if (!heroOn) paint();
      }).observe(heroWrap);
    }
    paint();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", function () { measureHero(); onScroll(); });
  }
  var foot = document.querySelector("footer");

  if (foot && root.classList.contains("curtain")) {
    var applyFoot = function () {
      root.classList.add("no-footcurtain");        
      var h = foot.offsetHeight;
      root.classList.remove("no-footcurtain");
      if (h > innerHeight + 4) {
        root.classList.add("no-footcurtain");
        root.style.setProperty("--foot-h", "0px");
        return;
      }
      root.style.setProperty("--foot-h", h + "px");
    };
    var setFoot = function (heroShowing) {
      root.setAttribute("data-foot", heroShowing ? "hidden" : "live");
    };
    if (heroWrap && "IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { setFoot(e[0].isIntersecting); }).observe(heroWrap);
    } else if (heroWrap) {
      setFoot(heroWrap.getBoundingClientRect().bottom > 0);
    }

    applyFoot();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(applyFoot);
    var ft;
    addEventListener("resize", function () { clearTimeout(ft); ft = setTimeout(applyFoot, 150); });
  }
  var STEP = 80;
  var targets = document.querySelectorAll(".rv, .rv-h, .rv-block, .rv-img");
  var footEl = document.querySelector("footer");
  var inFoot = function (el) { return footEl && footEl.contains(el); };
  Array.prototype.forEach.call(document.querySelectorAll(".rv-h"), function (h) {
    if (h.closest(".hero")) return;      
    Array.prototype.forEach.call(h.querySelectorAll(".rv-line>span"), function (s, i) {
      s.style.setProperty("--d", i * STEP + "ms");
    });
  });

  if (!("IntersectionObserver" in window) || reduce) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add("in"); });
  } else {
    
    var proxyOf = new Map();
    var io = new IntersectionObserver(function (entries) {
      var blocks = [];
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = proxyOf.get(e.target) || e.target;
        if (el.classList.contains("rv-block")) blocks.push({ el: el, r: e.boundingClientRect });
        else el.classList.add("in");
      });
      blocks.sort(function (a, b) {
        return Math.abs(a.r.top - b.r.top) > 24 ? a.r.top - b.r.top : a.r.left - b.r.left;
      });
      blocks.forEach(function (b, i) {
        b.el.style.setProperty("--d", i * STEP + "ms");
        b.el.classList.add("in");
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    Array.prototype.forEach.call(targets, function (el) {
      if (inFoot(el)) return;
      if (el.classList.contains("rv-img") && el.parentElement) {
        proxyOf.set(el.parentElement, el);
        io.observe(el.parentElement);
      } else io.observe(el);
    });
    var early = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        early.unobserve(e.target);
        Array.prototype.forEach.call(e.target.querySelectorAll('img[loading="lazy"]'),
          function (im) { im.loading = "eager"; });
      });
    }, { rootMargin: "100% 0px" });
    proxyOf.forEach(function (real) { early.observe(real.parentElement); });
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(document.querySelectorAll(".hero .rv, .hero .rv-h"),
        function (el) { io.unobserve(el); el.classList.add("in"); });
    });
    var footTargets = Array.prototype.filter.call(targets, inFoot);
    var pageBody = document.querySelector(".page-body");
    if (footTargets.length && pageBody) {
      var footDone = false, footQ = false;
      var footCheck = function () {
        footQ = false;
        if (footDone) return;
        var shown = innerHeight - pageBody.getBoundingClientRect().bottom;
        if (shown < Math.min(footEl.offsetHeight, innerHeight) * 0.3) return;
        footDone = true;
        footTargets.forEach(function (el) { el.classList.add("in"); });
        removeEventListener("scroll", footQueue);
      };
      var footQueue = function () { if (!footQ) { footQ = true; requestAnimationFrame(footCheck); } };
      addEventListener("scroll", footQueue, { passive: true });
      footCheck();
    }
  }
  var navLinks = document.querySelectorAll(".nav-links a");
  var setCurrent = function () {
    Array.prototype.forEach.call(navLinks, function (a) {
      var t = document.querySelector(a.getAttribute("href"));
      var r = t && t.getBoundingClientRect();
      var on = !!(r && r.top <= 74 && r.bottom >= 74);
      if (on === a.hasAttribute("aria-current")) return;   
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  var toned = document.querySelectorAll("[data-tone]");
  if (toned.length && "IntersectionObserver" in window) {
    var NAV_LINE = 45;               
    var setTone = function () {
      
      var dark = false;
      var hits = document.elementsFromPoint(innerWidth / 2, NAV_LINE);
      for (var i = 0; i < hits.length; i++) {
        if (hits[i].closest(".nav")) continue;
        var t = hits[i].closest("[data-tone]");
        if (t) { dark = t.getAttribute("data-tone") === "dark"; break; }
      }
      var tone = dark ? "dark" : "light";
      if (root.getAttribute("data-nav") !== tone) root.setAttribute("data-nav", tone);
      setCurrent();
    };
    
    var tLast = 0, tTail;
    addEventListener("scroll", function () {
      var now = performance.now();
      clearTimeout(tTail);
      tTail = setTimeout(setTone, 130);
      if (now - tLast < 120) return;
      tLast = now;
      requestAnimationFrame(setTone);
    }, { passive: true });
    addEventListener("resize", setTone);
    setTone();
    
    addEventListener("load", function () { requestAnimationFrame(setTone); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setTone);
    if ("MutationObserver" in window) {
      new MutationObserver(function () { requestAnimationFrame(setTone); })
        .observe(root, { attributes: true, attributeFilter: ["class"] });
    }
  }
  var toggle = document.getElementById("navToggle");
  var sheet = document.getElementById("navSheet");

  if (toggle && sheet) {
    var setOpen = function (open) {
      sheet.setAttribute("data-open", String(open));
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.closest(".nav").classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(sheet.getAttribute("data-open") !== "true");
    });
    sheet.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setOpen(false);
    });
    addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.getAttribute("data-open") === "true") setOpen(false);
    });
    
    document.addEventListener("click", function (e) {
      if (sheet.getAttribute("data-open") === "true" &&
          !sheet.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll(".mag"), function (el) {
      if (window.gsap) {
        var pos = { x: 0, y: 0 };
        var write = function () { el.style.translate = pos.x.toFixed(2) + "px " + pos.y.toFixed(2) + "px"; };
        var xTo = gsap.quickTo(pos, "x", { duration: 0.6, ease: "expo.out", onUpdate: write });
        var yTo = gsap.quickTo(pos, "y", { duration: 0.6, ease: "expo.out", onUpdate: write });
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.30);
        });
        el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
        return;
      }
      var raf = null;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
          var dy = (e.clientY - (r.top + r.height / 2)) * 0.30;
          el.style.translate = dx.toFixed(1) + "px " + dy.toFixed(1) + "px";
        });
      });
      el.addEventListener("pointerleave", function () { el.style.translate = ""; });
    });
  }
})();
(function () {
  "use strict";
  var stack = document.querySelector("[data-stack]");
  if (!stack) return;
  var order = Array.prototype.slice.call(stack.querySelectorAll(".hs-card"));
  var paint = function () {
    order.forEach(function (c, i) { c.setAttribute("data-slot", i); });
  };

  order.forEach(function (c) {
    c.addEventListener("focus", function () {
      var i = order.indexOf(c);
      if (i > 0) { order.splice(i, 1); order.unshift(c); paint(); }
    });
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var hover = false, focus = false, seen = true, busy = false;
  stack.addEventListener("pointerenter", function () { hover = true; });
  stack.addEventListener("pointerleave", function () { hover = false; });
  stack.addEventListener("focusin", function () { focus = true; });
  stack.addEventListener("focusout", function () { focus = false; });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }).observe(stack);
  }

  var next = function () {
    if (busy || hover || focus || !seen || document.hidden) return;
    busy = true;
    var front = order[0];
    front.classList.add("out");
    setTimeout(function () {
      order.push(order.shift());
      front.classList.remove("out");
      paint();
      busy = false;
    }, 480);
  };
  setInterval(next, 3400);
})();
(function () {
  "use strict";
  var dock = document.getElementById("dock");
  var close = document.getElementById("contact");
  if (!dock || !close) return;

  var queued = false;
  var update = function () {
    queued = false;
    var h = innerHeight;
    var show = scrollY > h * 0.6 && close.getBoundingClientRect().top > h - 40;
    dock.setAttribute("data-show", show ? "true" : "false");
    
    if (show) dock.removeAttribute("inert"); else dock.setAttribute("inert", "");
  };
  var queue = function () { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
})();
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var EASE = "cubic-bezier(.22,.61,.36,1)";
  Array.prototype.forEach.call(document.querySelectorAll(".faq details"), function (d) {
    var s = d.querySelector("summary");
    var a = d.querySelector(".a");
    if (!s || !a || !d.animate) return;
    var anim = null, closing = false;

    var run = function (from, to, opening) {
      if (anim) anim.cancel();
      closing = !opening;
      d.style.clipPath = "inset(0 -60px 0 -60px)";
      anim = d.animate([{ height: from + "px" }, { height: to + "px" }],
        { duration: opening ? 480 : 360, easing: EASE });
      if (opening) {
        a.animate([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, delay: 60, easing: EASE, fill: "backwards" });
      }
      anim.onfinish = function () {
        if (!opening) d.open = false;
        anim = null; closing = false;
        d.style.clipPath = "";
      };
      anim.oncancel = function () { closing = false; };
    };
    s.addEventListener("click", function (e) {
      e.preventDefault();
      var from = d.offsetHeight;            // where it is now, even mid-ease
      if (anim) { anim.cancel(); anim = null; }
      if (!d.open || closing) {
        d.open = true;
        run(from, d.offsetHeight, true);     // natural open height
      } else {
        run(from, d.offsetHeight - a.offsetHeight, false);
      }
    });
  });
  var navBar = document.querySelector(".nav"), navHero = document.querySelector(".hero-wrap");
  if (navBar && navHero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      navBar.classList.toggle("is-past", !e[0].isIntersecting);
    }, { rootMargin: "-80px 0px 0px 0px" }).observe(navHero);
  }
})();

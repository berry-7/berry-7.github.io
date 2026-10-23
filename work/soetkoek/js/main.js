
(function () {
  "use strict";

  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  var EASE = "expo.out";
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var menuBtn = $(".nav__menu"), sheet = $("#sheet");
  function setSheet(open) {
    sheet.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { var first = sheet.querySelector("a"); if (first) first.focus(); }
  }
  if (menuBtn && sheet) {
    menuBtn.addEventListener("click", function () { setSheet(sheet.hidden); });
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) setSheet(false); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { setSheet(false); menuBtn.focus(); } });
  }
  var BAKES = {
    cookies:  { word: "Cookies",      unit: "a dozen",  price: "R90",  say: "Choc chip cookies, R90 a dozen", ask: "a dozen choc chip cookies" },
    bread:    { word: "Banana", unit: "a loaf",   price: "R85",  say: "Banana bread, R85 a loaf",       ask: "a banana bread loaf" },
    brownies: { word: "Brownies",     unit: "box of 6", price: "R95",  say: "Fudgy brownies, R95 a box of 6", ask: "a box of 6 brownies" },
    donuts:   { word: "Donuts",       unit: "box of 6", price: "R110", say: "Glazed donuts, R110 a box of 6", ask: "a box of 6 glazed donuts" }
  };
  var hero = $(".hero"), chips = $$(".chip"), swap = null;
  function pick(key) {
    var d = BAKES[key], was = hero.dataset.bake;
    if (!d || key === was) return;
    hero.dataset.bake = key;
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.pick === key)); });
    $$(".echo span").forEach(function (s) { s.textContent = d.word; });
    $(".flower__t").innerHTML = "<small>" + d.unit + "</small>" + d.price;
    $("#heroOrder").href = "https://wa.me/27XXXXXXXXX?text=" + encodeURIComponent("Hi Koekie Club, I'd like to order " + d.ask);
    $("#bakeSay").textContent = d.say;
    var out = $('.bake[data-bake="' + was + '"]'), inn = $('.bake[data-bake="' + key + '"]');
    out.classList.remove("is-on"); inn.classList.add("is-on");
    if (swap) swap(out, inn);
  }
  chips.forEach(function (c) { c.addEventListener("click", function () { pick(c.dataset.pick); }); });
  if (REDUCE || !hasGSAP) {
    $$(".rv, .hi").forEach(function (el) { el.style.opacity = 1; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  var lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.6 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        var target = id.length > 1 && document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90, duration: 1.2 });
      });
    });
  }
  function splitLines(el) {
    if (!el.dataset.src) el.dataset.src = el.innerHTML;
    el.innerHTML = el.dataset.src;
    var words = [];
    (function walk(node, wrap) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (t) { if (t.trim()) words.push({ t: t, wrap: wrap }); });
        } else if (n.nodeType === 1) walk(n, n.tagName.toLowerCase());
      });
    })(el, null);
    el.textContent = "";
    var probes = words.map(function (w, i) {
      var s = document.createElement("span");
      s.style.display = "inline-block";
      if (w.wrap) { var x = document.createElement(w.wrap); x.textContent = w.t; s.appendChild(x); } else s.textContent = w.t;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
    var lines = [], top = null;
    probes.forEach(function (s) {
      if (top === null || Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; }
      lines[lines.length - 1].push(s.innerHTML);
    });
    el.textContent = "";
    return lines.map(function (ws) {
      var line = document.createElement("span"); line.className = "rv-line";
      var inner = document.createElement("span"); inner.innerHTML = ws.join(" ");
      line.appendChild(inner); el.appendChild(line);
      return inner;
    });
  }
  var splits = new Map();
  $$("[data-split]").forEach(function (el) { splits.set(el, splitLines(el)); });
  splits.forEach(function (lines, el) {
    gsap.set(lines, { yPercent: 115 });
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true,
      onEnter: function () { gsap.to(splits.get(el), { yPercent: 0, duration: 1.05, ease: EASE, stagger: .075 }); } });
  });
  var rsT;
  addEventListener("resize", function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      splits.forEach(function (_, el) { splits.set(el, splitLines(el)); });
      ScrollTrigger.refresh();
    }, 250);
  });
  $$(".rv").forEach(function (el) {
    gsap.set(el, { opacity: 0, y: 22 });
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true,
      onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: EASE }); } });
  });
  var top = $(".top"), lastY = 0;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: function (self) {
    var y = self.scroll();
    if (y > lastY + 6 && y > 300 && sheet.hidden) top.classList.add("hide");
    else if (y < lastY - 6) top.classList.remove("hide");
    lastY = y;
  } });
  var lines = $$(".h1 .ln > span"), bakes = $$(".bake"), pops = $$(".flower, .burst, .spark");
  gsap.set(lines, { yPercent: 115 });
  gsap.set(".hi", { opacity: 0, y: 18 });
  gsap.set(bakes, { opacity: 0 });
  gsap.set(pops, { scale: 0 });
  gsap.timeline({ delay: .15 })
    .to(lines, { yPercent: 0, duration: 1.15, ease: EASE, stagger: .09 }, 0)
    .to(".hi", { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .06 }, .35)
    .fromTo(".bake.is-on", { opacity: 0, scale: .6, rotation: -40 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.4, ease: EASE }, .25)
    .to(pops, { scale: 1, duration: .8, ease: "back.out(2)", stagger: .08 }, .9)
    .add(heroLean, 1.2);
  swap = function (out, inn) {
    gsap.killTweensOf([out, inn]);
    gsap.to(out, { opacity: 0, scale: .75, rotation: 25, duration: .35, ease: "power2.in" });
    gsap.fromTo(inn, { opacity: 0, scale: .7, rotation: -30 }, { opacity: 1, scale: 1, rotation: 0, duration: .9, ease: EASE, delay: .12 });
    gsap.fromTo(".flower", { scale: .55 }, { scale: 1, duration: .9, ease: "elastic.out(1,.45)" });
    gsap.fromTo(".echo span", { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .7, ease: EASE, stagger: .05 });
  };
  function heroLean() {
    gsap.to(".stage", { yPercent: -8, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 } });
    if (!FINE) return;
    var bx = gsap.quickTo(".stage", "x", { duration: 1, ease: "power3.out" }),
        by = gsap.quickTo(".stage", "y", { duration: 1, ease: "power3.out" });
    hero.addEventListener("pointermove", function (e) {
      var nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      bx(nx * 22); by(ny * 16);
    });
  }
  gsap.fromTo(".box__img", { scale: .9, rotate: -4 }, { scale: 1, rotate: 0, ease: "none",
    scrollTrigger: { trigger: ".box", start: "top bottom", end: "center center", scrub: .6 } });
  gsap.from([".stamp--hat", ".stamp--donut"], { scale: 0, rotate: -90, duration: 1, ease: "back.out(1.6)", stagger: .15,
    scrollTrigger: { trigger: ".box__art", start: "top 70%", once: true } });
  gsap.fromTo(".board", { yPercent: 18 }, { yPercent: 0, ease: "none",
    scrollTrigger: { trigger: ".card", start: "top bottom", end: "center center", scrub: .6 } });
  gsap.fromTo(".board__cake", { rotate: -25 }, { rotate: 0, ease: "none",
    scrollTrigger: { trigger: ".card", start: "top bottom", end: "center center", scrub: .6 } });
  gsap.fromTo(".arc", { rotate: -6 }, { rotate: 0, ease: "none",
    scrollTrigger: { trigger: ".card", start: "top bottom", end: "center center", scrub: .6 } });
  gsap.from([".stamp--love", ".stamp--smile"], { scale: 0, duration: 1, ease: "back.out(1.7)", stagger: .2,
    scrollTrigger: { trigger: ".card", start: "top 60%", once: true } });
  if (FINE) $$(".btn").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .25, duration: .5, ease: "power3.out" });
    });
    el.addEventListener("pointerleave", function () { gsap.to(el, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.4)" }); });
  });

  addEventListener("load", function () { ScrollTrigger.refresh(); });
})();

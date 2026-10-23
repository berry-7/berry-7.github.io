
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var WA = document.body.getAttribute("data-wa");
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_GSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  $$("[data-wa-msg]").forEach(function (a) {
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(a.getAttribute("data-wa-msg"));
    a.target = "_blank"; a.rel = "noopener";
  });
  var burger = $("#burger"), sheet = $("#sheet");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.classList.toggle("open", open);
    document.documentElement.classList.toggle("is-menu", open);
    if (open) sheet.removeAttribute("inert"); else sheet.setAttribute("inert", "");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("nav a", sheet); if (f) f.focus(); }
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet.classList.contains("open")) { setMenu(false); burger.focus(); }
  });
  var tabs = $$(".season-tabs [role=tab]"), slides = $$(".season-slide"), sImg = $("#seasonImg"), panel = $("#season-panel");
  function season(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      slides[k].classList.toggle("on", on);
    });
    panel.setAttribute("aria-labelledby", tabs[i].id);
    if (focus) tabs[i].focus();
    var src = slides[i].getAttribute("data-img"), alt = slides[i].getAttribute("data-alt");
    if (sImg.getAttribute("src") === src) return;
    sImg.classList.add("swap");
    var pre = new Image(); pre.src = src;
    pre.onload = pre.onerror = function () {
      setTimeout(function () { sImg.src = src; sImg.alt = alt; sImg.classList.remove("swap"); }, REDUCED ? 0 : 220);
    };
  }
  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { season(k); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? k + 1 : e.key === "ArrowLeft" ? k - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
      if (n === null) return;
      e.preventDefault(); season((n + tabs.length) % tabs.length, true);
    });
  });
  var bar = $("#stickyWa");
  if (bar && "IntersectionObserver" in window) {
    var heroOut = false, quoteIn = false;
    var settle = function () {
      var up = heroOut && !quoteIn;
      bar.classList.toggle("up", up);
      bar.setAttribute("aria-hidden", String(!up)); bar.tabIndex = up ? 0 : -1;
    };
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; settle(); }).observe($(".hero-ctas"));
    var endIn = { quote: false, foot: false };
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { endIn[e.target.id === "quote" ? "quote" : "foot"] = e.isIntersecting; });
      quoteIn = endIn.quote || endIn.foot; settle();
    }, { rootMargin: "0px 0px -20% 0px" });
    io2.observe($("#quote")); io2.observe($(".foot"));
  }
  var nav = $("#nav");
  function navTick(y) { nav.classList.toggle("solid", y > 60); }
  if (REDUCED || !HAS_GSAP) {
    document.documentElement.classList.remove("js");
    addEventListener("scroll", function () { navTick(scrollY); }, { passive: true });
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", function (e) { ST.update(); navTick(e.scroll); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var t = $(id); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: -90 });
      });
    });
  } else {
    ST.create({ start: 0, end: "max", onUpdate: function (s) { navTick(s.scroll()); } });
  }
  function splitWords(el) {
    var out = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/( +)/).forEach(function (w) {
          if (!w) return;
          if (/^ +$/.test(w)) { out.appendChild(document.createTextNode(" ")); return; }
          var m = document.createElement("span"); m.className = "w-mask"; m.setAttribute("aria-hidden", "true");
          var i = document.createElement("span"); i.className = "w"; i.textContent = w;
          m.appendChild(i); out.appendChild(m);
        });
      } else if (n.nodeType === 1) {
        var shell = n.cloneNode(false); shell.appendChild(splitWords(n)); out.appendChild(shell);
      }
    });
    return out;
  }
  $$("[data-split]").forEach(function (el) {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var f = splitWords(el); el.textContent = ""; el.appendChild(f);
  });

  var E = "expo.out";
  gsap.timeline({ delay: .1 })
    .fromTo(".hero-img", { scale: 1.14 }, { scale: 1, duration: 2.2, ease: "power3.out" })
    .from(".hero-tag", { opacity: 0, y: 12, duration: .8, ease: E }, .35)
    .from(".hero .w", { yPercent: 110, duration: 1.1, ease: E, stagger: .06 }, .45)
    .to(".hero [data-rv]", { opacity: 1, y: 0, duration: .9, ease: E, stagger: .1 }, "-=.75");
  gsap.to(".hero-img", { yPercent: 12, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  $$("[data-split]").forEach(function (el) {
    if (el.closest(".hero")) return;
    gsap.from($$(".w", el), { yPercent: 110, duration: 1, ease: E, stagger: .04,
      scrollTrigger: { trigger: el, start: "top 86%", once: true } });
  });
  $$("[data-rv]").forEach(function (el) {
    if (el.closest(".hero")) return;
    gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: E, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });
  ST.batch("[data-card]", { start: "top 88%", once: true, onEnter: function (els) {
    gsap.to(els, { clipPath: "inset(0% 0 0 0 round 28px)", opacity: 1, duration: 1.2, ease: E, stagger: .12 });
    gsap.from(els.map(function (c) { return c.querySelector("img"); }).filter(Boolean),
      { scale: 1.15, duration: 1.6, ease: E, stagger: .12 });
  } });
  var prices = { small: 650, standard: 1150 }, shown = 1150;
  $$('.picker input[name=yard]').forEach(function (r) {
    r.addEventListener("change", function () {
      var pane = $(".pp-" + r.value);
      gsap.fromTo(pane, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: E });
      var to = prices[r.value]; if (!to) return;
      var num = pane.querySelector(".pp-price").firstChild, o = { v: shown };
      gsap.to(o, { v: to, duration: .7, ease: "power3.out",
        onUpdate: function () { num.nodeValue = "R" + Math.round(o.v).toLocaleString("en-US"); } });
      shown = to;
    });
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();

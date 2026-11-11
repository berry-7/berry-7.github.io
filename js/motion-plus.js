
(function () {
  "use strict";
  var gsap = window.gsap;
  if (!gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var M = window.TLM || {};
  var ms = function (el) { return (parseFloat(el.style.getPropertyValue("--d")) || 0) / 1000; };

  if (window.SplitText && window.ScrollTrigger) {
    gsap.registerPlugin(SplitText, ScrollTrigger);
    var leads = document.querySelectorAll(".getsec-head .lead, .risk .lead, .close-card .lead");
    Array.prototype.forEach.call(leads, function (el) {
      var delay = ms(el);
      SplitText.create(el, {
        type: "lines", mask: "lines", linesClass: "sl", autoSplit: true,

        aria: "none",
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 105, duration: 1, ease: "expo.out", stagger: 0.08, delay: delay,
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          });
        }
      });

      el.classList.remove("rv");
    });
  }

  var hasDraw = !!window.DrawSVGPlugin;
  if (hasDraw) gsap.registerPlugin(DrawSVGPlugin);

  var MARKS = [
    [".p1-tick path", 0.62],
    [".p1-mag path", 0.95],
    [".p1-cross path", 1.62],
    [".p2-drop path[stroke]", 1.4]
  ];
  var STORY = 2.2;
  var mouse = matchMedia("(hover: hover) and (pointer: fine)");
  Array.prototype.forEach.call(document.querySelectorAll(".pcard"), function (card) {
    var paths = [];
    if (hasDraw) MARKS.forEach(function (m) {
      Array.prototype.forEach.call(card.querySelectorAll(m[0]), function (p, i) {
        paths.push([p, m[1] + i * 0.16]);
      });
    });
    var els = paths.map(function (p) { return p[0]; });

    var undraw = function () {
      if (!els.length) return;
      gsap.killTweensOf(els);
      gsap.set(els, { drawSVG: "0%", opacity: 0 });
    };
    undraw();
    var played = false, busyUntil = 0, rewound = false;
    var draw = function (base) {
      paths.forEach(function (p) {
        gsap.to(p[0], { drawSVG: "100%", duration: 0.42, ease: "power2.out", delay: base + p[1],
          onStart: function () { gsap.set(p[0], { opacity: 1 }); } });
      });
    };

    var first = function () {
      played = true;
      var d = (parseFloat(getComputedStyle(card).getPropertyValue("--d")) || 0) / 1000;
      busyUntil = performance.now() + (d + 0.38 + STORY) * 1000;
      draw(d + 0.38);
    };

    var rewind = function () {
      card.classList.add("snap", "rewind");
      undraw();
      void card.offsetWidth;
      card.classList.remove("snap");
      rewound = true;
    };

    var replay = function (lead) {
      if (!rewound) rewind();
      void card.offsetWidth;
      card.style.setProperty("--pd", Math.round(lead * 1000) + "ms");
      card.classList.remove("rewind");
      rewound = false;
      busyUntil = performance.now() + (lead + STORY) * 1000;
      draw(lead);
    };

    if (card.classList.contains("in")) first();
    else {
      var mo = new MutationObserver(function () {
        if (!card.classList.contains("in")) return;
        mo.disconnect();
        first();
      });
      mo.observe(card, { attributes: true, attributeFilter: ["class"] });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!played) return;
          if (!e.isIntersecting) { if (!rewound) rewind(); return; }
          if (rewound && e.intersectionRatio >= 0.33) replay(0.15);
        });
      }, { threshold: [0, 0.33] }).observe(card);
    }

    card.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse" || !mouse.matches || !played) return;
      if (performance.now() < busyUntil) return;
      rewind();
      replay(0.05);
    });
  });

  if (window.Flip) {
    gsap.registerPlugin(Flip);
    var stage = document.querySelector("[data-spiral-stage]");
    var shell = null;

    var pictureFor = function (a) {
      var img = a.querySelector("img");
      if (img) return img;

      if (!stage) return null;
      var href = a.getAttribute("href");
      var card = stage.querySelector('[data-spiral-card][data-href="' + href + '"]');
      return card && card.querySelector("img");
    };

    document.addEventListener("click", function (e) {

      if (e.defaultPrevented || e.button !== 0 || e.detail === 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || shell) return;
      var a = e.target.closest && e.target.closest('a[href^="work/"]');
      if (!a) return;
      var img = pictureFor(a);
      if (!img) return;
      var r = img.getBoundingClientRect();
      if (r.width < 40 || r.bottom < 0 || r.top > innerHeight) return;

      e.preventDefault();
      if (M.lenis) M.lenis.stop();
      shell = document.createElement("div");
      shell.className = "flip-shell";
      shell.setAttribute("aria-hidden", "true");
      var pic = document.createElement("img");
      pic.src = img.currentSrc || img.src;
      pic.alt = "";
      shell.appendChild(pic);
      document.body.appendChild(shell);

      var from = Flip.fit(pic, img, { getVars: true });
      from.borderRadius = getComputedStyle(img).borderRadius || "16px";
      gsap.from(pic, Object.assign(from, {
        duration: 0.85, ease: "expo.inOut",
        onComplete: function () { location.href = a.href; }
      }));
    });

    addEventListener("pageshow", function (e) {
      if (!e.persisted || !shell) return;
      shell.remove();
      shell = null;
      if (M.lenis) M.lenis.start();
    });
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var riskCard = document.querySelector(".risk");
    var pa = riskCard && riskCard.querySelector(".phone-a");
    var pb = riskCard && riskCard.querySelector(".phone-b");
    if (pa && pb) {
      var k = function () { return innerWidth <= 900 ? 0.5 : 1; };
      var ride = function (el, y0, y1, r0, r1) {
        gsap.fromTo(el,
          { "--py": function () { return y0 * k() + "px"; }, "--pr": r0 + "deg" },
          { "--py": function () { return y1 * k() + "px"; }, "--pr": r1 + "deg", ease: "none",
            scrollTrigger: { trigger: riskCard, start: "top bottom", end: "bottom top",
              scrub: 0.6, invalidateOnRefresh: true, refreshPriority: -2 } });
      };
      ride(pa, 46, -46, -5, 4);
      ride(pb, 84, -34, 6, -3);
    }
  }
})();

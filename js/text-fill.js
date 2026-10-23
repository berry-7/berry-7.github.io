
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  var split = function (el, byWord) {
    var chars = [];
    var text = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";
    var sr = document.createElement("span");
    sr.className = "vh";
    sr.textContent = text;
    var vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    text.split(" ").forEach(function (word, wi) {
      if (wi) vis.appendChild(document.createTextNode(" "));
      var w = document.createElement("span");
      w.className = "tf-word";
      if (byWord) { w.textContent = word; chars.push(w); vis.appendChild(w); return; }
      for (var i = 0; i < word.length; i++) {
        var c = document.createElement("span");
        c.className = "tf-ch";
        c.textContent = word[i];
        w.appendChild(c);
        chars.push(c);
      }
      vis.appendChild(w);
    });
    el.appendChild(sr);
    el.appendChild(vis);
    return chars;
  };
  var body = document.querySelector(".about-body");
  var chars = [], letters = 0;
  if (body) {
    Array.prototype.forEach.call(body.querySelectorAll("p"), function (p) {
      letters += p.textContent.replace(/\s+/g, "").length;
      chars = chars.concat(split(p, true));
    });
  }
  var lines = Array.prototype.map.call(document.querySelectorAll("[data-fill]"), function (el) {
    return { el: el, chars: split(el) };
  });

  var start = function () {
    if (chars.length) {
      gsap.fromTo(chars, { color: "#b8b8b8" }, {
        color: "#000000",
        ease: "none",
        
        stagger: chars.length > 1 ? 0.02 * (letters - 1) / (chars.length - 1) : 0,
        scrollTrigger: {
          trigger: body,
          start: "top 78%",       // first letter starts as the text enters
          end: "bottom 48%",      // last one is black by the middle of the screen
          scrub: true,
          
          refreshPriority: -2
        }
      });
    }
    
    lines.forEach(function (l) {
      var h = l.el.closest("h2,h1,h3") || l.el;
      gsap.fromTo(l.chars, { color: "#767676" }, {
        color: "#000000",
        ease: "none",
        stagger: 0.04,
        scrollTrigger: { trigger: h, start: "top 72%", end: "bottom 36%", scrub: true }
      });
    });
    ScrollTrigger.refresh();
    if (!body) return;
    var grid = body.closest(".about-grid") || body.parentNode;
    var lastH = grid.offsetHeight, rt;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        if (grid.offsetHeight === lastH) return;
        lastH = grid.offsetHeight;
        clearTimeout(rt);
        rt = setTimeout(function () { ScrollTrigger.refresh(); }, 120);
      }).observe(grid);
    }
  };
  if (document.readyState === "complete") start();
  else addEventListener("load", function () { setTimeout(start, 0); });
})();

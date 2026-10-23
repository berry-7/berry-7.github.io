
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var rail = document.querySelector(".gets");
  if (!rail) return;
  gsap.registerPlugin(ScrollTrigger);
  var lvh = function () {
    var probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100lvh;width:0;visibility:hidden";
    document.body.appendChild(probe);
    var h = probe.offsetHeight || innerHeight;
    probe.remove();
    return h;
  };

  var start = function () {
  var mm = gsap.matchMedia();
  mm.add("(max-width: 560px)", function () {
    var section = rail.closest(".getsec") || rail;
    rail.classList.add("is-pinned");
    rail.scrollLeft = 0;
    var cards = rail.children;
    var last = cards[cards.length - 1];
    var distance = function () {
      var gut = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      var now = parseFloat(getComputedStyle(rail).getPropertyValue("--rx")) || 0;
      var right = last.getBoundingClientRect().right - now;
      return Math.max(0, Math.round(right - (document.documentElement.clientWidth - gut)));
    };
    gsap.set(rail, { "--rx": "0px" });
    var tween = gsap.to(rail, {
      "--rx": function () { return -distance() + "px"; },
      ease: "none",
      
      scrollTrigger: {
        trigger: section,
        pin: section,
        start: function () {
          
          if (section.offsetHeight <= lvh() + 1) return "top top";
          return section.offsetHeight < innerHeight ? "center center" : "bottom bottom";
        },
        end: function () { return "+=" + distance(); },
        scrub: true,
        invalidateOnRefresh: true,
        
        refreshPriority: -1
      }
    });
    ScrollTrigger.refresh();

    return function () {            // leaving the phone range: undo it all
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
      rail.style.removeProperty("--rx");
      rail.classList.remove("is-pinned");
    };
  });
  };
  
  if (document.readyState === "complete") start();
  else addEventListener("load", function () { setTimeout(start, 0); });
})();

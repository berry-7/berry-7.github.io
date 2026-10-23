
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rv = document.querySelectorAll(".rv");
  function revealAll() { rv.forEach(function (el) { el.classList.add("in"); }); }

  if (!reduce && "IntersectionObserver" in window) {
    
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -4% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    
    setTimeout(revealAll, 4000);
  } else {
    revealAll();
  }
})();


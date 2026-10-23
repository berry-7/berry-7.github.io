
(function () {
  "use strict";
  var head = document.querySelector("[data-site-header]");
  if (!head) return;

  var on = false;
  var ticking = false;

  function apply() {
    ticking = false;
    var next = window.scrollY > 24;
    if (next === on) return;
    on = next;
    head.classList.toggle("is-floating", on);
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }, { passive: true });

  apply();
})();

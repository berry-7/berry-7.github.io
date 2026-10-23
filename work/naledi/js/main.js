
import { buildOrderUrl } from "./order.mjs";

(function () {
  "use strict";
  var head = document.querySelector("[data-site-header]");
  if (head) {
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
  }
})();
var form = document.getElementById("order");
var send = document.getElementById("send");

if (form && send) {
  var readState = function () {
    return {
      items: [].slice.call(form.querySelectorAll("[data-item]")).map(function (el) {
        return {
          name: el.dataset.item,
          price: +el.dataset.price,
          qty: +el.value
        };
      }),
      slot: form.elements.slot.value,
      name: form.elements.name.value
    };
  };

  var sync = function () { send.href = buildOrderUrl(readState()); };
  form.addEventListener("change", sync);
  sync();
}

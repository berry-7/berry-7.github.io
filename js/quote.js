
(function () {
  "use strict";
  var box = document.getElementById("quote");
  if (!box) return;
  var panel = box.querySelector(".qp-panel");
  var form = box.querySelector("form");
  var note = box.querySelector(".qp-status");
  var root = document.documentElement;
  var OPENERS = 'a[href="#contact"], a[href="audit.html"], .dock-btn';
  var outside = "header, main, footer, .nav-sheet, .bnav, .dock";
  var last = null, open = false;

  var lenis = function () { return window.TLM && window.TLM.lenis; };

  var show = function (from) {
    if (open) return;
    open = true; last = from || document.activeElement;

    var sheet = document.getElementById("navSheet"), tog = document.getElementById("navToggle");
    if (sheet && sheet.getAttribute("data-open") === "true" && tog) tog.click();
    box.removeAttribute("hidden");
    void box.offsetWidth;
    box.classList.add("is-open");
    root.classList.add("qp-lock");
    if (lenis()) lenis().stop();
    Array.prototype.forEach.call(document.querySelectorAll(outside), function (el) {
      el.setAttribute("inert", ""); el.setAttribute("data-qp-inert", "");
    });
    var first = form.querySelector("input");

    setTimeout(function () { if (open && first) first.focus({ preventScroll: true }); }, 420);
  };

  var hide = function () {
    if (!open) return;
    open = false;
    box.classList.remove("is-open");
    root.classList.remove("qp-lock");
    if (lenis()) lenis().start();
    Array.prototype.forEach.call(document.querySelectorAll("[data-qp-inert]"), function (el) {
      el.removeAttribute("inert"); el.removeAttribute("data-qp-inert");
    });
    setTimeout(function () { if (!open) box.setAttribute("hidden", ""); }, 520);
    if (last && last.focus) last.focus({ preventScroll: true });
  };

  window.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(OPENERS);
    if (!a || box.contains(a)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); e.stopImmediatePropagation();
    show(a);
  }, true);

  box.addEventListener("click", function (e) {
    if (e.target.closest("[data-qp-close]")) hide();
  });
  document.addEventListener("keydown", function (e) {
    if (open && e.key === "Escape") { e.preventDefault(); hide(); }
  });

  box.addEventListener("wheel", function (e) {
    var inPanel = panel.contains(e.target);
    if (!inPanel || panel.scrollHeight <= panel.clientHeight) e.preventDefault();
  }, { passive: false });
  box.querySelector(".qp-scrim").addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var v = function (n) { return (form.elements[n].value || "").trim(); };
    var lines = ["Hi Tlhogi, I'd like my free audit.", "",
      "Name: " + v("name"), "Email: " + v("email"), "Business: " + v("business")];
    if (v("message")) lines.push("", v("message"));
    window.open("https://wa.me/27760825924?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    note.hidden = false;
  });
})();

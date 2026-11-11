
(function () {
  "use strict";
  var box = document.querySelector("[data-port-reveal]");
  if (!box) return;
  var cv = box.querySelector(".port-paint");
  var photo = box.querySelector("img");
  if (!cv || !cv.getContext) return;

  var ctx = cv.getContext("2d");
  var paint = null, loading = false;
  var dabs = [], LIFE = 1400;
  var W = 0, H = 0, dpr = 1;
  var last = null, raf = 0;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(photo.offsetWidth * dpr);
    H = Math.round(photo.offsetHeight * dpr);
    if (!W || !H) return;
    cv.width = W;
    cv.height = H;
    cv.style.width = photo.offsetWidth + "px";
    cv.style.height = photo.offsetHeight + "px";
  }

  function load() {
    if (paint || loading) return;
    loading = true;
    var im = new Image();
    im.decoding = "async";
    im.onload = function () { paint = im; };
    im.src = cv.getAttribute("data-src");
  }

  function dab(x, y) {
    var R = W * 0.11, now = performance.now();
    for (var k = 0; k < 3; k++) {
      var a = Math.random() * Math.PI * 2;
      var d = Math.random() * R * 0.45;
      dabs.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
        r: R * (0.55 + Math.random() * 0.5), t: now });
    }
  }

  function stroke(x, y) {
    if (!last) { dab(x, y); last = { x: x, y: y }; return; }
    var dx = x - last.x, dy = y - last.y;
    var dist = Math.hypot(dx, dy);
    var step = W * 0.03;
    if (dist < step) return;
    var n = Math.floor(dist / step);
    for (var i = 1; i <= n; i++) dab(last.x + dx * i * step / dist, last.y + dy * i * step / dist);
    last = { x: last.x + dx * n * step / dist, y: last.y + dy * n * step / dist };
  }

  function frame(now) {
    raf = 0;
    now = now || performance.now();
    dabs = dabs.filter(function (d) { return now - d.t < LIFE; });
    ctx.clearRect(0, 0, W, H);
    if (paint && dabs.length) {
      ctx.save();
      ctx.beginPath();
      dabs.forEach(function (d) {

        var r = d.r * Math.pow(1 - (now - d.t) / LIFE, 0.6);
        ctx.moveTo(d.x + r, d.y);
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      });
      ctx.clip();
      ctx.drawImage(paint, 0, 0, W, H);
      ctx.restore();
    }
    if (dabs.length) raf = requestAnimationFrame(frame);
  }

  function at(e) {
    var r = box.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
  }

  box.style.touchAction = "pan-y";

  var lock = document.createElement("button");
  lock.type = "button";
  lock.className = "port-lock";
  lock.setAttribute("aria-pressed", "false");
  lock.setAttribute("aria-label", "Lock the photo so a finger paints instead of scrolling");
  lock.innerHTML =
    '<svg class="lk-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/></svg>' +
    '<svg class="lk-on" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  box.appendChild(lock);
  var locked = false;
  var setLock = function (on) {
    locked = on;
    lock.setAttribute("aria-pressed", on ? "true" : "false");
    box.classList.toggle("is-locked", on);
    box.style.touchAction = on ? "none" : "pan-y";
    if (on) box.setAttribute("data-lenis-prevent", ""); else box.removeAttribute("data-lenis-prevent");
    last = null;
  };
  lock.addEventListener("click", function () { setLock(!locked); load(); if (!W) size(); });
  lock.addEventListener("pointermove", function (e) { e.stopPropagation(); });
  box.addEventListener("touchmove", function (e) {
    if (locked && e.cancelable) e.preventDefault();
  }, { passive: false });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting && locked) setLock(false);
    }).observe(box);
  }
  box.addEventListener("pointerenter", function () { load(); if (!W) size(); });
  box.addEventListener("pointerdown", function () { load(); if (!W) size(); });
  box.addEventListener("pointermove", function (e) {
    if (!W) size();
    if (!W) return;
    var p = at(e);
    stroke(p.x, p.y);
    if (!raf) raf = requestAnimationFrame(frame);
  });
  box.addEventListener("pointerleave", function () { last = null; });
  box.addEventListener("pointercancel", function () { last = null; });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { load(); io.disconnect(); }
    }, { rootMargin: "600px 0px" });
    io.observe(box);
  } else load();

  var rt;
  addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });
  if (photo.complete) size(); else photo.addEventListener("load", size);
})();

/* Ставки Рейтинг — интерактив на hero-рендерах.
   Никакой тонкой 3D-сцены поверх картинки: сам AI-рендер — герой, а движение
   мыши даёт лёгкий перспективный наклон (как в премиальных продуктовых
   лендингах), плюс мягкое парение. Всё на CSS-transform, дёшево и плавно. */
(function () {
  "use strict";

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;

    document.querySelectorAll("img.hero-art").forEach(function (img) {
      var wrap = img.closest(".hero-split__art") || img.parentElement;
      var raf = null;
      var bob = 0;

      // лёгкое собственное парение, даже без движения мыши
      function idleFloat(t) {
        bob = Math.sin(t / 1800) * 6;
        apply(lastRX, lastRY);
        raf = requestAnimationFrame(idleFloat);
      }

      var lastRX = 0, lastRY = 0;
      function apply(rx, ry) {
        img.style.transform =
          "perspective(1000px) rotateY(" + rx + "deg) rotateX(" + ry + "deg) translateY(" + bob + "px) scale(1.015)";
      }

      if (coarse) {
        raf = requestAnimationFrame(idleFloat);
        return;
      }

      function onMove(e) {
        var rect = wrap.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        var px = x / rect.width - 0.5, py = y / rect.height - 0.5;
        lastRX = px * 12;
        lastRY = -py * 12;
      }
      function onLeave() {
        lastRX = 0; lastRY = 0;
      }

      wrap.addEventListener("mousemove", onMove);
      wrap.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(idleFloat);
    });
  });
})();

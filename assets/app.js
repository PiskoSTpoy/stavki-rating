/* sitegen: общий скрипт на весь сайт. Один файл, браузер скачивает его один раз. */
(function () {
  "use strict";

  /* ── меню на телефоне ── */
  var hdr = document.querySelector(".hdr");
  var burger = document.querySelector(".burger");
  if (hdr && burger) {
    burger.addEventListener("click", function () {
      var open = hdr.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    hdr.querySelectorAll(".hdr__nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        hdr.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && hdr.classList.contains("open")) {
        hdr.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── кнопка звонка: появляется, когда шапка уехала вверх ── */
  var bar = document.querySelector(".callbar");
  if (bar) {
    var on = false;
    var upd = function () {
      var want = (window.scrollY || document.documentElement.scrollTop) > 500;
      if (want !== on) { on = want; bar.classList.toggle("on", on); }
    };
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  /* ── отправка формы ──
     mode "endpoint" в site.json → отправляем через fetch на свой адрес (CRM, бот, что угодно).
     Иначе форма уходит обычным POST — так работает Netlify Forms.                     */
  document.querySelectorAll("form[data-endpoint]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = f.querySelector("button[type=submit],button:not([type])");
      var note = f.querySelector(".note") || (function () {
        var d = document.createElement("div"); d.className = "note"; f.appendChild(d); return d;
      })();
      var was = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Отправляем…"; }
      note.className = "note";
      note.textContent = "";

      fetch(f.dataset.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(f).entries()))
      })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          f.reset();
          note.className = "note ok";
          note.textContent = "Заявка отправлена. Перезвоним в ближайшее время.";
          if (window.ym) { try { ym(window.__ym_id, "reachGoal", "lead"); } catch (_) {} }
          if (window.gtag) { try { gtag("event", "generate_lead"); } catch (_) {} }
        })
        .catch(function () {
          note.className = "note err";
          note.textContent = "Не удалось отправить. Позвоните нам, пожалуйста — так быстрее.";
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = was; }
        });
    });
  });
})();

/* STAVKI RATING — общий скрипт оболочки: мобильное меню, активный пункт навигации,
   индикатор чтения. Без зависимостей; страница полностью работает и без него. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var hdr = document.querySelector(".site-header");
    var nav = hdr && hdr.querySelector(".nav");

    /* ── мобильное меню ── */
    if (hdr && nav) {
      if (!nav.id) nav.id = "site-nav";
      var burger = document.createElement("button");
      burger.type = "button";
      burger.className = "burger";
      burger.setAttribute("aria-label", "Меню");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-controls", nav.id);
      burger.innerHTML = "<span></span>";
      var right = hdr.querySelector(".header-right");
      (right || hdr.querySelector(".container")).appendChild(burger);

      var setOpen = function (open) {
        hdr.classList.toggle("nav-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
      };
      burger.addEventListener("click", function () {
        setOpen(!hdr.classList.contains("nav-open"));
      });
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && hdr.classList.contains("nav-open")) {
          setOpen(false);
          burger.focus();
        }
      });
      document.addEventListener("click", function (e) {
        if (hdr.classList.contains("nav-open") && !hdr.contains(e.target)) setOpen(false);
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 940) setOpen(false);
      });
    }

    /* ── подпись у иконки поиска (на телефоне текст скрыт) ── */
    var search = document.querySelector(".search");
    if (search && !search.getAttribute("aria-label")) {
      search.setAttribute("aria-label", "Поиск по БК и бонусам");
    }

    /* ── активный пункт навигации по адресу страницы ── */
    if (nav) {
      var path = location.pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
      var best = null, bestLen = 0;
      nav.querySelectorAll("a[href^='/']").forEach(function (a) {
        var p = a.getAttribute("href").split("#")[0].split("?")[0].replace(/\/+$/, "");
        if (!p) return;
        if ((path === p || path.indexOf(p + "/") === 0) && p.length > bestLen) { best = a; bestLen = p.length; }
      });
      /* страницы-обзоры /xxx-obzor и карточки БК относятся к «Рейтингу» */
      if (!best && /-obzor$|^\/bukmekery(\/|$)/.test(path)) best = nav.querySelector("a[href='/rating']");
      if (!best && /^\/novosti/.test(path)) best = nav.querySelector("a[href='/novosti']");
      if (best) {
        nav.querySelectorAll("a.active").forEach(function (a) { a.classList.remove("active"); });
        best.setAttribute("aria-current", path === best.getAttribute("href") ? "page" : "true");
      }
    }

    /* ── индикатор чтения на длинных страницах ── */
    var prose = document.querySelector(".prose");
    if (prose && document.documentElement.scrollHeight > window.innerHeight * 2.2) {
      var bar = document.createElement("div");
      bar.className = "read-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
      var ticking = false;
      var update = function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var y = window.pageYOffset || document.documentElement.scrollTop;
        bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + "%";
        ticking = false;
      };
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  });
})();

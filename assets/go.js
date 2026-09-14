// /go/{key} redirect: official site by default; partner URL + subid once approved.
// subid = key-page-placement-time36-rand4 (no PII). Query params on the go page:
//   p  — source page slug, pl — placement (card | table | cta | text).
(function () {
  var el = document.querySelector('[data-go]');
  if (!el) return;
  var key = el.getAttribute('data-go');
  var targets = window.GO_TARGETS || {};
  var t = targets[key];
  if (!t || !t.official) return;

  var q = new URLSearchParams(location.search);
  var clean = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); };
  var dest = t.official;

  // Своя партнёрка. Если её нет, но задан recommend на живого партнёра —
  // уводим трафик на него (решение владельца 15.09.2026: не терять клики по
  // непартнёрским БК). subid хранит исходный ключ, чтобы в кабинете партнёра
  // было видно, с какой страницы пришёл трафик.
  var partner = (t.partner && t.partner.url) ? t.partner : null;
  var subKey = key;
  if (!partner && t.recommend && targets[t.recommend] && targets[t.recommend].partner) {
    partner = targets[t.recommend].partner;
    subKey = key + '-' + t.recommend;
  }

  if (partner && partner.url) {
    var subid = [subKey, clean(q.get('p')), clean(q.get('pl')),
      Date.now().toString(36), Math.random().toString(36).slice(2, 6)]
      .filter(Boolean).join('-');
    try {
      var u = new URL(partner.url);
      u.searchParams.set(partner.subParam || 'subid', subid);
      dest = u.toString();
    } catch (e) { dest = t.official; }
  }

  // сразу на партнёрскую ссылку (по требованию владельца 14.09.2026) — без задержки
  location.replace(dest);
})();

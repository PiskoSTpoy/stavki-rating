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

  if (t.partner && t.partner.url) {
    var subid = [key, clean(q.get('p')), clean(q.get('pl')),
      Date.now().toString(36), Math.random().toString(36).slice(2, 6)]
      .filter(Boolean).join('-');
    try {
      var u = new URL(t.partner.url);
      u.searchParams.set(t.partner.subParam || 'subid', subid);
      dest = u.toString();
    } catch (e) { dest = t.official; }
  }

  // give the warning a moment to be seen, then go
  setTimeout(function () { location.replace(dest); }, 700);
})();

#!/usr/bin/env python3
"""Пост-обработка собранного dist/ (добавить ПОСЛЕДНИМ шагом сборки, после всех gen_*.py):
  1. «служебные» страницы со старой разметкой (<link href="/assets/style.css">, .canvas/.frame/.hdr/.foot) —
     перевод на общий каркас: шапка, <main>, крошки из BreadcrumbList, общий подвал, sticky-cta, site.js;
  2. неразрывные пробелы в суммах и после №/§ во всех .html (вне script/style/комментариев).
Идемпотентно: страницы, уже переведённые, пропускаются. Не требует правок самих генераторов служебных страниц.
Запуск:  python3 postprocess_dist.py <dist> [--no-nbsp] [--no-legacy]"""
import re, sys, os, glob, json, html
dist = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from nbsp import nbsp_html
rd = lambda n: open(os.path.join(here, n), encoding='utf-8').read()
HEADER, FOOTER, STICKY = rd('header.html').replace('<nav class="nav">', '<nav class="nav" aria-label="Основное меню">'), rd('footer.html'), rd('sticky.html')
V = '?v=' + os.environ.get('ASSET_VER', '20261004')
HEADLINKS = f'''<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="120x120" href="/favicon-120.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/site.css{V}">
<link rel="stylesheet" href="/assets/chrome.css{V}">
<meta name="theme-color" content="#07090F">'''

def crumbs(s, rel):
    m = re.search(r'<script type="application/ld\+json">(\{[^<]*"BreadcrumbList".*?)</script>', s, re.S)
    if not m: return ''
    try:
        items = [(i['name'], i['item']) for i in json.loads(m.group(1))['itemListElement']]
    except Exception:
        return ''
    if os.path.basename(rel).startswith('novosti-') and len(items) == 2:
        items = [items[0], ('Новости', 'https://stavki-rating.ru/novosti'), items[1]]
    out = []
    for k, (n, u) in enumerate(items):
        n = html.escape(n, quote=False)
        out.append(n if k == len(items) - 1 else '<a href="%s">%s</a>' % (u.replace('https://stavki-rating.ru', '') or '/', n))
    return '<nav class="crumbs" aria-label="Хлебные крошки">' + '<span>/</span>'.join(out) + '</nav>'

def legacy(s, rel):
    head = s[:s.find('<body')]
    head = head.replace('<link rel="stylesheet" href="/assets/style.css">', HEADLINKS)
    if os.path.basename(rel).startswith('novosti-'):
        head = head.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    m = re.search(r'<main id="main">(.*?)</main>', s, re.S)
    if not m: return None
    inner = re.sub(r'\s*<div class="glow" aria-hidden="true"></div>', '', m.group(1))
    a = inner.find('<div class="wrap prose">')
    if a < 0: return None
    content = inner[a + len('<div class="wrap prose">'):inner.rstrip().rfind('</div>')]
    scripts = ''.join(re.findall(r'<script>.*?</script>', s[s.find('</footer>') + 9:], re.S))
    return f'''{head}<body>
<a class="skip" href="#main">К содержанию</a>

{HEADER}

<main id="main">
  <section class="section tight"><div class="container prose">
{crumbs(s, rel)}
{content.strip()}
  </div></section>
</main>

{FOOTER}

{STICKY}

<script src="/assets/site.js" defer></script>
{scripts}
</body>
</html>
'''

n_leg = n_nb = 0
for f in sorted(glob.glob(os.path.join(dist, '**', '*.html'), recursive=True)):
    rel = os.path.relpath(f, dist); s = o = open(f, encoding='utf-8').read()
    if '--no-legacy' not in sys.argv and 'assets/style.css' in s:
        r = legacy(s, rel)
        if r: s = r; n_leg += 1
        else: print('! не удалось перевести', rel)
    if '--no-nbsp' not in sys.argv: s = nbsp_html(s)
    if s != o:
        open(f, 'w', encoding='utf-8').write(s); n_nb += 1
print(f'служебных страниц переведено: {n_leg}; файлов изменено: {n_nb}')

# --- contacts: форма Netlify на GitHub Pages не работает (POST -> 405) -> mailto ---
import shutil
cp = os.path.join(dist, 'contacts.html')
if os.path.exists(cp):
    c = o = open(cp, encoding='utf-8').read()
    c = re.sub(r'<form class="form" name="lead".*?</form>', '<p><a class="btn btn-primary" href="mailto:hello@stavki-rating.ru">Написать на hello@stavki-rating.ru</a></p>', c, flags=re.S)
    c = c.replace('напишите на почту через форму ниже.', 'напишите на почту <a href="mailto:hello@stavki-rating.ru">hello@stavki-rating.ru</a>. Как мы обрабатываем данные — в <a href="/politika-konfidencialnosti">политике конфиденциальности</a>.')
    if c != o: open(cp, 'w', encoding='utf-8').write(c); print('contacts: форма заменена на mailto')

# --- страница политики конфиденциальности (статический файл из port-kit/pages) ---
pp = os.path.join(dist, 'politika-konfidencialnosti.html')
if not os.path.exists(pp):
    shutil.copy(os.path.join(here, 'pages', 'politika-konfidencialnosti.html'), pp); print('добавлена politika-konfidencialnosti.html')

# --- sitemap ---
sp = os.path.join(dist, 'sitemap.xml')
if os.path.exists(sp):
    sm = o = open(sp, encoding='utf-8').read()
    for slug, prio in (('eksperty', '0.5'), ('politika-konfidencialnosti', '0.3')):
        if '/' + slug + '<' not in sm:
            sm = sm.replace('</urlset>', f'  <url>\n    <loc>https://stavki-rating.ru/{slug}</loc>\n    <priority>{prio}</priority>\n  </url>\n</urlset>', 1)
    if sm != o: open(sp, 'w', encoding='utf-8').write(sm); print('sitemap дополнен')

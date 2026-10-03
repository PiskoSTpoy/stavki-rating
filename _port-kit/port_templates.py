#!/usr/bin/env python3
"""Переносит редизайн (PR #1) в шаблоны исходников. Идемпотентно, каждая правка отчитывается.
Запуск из корня репозитория исходников:
    python3 <port-kit>/port_templates.py --root . [--dry-run]
Что делает:
  theme/volt-shell.html : inline <style> -> <link site.css + chrome.css>, theme-color, skip-ссылка, <main id>,
                          aria-label у меню, site.js, новый подвал
  home-volt.html        : chrome.css (site.css НЕ подключается — своя вёрстка), skip-ссылка, логотип '/', общее меню,
                          <main id=main>, новый подвал, site.js
Копирование assets и пост-обработку nbsp (nbsp.py) в сборку нужно добавить отдельно — см. README.md."""
import re, sys, os, argparse
ap = argparse.ArgumentParser(); ap.add_argument('--root', default='.'); ap.add_argument('--dry-run', action='store_true')
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__))
V = '?v=' + os.environ.get('ASSET_VER', '20261004')   # лучше подставлять build-id
FOOTER = open(os.path.join(here, 'footer.html'), encoding='utf-8').read()
HEADER = open(os.path.join(here, 'header.html'), encoding='utf-8').read()
NAV = re.search(r'<nav class="nav"[^>]*>.*?</nav>', HEADER, re.S).group(0)
LINKS = (f'<link rel="stylesheet" href="/assets/site.css{V}">\n<link rel="stylesheet" href="/assets/chrome.css{V}">\n'
         '<meta name="theme-color" content="#07090F">')
CHROME = f'<link rel="stylesheet" href="/assets/chrome.css{V}">\n<meta name="theme-color" content="#07090F">'

def step(name, ok, note=''):
    print(('  ✔ ' if ok else '  ✘ ') + name + (' — ' + note if note else ''))
    return ok

def ver_replace(s, pat, repl, name, flags=0):
    s2, n = re.subn(pat, repl, s, count=1, flags=flags)
    step(name, n == 1 or ('пропуск' if False else n == 1), '' if n == 1 else 'не найдено (возможно, уже применено)')
    return s2

def patch(path, kind):
    if not os.path.exists(path):
        print(f'[{kind}] файла нет: {path}'); return
    print(f'[{kind}] {path}')
    s = o = open(path, encoding='utf-8').read()
    if kind == 'theme':
        if 'assets/site.css' in s: step('site.css уже подключён', True)
        else: s = ver_replace(s, r'<style>.*?</style>', lambda m: LINKS, 'inline <style> -> site.css + chrome.css', re.S)
    else:
        if 'assets/chrome.css' in s: step('chrome.css уже подключён', True)
        else: s = ver_replace(s, r'(</style>)(\s*\n)', lambda m: m.group(1) + '\n' + CHROME + m.group(2), 'chrome.css после inline <style>', re.S)
        s = s.replace('<a class="logo" href="#top">', '<a class="logo" href="/">', 1)
        s2 = re.sub(r'<nav class="nav">.*?</nav>', lambda m: NAV, s, count=1, flags=re.S); step('общее меню', s2 != s or NAV in s); s = s2
        if '<main' not in s:
            s2 = s.replace('<a id="top"></a>', '<main id="main">\n<a id="top"></a>', 1)
            i = s2.find('<!-- ФУТЕР -->'); step('<main id=main>', i > 0 and s2 != s, 'не нашёл маркер «<!-- ФУТЕР -->»' if i <= 0 else '')
            if i > 0: s2 = s2[:i] + '</main>\n\n' + s2[i:]
            s = s2
    if 'class="skip"' not in s:
        s = s.replace('<body>\n', '<body>\n<a class="skip" href="#main">К содержанию</a>\n', 1); step('skip-ссылка', 'class="skip"' in s)
    if kind == 'theme':
        s = s.replace('<main>', '<main id="main">', 1)
        s = s.replace('<nav class="nav">', '<nav class="nav" aria-label="Основное меню">', 1)
    if 'assets/site.js' not in s:
        s = s.replace('</body>', '<script src="/assets/site.js" defer></script>\n</body>', 1); step('site.js', 'assets/site.js' in s)
    m = re.search(r'<footer class="footer">.*?</footer>', s, re.S)
    if m:
        if '{{' in m.group(0) or '{%' in m.group(0): print('  ! в подвале шаблона есть плейсхолдеры — проверьте вручную')
        s = s.replace(m.group(0), FOOTER, 1); step('новый подвал', True)
    else: step('подвал', False, 'блок <footer class="footer"> не найден')
    if s != o and not a.dry_run:
        open(path, 'w', encoding='utf-8').write(s)
    print('  изменён' if s != o else '  без изменений', '(dry-run)' if a.dry_run else '')

patch(os.path.join(a.root, 'theme', 'volt-shell.html'), 'theme')
patch(os.path.join(a.root, 'home-volt.html'), 'home')
print('\nДальше вручную: копирование assets в dist, страница политики, contacts, заголовок главной, nbsp — см. README.md')

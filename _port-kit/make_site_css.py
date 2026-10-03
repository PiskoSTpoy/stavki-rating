#!/usr/bin/env python3
"""Собирает assets/site.css из ТЕКУЩЕГО inline-CSS шаблона theme/volt-shell.html + дельта редизайна.
Каждая правка проверяется assert-ом: если шаблон успел измениться и строка не найдена — скрипт падает
и показывает, какую именно правку надо перенести руками (см. css-delta.diff).
Запуск:  python3 make_site_css.py <путь к volt-shell.html> <куда писать site.css>"""
import re, sys, os
tpl, out = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
src = open(tpl, encoding='utf-8').read()
m = re.search(r'<style>(.*?)</style>', src, re.S)
if not m:
    sys.exit('в шаблоне нет inline <style> — возможно, CSS уже вынесен; возьмите assets/site.css из port-kit как есть')
base = m.group(1).strip('\n')

def sub(old, new):
    global base
    if old not in base:
        sys.exit('НЕ НАЙДЕНО в CSS шаблона (перенесите правку вручную): ' + old[:90])
    base = base.replace(old, new, 1)

sub("html { scroll-behavior: smooth; }", "html { scroll-behavior: smooth; scroll-padding-top: 84px; -webkit-text-size-adjust: 100%; }")
sub("-webkit-font-smoothing: antialiased; overflow-x: hidden; }",
    "-webkit-font-smoothing: antialiased; overflow-x: hidden; position: relative; text-rendering: optimizeLegibility; }\n"
    "  /* мягкое фиолетовое свечение под шапкой — одно на все страницы */\n"
    "  body::before { content: \"\"; position: absolute; top: 0; left: 50%; width: min(1100px, 100%); height: 460px; transform: translateX(-50%); background: radial-gradient(60% 70% at 50% 0%, rgba(124,92,255,.20), transparent 72%); pointer-events: none; z-index: -1; }")
sub("h1 { font-size: clamp(23px, 2.8vw, 35px); }", "h1 { font-size: clamp(28px, 4.2vw, 44px); font-weight: 700; letter-spacing: -.025em; line-height: 1.08; }")
sub("h2 { font-size: clamp(21px, 2.4vw, 28px); }", "h2 { font-size: clamp(22px, 2.6vw, 30px); }")
sub(".eyebrow { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }",
    ".eyebrow { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }\n  .eyebrow::first-letter { color: var(--volt); }")
sub(".search { display: inline-flex;", ".search { white-space: nowrap; display: inline-flex;")
sub("    main { position: relative; z-index: 1; width: calc(var(--col) + 96px);", "    .wall ~ main { position: relative; z-index: 1; width: calc(var(--col) + 96px);")
sub(".section.tight { padding-top: 6px; }", ".section.tight { padding-top: 6px; padding-bottom: 24px; }")
sub(".prose { max-width: none; display: grid; gap: 14px; }",
    ".prose { max-width: none; display: grid; gap: 14px; }\n  .prose > .eyebrow { margin-bottom: -6px; }\n  .container > .toc + h2, .prose > .toc + h2 { margin-top: 30px !important; }\n  .prose > * { min-width: 0; }")
sub(".prose table { border-collapse: collapse; width: 100%; font-size: 14px; min-width: 440px; }",
    ".prose table { border-collapse: collapse; width: 100%; font-size: 14px; min-width: 440px; }\n"
    "  /* тень-подсказка, что таблицу можно прокрутить вбок */\n"
    "  .table-wrap { background: linear-gradient(90deg, var(--surface) 30%, transparent), linear-gradient(90deg, transparent, var(--surface) 70%) 100% 0, radial-gradient(farthest-side at 0 50%, rgba(0,0,0,.45), transparent), radial-gradient(farthest-side at 100% 50%, rgba(0,0,0,.45), transparent) 100% 0; background-repeat: no-repeat; background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%; background-attachment: local, local, scroll, scroll; }")
sub("  @media (max-width: 800px) { .footer-grid { grid-template-columns: 1fr 1fr; } }",
    "  @media (max-width: 800px) { .footer-grid { grid-template-columns: 1fr 1fr; } .footer-grid > div:first-child { grid-column: 1 / -1; } }\n  @media (max-width: 460px) { .footer-grid { grid-template-columns: 1fr; } }")
sub(".footer a { color: var(--muted); display: block; padding: 3px 0; }", ".footer a { color: var(--muted); display: block; padding: 5px 0; }")
sub(".sticky-cta small { font-size: 10.5px;", ".sticky-cta small { font-size: 11px;")

head = ("/* STAVKI RATING — основная таблица стилей сайта (шапка, контент статей, таблицы, FAQ, подвал).\n"
        "   Генерируется из theme/volt-shell.html + дельта редизайна (port-kit/make_site_css.py).\n"
        "   Оболочка (мобильное меню, поиск, skip-ссылка, подвал) — в chrome.css. */\n")
tail = open(os.path.join(here, 'tail_compat.css'), encoding='utf-8').read()
open(out, 'w', encoding='utf-8').write(head + '  ' + base.lstrip() + tail)
print('OK ->', out)

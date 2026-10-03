# port-kit — перенос редизайна (PR #1) в исходники за ~10 минут

Проверено на копиях старых страниц (коммит gh-pages `c522cea`, до PR): результат совпадает с продом
(`theme` — 0 строк отличий, служебные страницы — 0, `contacts`/политика/sitemap — 0; главная — только H1-месяц и позиция `site.js`).
Доступа к `stavki-rating-src` у меня не было (клонирование блокировал фильтр разрешений), поэтому скрипты написаны
по выводу, а не по шаблонам: **каждая правка отчитывается ✔/✘, на расхождении скрипт не гадает, а падает/пишет «не найдено».**

## Порядок (из корня исходников)

```bash
KIT=/путь/к/port-kit
# 0. ветка, чтобы плановая сборка не подхватила недоделку
git switch -c port/redesign

# 1. шаблоны: volt-shell.html и home-volt.html
python3 $KIT/port_templates.py --root . --dry-run     # посмотреть
python3 $KIT/port_templates.py --root .               # применить

# 2. CSS: собрать site.css из ТЕКУЩЕГО inline-CSS шаблона (до шага 1!) + дельта
#    (если шаг 1 уже убрал <style>, возьмите готовый $KIT/assets/site.css)
python3 $KIT/make_site_css.py <копия исходного volt-shell.html> assets-src/site.css
cp $KIT/assets/chrome.css $KIT/assets/site.js $KIT/assets/style.css assets-src/

# 3. сборка: копировать assets в dist (добавить в _build_core.sh / deploy.sh):
#    cp assets-src/{site.css,chrome.css,site.js,style.css} dist/assets/
# 4. ПОСЛЕДНИМ шагом сборки (после всех gen_*.py):
#    python3 $KIT/postprocess_dist.py dist
#    — переводит ~83 служебные страницы (rating, novosti, novosti-*, contacts, otvetstvennaya-igra,
#      kak-proverit-licenziyu, go/*) на общий каркас БЕЗ правки их генераторов, ставит nbsp в суммах,
#      заменяет нерабочую форму Netlify в contacts на mailto, кладёт страницу политики и правит sitemap.
```

`ASSET_VER=<build-id>` — версия в `?v=` у CSS (по умолчанию `20261004`).

## Что остаётся руками
1. **H1 главной**: в `home-volt.html` стоит «… — сентябрь 2026» — выводить месяц из даты сборки (на проде вручную «октябрь 2026»).
2. **nbsp в `bonus:'…'` главной** обрабатывает `postprocess_dist.py` только в HTML-тексте; строки внутри JS — отдельно (см. `nbsp.py`, функция `nb_text`, применять к строкам `bonus:'…'`).
3. Новая страница политики лежит в `pages/` как готовый HTML; если у вас есть генератор служебных страниц — перенесите её туда.
4. `assets/app.js`, `assets/scene.js`, `assets/style.css` (алиас) нужны только пока живы старые страницы; после перехода — удалить.

## Проверки после сборки
```bash
python3 $KIT/audit_static.py        # битые ссылки/ресурсы, h1=1, title/description/canonical (правит путь root внутри)
node   $KIT/audit_dyn.js            # playwright, 390px: страницы с горизонтальным переполнением и ошибки загрузки
                                    #   (правит root/порт внутри; нужен http.server на 8765 из dist)
# три гейта: geo_check FAIL 0 / WARN<=15, uniqueness 0 дублей, node _tools/test_calc.cjs 85/85
```
Эталон прогона на проде после PR: **531 страница, переполнение 0, ошибок загрузки 0**.

import re
NBSP=' '
TOK=re.compile(r'(<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->|<[^>]+>)',re.S)
def nb_text(t):
    t=re.sub(r'(?<=\d) (?=\d{3}(?!\d))',NBSP,t)
    t=re.sub(r'(?<=\d) (?=(?:₽|%|руб|млн|млрд|трлн|тыс|мин\b|сек\b|ч\b|лет\b|года\b|год\b))',NBSP,t)
    t=re.sub(r'(№|§) (?=\d)',lambda m:m.group(1)+NBSP,t)
    t=re.sub(r'(?<=\s)(и|в|во|на|с|со|к|ко|по|за|от|до|из|не|ни|а|но|о|об|у|для|при) (?=\S)',lambda m:m.group(1)+NBSP,t) if False else t
    return t
def nbsp_html(s):
    parts=TOK.split(s)
    for i in range(0,len(parts),2):
        parts[i]=nb_text(parts[i])
    return ''.join(parts)

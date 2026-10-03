import os,re,sys,collections,html
from urllib.parse import urlparse,unquote
root='/home/user/stavki-rating'
files=[]
for d,_,fs in os.walk(root):
    if '.git' in d: continue
    for f in fs:
        if f.endswith('.html'): files.append(os.path.join(d,f))
def exists(path):
    p=path.split('#')[0].split('?')[0]
    if p in('','/'): return True
    p=unquote(p).lstrip('/')
    for c in (p,p+'.html',os.path.join(p,'index.html')):
        if os.path.isfile(os.path.join(root,c)): return True
    return False
issues=collections.defaultdict(list)
for f in files:
    rel=os.path.relpath(f,root)
    s=open(f,encoding='utf-8').read()
    base='/'+os.path.dirname(rel)+'/' if os.path.dirname(rel) else '/'
    for m in re.finditer(r'(?:href|src)="([^"]+)"',s):
        u=m.group(1)
        if u.startswith(('http','mailto:','tel:','#','data:','javascript:')) or u.startswith('//'): continue
        path=u if u.startswith('/') else os.path.normpath(base+u)
        if not exists(path): issues['broken-link'].append((rel,u))
    t=re.search(r'<title>(.*?)</title>',s,re.S)
    if not t or not t.group(1).strip(): issues['no-title'].append(rel)
    if not re.search(r'<meta name="description"',s): issues['no-desc'].append(rel)
    n=len(re.findall(r'<h1[ >]',s))
    if n!=1: issues['h1=%d'%n].append(rel)
    if not re.search(r'rel="canonical"',s): issues['no-canonical'].append(rel)
    for m in re.finditer(r'<img\b[^>]*>',s):
        if 'alt=' not in m.group(0): issues['img-no-alt'].append((rel,m.group(0)[:80]))
        if 'width=' not in m.group(0) and 'height=' not in m.group(0): issues['img-no-dims'].append(rel)
    if 'lang="ru"' not in s: issues['no-lang'].append(rel)
    if not re.search(r'name="viewport"',s): issues['no-viewport'].append(rel)
    if re.search(r'undefined|\{\{|\}\}|None|NaN|TODO|lorem|PLACEHOLDER|XXX',s): 
        for w in re.findall(r'.{30}(?:undefined|\{\{|\}\}|\bNone\b|\bNaN\b|TODO|lorem|PLACEHOLDER|XXX).{30}',s): issues['placeholder-text'].append((rel,w))
for k,v in sorted(issues.items()):
    print('##',k,len(v))
    for x in v[:8]: print('   ',x)

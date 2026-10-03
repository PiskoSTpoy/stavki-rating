const { chromium } = require('playwright');
const fs=require('fs'),path=require('path');
const root='/home/user/stavki-rating';
function walk(d,o=[]){for(const f of fs.readdirSync(d)){if(f=='.git')continue;const p=path.join(d,f);fs.statSync(p).isDirectory()?walk(p,o):p.endsWith('.html')&&o.push(path.relative(root,p));}return o}
const pages=walk(root);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--host-resolver-rules=MAP fonts.googleapis.com 127.0.0.1, MAP fonts.gstatic.com 127.0.0.1']});
  const res=[];
  let i=0;
  async function worker(){
    const ctx=await b.newContext({viewport:{width:390,height:844}});
    while(i<pages.length){
      const p=pages[i++];
      const pg=await ctx.newPage();
      const errs=[];
      pg.on('pageerror',e=>errs.push('js:'+e.message.slice(0,100)));
      pg.on('requestfailed',r=>{const u=r.url();if(u.startsWith('http://localhost'))errs.push('reqfail:'+u)});
      pg.on('response',r=>{if(r.url().startsWith('http://localhost')&&r.status()>=400)errs.push(r.status()+':'+r.url())});
      await pg.goto('http://localhost:8765/'+p,{waitUntil:'load',timeout:15000}).catch(e=>errs.push('goto'));
      const m=await pg.evaluate(()=>{
        const W=innerWidth;const off=[];
        document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&r.right>W+2&&!e.closest('.tw,[style*="overflow"],.table-wrap,pre')){const cs=getComputedStyle(e);if(cs.position!=='fixed')off.push((e.tagName+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')).slice(0,40)+':'+Math.round(r.right))}});
        return {sw:document.documentElement.scrollWidth,W,off:off.slice(0,3)};
      });
      res.push({p,sw:m.sw,W:m.W,off:m.off,errs});
      await pg.close();
    }
  }
  await Promise.all([worker(),worker(),worker(),worker()]);
  fs.writeFileSync('dyn.json',JSON.stringify(res));
  const over=res.filter(r=>r.sw>r.W);
  console.log('pages',res.length,'overflow',over.length);
  const by={};over.forEach(r=>{const k=r.off[0]||'?';by[k]=(by[k]||0)+1});
  console.log(by);
  over.slice(0,15).forEach(r=>console.log(r.p,r.sw,r.off.join(' | ')));
  const er=res.filter(r=>r.errs.length);console.log('with errors',er.length);er.slice(0,15).forEach(r=>console.log(r.p,r.errs.slice(0,3)));
  await b.close();
})();

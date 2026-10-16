const form = document.getElementById('form');
const status = document.getElementById('status');
const btn = document.getElementById('submit');
const result = document.getElementById('result');
const sleep = ms => new Promise(r => setTimeout(r,ms));
form.addEventListener('submit',async ev => {
  ev.preventDefault();
  result.hidden = true; btn.disabled=true;
  try {
    status.textContent='يتم فتح المهمة...';
    const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:document.getElementById('url').value,maxPages:Number(document.getElementById('pages').value)})});
    const data=await response.json();
    if(!response.ok) throw Error(data.error||'تعذر بدء المهمة');
    while(true){
      await sleep(1200);
      const r=await fetch('/api/job/'+encodeURIComponent(data.id));
      const job=await r.json();
      status.textContent=job.progress||'قيد الفحص';
      if(job.state==='error') throw Error(job.error||'تعذر التحليل');
      if(job.state==='done') {
        const base='/reports/'+encodeURIComponent(data.id)+'/';
        document.getElementById('summary').textContent='تم توثيق '+job.pages+' صفحة. ابدأ من مخطط إعادة البناء.';
        document.getElementById('blueprint').href=base+'BLUEPRINT.md';
        document.getElementById('raw').href=base+'report.json';
        const report=await (await fetch(base+'report.json')).json();
        const screenshot=report.pages?.[0]?.screenshot;
        const shotLink=document.getElementById('screens');
        shotLink.hidden=!screenshot;
        if(screenshot) shotLink.href=base+encodeURIComponent(screenshot);
        result.hidden=false;break;
      }
    }
  }catch(e){status.textContent='خطأ: '+e.message;}
  finally{btn.disabled=false;}
});

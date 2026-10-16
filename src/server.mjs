import express from 'express';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { analyzeSite } from './analyzer.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const reportsPath = path.join(root, 'reports');
await mkdir(reportsPath, {recursive:true});
const app = express();
const jobs = new Map();
let current = null;
app.disable('x-powered-by');
app.use(express.json({limit:'4kb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");next();});
app.use(express.static(path.join(root,'public')));
app.use('/reports',express.static(reportsPath,{index:false,setHeaders(res){res.setHeader('Cache-Control','no-store');}}));
app.post('/api/analyze', (req,res) => {
  if (current) return res.status(429).json({error:'هناك تحليل جارٍ. انتظر انتهاءه.'});
  const {url,maxPages=4} = req.body || {};
  if (typeof url !== 'string' || url.length > 2048) return res.status(400).json({error:'ضع رابطًا صالحًا'});
  const id = randomUUID();
  const job = {id,state:'running',progress:'بدء التحليل',pages:0,error:null};
  jobs.set(id,job); current=id;
  res.status(202).json({id});
  analyzeSite({url,maxPages,outDir:path.join(reportsPath,id),onProgress:msg=>{job.progress=msg;}})
    .then(result=>{job.state='done';job.pages=result.pages.length;job.progress='جاهز';})
    .catch(err=>{job.state='error';job.error=err.message;})
    .finally(()=>{current=null;});
});
app.get('/api/job/:id',(req,res)=>{
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({error:'تقرير غير موجود'});
  res.json(job);
});
const port = Number(process.env.PORT||4317);
app.listen(port,'127.0.0.1',()=>console.log('CloneCraft Studio: http://127.0.0.1:'+port));

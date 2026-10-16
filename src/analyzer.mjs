import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePublicUrl, assertPublicHost, sameOriginPage, fileSlug } from './url-utils.mjs';
import { writeBlueprint } from './blueprint.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeSite({ url, maxPages = 4, outDir, onProgress = () => {} }) {
  const root = parsePublicUrl(url);
  await assertPublicHost(root);
  const limit = Math.min(15, Math.max(1, Number(maxPages) || 4));
  await mkdir(outDir, { recursive: true });
  const pages = [];
  const queue = [root.href], seen = new Set();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false });
    // Avoid writes, local/internal access, and third-party tracking. No authenticated browser state.
    await context.route('**/*', async route => {
      const request = route.request();
      if (request.method() !== 'GET') return route.abort();
      let requested;
      try { requested = parsePublicUrl(request.url()); await assertPublicHost(requested); }
      catch { return route.abort(); }
      if (request.resourceType() === 'websocket') return route.abort();
      // Cross-origin API endpoints are not needed for a structural inventory.
      if (requested.origin !== root.origin && ['xhr','fetch'].includes(request.resourceType())) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    while (queue.length && pages.length < limit) {
      const next = queue.shift();
      if (seen.has(next)) continue;
      seen.add(next);
      onProgress('فحص الصفحة '+(pages.length + 1)+' من '+limit+': '+next);
      try {
        const response = await page.goto(next, { waitUntil: 'domcontentloaded', timeout: 25000 });
        if (response && response.status() >= 400) throw new Error('HTTP '+response.status());
        // No clicks or logins; brief wait permits initial client rendering.
        await page.waitForTimeout(850);
        const finalUrl = page.url();
        if (!sameOriginPage(finalUrl, root)) throw new Error('الوجهة أعادت التوجيه إلى نطاق خارج الهدف');
        const data = await page.evaluate(() => {
          const clean = s => String(s ?? '').replace(/\s+/g,' ').trim().slice(0,240);
          const sample = (selector, limit, mapper) => [...document.querySelectorAll(selector)].slice(0,limit).map(mapper);
          const style = getComputedStyle(document.body);
          const box = el => {
            const b = el.getBoundingClientRect();
            return {x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height)};
          };
          return {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content ?? '',
            lang: document.documentElement.lang,
            theme: { fontFamily: style.fontFamily, backgroundColor: style.backgroundColor, color: style.color },
            headings: sample('h1,h2,h3',40,el=>({level:el.tagName.toLowerCase(),text:clean(el.textContent)})),
            buttons: sample('button,[role="button"],input[type="submit"]',80,el=>({label:clean(el.getAttribute('aria-label') || el.textContent || el.value),role:el.getAttribute('role')||el.tagName.toLowerCase(),box:box(el)})),
            inputs: sample('input,select,textarea',80,el=>({type:el.type||el.tagName.toLowerCase(),label:clean(el.getAttribute('aria-label')||el.placeholder||el.name),required:el.required||false,box:box(el)})),
            landmarks: sample('header,nav,main,aside,footer,section,article',35,el=>({kind:el.tagName.toLowerCase(),box:box(el)})),
            links: sample('a[href]',250,el=>({href:el.href,text:clean(el.textContent)}))
          };
        });
        const slug = fileSlug(next, pages.length);
        const screenshot = slug+'.png';
        await page.screenshot({path:path.join(outDir,screenshot), fullPage:true, animations:'disabled', timeout:15000});
        const entry = {url:finalUrl,screenshot,...data};
        pages.push(entry);
        for (const link of entry.links) {
          const nextHref = sameOriginPage(link.href, root);
          if (nextHref && !seen.has(nextHref) && !queue.includes(nextHref)) queue.push(nextHref);
        }
      } catch (err) {
        onProgress('تعذر فحص '+next+': '+err.message);
      }
      await sleep(450);
    }
    await context.close();
  } finally { await browser.close(); }
  if (!pages.length) throw new Error('لم تنجح قراءة أي صفحة. تحقق من الموقع والقيود ومواصفات المتصفح.');
  const report = {rootUrl:root.href,createdAt:new Date().toISOString(),pages,limitations:['public pages only','no source/server/database inference','no authentication or POST requests']};
  await writeFile(path.join(outDir,'report.json'),JSON.stringify(report,null,2),'utf8');
  await writeBlueprint(outDir);
  onProgress('اكتمل التقرير');
  return report;
}

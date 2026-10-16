import { resolve } from 'node:path';
import { analyzeSite } from './analyzer.mjs';
import { writeBlueprint } from './blueprint.mjs';

function option(name,fallback) {const i = process.argv.indexOf('--'+name);return i >= 0 ? process.argv[i+1] : fallback;}
const cmd = process.argv[2];
try {
  if (cmd === 'analyze') {
    const url = option('url');
    if (!url) throw new Error('استخدم --url https://example.com');
    const outDir = resolve(option('out','reports/latest'));
    const r = await analyzeSite({url,maxPages: Number(option('pages',4)),outDir,onProgress:console.log});
    console.log('فحص '+r.pages.length+' صفحة. التقرير: '+outDir+'/BLUEPRINT.md');
  } else if (cmd === 'blueprint') {
    console.log(await writeBlueprint(resolve(option('out','reports/latest'))));
  } else {
    console.log('الاستخدام:\n  npm run analyze -- --url https://example.com --pages 4 --out reports/test\n  npm run blueprint -- --out reports/test');
  }
} catch (err) {console.error(err.message);process.exitCode=1;}

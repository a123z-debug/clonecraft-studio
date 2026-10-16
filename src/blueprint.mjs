import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const safe = s => String(s ?? '').replaceAll('|','\\|').replaceAll('\n',' ').slice(0,200);

export function markdownBlueprint(report) {
  const pages = report.pages ?? [];
  let md = '# CloneCraft · خطة إعادة البناء\n\n';
  md += '**الرابط المرجعي:** ' + report.rootUrl + '\n\n';
  md += '**الصفحات المفحوصة:** '+pages.length+'  \n**تاريخ الفحص:** '+report.createdAt+'\n\n';
  md += '> هذا التقرير يصف معلومات ظاهرة للعامة فقط. لا يكشف الكود الخلفي أو قواعد البيانات أو أسرار التشغيل. يجب تطوير التنفيذ الجديد بصورة مستقلة مع احترام حقوق المحتوى والعلامات.\n\n';
  md += '## 1. خريطة الصفحات\n\n| الصفحة | العنوان | روابط | عناصر تفاعل |\n|---|---|---:|---:|\n';
  for (const p of pages) md += '| '+safe(p.url)+' | '+safe(p.title)+' | '+(p.links?.length ?? 0)+' | '+((p.buttons?.length ?? 0) + (p.inputs?.length ?? 0))+' |\n';
  md += '\n## 2. التصميم والوظائف الظاهرة\n\n';
  for (const p of pages) {
    md += '### '+safe(p.title || p.url)+'\n\n- المسار: '+p.url+'\n- الصورة: '+p.screenshot+'\n';
    md += '- الخط: '+safe(p.theme?.fontFamily)+'، خلفية: '+safe(p.theme?.backgroundColor)+'، لون نص: '+safe(p.theme?.color)+'\n';
    md += '- العناوين: '+((p.headings ?? []).slice(0,12).map(x => safe(x.text)).join('، ') || 'لا يوجد')+'\n';
    md += '- الأزرار: '+((p.buttons ?? []).slice(0,25).map(x => safe(x.label)).join('، ') || 'لا يوجد')+'\n';
    md += '- الحقول: '+((p.inputs ?? []).slice(0,25).map(x => safe(x.label || x.type)).join('، ') || 'لا يوجد')+'\n\n';
  }
  md += '## 3. ما لا يمكن استنتاجه من الموقع العام\n\n- بنية قاعدة البيانات الحقيقية ومحتوياتها.\n- خوارزميات الخادم غير المنشورة، والصلاحيات الداخلية والتكاملات السرية.\n- مسارات الدفع وتسجيل الدخول أو الوظائف المقيدة؛ تحتاج متطلبات ووثائق واختبارًا مصرحًا به.\n\n';
  md += '## 4. خطة التنفيذ المستقل\n\n';
  md += '1. تأكيد ملكية الهدف أو الإذن وسرد الصفحات المطلوبة.\n2. اعتماد نظام تصميم مستقل أو أصول مرخّصة.\n3. تنفيذ الواجهة وتجاوب الهاتف وسلوك العناصر.\n4. تعريف عقود API واستحداث خلفية وقاعدة بيانات وفق المتطلبات المتاحة، لا بالافتراض أنها المستخرجة من الهدف.\n5. إعداد اختبارات الوظائف وإمكانية الوصول والأداء.\n6. مقارنة لقطات الشاشة والتفاعلات وتحسين الفروقات يدويًا.\n7. مراجعة الأمان والحقوق قبل النشر.\n\n';
  md += '## 5. توجيه إلى Claude Code\n\n';
  md += 'اقرأ هذا التقرير وصور الصفحات وملف agents/CLAUDE.md. أنشئ موقعًا جديدًا من الصفر، بمكونات قابلة لإعادة الاستخدام، وبملفات اختبار واضحة. لا تعِد استخدام نصوص أو صور أو علامات محمية دون إذن، ولا تزعم معرفة الخدمات الخلفية غير المرئية. قدم قائمة بالاختلافات غير المحسومة والأدلة اللازمة لتطبيقها.\n';
  return md;
}

export async function writeBlueprint(dir) {
  const report = JSON.parse(await readFile(path.join(dir,'report.json'),'utf8'));
  const file = path.join(dir,'BLUEPRINT.md');
  await writeFile(file, markdownBlueprint(report),'utf8');
  return file;
}

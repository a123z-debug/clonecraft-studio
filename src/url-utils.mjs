import net from 'node:net';
import dns from 'node:dns/promises';

export function parsePublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('عنوان URL غير صالح'); }
  if (!['https:', 'http:'].includes(u.protocol)) throw new Error('المسموح HTTP وHTTPS فقط');
  if (u.username || u.password) throw new Error('روابط تحتوي بيانات دخول غير مسموحة');
  if (!u.hostname || u.hostname.length > 253) throw new Error('اسم المضيف غير صالح');
  if (u.port && !['80','443'].includes(u.port)) throw new Error('المنافذ غير القياسية محظورة');
  u.hash = '';
  return u;
}

export function isPublicIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const p = ip.split('.').map(Number);
    const [a,b,c] = p;
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 ||
      a === 192 && (b === 168 || b === 0 && c === 0) ||
      a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19) ||
      a === 192 && b === 88 && c === 99
    );
  }
  if (kind === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPublicIp(v.slice(7));
    return !(v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') ||
      /^fe[89ab]/.test(v) || v.startsWith('2001:db8:'));
  }
  return false;
}

export async function assertPublicHost(u) {
  const hostname = u.hostname.toLowerCase().replace(/\.$/, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.test')) {
    throw new Error('المضيف المحلي أو الخاص غير مسموح');
  }
  const matches = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!matches.length || matches.some(x => !isPublicIp(x.address))) {
    throw new Error('المضيف يُرجع عنوان شبكة خاصة أو غير صالح');
  }
  return true;
}

export function sameOriginPage(raw, root) {
  try {
    const url = parsePublicUrl(raw);
    if (url.origin !== root.origin) return null;
    if (/\.(?:pdf|zip|png|jpe?g|gif|svg|webp|mp4|mp3|woff2?|css|js)(?:$)/i.test(url.pathname)) return null;
    if (/(?:\/|^)(?:logout|signout|delete-account|reset-password)(?:\/|$)/i.test(url.pathname)) return null;
    url.search = '';
    return url.href;
  } catch { return null; }
}

export function fileSlug(u, i) {
  const path = new URL(u).pathname.replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '').slice(0,44);
  return String(i + 1).padStart(2, '0') + '-' + (path || 'home');
}

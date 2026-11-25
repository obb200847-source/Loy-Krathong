import { createHmac, timingSafeEqual } from 'node:crypto';

const cookieName = 'krathong_admin';
function sign(payload) { return createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url'); }
function cookie(req) { return (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1); }

export function isAdmin(req) {
  try {
    const [payload, signature] = decodeURIComponent(cookie(req) || '').split('.');
    if (!payload || !signature) return false;
    const expected = sign(payload);
    const a = Buffer.from(signature), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch { return false; }
}

export function setSession(res) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(`${payload}.${sign(payload)}`)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`);
}
export function clearSession(res) {
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`);
}
export function passwordMatches(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(expected);
  return !!expected && a.length === b.length && timingSafeEqual(a, b);
}
export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: 'กรุณาเข้าสู่ระบบผู้ดูแลก่อน' });
  return false;
}

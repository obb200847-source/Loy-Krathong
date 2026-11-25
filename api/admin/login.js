import { passwordMatches, setSession } from '../../lib/auth.js';
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'ไม่รองรับคำสั่งนี้' });
  if (!passwordMatches(req.body?.password)) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  setSession(res);
  return res.status(200).json({ ok: true });
}

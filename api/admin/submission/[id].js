import { deleteSubmission } from '../../../lib/data.js';
import { requireAdmin } from '../../../lib/auth.js';
export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'ไม่รองรับคำสั่งนี้' });
  if (!requireAdmin(req, res)) return;
  if (!/^[0-9a-f-]{36}$/i.test(req.query.id || '')) return res.status(400).json({ error: 'รหัสกระทงไม่ถูกต้อง' });
  try { await deleteSubmission(req.query.id); return res.status(200).json({ ok: true }); }
  catch { return res.status(500).json({ error: 'ลบกระทงไม่สำเร็จ' }); }
}

import { allSubmissions } from '../../lib/data.js';
import { requireAdmin } from '../../lib/auth.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'ไม่รองรับคำสั่งนี้' });
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await allSubmissions();
    return res.status(200).json(rows.map(({ id, name, createdAt }) => ({ id, name, createdAt, image: `/api/image/${id}` })));
  } catch { return res.status(500).json({ error: 'โหลดรายการกระทงไม่สำเร็จ' }); }
}

import { randomUUID } from 'node:crypto';
import { allSubmissions, imageData, saveSubmission } from '../lib/data.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const rows = await allSubmissions();
      return res.status(200).json(rows.map(({ id, name, createdAt }) => ({ id, name, createdAt, image: `/api/image/${id}` })));
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'ไม่รองรับคำสั่งนี้' });
    const name = String(req.body?.name || '').trim().slice(0, 80);
    if (!name) return res.status(400).json({ error: 'กรุณาตั้งชื่อกระทง' });
    const { type, bytes } = imageData(req.body?.image);
    const id = randomUUID();
    await saveSubmission(id, { name, createdAt: new Date().toISOString(), imageType: type, image: bytes.toString('base64') });
    return res.status(201).json({ id });
  } catch (error) { return res.status(400).json({ error: error.message || 'บันทึกกระทงไม่สำเร็จ' }); }
}

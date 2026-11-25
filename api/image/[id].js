import { readSubmission } from '../../lib/data.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' || !/^[0-9a-f-]{36}$/i.test(req.query.id || '')) return res.status(404).end();
  try {
    const item = await readSubmission(req.query.id);
    if (!item) return res.status(404).end();
    res.setHeader('Content-Type', item.imageType || 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(Buffer.from(item.image, 'base64'));
  } catch { return res.status(404).end(); }
}

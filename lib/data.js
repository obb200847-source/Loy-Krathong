import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { del, get, list, put } from '@vercel/blob';

const key = () => {
  const value = process.env.DATA_ENCRYPTION_KEY;
  if (!value) throw new Error('ตั้งค่า DATA_ENCRYPTION_KEY ใน Vercel ก่อน');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length !== 32) throw new Error('DATA_ENCRYPTION_KEY ต้องเป็น base64 ของคีย์ 32 ไบต์');
  return bytes;
};

export function encrypt(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.from('KRY1'), iv, cipher.getAuthTag(), encrypted]);
}

export function decrypt(input) {
  const data = Buffer.from(input);
  if (data.subarray(0, 4).toString() !== 'KRY1') throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
  const decipher = createDecipheriv('aes-256-gcm', key(), data.subarray(4, 16));
  decipher.setAuthTag(data.subarray(16, 32));
  return Buffer.concat([decipher.update(data.subarray(32)), decipher.final()]).toString('utf8');
}

export async function saveSubmission(id, value) {
  await put(`submissions/${id}.enc`, encrypt(JSON.stringify(value)), {
    access: 'private', contentType: 'application/octet-stream', addRandomSuffix: false,
    allowOverwrite: false
  });
}

export async function readSubmission(id) {
  const result = await get(`submissions/${id}.enc`, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  return JSON.parse(decrypt(bytes));
}

export async function allSubmissions() {
  const { blobs } = await list({ prefix: 'submissions/', limit: 1000 });
  const rows = await Promise.all(blobs.map(async blob => {
    const id = blob.pathname.split('/').pop().replace(/\.enc$/, '');
    try { return { id, ...(await readSubmission(id)) }; } catch { return null; }
  }));
  return rows.filter(Boolean).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deleteSubmission(id) {
  await del(`submissions/${id}.enc`, { access: 'private' });
}

export function imageData(value) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(value || '');
  if (!match) throw new Error('ไฟล์ภาพต้องเป็น PNG, JPG, WEBP หรือ GIF');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new Error('ขนาดภาพต้องไม่เกิน 2 MB');
  return { type: match[1], bytes };
}

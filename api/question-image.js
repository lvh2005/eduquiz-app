import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { isAdminAuthenticated, isAdminConfigured } from '../lib/admin-auth.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isAdminConfigured() && !isAdminAuthenticated(req)) {
    return res.status(401).json({ error: 'Cần đăng nhập admin để tải ảnh lên' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: 'Chưa cấu hình BLOB_READ_WRITE_TOKEN trên Vercel'
    });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  const extension = IMAGE_TYPES[contentType];
  if (!extension) {
    return res.status(415).json({ error: 'Định dạng ảnh không được hỗ trợ' });
  }

  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_SIZE_BYTES) {
    return res.status(413).json({ error: 'Mỗi ảnh phải nhỏ hơn 4 MB' });
  }

  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return res.status(413).json({ error: 'Mỗi ảnh phải nhỏ hơn 4 MB' });
      }
      chunks.push(chunk);
    }

    if (size === 0) {
      return res.status(400).json({ error: 'Ảnh tải lên đang trống' });
    }

    const blob = await put(
      `quiz-images/${randomUUID()}.${extension}`,
      Buffer.concat(chunks),
      {
        access: 'public',
        contentType,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        token,
      }
    );

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Question image upload failed:', error);
    return res.status(500).json({ error: 'Không thể lưu ảnh lên Vercel Blob' });
  }
}

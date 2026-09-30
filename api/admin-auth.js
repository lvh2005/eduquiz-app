import { clearAdminCookie, createAdminCookie, isAdminAuthenticated, isAdminConfigured, verifyAdminPassword } from '../lib/admin-auth.js';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!isAdminConfigured()) {
    return res.status(503).json({ error: 'Admin chưa được cấu hình trên server' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAdminAuthenticated(req) });
  }

  if (req.method === 'POST') {
    if (!verifyAdminPassword(req.body?.password)) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }
    res.setHeader('Set-Cookie', createAdminCookie());
    return res.status(200).json({ authenticated: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearAdminCookie());
    return res.status(200).json({ authenticated: false });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
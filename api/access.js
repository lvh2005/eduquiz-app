import { Redis } from '@upstash/redis';
import { isAdminAuthenticated } from '../lib/admin-auth.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ACCESS_CONFIG_KEY = 'eduquiz:config:access_pass';
const DEFAULT_PASS = '123456';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET Request
    if (req.method === 'GET') {
      // Admin lấy cấu hình đầy đủ (bao gồm mật khẩu)
      if (req.query.admin === '1') {
        if (!isAdminAuthenticated(req)) {
          return res.status(401).json({ error: 'Chưa đăng nhập quản trị' });
        }
        let config = await redis.get(ACCESS_CONFIG_KEY).catch(() => null);
        if (typeof config === 'string') {
          try { config = JSON.parse(config); } catch {}
        }
        if (!config) {
          config = { enabled: true, password: DEFAULT_PASS, updatedAt: new Date().toISOString() };
          try { await redis.set(ACCESS_CONFIG_KEY, JSON.stringify(config)); } catch (_) {}
        }
        return res.status(200).json(config);
      }

      // Người dùng học sinh / sinh viên: chỉ kiểm tra xem có yêu cầu pass không
      let config = await redis.get(ACCESS_CONFIG_KEY).catch(() => null);
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch {}
      }
      if (!config) {
        config = { enabled: true, password: DEFAULT_PASS, updatedAt: new Date().toISOString() };
        try { await redis.set(ACCESS_CONFIG_KEY, JSON.stringify(config)); } catch (_) {}
      }

      return res.status(200).json({ required: Boolean(config.enabled) });
    }

    // 2. POST Request
    if (req.method === 'POST') {
      // A. Admin lưu cấu hình mật khẩu
      if (req.query.action === 'save_config') {
        if (!isAdminAuthenticated(req)) {
          return res.status(401).json({ error: 'Chưa đăng nhập quản trị' });
        }
        const { enabled, password } = req.body || {};
        const isEnabled = Boolean(enabled);
        const pass = String(password || '').trim();

        if (isEnabled && !pass) {
          return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hợp lệ khi kích hoạt bảo vệ' });
        }

        const newConfig = {
          enabled: isEnabled,
          password: pass || DEFAULT_PASS,
          updatedAt: new Date().toISOString(),
        };

        await redis.set(ACCESS_CONFIG_KEY, JSON.stringify(newConfig));
        return res.status(200).json({ success: true, config: newConfig });
      }

      // B. Xác thực mật khẩu khi vào học
      const submittedPassword = String(req.body?.password || '').trim();
      let config = await redis.get(ACCESS_CONFIG_KEY).catch(() => null);
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch {}
      }
      if (!config) {
        config = { enabled: true, password: DEFAULT_PASS };
      }

      if (!config.enabled) {
        return res.status(200).json({ success: true, required: false });
      }

      if (submittedPassword && submittedPassword === config.password) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ success: false, error: 'Mật khẩu vào học không chính xác' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Access API Error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi hệ thống xác thực' });
  }
}

import { Redis } from '@upstash/redis';
import { isAdminAuthenticated } from '../lib/admin-auth.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const PRESENCE_KEY = 'eduquiz:presence:online';
const ACTIVE_WINDOW_MS = 120_000;
const SESSION_TTL_SECONDS = 180;

function parseRecord(value) {
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function validLocation(location) {
  return location && Number.isFinite(location.latitude) && location.latitude >= -90 && location.latitude <= 90
    && Number.isFinite(location.longitude) && location.longitude >= -180 && location.longitude <= 180
    && Number.isFinite(location.accuracy) && location.accuracy >= 0;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { sessionId, location } = req.body || {};
      if (typeof sessionId !== 'string' || !/^[a-f0-9-]{36}$/i.test(sessionId)) {
        return res.status(400).json({ error: 'Mã phiên không hợp lệ' });
      }
      if (location !== undefined && location !== null && !validLocation(location)) {
        return res.status(400).json({ error: 'Tọa độ không hợp lệ' });
      }

      // Tự động nhận diện vị trí qua IP (Vercel IP Geolocation) không cần xin quyền / không hiện popup
      const rawCity = req.headers['x-vercel-ip-city'];
      const city = rawCity ? decodeURIComponent(rawCity) : '';
      const region = req.headers['x-vercel-ip-country-region'] || '';
      const country = req.headers['x-vercel-ip-country'] || 'VN';
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
      const ipLat = parseFloat(req.headers['x-vercel-ip-latitude']) || null;
      const ipLon = parseFloat(req.headers['x-vercel-ip-longitude']) || null;

      let autoLabel = '';
      if (city) {
        autoLabel = `${city}${region ? ', ' + region : ''} (${country})`;
      } else if (ip) {
        autoLabel = `IP: ${ip}`;
      }

      const now = Date.now();
      const sessionKey = `eduquiz:presence:session:${sessionId}`;
      const previous = parseRecord(await redis.get(sessionKey));

      let effectiveLocation = location;
      if (!effectiveLocation && previous?.location) {
        effectiveLocation = previous.location;
      }
      if (!effectiveLocation && autoLabel) {
        effectiveLocation = {
          label: autoLabel,
          latitude: ipLat,
          longitude: ipLon,
          isIp: true
        };
      }

      const record = {
        lastSeen: now,
        ip,
        location: effectiveLocation || null,
      };

      await Promise.all([
        redis.zadd(PRESENCE_KEY, { score: now, member: sessionId }),
        redis.set(sessionKey, JSON.stringify(record), { ex: SESSION_TTL_SECONDS }),
        redis.expire(PRESENCE_KEY, SESSION_TTL_SECONDS),
      ]);
      return res.status(200).json({ success: true, location: effectiveLocation });
    }

    if (req.method === 'GET') {
      if (!isAdminAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

      const now = Date.now();
      await redis.zremrangebyscore(PRESENCE_KEY, 0, now - ACTIVE_WINDOW_MS);
      const sessionIds = await redis.zrange(PRESENCE_KEY, 0, -1);
      const sessions = (await Promise.all(sessionIds.map(async sessionId => {
        const record = parseRecord(await redis.get(`eduquiz:presence:session:${sessionId}`));
        return record ? { lastSeen: record.lastSeen, location: record.location || null } : null;
      }))).filter(Boolean);

      return res.status(200).json({ count: sessions.length, sessions });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Presence API error:', error);
    return res.status(500).json({ error: 'Không thể tải trạng thái online' });
  }
}
import { Redis } from '@upstash/redis';

// Khởi tạo Redis client từ biến môi trường của Upstash trên Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

  const { id = 'hubt_csdl_2tc' } = req.query;
  const redisKey = `eduquiz:exam:${id}`;

  try {
    // 1. Lấy dữ liệu đề thi
    if (req.method === 'GET') {
      const data = await redis.get(redisKey);
      if (!data) {
        return res.status(404).json({ error: 'Chưa có đề thi nào được tạo' });
      }
      return res.status(200).json(typeof data === 'string' ? JSON.parse(data) : data);
    }

    // 2. Lưu / Cập nhật đề thi mới
    if (req.method === 'POST') {
      const { title, questions } = req.body;
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Dữ liệu questions không hợp lệ' });
      }

      const examPayload = {
        id,
        title: title || 'Bộ đề trắc nghiệm CSDL',
        updatedAt: new Date().toISOString(),
        questions,
      };

      await redis.set(redisKey, JSON.stringify(examPayload));
      return res.status(200).json({ success: true, count: questions.length, exam: examPayload });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
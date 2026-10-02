import { Redis } from '@upstash/redis';
import { isAdminAuthenticated, isAdminConfigured } from '../lib/admin-auth.js';

// Khởi tạo Redis client từ biến môi trường của Upstash trên Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (['POST', 'DELETE'].includes(req.method) && isAdminConfigured() && !isAdminAuthenticated(req)) {
    return res.status(401).json({ error: 'Cần đăng nhập admin để thay đổi đề thi' });
  }

  const { id = 'hubt_csdl_2tc' } = req.query;
  const redisKey = `eduquiz:exam:${id}`;

  try {
    // 1. Lấy dữ liệu đề thi kèm thống kê lượt thi thật
    if (req.method === 'GET') {
      const statsKey = `eduquiz:stats:${id}`;
      const [data, rawStats] = await Promise.all([
        redis.get(redisKey),
        redis.get(statsKey).catch(() => null)
      ]);

      if (!data) {
        return res.status(404).json({ error: 'Chưa có đề thi nào được tạo' });
      }

      const examData = typeof data === 'string' ? JSON.parse(data) : data;
      examData.stats = rawStats ? (typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats) : {};
      return res.status(200).json(examData);
    }

    // 2. Ghi nhận lượt thi thật khi người dùng nộp bài / luyện tập
    if (req.method === 'POST' && req.query.action === 'attempt') {
      const subject = String(req.body?.subject || req.query.subject || 'all').trim();
      const statsKey = `eduquiz:stats:${id}`;
      const rawStats = await redis.get(statsKey).catch(() => null);
      const currentStats = rawStats ? (typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats) : {};

      if (!currentStats[subject]) {
        currentStats[subject] = { attempts: 0, views: 0 };
      }
      currentStats[subject].attempts = (currentStats[subject].attempts || 0) + 1;
      await redis.set(statsKey, JSON.stringify(currentStats));
      return res.status(200).json({ success: true, stats: currentStats });
    }

    // 3. Lưu / Cập nhật đề thi mới
    if (req.method === 'POST') {
      const { title, subject, questions } = req.body;
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Dữ liệu questions không hợp lệ' });
      }

      const incomingSubject = subject || questions.find(question => question.subject)?.subject || title || 'Chưa đặt môn';
      const currentData = await redis.get(redisKey);
      const currentExam = currentData ? (typeof currentData === 'string' ? JSON.parse(currentData) : currentData) : null;
      const currentQuestions = currentExam?.questions || [];
      const currentSubject = currentExam?.subject || currentExam?.title || 'Chưa đặt môn';
      const normalizedQuestions = currentQuestions.map(question => ({
        ...question,
        subject: question.subject || currentSubject,
      }));
      const retainedQuestions = normalizedQuestions.filter(question => question.subject !== incomingSubject);

      const examPayload = {
        id,
        title: currentExam?.title || title || 'Bộ đề trắc nghiệm CSDL',
        subject: incomingSubject,
        subjects: Array.from(new Set([...retainedQuestions, ...questions].map(question => question.subject || incomingSubject))),
        updatedAt: new Date().toISOString(),
        questions: [...retainedQuestions, ...questions],
      };

      await redis.set(redisKey, JSON.stringify(examPayload));
      return res.status(200).json({ success: true, count: questions.length, total: examPayload.questions.length, exam: examPayload });
    }

    if (req.method === 'DELETE') {
      const subject = String(req.query.subject || '').trim();
      if (!subject) return res.status(400).json({ error: 'Thiếu tên môn cần xóa' });

      const currentData = await redis.get(redisKey);
      const currentExam = currentData ? (typeof currentData === 'string' ? JSON.parse(currentData) : currentData) : null;
      if (!currentExam) return res.status(404).json({ error: 'Chưa có đề thi' });

      const questions = (currentExam.questions || []).filter(question => (question.subject || currentExam.subject) !== subject);
      const subjects = Array.from(new Set(questions.map(question => question.subject).filter(Boolean)));
      const examPayload = { ...currentExam, subject: subjects[0] || '', subjects, questions, updatedAt: new Date().toISOString() };
      await redis.set(redisKey, JSON.stringify(examPayload));
      return res.status(200).json({ success: true, count: questions.length, exam: examPayload });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
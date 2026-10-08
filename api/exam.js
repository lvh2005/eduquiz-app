import { Redis } from '@upstash/redis';
import { isAdminAuthenticated, isAdminConfigured } from '../lib/admin-auth.js';

// Khởi tạo Redis client từ biến môi trường của Upstash trên Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

import { DEFAULT_EXAM } from '../lib/default-exam.js';

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
      let data = null;
      let rawStats = null;

      try {
        [data, rawStats] = await Promise.all([
          redis.get(redisKey),
          redis.get(statsKey).catch(() => null)
        ]);
      } catch (redisErr) {
        console.warn('Redis query failed:', redisErr);
      }

      let examData;
      const isKtm = (str) => {
        const s = (str || '').trim().toLowerCase();
        return s.includes('kế toán máy') || s.includes('ketoanmay') || s.includes('hệ thống kế toán máy');
      };
      const isMnm = (str) => {
        const s = (str || '').trim().toLowerCase();
        return s.includes('mã nguồn mở') || s.includes('manguonmo') || s.includes('ma nguon mo');
      };

      if (!data) {
        examData = {
          id,
          title: 'Bộ đề trắc nghiệm HUBT',
          subject: '',
          subjects: [],
          updatedAt: new Date().toISOString(),
          questions: Array.isArray(DEFAULT_EXAM) ? DEFAULT_EXAM.filter(q => !isMnm(q.subject) && !isMnm(q.q)) : [],
        };
        try { await redis.set(redisKey, JSON.stringify(examData)); } catch (_) {}
      } else {
        examData = typeof data === 'string' ? JSON.parse(data) : data;
        let currentQuestions = Array.isArray(examData.questions) ? examData.questions : [];

        // Lọc bỏ triệt để toàn bộ câu hỏi và môn thi liên quan đến Kế toán máy và Mã nguồn mở
        let cleanedQuestions = currentQuestions.filter(q =>
          !isKtm(q.subject) && !isKtm(q.title) && !isKtm(q.q) &&
          !isMnm(q.subject) && !isMnm(q.title) && !isMnm(q.q)
        );
        let cleanedSubjects = (examData.subjects || []).filter(sub => !isKtm(sub) && !isMnm(sub));

        if (cleanedQuestions.length === 0 && DEFAULT_EXAM.length > 0) {
          cleanedQuestions = DEFAULT_EXAM.filter(q => !isKtm(q.subject) && !isMnm(q.subject) && !isMnm(q.q));
          cleanedSubjects = Array.from(new Set(cleanedQuestions.map(q => q.subject).filter(Boolean)));
        }

        const hasChanged = cleanedQuestions.length !== currentQuestions.length ||
                           (examData.subjects && cleanedSubjects.length !== examData.subjects.length) ||
                           isKtm(examData.title) || isKtm(examData.subject) ||
                           isMnm(examData.title) || isMnm(examData.subject);

        if (hasChanged) {
          examData.questions = cleanedQuestions;
          examData.subjects = cleanedSubjects;
          examData.subject = cleanedSubjects[0] || (cleanedQuestions[0]?.subject) || '';
          if (isKtm(examData.title) || isMnm(examData.title) || !examData.title) {
            examData.title = examData.subject || 'Bộ đề trắc nghiệm HUBT';
          }
          try { await redis.set(redisKey, JSON.stringify(examData)); } catch (_) {}
        }
      }

      // Xử lý thống kê lượt thi: lọc bỏ môn kế toán máy và mã nguồn mở
      let parsedStats = rawStats ? (typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats) : {};
      let statsChanged = false;
      for (const key of Object.keys(parsedStats)) {
        if (isKtm(key) || isMnm(key)) {
          delete parsedStats[key];
          statsChanged = true;
        }
      }
      if (statsChanged) {
        try { await redis.set(statsKey, JSON.stringify(parsedStats)); } catch (_) {}
      }

      examData.stats = parsedStats;
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
      const { title, subject, questions, sourceQuestionCount } = req.body;
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Dữ liệu questions không hợp lệ' });
      }
      if (sourceQuestionCount !== undefined &&
          (!Number.isInteger(sourceQuestionCount) || sourceQuestionCount !== questions.length)) {
        return res.status(400).json({
          error: `Số câu trong file không khớp với dữ liệu nhận được (${questions.length} câu)`
        });
      }
      const invalidQuestionIndex = questions.findIndex(question => {
        const answerIndex = question?.c ?? question?.correct;
        return typeof question?.q !== 'string' ||
          !question.q.trim() ||
          !Array.isArray(question.a) ||
          question.a.length < 2 ||
          !Number.isInteger(answerIndex) ||
          answerIndex < 0 ||
          answerIndex >= question.a.length;
      });
      if (invalidQuestionIndex >= 0) {
        return res.status(400).json({
          error: `Câu ${invalidQuestionIndex + 1} thiếu nội dung, phương án hoặc đáp án đúng hợp lệ`
        });
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
      const isMnmPost = (str) => {
        const s = (str || '').trim().toLowerCase();
        return s.includes('mã nguồn mở') || s.includes('manguonmo') || s.includes('ma nguon mo');
      };
      const retainedQuestions = normalizedQuestions.filter(question => question.subject !== incomingSubject && !isMnmPost(question.subject) && !isMnmPost(question.q));
      const cleanTitle = (currentExam?.title && !isMnmPost(currentExam.title) && !currentExam.title.toLowerCase().includes('kế toán máy'))
        ? currentExam.title
        : (incomingSubject && !isMnmPost(incomingSubject) ? incomingSubject : 'Bộ đề trắc nghiệm HUBT');

      const examPayload = {
        id,
        title: cleanTitle,
        subject: incomingSubject,
        subjects: Array.from(new Set([...retainedQuestions, ...questions].map(question => question.subject || incomingSubject).filter(s => s && !isMnmPost(s)))),
        updatedAt: new Date().toISOString(),
        questions: [...retainedQuestions, ...questions].filter(q => !isMnmPost(q.subject) && !isMnmPost(q.q)),
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

      const isMnmDel = (str) => {
        const s = (str || '').trim().toLowerCase();
        return s.includes('mã nguồn mở') || s.includes('manguonmo') || s.includes('ma nguon mo');
      };

      const questions = (currentExam.questions || []).filter(question =>
        (question.subject || currentExam.subject) !== subject &&
        !isMnmDel(question.subject) &&
        !isMnmDel(question.q)
      );
      const subjects = Array.from(new Set(questions.map(question => question.subject).filter(s => s && !isMnmDel(s))));
      const cleanTitle = (currentExam.title && !isMnmDel(currentExam.title) && currentExam.title !== subject) ? currentExam.title : (subjects[0] || 'Bộ đề trắc nghiệm HUBT');
      const examPayload = { ...currentExam, title: cleanTitle, subject: subjects[0] || '', subjects, questions, updatedAt: new Date().toISOString() };
      await redis.set(redisKey, JSON.stringify(examPayload));
      return res.status(200).json({ success: true, count: questions.length, exam: examPayload });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
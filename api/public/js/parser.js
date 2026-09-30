// Phân tích văn bản thô ra JSON câu hỏi
function parseQuizText(fullText) {
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions = [];
  let currentPart = 1;
  let current = null;

  const qRegex = /^(?:câu|cau)\s*(\d+)[\s*:\.\-\)](.*)$/i;
  const partRegex = /^(?:phần|phan|part)\s*(\d+)/i;
  const optRegex = /^(\*|\[x\])?\s*([A-Da-d])[\.\:\-\)](.*)$/;

  lines.forEach(line => {
    const partMatch = line.match(partRegex);
    if (partMatch) {
      currentPart = parseInt(partMatch[1]) || 1;
      return;
    }

    const qMatch = line.match(qRegex);
    if (qMatch) {
      if (current && current.a.length >= 2) questions.push(current);
      current = {
        id: questions.length + 1,
        part: currentPart,
        q: qMatch[2].trim() || `Câu ${qMatch[1]}`,
        a: [],
        c: 0
      };
      return;
    }

    const optMatch = line.match(optRegex);
    if (optMatch && current) {
      const isCorrect = Boolean(optMatch[1]);
      current.a.push(optMatch[3].trim());
      if (isCorrect) current.c = current.a.length - 1;
      return;
    }

    if (current) {
      if (current.a.length === 0) current.q += ' ' + line;
      else current.a[current.a.length - 1] += ' ' + line;
    }
  });

  if (current && current.a.length >= 2) questions.push(current);
  return questions;
}

// Đọc file .docx trực tiếp trên browser bằng mammoth
async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
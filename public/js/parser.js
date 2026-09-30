// Phân tích văn bản thô ra JSON câu hỏi kèm cảnh báo dữ liệu lỗi
function parseQuizTextDetailed(fullText) {
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions = [];
  const diagnostics = [];
  let currentPart = 1;
  let current = null;

  const qRegex = /^(?:câu|cau)\s*(\d+)[\s*:\.\-\)](.*)$/i;
  const partRegex = /^(?:phần|phan|part)\s*(\d+)/i;
  const optRegex = /^(\*|\[x\])?\s*(?:\(([A-Da-d])\)|\[([A-Da-d])\]|([A-Da-d])[\.\:\-\)\]])\s*(.*)$/;

  const finishCurrent = () => {
    if (!current) return;
    if (current.a.length >= 2) {
      questions.push(current);
    } else {
      diagnostics.push(`Câu ${current.sourceNumber} chỉ có ${current.a.length} phương án`);
    }
  };

  lines.forEach(line => {
    const partMatch = line.match(partRegex);
    if (partMatch) {
      currentPart = parseInt(partMatch[1]) || 1;
      return;
    }

    const qMatch = line.match(qRegex);
    if (qMatch) {
      finishCurrent();
      current = {
        id: questions.length + 1,
        sourceNumber: Number(qMatch[1]),
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
      current.a.push(optMatch[5].trim());
      if (isCorrect) current.c = current.a.length - 1;
      return;
    }

    if (current) {
      if (current.a.length === 0) current.q += ' ' + line;
      else current.a[current.a.length - 1] += ' ' + line;
    }
  });

  finishCurrent();

  const sourceNumbers = questions.map(question => question.sourceNumber);
  sourceNumbers.forEach((number, index) => {
    const previous = sourceNumbers[index - 1];
    if (index > 0 && number > previous + 1) {
      diagnostics.push(`Thiếu hoặc sai thứ tự giữa câu ${previous} và câu ${number}`);
    }
  });

  if (/[�]|(?:Ã.|Â.|Ä.|Æ.|á»|â€)/.test(fullText)) {
    diagnostics.push('Có ký tự nghi bị lỗi mã hóa tiếng Việt (ví dụ: �, Ã, Â, á»...)');
  }

  const delimiterPairs = [['(', ')'], ['[', ']']];
  delimiterPairs.forEach(([opening, closing]) => {
    const openingCount = [...fullText].filter(character => character === opening).length;
    const closingCount = [...fullText].filter(character => character === closing).length;
    if (openingCount !== closingCount) {
      diagnostics.push(`Số dấu ${opening} và ${closing} không khớp (${openingCount}/${closingCount})`);
    }
  });

  return { questions, diagnostics };
}

function parseQuizText(fullText) {
  return parseQuizTextDetailed(fullText).questions;
}

// Đọc file .docx trực tiếp trên browser bằng mammoth
async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

// Build complete parser
function parseAll() {
  const questions = [];
  let currentSection = "Phần 3"; // default section as per prompt
  let currentQ = null;
  let currentOptions = [];
  let pendingImages = [];

  // Map of question numbers to images based on figures
  // Câu 56-63: Hình 01 -> IMAGE_1
  // Câu 64-72: Hình 02 -> IMAGE_2
  // Câu 73-78: Hình 03 -> IMAGE_3
  // Câu 80-93: Hình 05 -> IMAGE_4
  // Câu 94-100: Hình 06 -> IMAGE_5

  for (let i = 0; i < mnm1Paras.length; i++) {
    const item = mnm1Paras[i];
    let raw = item.text.trim();
    const images = item.images;

    // Check section
    const secMatch = raw.match(/\[BOLD:(Phần\s*\d+)\]/i) || raw.match(/^(Phần\s*\d+)/i);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }

    // Check Question start
    // Patterns:
    // [BOLD:Câu 56. Nhìn vào hình 01...]
    // [BOLD:Câu 56: ...]
    // Câu 56. ...
    const cleanLine = raw.replace(/\[BOLD:(.*?)\]/g, '$1').trim();
    const qMatch = cleanLine.match(/^Câu\s*(\d+)[\.\:](?:\s*\(.*?\))?\s*(.*)$/i);

    if (qMatch) {
      if (currentQ) {
        finalizeQ(currentQ, currentOptions);
        questions.push(currentQ);
      }

      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();

      currentQ = {
        question_number: qNum,
        raw_text: qText,
        section: currentSection,
        question_type: "SINGLE_CHOICE",
        images: [],
        options: [],
        correct_answer: null,
        explanation: ""
      };
      currentOptions = [];
      continue;
    }

    if (currentQ) {
      // Ignore "Hình minh họa..." lines
      if (/^Hình minh họa/i.test(cleanLine)) {
        continue;
      }

      // Check if option line:
      // Examples:
      // "A. Được đưa ra dựa trên copyright"
      // "[BOLD:✓ D. Tồn tại giấp phép...]"
      // "✓ A. Free BSD"
      // "[BOLD:A. 1]"
      // "✓ F. Tất cả các đáp án"
      const optMatch = raw.match(/^(?:\[BOLD:)?\s*(✓|✔|\*|\[x\])?\s*([A-H])[\.\:\)]\s*(.*)$/i);
      
      // Also some options might not have [A-H]. but just text if format is weird? Let's check.
      if (optMatch) {
        let hasTick = Boolean(optMatch[1]) || raw.includes('✓') || raw.includes('✔') || raw.includes('*') || raw.includes('[x]');
        let key = optMatch[2].toUpperCase();
        let optText = optMatch[3]
          .replace(/\[BOLD:(.*?)\]/g, '$1')
          .replace(/^[✓✔\*\[\]x\s]+/, '')
          .replace(/\]$/, '')
          .replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '') // strip TB(12)=...
          .trim();

        currentOptions.push({
          key: key,
          text: optText,
          is_correct: hasTick
        });
      } else if (cleanLine.length > 0 && currentOptions.length === 0) {
        // Multi-line question text
        currentQ.raw_text += " " + cleanLine;
      } else if (cleanLine.length > 0 && currentOptions.length > 0) {
        // Multi-line option text
        const lastOpt = currentOptions[currentOptions.length - 1];
        lastOpt.text += " " + cleanLine.replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '').trim();
      }
    }
  }

  if (currentQ) {
    finalizeQ(currentQ, currentOptions);
    questions.push(currentQ);
  }

  return questions;
}

function finalizeQ(q, options) {
  let num = q.question_number;
  let images = [];

  // Assign image placeholder based on figure reference or question number
  // In the docx:
  // Câu 56-63: Nhìn vào hình 01 -> [IMAGE_1]
  // Câu 64-72: Nhìn vào hình 02 -> [IMAGE_2]
  // Câu 73-78: Nhìn vào hình 03 -> [IMAGE_3]
  // Câu 80-93: Nhìn vào hình 05 -> [IMAGE_4]
  // Câu 94-100: Nhìn vào hình 06 -> [IMAGE_5]

  if (num >= 56 && num <= 63) {
    images = ["IMAGE_1"];
  } else if (num >= 64 && num <= 72) {
    images = ["IMAGE_2"];
  } else if (num >= 73 && num <= 78) {
    images = ["IMAGE_3"];
  } else if (num >= 80 && num <= 93) {
    images = ["IMAGE_4"];
  } else if (num >= 94 && num <= 100) {
    images = ["IMAGE_5"];
  }

  let text = q.raw_text;
  for (let img of images) {
    if (!text.includes(`[${img}]`)) {
      text = `${text} [${img}]`;
    }
  }

  q.question_text = text.trim();
  delete q.raw_text;
  q.images = images;
  q.options = options;

  const correct = options.filter(o => o.is_correct);
  if (correct.length === 1) {
    q.correct_answer = correct[0].key;
    q.question_type = "SINGLE_CHOICE";
  } else if (correct.length > 1) {
    q.correct_answer = correct.map(o => o.key).join(',');
    q.question_type = "MULTIPLE_CHOICE";
  } else {
    q.correct_answer = null;
    q.question_type = "SINGLE_CHOICE";
  }
}

const res = parseAll();
console.log(`Parsed ${res.length} questions.`);

// Validate every question
let errors = [];
res.forEach(q => {
  if (!q.options || q.options.length < 2) {
    errors.push(`Q${q.question_number} has less than 2 options (${q.options.length})`);
  }
  if (!q.correct_answer) {
    errors.push(`Q${q.question_number} has no correct answer`);
  }
  if (!q.question_text) {
    errors.push(`Q${q.question_number} has no text`);
  }
});

console.log('Validation errors:', errors);
fs.writeFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/parsed_quiz.json', JSON.stringify(res, null, 2), 'utf8');

import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

function cleanTypo(str) {
  if (!str) return '';
  return str
    .replace(/đ-ợc/g, 'được')
    .replace(/ng-ời/g, 'người')
    .replace(/nh-\s+/g, 'như ')
    .replace(/ch-ơng/g, 'chương')
    .replace(/h-ởng/g, 'hưởng')
    .replace(/t-ơng/g, 'tương')
    .replace(/th-ơng/g, 'thương')
    .replace(/l-u/g, 'lưu')
    .replace(/b-ớc/g, 'bước')
    .replace(/h-ớng/g, 'hướng')
    .replace(/tr-ớc/g, 'trước')
    .replace(/ph-ơng/g, 'phương')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMnm1() {
  const questions = [];
  let currentSection = "Phần 3";
  let currentQ = null;
  let currentOptions = [];

  for (let i = 0; i < mnm1Paras.length; i++) {
    const item = mnm1Paras[i];
    let raw = item.text.trim();

    const secMatch = raw.match(/\[BOLD:(Phần\s*\d+)\]/i) || raw.match(/^(Phần\s*\d+)/i);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }

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
      if (/^Hình minh họa/i.test(cleanLine)) {
        continue;
      }

      const optMatch = raw.match(/^(?:\[BOLD:)?\s*(✓|✔|\*|\[x\])?\s*([A-H])[\.\:\)]\s*(.*)$/i);
      if (optMatch) {
        let hasTick = Boolean(optMatch[1]) || raw.includes('✓') || raw.includes('✔') || raw.includes('*') || raw.includes('[x]');
        let key = optMatch[2].toUpperCase();
        let optText = optMatch[3]
          .replace(/\[BOLD:(.*?)\]/g, '$1')
          .replace(/^[✓✔\*\[\]x\s]+/, '')
          .replace(/\]$/, '')
          .replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '')
          .trim();

        currentOptions.push({
          key: key,
          text: cleanTypo(optText),
          is_correct: hasTick
        });
      } else if (cleanLine.length > 0 && currentOptions.length === 0) {
        currentQ.raw_text += " " + cleanLine;
      } else if (cleanLine.length > 0 && currentOptions.length > 0) {
        const lastOpt = currentOptions[currentOptions.length - 1];
        lastOpt.text = cleanTypo(lastOpt.text + " " + cleanLine.replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '').trim());
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

  let text = cleanTypo(q.raw_text);
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

const finalQuiz = parseMnm1();
fs.writeFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/final_quiz.json', JSON.stringify(finalQuiz, null, 2), 'utf8');

// Ensure public/data directory exists and save there too for the web application
if (!fs.existsSync('c:/Users/LEVUHA/Desktop/eduquiz-app/public/data')) {
  fs.mkdirSync('c:/Users/LEVUHA/Desktop/eduquiz-app/public/data', { recursive: true });
}
fs.writeFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/public/data/quiz.json', JSON.stringify(finalQuiz, null, 2), 'utf8');

console.log('Final quiz built successfully:', finalQuiz.length, 'questions.');

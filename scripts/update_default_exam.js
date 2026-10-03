import fs from 'fs';

const finalQuiz = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/final_quiz.json', 'utf8'));

// The app expects questions in format:
// {
//   id: number,
//   sourceNumber: number,
//   subject: string,
//   q: string,
//   a: string[],
//   c: number, // 0-based index of correct answer
//   options: string[], // "A. ...", "B. ..."
//   correct: number,
//   image: string | null // e.g. "/images/IMAGE_1.png" or base64
// }

const examQuestions = finalQuiz.map((item, idx) => {
  const optionsTexts = item.options.map(o => o.text);
  const optionsWithPrefix = item.options.map(o => `${o.key}. ${o.text}`);
  const correctIdx = item.options.findIndex(o => o.is_correct);

  let imagePath = null;
  if (item.images && item.images.length > 0) {
    imagePath = `/images/${item.images[0]}.png`;
  }

  return {
    id: idx + 1,
    sourceNumber: item.question_number,
    part: 1,
    subject: "Mã nguồn mở",
    q: item.question_text.replace(/\s*\[IMAGE_\d+\]/g, '').trim(),
    a: optionsTexts,
    c: correctIdx >= 0 ? correctIdx : 0,
    options: optionsWithPrefix,
    correct: correctIdx >= 0 ? correctIdx : 0,
    image: imagePath
  };
});

const defaultExamContent = `export const DEFAULT_EXAM = ${JSON.stringify(examQuestions, null, 2)};\n`;
fs.writeFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/lib/default-exam.js', defaultExamContent, 'utf8');

console.log('Updated lib/default-exam.js with', examQuestions.length, 'questions. File size:', defaultExamContent.length, 'bytes');

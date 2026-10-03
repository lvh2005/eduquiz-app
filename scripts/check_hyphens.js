import fs from 'fs';

const quiz = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/parsed_quiz.json', 'utf8'));

let matches = new Set();
const hyphenRegex = /\b\w+[\-\—\–]\w+\b/g;

function scanText(t) {
  let m;
  while ((m = hyphenRegex.exec(t)) !== null) {
    matches.add(m[0]);
  }
}

quiz.forEach(q => {
  scanText(q.question_text);
  q.options.forEach(o => scanText(o.text));
});

console.log('Hyphenated words found:', Array.from(matches));

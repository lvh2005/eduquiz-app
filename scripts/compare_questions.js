import fs from 'fs';

const mnmParas = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm_paras.json', 'utf8'));
const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

// Extract questions from mnm
let mnmQ = [];
for (let p of mnmParas) {
  const m = p.text.match(/Câu\s*(\d+)[\:\.]\s*(.*)/i);
  if (m) {
    mnmQ.push({ num: parseInt(m[1]), text: m[2] });
  }
}

// Extract questions from mnm1
let mnm1Q = [];
for (let p of mnm1Paras) {
  const clean = p.text.replace(/\[BOLD:(.*?)\]/g, '$1');
  const m = clean.match(/Câu\s*(\d+)[\:\.]\s*(.*)/i);
  if (m) {
    mnm1Q.push({ num: parseInt(m[1]), text: m[2] });
  }
}

console.log('mnm unique questions:', mnmQ.length, 'mnm1 unique questions:', mnm1Q.length);
console.log('mnm1 question numbers range:', mnm1Q[0]?.num, 'to', mnm1Q[mnm1Q.length - 1]?.num);
console.log('mnm question numbers sample:', mnmQ.slice(0, 10));

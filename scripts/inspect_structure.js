import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

// Let's inspect all lines in mnm1Paras
console.log('Total paras:', mnm1Paras.length);

for (let i = 0; i < mnm1Paras.length; i++) {
  const p = mnm1Paras[i];
  if (p.text.includes('Phần') || /câu\s*\d+/i.test(p.text)) {
    console.log(`P${i}: ${p.text}`);
  }
}

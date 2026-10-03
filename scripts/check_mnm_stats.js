import fs from 'fs';

const mnmParas = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm_paras.json', 'utf8'));

// Check how many have bold / ticks / answers in mnm
let ticksCount = 0;
let boldCount = 0;
let tbCount = 0;
let dapAnCount = 0;

for (let p of mnmParas) {
  if (p.text.includes('✓') || p.text.includes('✔')) ticksCount++;
  if (p.text.includes('[BOLD:')) boldCount++;
  if (/TB\s*\(\d+\)/i.test(p.text)) tbCount++;
  if (/Đáp án/i.test(p.text)) dapAnCount++;
}

console.log('mnm stats:', { ticksCount, boldCount, tbCount, dapAnCount });

// Let's check sections in mnm
for (let i = 0; i < mnmParas.length; i++) {
  const p = mnmParas[i];
  if (/Phần\s*\d+/i.test(p.text)) {
    console.log(`P${i}: ${p.text}`);
  }
}

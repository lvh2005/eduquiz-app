import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

// Find lines with TB(
for (let i = 0; i < mnm1Paras.length; i++) {
  const t = mnm1Paras[i].text.replace(/\[BOLD:(.*?)\]/g, '$1');
  if (/TB\s*\(/i.test(t)) {
    console.log(`\n--- Match at line ${i} ---`);
    for (let j = Math.max(0, i - 5); j <= Math.min(mnm1Paras.length - 1, i + 2); j++) {
      console.log(`   ${mnm1Paras[j].text}`);
    }
  }
}

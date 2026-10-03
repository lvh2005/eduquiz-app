import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

console.log('Search for section titles in mnm1:');
for (let i = 0; i < mnm1Paras.length; i++) {
  const t = mnm1Paras[i].text.replace(/\[BOLD:(.*?)\]/g, '$1');
  if (/phần|chương|bài|môn|đề/i.test(t)) {
    console.log(`P${i}: ${t}`);
  }
}

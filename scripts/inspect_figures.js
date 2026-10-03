import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

for (let i = 0; i < mnm1Paras.length; i++) {
  const p = mnm1Paras[i];
  if (p.images.length > 0 || /hình\s*\d+/i.test(p.text)) {
    console.log(`P${i} [IMG: ${p.images.join(',')}] text: ${p.text}`);
  }
}

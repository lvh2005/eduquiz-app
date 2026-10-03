import fs from 'fs';

const mnmParas = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm_paras.json', 'utf8'));

for (let i = 0; i < 150; i++) {
  console.log(`${i}: ${mnmParas[i].text}`);
}

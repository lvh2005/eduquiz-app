import fs from 'fs';

const mnmParas = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm_paras.json', 'utf8'));

for (let i = 0; i < mnmParas.length; i++) {
  if (/Đáp án/i.test(mnmParas[i].text)) {
    console.log(`Line ${i}: ${mnmParas[i].text}`);
    if (i < 500) {
      // just print first 10
    }
  }
}

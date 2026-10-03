import fs from 'fs';

const mnmParas = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm_paras.json', 'utf8'));

for (let i = 0; i < mnmParas.length; i++) {
  const t = mnmParas[i].text.replace(/\[BOLD:(.*?)\]/g, '$1');
  if (/Phần\s*\d+/i.test(t)) {
    console.log(`mnm P${i}: ${t}`);
    // print context
    for (let j = Math.max(0, i-1); j <= Math.min(mnmParas.length-1, i+3); j++) {
      console.log(`   ctx: ${mnmParas[j].text.replace(/\[BOLD:(.*?)\]/g, '$1')}`);
    }
  }
}

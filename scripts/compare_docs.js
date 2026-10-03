import fs from 'fs';

const mnmParas = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm_paras.json', 'utf8'));
const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

console.log('=== mnm1 sample (first 100 paras) ===');
console.log(mnm1Paras.slice(0, 50).map(p => `${p.text} ${p.images.length ? `[IMG:${p.images.join(',')}]` : ''}`).join('\n'));

console.log('=== mnm sample (first 50 paras) ===');
console.log(mnmParas.slice(0, 50).map(p => `${p.text} ${p.images.length ? `[IMG:${p.images.join(',')}]` : ''}`).join('\n'));

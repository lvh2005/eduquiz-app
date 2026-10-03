import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

console.log('Total paras in mnm1:', mnm1Paras.length);

// Let's print all paragraphs that have images or sections or question headers
for (let i = 0; i < mnm1Paras.length; i++) {
  const p = mnm1Paras[i];
  if (p.images.length > 0) {
    console.log(`P${i} [IMAGES: ${p.images.join(', ')}] text: "${p.text}"`);
    // print context around it
    for (let j = Math.max(0, i - 2); j <= Math.min(mnm1Paras.length - 1, i + 3); j++) {
      console.log(`   ctx P${j}: ${mnm1Paras[j].text} (imgs: ${mnm1Paras[j].images.join(',')})`);
    }
  }
}

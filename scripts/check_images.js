const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/ketoanmay_172.json', 'utf8'));

console.log('--- Questions with images ---');
data.forEach(q => {
  if (q.image) {
    console.log(`Part ${q.part} - Câu ${q.sourceNumber} (ID ${q.id}): ${q.q.substring(0, 60)}... [Base64 bytes: ${q.image.length}]`);
  }
});

console.log('\n--- Questions mentioning "hình" / "ảnh" / "sơ đồ" without images ---');
data.forEach(q => {
  const text = (q.q + ' ' + (q.a || []).join(' ')).toLowerCase();
  if ((text.includes('hình') || text.includes('ảnh') || text.includes('sơ đồ') || text.includes('bảng trên')) && !q.image) {
    console.log(`Part ${q.part} - Câu ${q.sourceNumber} (ID ${q.id}): ${q.q}`);
  }
});

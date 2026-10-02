import fs from 'fs';

const questions = JSON.parse(fs.readFileSync('public/data/ketoanmay_172.json', 'utf8'));

function getBase64Jpg(filepath) {
  const fileBuf = fs.readFileSync(filepath);
  return `data:image/jpeg;base64,${fileBuf.toString('base64')}`;
}

const pdfImgMap = {
  1: getBase64Jpg('scripts/extracted_img_1_obj4.jpg'),
  2: getBase64Jpg('scripts/extracted_img_2_obj11.jpg'),
  3: getBase64Jpg('scripts/extracted_img_3_obj13.jpg'),
  4: getBase64Jpg('scripts/extracted_img_4_obj18.jpg'),
  5: getBase64Jpg('scripts/extracted_img_5_obj20.jpg'),
  48: getBase64Jpg('scripts/extracted_img_6_obj140.jpg'),
  49: getBase64Jpg('scripts/extracted_img_7_obj145.jpg'),
  50: getBase64Jpg('scripts/extracted_img_8_obj148.jpg'),
  51: getBase64Jpg('scripts/extracted_img_9_obj153.jpg'),
  52: getBase64Jpg('scripts/extracted_img_10_obj155.jpg'),
  53: getBase64Jpg('scripts/extracted_img_11_obj158.jpg'),
};

let attached = 0;
questions.forEach(q => {
  if (q.part === 1) {
    if (pdfImgMap[q.sourceNumber]) {
      q.image = pdfImgMap[q.sourceNumber];
      attached++;
      console.log(`Attached PDF image to Part 1 - Câu ${q.sourceNumber} (ID ${q.id})`);
    }
  }
});

fs.writeFileSync('public/data/ketoanmay_172.json', JSON.stringify(questions, null, 2), 'utf8');
fs.writeFileSync('ketoanmay_173_questions.json', JSON.stringify(questions, null, 2), 'utf8');
fs.writeFileSync('lib/default-exam.js', `export const DEFAULT_EXAM = ${JSON.stringify(questions, null, 2)};\n`, 'utf8');

console.log(`\nUpdated all files! Total questions with images: ${questions.filter(q => !!q.image).length}`);

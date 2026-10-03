import fs from 'fs';
import AdmZip from 'adm-zip';

function cleanVietnamese(text) {
  if (!text) return '';
  let s = text.normalize('NFC');

  for (let iter = 0; iter < 8; iter++) {
    s = s.replace(/([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])\s+([àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])/g, '$1$2');
    s = s.replace(/([àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])\s+([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])/g, '$1$2');
    s = s.replace(/\b([b-df-hj-np-tv-zđĐ])\s+([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])/gi, '$1$2');
    s = s.replace(/([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])\s+([cghkmnptx])\b/gi, '$1$2');
    s = s.replace(/([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])\s+(ng|nh|ch|th|tr|ph|kh|gh|gi)\b/gi, '$1$2');
  }

  s = s.trim();
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1);
  }
  s = s.replace(/\s+/g, ' ');
  return s;
}

const docxZip = new AdmZip('C:/Users/LEVUHA/Downloads/Mã nguồn mở.docx');
const docxMedia = {};
for (const entry of docxZip.getEntries()) {
  if (entry.entryName.startsWith('word/media/')) {
    docxMedia[entry.name] = `data:image/png;base64,${entry.getData().toString('base64')}`;
  }
}

const pdfImg1 = fs.existsSync('scripts/mnm_images/img_1_1680x936.png')
  ? `data:image/png;base64,${fs.readFileSync('scripts/mnm_images/img_1_1680x936.png').toString('base64')}`
  : null;
const pdfImg10 = fs.existsSync('scripts/mnm_images/img_10_445x384.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_10_445x384.jpg').toString('base64')}`
  : null;
const pdfImg18 = fs.existsSync('scripts/mnm_images/img_18_901x344.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_18_901x344.jpg').toString('base64')}`
  : null;
const pdfImg24 = fs.existsSync('scripts/mnm_images/img_24_1446x1087.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_24_1446x1087.jpg').toString('base64')}`
  : null;
const pdfImg38 = fs.existsSync('scripts/mnm_images/img_38_1598x984.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_38_1598x984.jpg').toString('base64')}`
  : null;

const figureImages = {
  'hình 01': pdfImg1 || docxMedia['image5.png'],
  'hình 1': pdfImg1 || docxMedia['image5.png'],
  'hình 02': pdfImg10 || docxMedia['image1.png'],
  'hình 2': pdfImg10 || docxMedia['image1.png'],
  'hình 03': pdfImg18 || docxMedia['image2.png'],
  'hình 3': pdfImg18 || docxMedia['image2.png'],
  'hình 05': pdfImg24 || docxMedia['image3.png'],
  'hình 5': pdfImg24 || docxMedia['image3.png'],
  'hình 06': pdfImg38 || docxMedia['image4.png'],
  'hình 6': pdfImg38 || docxMedia['image4.png'],
};

const content = fs.readFileSync('scripts/pdf_extracted_text.txt', 'utf8');
const lines = content.split('\n');

let currentPart = 1;
let rawQuestions = [];
let currentBlock = [];

for (let line of lines) {
  line = line.trim();
  if (!line) continue;

  const partMatch = line.match(/^Ph\s*ầ\s*n\s*(\d+)/i);
  if (partMatch) {
    currentPart = parseInt(partMatch[1]);
    continue;
  }

  if (/^\[---\s*PAGE\s*\d+\s*---\]$/i.test(line)) continue;
  if (/^Câu\s*\d+\s*\(\s*M\s*ộ\s*t\s*đ\s*á\s*p\s*á\s*n\s*\)/i.test(line)) continue;

  const qHeaderMatch = line.match(/^Câu\s*(\d+)[\s.:]/i);
  if (qHeaderMatch) {
    if (currentBlock.length > 0) {
      rawQuestions.push({ part: currentPart, lines: currentBlock });
    }
    currentBlock = [line];
  } else {
    if (currentBlock.length > 0) {
      currentBlock.push(line);
    }
  }
}
if (currentBlock.length > 0) {
  rawQuestions.push({ part: currentPart, lines: currentBlock });
}

let parsedQuestions = [];
let globalId = 0;

for (const block of rawQuestions) {
  globalId++;
  const firstLine = block.lines[0];
  const sourceMatch = firstLine.match(/^Câu\s*(\d+)[\s.:](.*)/i);
  const sourceNumber = sourceMatch ? parseInt(sourceMatch[1]) : globalId;
  
  let qTextLines = [sourceMatch ? sourceMatch[2].trim() : firstLine];
  let options = [];
  let correct = 0;
  let inOptions = false;

  for (let i = 1; i < block.lines.length; i++) {
    const l = block.lines[i];
    const optMatch = l.match(/^(\*?\s*)([A-G])[\s.:\)\-](.*)/i);
    if (optMatch) {
      inOptions = true;
      const isCorrect = optMatch[1].includes('*');
      const optChar = optMatch[2].toUpperCase();
      const optText = optMatch[3].trim();
      const optIndex = optChar.charCodeAt(0) - 65;

      if (isCorrect) correct = optIndex;
      options.push({ char: optChar, text: optText, isCorrect });
    } else {
      if (!inOptions) {
        qTextLines.push(l);
      } else if (options.length > 0) {
        options[options.length - 1].text += ' ' + l;
      }
    }
  }

  let cleanedQText = cleanVietnamese(qTextLines.join(' '));

  let cleanOptionTexts = options.map((opt) => cleanVietnamese(opt.text));
  let cleanFormattedOptions = options.map((opt) => `${opt.char}. ${cleanVietnamese(opt.text)}`);

  let attachedImage = null;
  const lowerQ = cleanedQText.toLowerCase();
  for (const [figKey, imgData] of Object.entries(figureImages)) {
    if (lowerQ.includes(figKey)) {
      attachedImage = imgData;
      break;
    }
  }

  if (cleanOptionTexts.length === 0) {
    cleanOptionTexts = ['A', 'B', 'C', 'D'];
    cleanFormattedOptions = ['A.', 'B.', 'C.', 'D.'];
  }

  parsedQuestions.push({
    id: globalId,
    sourceNumber,
    part: block.part,
    subject: 'Mã nguồn mở',
    q: cleanedQText,
    a: cleanOptionTexts,
    c: correct,
    options: cleanFormattedOptions,
    correct,
    image: attachedImage
  });
}

console.log(`Successfully built ${parsedQuestions.length} questions for Mã nguồn mở!`);
const withImages = parsedQuestions.filter(q => Boolean(q.image)).length;
console.log(`Questions with image: ${withImages}`);

fs.writeFileSync('lib/default-exam.js', `export const DEFAULT_EXAM = ${JSON.stringify(parsedQuestions, null, 2)};\n`, 'utf8');
console.log('Saved to lib/default-exam.js');

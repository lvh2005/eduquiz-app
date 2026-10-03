import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

function fixVietnameseSpacedText(text) {
  if (!text) return '';
  // Normalize unicode
  let s = text.normalize('NFC');
  
  // Fix spaced characters in Vietnamese words
  // e.g. "đ ây" -> "đây", "ngu ồ n" -> "nguồn", "t ươ ng đươ ng" -> "tương đương"
  // A common pattern in EduQuiz PDF export is spaces between syllable components
  // Replace letter + space + combining vowel/consonant
  s = s.replace(/([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])\s+([àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])/g, '$1$2');
  // Repeat to catch 3-letter combinations like n g u
  for (let i = 0; i < 5; i++) {
    s = s.replace(/([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])\s+([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])/g, (match, p1, p2) => {
      // Don't merge standalone single-letter words like "và", "là", but fix split words
      const combined = p1 + p2;
      return match; // We will use a smarter dictionary/regex or item grouping
    });
  }
  return s;
}

async function analyzePdf() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/LEVUHA/Downloads/Mã nguồn mở.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  console.log('Total pages:', doc.numPages);
  
  // Let's inspect text items and positions on each page
  let questionsFound = [];
  let partsFound = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Check operators for images
    const ops = await page.getOperatorList();
    let imgCountOnPage = 0;
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
        imgCountOnPage++;
      }
    }

    // Combine text items with smart whitespace
    let pageStr = '';
    let lastX = 0;
    let lastWidth = 0;
    let lastY = 0;

    for (const item of textContent.items) {
      const x = item.transform[4];
      const y = item.transform[5];
      const width = item.width;
      
      if (lastY !== 0 && Math.abs(lastY - y) > 5) {
        pageStr += '\n';
      } else if (lastX !== 0 && (x - (lastX + lastWidth)) > 1.5) {
        pageStr += ' ';
      }
      pageStr += item.str;
      lastX = x;
      lastWidth = width;
      lastY = y;
    }

    if (imgCountOnPage > 0) {
      console.log(`Page ${pageNum} has ${imgCountOnPage} image(s)! Text preview:\n${pageStr.slice(0, 300)}`);
    }

    // Look for parts
    const partMatch = pageStr.match(/Ph\s*ầ\s*n\s*(\d+)/i);
    if (partMatch) {
      partsFound.push({ part: parseInt(partMatch[1]), pageNum });
    }
  }

  console.log('Parts found:', partsFound);
}

analyzePdf();

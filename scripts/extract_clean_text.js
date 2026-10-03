import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function parseAllPdfQuestions() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/LEVUHA/Downloads/Mã nguồn mở.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Sort text items by vertical position top-to-bottom, then horizontal left-to-right
    const items = textContent.items;
    let lines = [];
    let currentY = null;
    let currentLine = '';

    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (currentY === null || Math.abs(currentY - y) > 3) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = item.str;
        currentY = y;
      } else {
        currentLine += (item.str.startsWith(' ') || currentLine.endsWith(' ') ? '' : ' ') + item.str;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    // Clean footer/header lines from EduQuiz print
    const cleanLines = lines.filter(l => {
      if (/EduQuiz\s*-\s*Mã nguồn mở/i.test(l)) return false;
      if (/https:\/\/eduquiz\.vn/i.test(l)) return false;
      if (/^\d{2}:\d{2}\s+\d+\/\d+\/\d+/i.test(l)) return false;
      return true;
    });

    fullText += `\n[--- PAGE ${pageNum} ---]\n` + cleanLines.join('\n') + '\n';
  }

  fs.writeFileSync('scripts/pdf_extracted_text.txt', fullText, 'utf8');
  console.log('Saved extracted PDF text to scripts/pdf_extracted_text.txt. Length:', fullText.length);
}

parseAllPdfQuestions();

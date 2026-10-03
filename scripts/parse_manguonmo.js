import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function parsePdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log(filePath, 'Total Pages:', doc.numPages);

  let fullPages = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by their y-coordinate to reconstruct natural lines
    const items = textContent.items;
    let lines = [];
    let currentY = null;
    let currentLine = '';

    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (currentY === null || Math.abs(currentY - y) > 4) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = item.str;
        currentY = y;
      } else {
        currentLine += (item.str.startsWith(' ') || currentLine.endsWith(' ') ? '' : ' ') + item.str;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    fullPages.push({
      pageNum,
      lines,
      text: lines.join('\n')
    });
  }

  const allText = fullPages.map(p => p.text).join('\n\n');
  console.log('Sample from first 3 pages:\n', allText.slice(0, 1500));
  
  // Count questions
  const qMatches = [...allText.matchAll(/câu\s*(\d+)[\s.:]/gi)];
  console.log('Total Câu matches in PDF:', qMatches.length);
  if (qMatches.length > 0) {
    console.log('First question match:', qMatches[0][0]);
    console.log('Last question match:', qMatches[qMatches.length - 1][0]);
  }
}

parsePdf('C:/Users/LEVUHA/Downloads/Mã nguồn mở.pdf');

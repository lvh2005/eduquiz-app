import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function mapQuestionsAndImages() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/LEVUHA/Downloads/Mã nguồn mở.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  let pageData = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    
    // find questions
    const hinhMatches = [...pageText.matchAll(/hình\s*([0-9a-zA-Z]+)/gi)];
    if (hinhMatches.length > 0) {
      console.log(`Page ${pageNum} mentions figures:`, hinhMatches.map(m => m[0]));
    }
  }
}

mapQuestionsAndImages();

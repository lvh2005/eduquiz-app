import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractImagesFromPdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  console.log(`Document loaded: ${filePath}, Pages: ${doc.numPages}`);
  let pageImages = {};

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const ops = await page.getOperatorList();
    
    // Check for images
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const objId = ops.argsArray[i][0];
        try {
          const imgObj = await page.objs.get(objId);
          if (imgObj) {
            console.log(`Page ${pageNum} has image objId: ${objId}, width: ${imgObj.width}, height: ${imgObj.height}, kind: ${imgObj.kind}`);
            if (!pageImages[pageNum]) pageImages[pageNum] = [];
            pageImages[pageNum].push({
              objId,
              width: imgObj.width,
              height: imgObj.height,
              dataLen: imgObj.data?.length
            });
          }
        } catch (err) {
          console.warn(`Error getting image ${objId} on page ${pageNum}:`, err.message);
        }
      }
    }
  }

  console.log('Summary of page images:', pageImages);
}

extractImagesFromPdf('C:/Users/LEVUHA/Downloads/Mã nguồn mở.pdf');

import fs from 'fs';
import path from 'path';

function inspectDoc(dir) {
  console.log('=== Inspecting:', dir, '===');
  const docXml = fs.readFileSync(path.join(dir, 'word/document.xml'), 'utf8');
  const relsXml = fs.existsSync(path.join(dir, 'word/_rels/document.xml.rels')) 
    ? fs.readFileSync(path.join(dir, 'word/_rels/document.xml.rels'), 'utf8') 
    : '';

  // check media
  const mediaDir = path.join(dir, 'word/media');
  if (fs.existsSync(mediaDir)) {
    const files = fs.readdirSync(mediaDir);
    console.log('Media files count:', files.length, files.slice(0, 10));
  } else {
    console.log('No media dir');
  }

  // Sample first 2000 chars of docXml or extract text paragraphs
  // Let's do a simple regex extraction of paragraphs (<w:p>...</w:p>)
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch;
  let count = 0;
  let sampleParas = [];
  while ((pMatch = pRegex.exec(docXml)) !== null && count < 60) {
    const pContent = pMatch[1];
    
    // Extract runs with bold / underline / etc
    // check if there's drawing/blip (image)
    let images = [];
    const blipRegex = /<a:blip[^>]*r:embed="([^"]+)"/g;
    let bMatch;
    while ((bMatch = blipRegex.exec(pContent)) !== null) {
      images.push(bMatch[1]);
    }
    const vImagedataRegex = /<v:imagedata[^>]*r:id="([^"]+)"/g;
    while ((bMatch = vImagedataRegex.exec(pContent)) !== null) {
      images.push(bMatch[1]);
    }

    // Extract text and runs
    let pText = '';
    const rRegex = /<w:r(?:\s+[^>]*)?>([\s\S]*?)<\/w:r>/g;
    let rMatch;
    while ((rMatch = rRegex.exec(pContent)) !== null) {
      const rContent = rMatch[1];
      const isBold = /<w:b(?:\s|\/|>)/.test(rContent) && !/<w:b\s+w:val="(?:0|false|none)"/.test(rContent);
      const isStrike = /<w:strike/.test(rContent);
      const isUnderline = /<w:u\s+w:val="(?!none)/.test(rContent);
      
      const tRegex = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g;
      let tMatch;
      let rText = '';
      while ((tMatch = tRegex.exec(rContent)) !== null) {
        rText += tMatch[1];
      }
      if (rText) {
        if (isBold) {
          pText += `[BOLD:${rText}]`;
        } else {
          pText += rText;
        }
      }
    }
    if (images.length > 0) {
      pText += ` [IMAGES:${images.join(',')}]`;
    }
    if (pText.trim()) {
      sampleParas.push(pText.trim());
      count++;
    }
  }

  console.log('Sample paragraphs (first 30):');
  sampleParas.slice(0, 30).forEach((p, idx) => console.log(`${idx+1}: ${p}`));
}

inspectDoc('c:/Users/LEVUHA/Desktop/eduquiz-app/scratch_docx_mnm');
inspectDoc('c:/Users/LEVUHA/Desktop/eduquiz-app/scratch_docx_mnm1');

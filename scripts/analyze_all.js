import fs from 'fs';
import path from 'path';

function analyzeFullDoc(dir, name) {
  const docXml = fs.readFileSync(path.join(dir, 'word/document.xml'), 'utf8');
  const relsXml = fs.existsSync(path.join(dir, 'word/_rels/document.xml.rels')) 
    ? fs.readFileSync(path.join(dir, 'word/_rels/document.xml.rels'), 'utf8') 
    : '';

  // parse rels to map rId -> target filename
  const relMap = {};
  const relRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let relMatch;
  while ((relMatch = relRegex.exec(relsXml)) !== null) {
    relMap[relMatch[1]] = relMatch[2];
  }

  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch;
  let paras = [];
  while ((pMatch = pRegex.exec(docXml)) !== null) {
    const pContent = pMatch[1];
    
    // Extract images
    let images = [];
    const blipRegex = /<a:blip[^>]*r:embed="([^"]+)"/g;
    let bMatch;
    while ((bMatch = blipRegex.exec(pContent)) !== null) {
      images.push(relMap[bMatch[1]] || bMatch[1]);
    }
    const vImagedataRegex = /<v:imagedata[^>]*r:id="([^"]+)"/g;
    while ((bMatch = vImagedataRegex.exec(pContent)) !== null) {
      images.push(relMap[bMatch[1]] || bMatch[1]);
    }

    let pText = '';
    const rRegex = /<w:r(?:\s+[^>]*)?>([\s\S]*?)<\/w:r>/g;
    let rMatch;
    while ((rMatch = rRegex.exec(pContent)) !== null) {
      const rContent = rMatch[1];
      const isBold = /<w:b(?:\s|\/|>)/.test(rContent) && !/<w:b\s+w:val="(?:0|false|none)"/.test(rContent);
      
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
    paras.push({ text: pText.trim(), images });
  }

  console.log(`\n================== ${name} ==================`);
  console.log(`Total paragraphs: ${paras.length}`);
  
  // Find all questions
  const qParas = paras.filter(p => /câu\s*\d+/i.test(p.text));
  console.log(`Paragraphs matching 'Câu': ${qParas.length}`);

  // Find all images
  const imgParas = paras.filter(p => p.images.length > 0);
  console.log(`Paragraphs with images: ${imgParas.length}`);
  imgParas.forEach((p, i) => console.log(`  Img ${i+1}: text="${p.text}" images=${p.images.join(', ')}`));

  // Write out all paragraphs to a file for complete analysis
  fs.writeFileSync(`c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/${name}_paras.json`, JSON.stringify(paras, null, 2), 'utf8');
}

analyzeFullDoc('c:/Users/LEVUHA/Desktop/eduquiz-app/scratch_docx_mnm', 'mnm');
analyzeFullDoc('c:/Users/LEVUHA/Desktop/eduquiz-app/scratch_docx_mnm1', 'mnm1');

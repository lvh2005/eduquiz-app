import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('C:\\Users\\LEVUHA\\Downloads\\ketoanmay.pdf');
const latin1 = buf.toString('latin1');

const objRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
let m;
const objMap = {};

while ((m = objRegex.exec(latin1)) !== null) {
  objMap[m[1]] = m[3];
}

// Find all pages
const pageList = [];
for (let num in objMap) {
  const body = objMap[num];
  if (body.includes('/Type /Page') || body.includes('/Type/Page')) {
    pageList.push({ num, body });
  }
}

console.log(`Checking ${pageList.length} pages...`);

pageList.forEach((p, idx) => {
  const contentsMatch = p.body.match(/\/Contents\s+(\d+)/);
  const resourcesMatch = p.body.match(/\/Resources\s+(\d+)/);
  let resBody = resourcesMatch ? objMap[resourcesMatch[1]] : p.body;
  
  // Find XObjects in resBody
  const xobjs = [];
  if (resBody) {
    const xMatch = resBody.match(/\/XObject\s*<<([\s\S]*?)>>/);
    if (xMatch) {
      const refs = xMatch[1].match(/\/([a-zA-Z0-9_]+)\s+(\d+)\s+\d+\s+R/g) || [];
      refs.forEach(r => {
        const parts = r.match(/\/([a-zA-Z0-9_]+)\s+(\d+)\s+\d+\s+R/);
        if (parts) xobjs.push({ name: parts[1], targetObj: parts[2] });
      });
    }
  }

  // Decompress contents
  let text = '';
  if (contentsMatch) {
    const cBody = objMap[contentsMatch[1]];
    const sStart = cBody.indexOf('stream') + 6;
    let actualStart = sStart;
    if (cBody[actualStart] === '\r' && cBody[actualStart + 1] === '\n') actualStart += 2;
    else if (cBody[actualStart] === '\n' || cBody[actualStart] === '\r') actualStart += 1;
    const sEnd = cBody.indexOf('endstream');
    
    // slice from raw buffer to avoid latin1 corruption of binary
    const startInBuf = latin1.indexOf(cBody) + actualStart;
    const len = sEnd - actualStart;
    const rawStream = buf.slice(startInBuf, startInBuf + len);

    try {
      const decomp = zlib.inflateSync(rawStream);
      const str = decomp.toString('utf8');
      // extract text in Tj / TJ
      const tjMatches = str.match(/\((.*?)\)\s*Tj/g) || [];
      text = tjMatches.map(t => t.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
    } catch (_) {}
  }

  if (xobjs.length > 0) {
    console.log(`Page ${idx + 1} (Page Obj ${p.num}) has XObjects:`, xobjs.map(x => `obj ${x.targetObj}`));
    console.log(`   Page text snippet: ${text.substring(0, 150)}...\n`);
  }
});

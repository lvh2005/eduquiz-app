const fs = require('fs');
const zlib = require('zlib');

function readZip(buf) {
  const entries = {};
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  const cdEntriesCount = buf.readUInt16LE(eocdOffset + 10);
  let ptr = cdOffset;
  for (let i = 0; i < cdEntriesCount; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);

    const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawData = buf.slice(dataStart, dataStart + compSize);

    let data;
    if (method === 0) data = rawData;
    else if (method === 8) data = zlib.inflateRawSync(rawData);
    else continue;

    entries[name] = data;
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

const docxBuf = fs.readFileSync('C:\\Users\\LEVUHA\\Downloads\\ÔN TUẦN7_CSCN HTKTM_9_2026.docx');
const entries = readZip(docxBuf);

const relsXml = entries['word/_rels/document.xml.rels'].toString('utf8');
const rIdMap = {};
const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relRegex.exec(relsXml)) !== null) {
  let target = m[2];
  if (target.startsWith('media/')) target = 'word/' + target;
  else if (!target.startsWith('word/')) target = 'word/' + target;
  rIdMap[m[1]] = target;
}

const docXml = entries['word/document.xml'].toString('utf8');
const pRegex = /<w:p(?:\s|>).*?<\/w:p>/gs;
let pMatch;
let currentQ = 0;
const qImageMap = {};

while ((pMatch = pRegex.exec(docXml)) !== null) {
  const pStr = pMatch[0];
  const text = pStr.replace(/<[^>]+>/g, '').trim();
  const qM = text.match(/Câu\s+(\d+)/i);
  if (qM) {
    currentQ = parseInt(qM[1]);
  }
  const blipM = pStr.match(/r:embed="([^"]+)"/);
  if (blipM) {
    const rId = blipM[1];
    const mediaPath = rIdMap[rId];
    if (entries[mediaPath]) {
      const mime = mediaPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const base64 = `data:${mime};base64,${entries[mediaPath].toString('base64')}`;
      qImageMap[currentQ] = base64;
      console.log(`Mapped Question ${currentQ} -> ${mediaPath} (${entries[mediaPath].length} bytes)`);
    }
  }
}

// Now load ketoanmay_173_questions.json and update image fields for Part 1 questions
const questions = JSON.parse(fs.readFileSync('ketoanmay_173_questions.json', 'utf8'));
let attachedCount = 0;
questions.forEach(q => {
  if (q.part === 1 && qImageMap[q.sourceNumber]) {
    q.image = qImageMap[q.sourceNumber];
    attachedCount++;
  }
});

fs.writeFileSync('ketoanmay_173_questions.json', JSON.stringify(questions, null, 2), 'utf8');
console.log(`Successfully attached ${attachedCount} images to ketoanmay_173_questions.json!`);

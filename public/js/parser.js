// =======================================================
// EduQuiz Universal Parser (.DOCX & .PPTX & .TXT)
// Hỗ trợ trích xuất Câu hỏi, Phương án, Màu đỏ đáp án, Gạch chân và Hình ảnh Base64
// =======================================================

async function decompressDeflateRaw(compressedUint8Array) {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedUint8Array);
      writer.close();
      const reader = ds.readable.getReader();
      const chunks = [];
      let totalLength = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLength += value.length;
      }
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } catch (e) {
      console.warn('DecompressionStream error:', e);
    }
  }
  return compressedUint8Array;
}

// Giải nén file Zip (.docx / .pptx) bằng Central Directory và Local Header
async function readDocxZipEntries(arrayBuffer) {
  const buffer = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const files = {};

  // 1. Tìm End of Central Directory (EOCD)
  let eocdOffset = buffer.length - 22;
  while (eocdOffset >= 0) {
    if (view.getUint32(eocdOffset, true) === 0x06054b50) break;
    eocdOffset--;
  }

  if (eocdOffset >= 0) {
    const cdCount = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    let cur = cdOffset;

    for (let i = 0; i < cdCount && cur < buffer.length - 46; i++) {
      const sig = view.getUint32(cur, true);
      if (sig !== 0x02014b50) break;

      const compression = view.getUint16(cur + 10, true);
      const compressedSize = view.getUint32(cur + 20, true);
      const nameLen = view.getUint16(cur + 28, true);
      const extraLen = view.getUint16(cur + 30, true);
      const commentLen = view.getUint16(cur + 32, true);
      const localHeaderOffset = view.getUint32(cur + 42, true);

      const nameBytes = buffer.slice(cur + 46, cur + 46 + nameLen);
      const name = new TextDecoder('utf-8').decode(nameBytes);
      cur += 46 + nameLen + extraLen + commentLen;

      if (localHeaderOffset + 30 <= buffer.length && view.getUint32(localHeaderOffset, true) === 0x04034b50) {
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const compressedData = buffer.slice(dataStart, dataStart + compressedSize);

        let decompressed = compressedData;
        if (compression === 8) {
          decompressed = await decompressDeflateRaw(compressedData);
        }
        files[name] = decompressed;
      }
    }
    return files;
  }

  // 2. Fallback quét tuần tự
  let offset = 0;
  while (offset < buffer.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig === 0x04034b50) {
      const compression = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);

      const nameBytes = buffer.slice(offset + 30, offset + 30 + nameLen);
      const name = new TextDecoder('utf-8').decode(nameBytes);
      const dataStart = offset + 30 + nameLen + extraLen;
      const dataEnd = dataStart + compressedSize;
      const compressedData = buffer.slice(dataStart, dataEnd);

      let decompressed = compressedData;
      if (compression === 8) {
        decompressed = await decompressDeflateRaw(compressedData);
      }
      files[name] = decompressed;
      offset = dataEnd;
    } else if (sig === 0x02014b50) {
      break;
    } else {
      offset++;
    }
  }
  return files;
}

// Chuyển Uint8Array sang Base64
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const sub = uint8Array.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, sub);
  }
  return window.btoa(binary);
}

// Bóc tách câu hỏi từ file DOCX hoặc PPTX
async function parseDocxFileDetailed(file) {
  const fileName = (file.name || '').toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const zip = await readDocxZipEntries(arrayBuffer);
  const decoder = new TextDecoder('utf-8');

  // ==========================================
  // XỬ LÝ FILE POWERPOINT (.PPTX)
  // ==========================================
  if (fileName.endsWith('.pptx')) {
    const slideKeys = Object.keys(zip).filter(k => k.match(/^ppt\/slides\/slide\d+\.xml$/)).sort((a,b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

    if (slideKeys.length === 0) {
      throw new Error('Không tìm thấy slide nào trong file PowerPoint .pptx');
    }

    const questions = [];
    const diagnostics = [];
    let currentQ = null;
    const qHeaderRegex = /^(?:câu|cau|question|q\s*\.?|bài|bai)\s*(\d+)[\s*:\.\-\)]([\s\S]*)$/i;
    const numberedQRegex = /^(\d+)[\.\:\-\)]([\s\S]*)$/;
    const optPrefixRegex = /^(?:(?:\(([a-eA-E])\)|\[([a-eA-E])\]|([a-eA-E])[\.\:\-\)\]])\s*|\*\s*)+([\s\S]*)$/;

    function finishCurrentQ() {
      if (!currentQ) return;
      if (currentQ.a.length >= 2) questions.push(currentQ);
      else if (currentQ.a.length > 0) diagnostics.push(`Câu ${currentQ.sourceNumber} chỉ có ${currentQ.a.length} phương án`);
    }

    slideKeys.forEach((slideKey, sIdx) => {
      const slideXml = zip[slideKey] ? decoder.decode(zip[slideKey]) : '';
      const relsKey = slideKey.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
      const relsXml = zip[relsKey] ? decoder.decode(zip[relsKey]) : '';

      const rels = {};
      const rMatches = relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g);
      for (const m of rMatches) rels[m[1]] = m[2];

      function getPptImageDataUrl(rId) {
        let target = rels[rId];
        if (!target) return null;
        target = target.replace(/^\.\.\//, 'ppt/');
        if (!target.startsWith('ppt/')) target = 'ppt/' + target;
        const imgData = zip[target];
        if (!imgData) return null;
        const ext = target.split('.').pop().toLowerCase();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${uint8ArrayToBase64(imgData)}`;
      }

      const pMatches = slideXml.match(/<a:p\b[\s\S]*?<\/a:p>/g) || [];
      const slideParagraphs = [];

      pMatches.forEach(pXml => {
        const blipMatches = [...pXml.matchAll(/r:embed="([^"]+)"/g)];
        const imagesInP = blipMatches.map(m => getPptImageDataUrl(m[1])).filter(Boolean);

        let isRed = /<a:srgbClr\s+val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(pXml);
        let isUnderline = /u="(?:sng|words|dbl)"/i.test(pXml);

        let pText = '';
        const runs = pXml.match(/<a:r\b[\s\S]*?<\/a:r>/g) || [];
        runs.forEach(r => {
          if (/<a:srgbClr\s+val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(r)) isRed = true;
          if (/u="(?:sng|words|dbl)"/i.test(r)) isUnderline = true;
          const tMatches = r.match(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g) || [];
          tMatches.forEach(t => { pText += t.replace(/<[^>]+>/g, ''); });
        });

        pText = pText.trim();
        if (pText || imagesInP.length > 0) {
          slideParagraphs.push({ text: pText, images: imagesInP, isRed, isUnderline });
        }
      });

      // Xử lý các đoạn văn trong slide
      slideParagraphs.forEach((item, pIdx) => {
        const { text: pText, images: imagesInP, isRed, isUnderline } = item;

        // 1. Khớp "Câu X:", "Question X:"
        const qMatch = pText ? (pText.match(qHeaderRegex) || pText.match(numberedQRegex)) : null;
        if (qMatch) {
          finishCurrentQ();
          let qBody = qMatch[2].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
          currentQ = {
            id: questions.length + 1,
            sourceNumber: Number(qMatch[1]),
            q: qBody || `Câu ${qMatch[1]}`,
            image: imagesInP[0] || null,
            a: [],
            c: 0
          };
          return;
        }

        // 2. Nếu là đoạn đầu của slide và có dấu hỏi chấm hoặc có phương án theo sau
        if (!currentQ && pIdx === 0 && pText && (pText.endsWith('?') || slideParagraphs.length >= 3)) {
          finishCurrentQ();
          currentQ = {
            id: questions.length + 1,
            sourceNumber: questions.length + 1,
            q: pText.replace(/^["'“](.*)["'”]$/, '$1').trim(),
            image: imagesInP[0] || null,
            a: [],
            c: 0
          };
          return;
        }

        if (imagesInP.length > 0 && currentQ && currentQ.a.length === 0) {
          currentQ.image = imagesInP[0];
        }

        if (currentQ && pText) {
          let optText = pText;
          const optMatch = optText.match(optPrefixRegex);
          const isAsterisk = /^\*/.test(optText) || /\[x\]/i.test(optText);
          if (optMatch) optText = optMatch[4].trim();
          optText = optText.replace(/^["'“](.*)["'”]$/, '$1').trim();

          if (optText) {
            currentQ.a.push(optText);
            if (isRed || isUnderline || isAsterisk) {
              currentQ.c = currentQ.a.length - 1;
            }
          }
        }
      });
    });

    finishCurrentQ();
    return { questions, diagnostics };
  }

  // ==========================================
  // XỬ LÝ FILE WORD (.DOCX)
  // ==========================================
  const xml = zip['word/document.xml'] ? decoder.decode(zip['word/document.xml']) : '';
  const relsXml = zip['word/_rels/document.xml.rels'] ? decoder.decode(zip['word/_rels/document.xml.rels']) : '';

  if (!xml) {
    throw new Error('Không tìm thấy nội dung văn bản trong file docx');
  }

  const rels = {};
  const rMatches = relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g);
  for (const m of rMatches) rels[m[1]] = m[2];

  function getImageDataUrl(rId) {
    let target = rels[rId];
    if (!target) return null;
    target = target.replace(/^\//, '');
    if (!target.startsWith('word/')) target = 'word/' + target;
    const imgData = zip[target];
    if (!imgData) return null;
    const ext = target.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${uint8ArrayToBase64(imgData)}`;
  }

  const pMatches = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const questions = [];
  const diagnostics = [];
  let currentQ = null;

  const qHeaderRegex = /^(?:câu|cau)\s*(\d+)[\s*:\.\-\)]([\s\S]*)$/i;
  const optPrefixRegex = /^(?:(?:\(([a-eA-E])\)|\[([a-eA-E])\]|([a-eA-E])[\.\:\-\)\]])\s*|\*\s*)+([\s\S]*)$/;

  function finishCurrentQ() {
    if (!currentQ) return;
    if (currentQ.a.length >= 2) questions.push(currentQ);
    else if (currentQ.a.length > 0) diagnostics.push(`Câu ${currentQ.sourceNumber} chỉ có ${currentQ.a.length} phương án trả lời`);
  }

  pMatches.forEach(pXml => {
    const blipMatches = [...pXml.matchAll(/r:embed="([^"]+)"/g)];
    const imagesInP = blipMatches.map(m => getImageDataUrl(m[1])).filter(Boolean);

    let isRed = /w:color\s+w:val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(pXml);
    let isUnderline = /<w:u\b/i.test(pXml);

    let pText = '';
    const runs = pXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
    runs.forEach(r => {
      if (/w:color\s+w:val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(r)) isRed = true;
      if (/<w:u\b/i.test(r)) isUnderline = true;
      const tMatches = r.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      tMatches.forEach(t => { pText += t.replace(/<[^>]+>/g, ''); });
    });

    pText = pText.replace(/&quot;/g, '"')
                 .replace(/&apos;/g, "'")
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&amp;/g, '&')
                 .trim();

    const qMatch = pText.match(qHeaderRegex);
    if (qMatch) {
      finishCurrentQ();
      let qBody = qMatch[2].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
      currentQ = {
        id: questions.length + 1,
        sourceNumber: Number(qMatch[1]),
        q: qBody || `Câu ${qMatch[1]}`,
        image: imagesInP[0] || null,
        a: [],
        c: 0
      };
      return;
    }

    if (imagesInP.length > 0 && currentQ && currentQ.a.length === 0) {
      currentQ.image = imagesInP[0];
    }

    if (!pText) return;

    if (currentQ) {
      let optText = pText;
      const optMatch = optText.match(optPrefixRegex);
      const isAsteriskCorrect = /^\*/.test(optText) || /\[x\]/i.test(optText);
      if (optMatch) optText = optMatch[4].trim();
      optText = optText.replace(/^["'“](.*)["'”]$/, '$1').trim();

      if (optText) {
        currentQ.a.push(optText);
        if (isRed || isUnderline || isAsteriskCorrect) {
          currentQ.c = currentQ.a.length - 1;
        }
      }
    }
  });

  finishCurrentQ();
  return { questions, diagnostics };
}

// Phân tích văn bản thô (khi dán Text thủ công)
function parseQuizTextDetailed(fullText) {
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions = [];
  const diagnostics = [];
  let currentPart = 1;
  let current = null;

  const qRegex = /^(?:câu|cau)\s*(\d+)[\s*:\.\-\)](.*)$/i;
  const partRegex = /^(?:phần|phan|part)\s*(\d+)/i;
  const optRegex = /^(\*|\[x\])?\s*(?:\(([A-Da-d])\)|\[([A-Da-d])\]|([A-Da-d])[\.\:\-\)\]])\s*(.*)$/;

  const finishCurrent = () => {
    if (!current) return;
    if (current.a.length >= 2) {
      questions.push(current);
    } else {
      diagnostics.push(`Câu ${current.sourceNumber} chỉ có ${current.a.length} phương án`);
    }
  };

  lines.forEach(line => {
    const partMatch = line.match(partRegex);
    if (partMatch) {
      currentPart = parseInt(partMatch[1]) || 1;
      return;
    }

    const qMatch = line.match(qRegex);
    if (qMatch) {
      finishCurrent();
      let qBody = qMatch[2].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
      current = {
        id: questions.length + 1,
        sourceNumber: Number(qMatch[1]),
        part: currentPart,
        q: qBody || `Câu ${qMatch[1]}`,
        image: null,
        a: [],
        c: 0
      };
      return;
    }

    const optMatch = line.match(optRegex);
    if (optMatch && current) {
      const isCorrect = Boolean(optMatch[1]);
      let optText = optMatch[5].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
      current.a.push(optText);
      if (isCorrect) current.c = current.a.length - 1;
      return;
    }

    if (current) {
      let cleanLine = line.replace(/^["'“](.*)["'”]$/, '$1').trim();
      if (current.a.length === 0) current.q += ' ' + cleanLine;
      else {
        current.a.push(cleanLine);
      }
    }
  });

  finishCurrent();
  return { questions, diagnostics };
}

function parseQuizText(fullText) {
  return parseQuizTextDetailed(fullText).questions;
}
// =======================================================
// EduQuiz DOCX & Text Parser với hỗ trợ Màu đỏ, Gạch chân, Ảnh Base64
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

// Giải nén file Zip (DOCX) trực tiếp trong trình duyệt
async function readDocxZipEntries(arrayBuffer) {
  const buffer = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const files = {};
  let offset = 0;

  while (offset < buffer.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig === 0x04034b50) { // Local File Header
      const compression = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const uncompressedSize = view.getUint32(offset + 22, true);
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
    } else if (sig === 0x02014b50) { // Central Directory
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

// Bóc tách câu hỏi trực tiếp từ file DOCX (Giữ nguyên Ảnh, Màu Đỏ, Gạch Chân, Dấu ngoặc kép)
async function parseDocxFileDetailed(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await readDocxZipEntries(arrayBuffer);

  const decoder = new TextDecoder('utf-8');
  const xml = zip['word/document.xml'] ? decoder.decode(zip['word/document.xml']) : '';
  const relsXml = zip['word/_rels/document.xml.rels'] ? decoder.decode(zip['word/_rels/document.xml.rels']) : '';

  if (!xml) {
    throw new Error('Không tìm thấy nội dung văn bản trong file docx');
  }

  // Map Relationships (để lấy đường dẫn ảnh)
  const rels = {};
  const rMatches = relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g);
  for (const m of rMatches) {
    rels[m[1]] = m[2];
  }

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
    if (currentQ.a.length >= 2) {
      questions.push(currentQ);
    } else if (currentQ.a.length > 0) {
      diagnostics.push(`Câu ${currentQ.sourceNumber} chỉ có ${currentQ.a.length} phương án trả lời`);
    }
  }

  pMatches.forEach(pXml => {
    // 1. Kiểm tra xem đoạn này có ảnh không
    const blipMatches = [...pXml.matchAll(/r:embed="([^"]+)"/g)];
    const imagesInP = blipMatches.map(m => getImageDataUrl(m[1])).filter(Boolean);

    // 2. Kiểm tra định dạng màu đỏ và gạch chân (Đáp án đúng)
    let isRed = false;
    let isUnderline = false;

    if (/w:color\s+w:val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(pXml)) {
      isRed = true;
    }
    if (/<w:u\b/i.test(pXml)) {
      isUnderline = true;
    }

    let pText = '';
    const runs = pXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
    runs.forEach(r => {
      if (/w:color\s+w:val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(r)) {
        isRed = true;
      }
      if (/<w:u\b/i.test(r)) {
        isUnderline = true;
      }
      const tMatches = r.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      tMatches.forEach(t => {
        pText += t.replace(/<[^>]+>/g, '');
      });
    });

    // Giải mã ký tự HTML entities
    pText = pText.replace(/&quot;/g, '"')
                 .replace(/&apos;/g, "'")
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&amp;/g, '&')
                 .trim();

    // 3. Nhận dạng Đầu câu hỏi "Câu X."
    const qMatch = pText.match(qHeaderRegex);
    if (qMatch) {
      finishCurrentQ();
      let qBody = qMatch[2].trim();
      qBody = qBody.replace(/^["'“](.*)["'”]$/, '$1').trim();

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

    // Nếu đoạn này chỉ chứa ảnh đính kèm bổ trợ cho câu hỏi
    if (imagesInP.length > 0 && currentQ) {
      if (currentQ.a.length === 0) {
        currentQ.image = imagesInP[0];
      }
    }

    if (!pText) return;

    // 4. Nhận dạng Phương án trả lời (A, B, C, D hoặc dòng văn bản đáp án)
    if (currentQ) {
      let optText = pText;
      const optMatch = optText.match(optPrefixRegex);
      const isAsteriskCorrect = /^\*/.test(optText) || /\[x\]/i.test(optText);

      if (optMatch) {
        optText = optMatch[4].trim();
      }

      // Xóa dấu ngoặc kép bọc ngoài đáp án nếu có
      optText = optText.replace(/^["'“](.*)["'”]$/, '$1').trim();

      if (optText) {
        const isCorrect = isRed || isUnderline || isAsteriskCorrect;
        currentQ.a.push(optText);
        if (isCorrect) {
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
        // Coi như là một đáp án mới nếu câu hỏi đang tiếp diễn
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
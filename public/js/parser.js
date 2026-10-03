// =======================================================
// EduQuiz Universal Parser (.DOCX & .PPTX & .TXT & .PDF)
// Hỗ trợ trích xuất Câu hỏi, Phương án, Dấu tick ✓, Màu đỏ, In đậm, Gạch chân và Hình ảnh
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

// Nén ảnh nhẹ lại để không vượt quá giới hạn 4.5MB của Vercel & Redis
async function compressImage(dataUrl, maxWidth = 800, quality = 0.72) {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function cleanVietnameseTypo(str) {
  if (!str) return '';
  return str
    .replace(/đ-ợc/g, 'được')
    .replace(/ng-ời/g, 'người')
    .replace(/nh-\s+/g, 'như ')
    .replace(/ch-ơng/g, 'chương')
    .replace(/h-ởng/g, 'hưởng')
    .replace(/t-ơng/g, 'tương')
    .replace(/th-ơng/g, 'thương')
    .replace(/l-u/g, 'lưu')
    .replace(/b-ớc/g, 'bước')
    .replace(/h-ớng/g, 'hướng')
    .replace(/tr-ớc/g, 'trước')
    .replace(/ph-ơng/g, 'phương')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripCorrectnessMarker(text) {
  return text.replace(/^(?:(?:✓|✔|\*|\[x\])\s*)+/i, '').trim();
}

// =======================================================
// XỬ LÝ FILE PDF (.PDF) - Cả PDF có chữ và PDF dạng ảnh scan (OCR)
// =======================================================
async function parsePdfFileDetailed(file) {
  if (!window.pdfjsLib) {
    throw new Error('Thư viện PDF.js chưa được tải. Vui lòng kiểm tra kết nối mạng.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullExtractedText = '';
  const diagnostics = [];
  let pagesWithImages = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items || [];
    const operatorList = await page.getOperatorList();
    const imageOperators = [
      window.pdfjsLib.OPS.paintImageXObject,
      window.pdfjsLib.OPS.paintInlineImageXObject,
      window.pdfjsLib.OPS.paintImageMaskXObject,
      window.pdfjsLib.OPS.paintImageXObjectRepeat
    ].filter(Number.isInteger);
    if (operatorList.fnArray.some(operator => imageOperators.includes(operator))) {
      pagesWithImages++;
    }

    if (items.length > 0) {
      items.sort((a, b) => {
        const yDiff = Math.abs(b.transform[5] - a.transform[5]);
        if (yDiff > 6) {
          return b.transform[5] - a.transform[5];
        }
        return a.transform[4] - b.transform[4];
      });

      let pageLines = [];
      let currentLine = '';
      let lastY = null;

      items.forEach(item => {
        const str = item.str || '';
        if (!str.trim()) return;

        const currentY = item.transform[5];
        if (lastY !== null && Math.abs(currentY - lastY) > 8) {
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          currentLine = str;
        } else {
          currentLine += (currentLine ? ' ' : '') + str;
        }
        lastY = currentY;
      });

      if (currentLine.trim()) pageLines.push(currentLine.trim());
      fullExtractedText += pageLines.join('\n') + '\n\n';
    } else if (window.Tesseract) {
      try {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const ocrResult = await window.Tesseract.recognize(canvas, 'vie+eng');
        const ocrText = ocrResult?.data?.text || '';
        if (ocrText.trim()) {
          fullExtractedText += ocrText + '\n\n';
        }
      } catch (ocrErr) {
        console.warn(`Lỗi OCR trang ${pageNum}:`, ocrErr);
        diagnostics.push(`Trang ${pageNum} không thể nhận dạng chữ qua OCR: ${ocrErr.message}`);
      }
    }
  }

  if (!fullExtractedText.trim()) {
    throw new Error('Không trích xuất được chữ từ file PDF. File có thể là ảnh scan chất lượng thấp hoặc bị khóa bảo vệ.');
  }

  const parsed = parseQuizTextDetailed(fullExtractedText);
  return {
    questions: parsed.questions,
    sourceQuestionCount: parsed.sourceQuestionCount,
    diagnostics: [
      ...diagnostics,
      ...parsed.diagnostics,
      ...(pagesWithImages > 0
        ? [`PDF có hình minh họa trên ${pagesWithImages} trang nhưng không thể giữ đúng ảnh/vị trí khi nhập. Hãy dùng file DOCX gốc để bảo toàn hình.`]
        : [])
    ]
  };
}

// Bóc tách câu hỏi tổng quát từ mọi loại file: .pdf, .docx, .pptx, .txt
async function parseDocxFileDetailed(file) {
  const fileName = (file.name || '').toLowerCase();

  // 1. File PDF
  if (fileName.endsWith('.pdf')) {
    return await parsePdfFileDetailed(file);
  }

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
    let sourceQuestionCount = 0;
    let currentQ = null;
    const qHeaderRegex = /^(?:câu|cau|question|q\s*\.?|bài|bai)\s*(\d+)[\s*:\.\-\)]([\s\S]*)$/i;
    const numberedQRegex = /^(\d+)[\.\:\-\)]([\s\S]*)$/;
    const optPrefixRegex = /^(?:(?:\(([a-eA-E])\)|\[([a-eA-E])\]|([a-eA-E])[\.\:\-\)\]])\s*|[✓✔]\s*|\*\s*)+([\s\S]*)$/;

    function finishCurrentQ() {
      if (!currentQ) return;
      if (currentQ.a.length >= 2) {
        currentQ.options = currentQ.a.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`);
        currentQ.correct = currentQ.c;
        questions.push(currentQ);
      } else if (currentQ.a.length > 0) {
        diagnostics.push(`Câu ${currentQ.sourceNumber} chỉ có ${currentQ.a.length} phương án`);
      } else {
        diagnostics.push(`Câu ${currentQ.sourceNumber} không có phương án trả lời`);
      }
      if (currentQ.a.length >= 2 && currentQ.c === null) {
        diagnostics.push(`Câu ${currentQ.sourceNumber} chưa đánh dấu đáp án đúng`);
      }
    }

    for (const slideKey of slideKeys) {
      const slideXml = zip[slideKey] ? decoder.decode(zip[slideKey]) : '';
      const relsKey = slideKey.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
      const relsXml = zip[relsKey] ? decoder.decode(zip[relsKey]) : '';

      const rels = {};
      const rMatches = relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g);
      for (const m of rMatches) rels[m[1]] = m[2];

      async function getPptImageDataUrl(rId) {
        let target = rels[rId];
        if (!target) return null;
        target = target.replace(/^\.\.\//, 'ppt/');
        if (!target.startsWith('ppt/')) target = 'ppt/' + target;
        const imgData = zip[target];
        if (!imgData) return null;
        const ext = target.split('.').pop().toLowerCase();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        const rawUrl = `data:${mime};base64,${uint8ArrayToBase64(imgData)}`;
        return await compressImage(rawUrl);
      }

      const pMatches = slideXml.match(/<a:p\b[\s\S]*?<\/a:p>/g) || [];
      const slideParagraphs = [];

      for (const pXml of pMatches) {
        const blipMatches = [...pXml.matchAll(/r:embed="([^"]+)"/g)];
        const imagesInP = [];
        for (const m of blipMatches) {
          const imgUrl = await getPptImageDataUrl(m[1]);
          if (imgUrl) imagesInP.push(imgUrl);
        }

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

        pText = cleanVietnameseTypo(pText.trim());
        if (pText || imagesInP.length > 0) {
          slideParagraphs.push({ text: pText, images: imagesInP, isRed, isUnderline });
        }
      }

      slideParagraphs.forEach((item, pIdx) => {
        const { text: pText, images: imagesInP, isRed, isUnderline } = item;

        const qMatch = pText ? (pText.match(qHeaderRegex) || pText.match(numberedQRegex)) : null;
        if (qMatch) {
          finishCurrentQ();
          sourceQuestionCount++;
          let qBody = qMatch[2].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
          currentQ = {
            id: questions.length + 1,
            sourceNumber: Number(qMatch[1]),
            q: qBody || `Câu ${qMatch[1]}`,
            image: imagesInP[0] || null,
            a: [],
            c: null
          };
          return;
        }

        if (!currentQ && pIdx === 0 && pText && (pText.endsWith('?') || slideParagraphs.length >= 3)) {
          finishCurrentQ();
          currentQ = {
            id: questions.length + 1,
            sourceNumber: questions.length + 1,
            q: pText.replace(/^["'“](.*)["'”]$/, '$1').trim(),
            image: imagesInP[0] || null,
            a: [],
            c: null
          };
          sourceQuestionCount++;
          return;
        }

        if (imagesInP.length > 0 && currentQ && currentQ.a.length === 0) {
          currentQ.image = imagesInP[0];
        }

        if (currentQ && pText) {
          let optText = pText;
          const optMatch = optText.match(optPrefixRegex);
          const isAsterisk = /^\*/.test(optText) || /\[x\]/i.test(optText) || /^[✓✔]/.test(optText);
          if (optMatch) optText = optMatch[4].trim();
          optText = stripCorrectnessMarker(optText).replace(/^["'“](.*)["'”]$/, '$1').trim();

          if (optText) {
            currentQ.a.push(optText);
            if (isRed || isUnderline || isAsterisk) {
              currentQ.c = currentQ.a.length - 1;
            }
          }
        }
      });
    }

    finishCurrentQ();
    return { questions, sourceQuestionCount, diagnostics };
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

  const imageCache = {};
  async function getImageDataUrl(rId) {
    if (imageCache[rId]) return imageCache[rId];
    let target = rels[rId];
    if (!target) return null;
    target = target.replace(/^\//, '');
    if (!target.startsWith('word/')) target = 'word/' + target;
    const imgData = zip[target];
    if (!imgData) return null;
    const ext = target.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const rawUrl = `data:${mime};base64,${uint8ArrayToBase64(imgData)}`;
    const compressed = await compressImage(rawUrl);
    imageCache[rId] = compressed;
    return compressed;
  }

  const pMatches = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
  const questions = [];
  const diagnostics = [];
  let sourceQuestionCount = 0;
  let currentQ = null;

  const qHeaderRegex = /^(?:câu|cau|question|q\s*\.?|bài|bai)\s*(\d+)[\s*:\.\-\)]([\s\S]*)$/i;
  const optPrefixRegex = /^(?:\[BOLD:)?\s*(?:(?:\(([a-hA-H])\)|\[([a-hA-H])\]|([a-hA-H])[\.\:\-\)\]])\s*|\*\s*|[✓✔]\s*)+([\s\S]*)$/i;

  function finishCurrentQ() {
    if (!currentQ) return;
    if (currentQ.a.length >= 2) {
      currentQ.options = currentQ.a.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`);
      currentQ.correct = currentQ.c;
      questions.push(currentQ);
    } else if (currentQ.a.length > 0) {
      diagnostics.push(`Câu ${currentQ.sourceNumber} chỉ có ${currentQ.a.length} phương án trả lời`);
    } else {
      diagnostics.push(`Câu ${currentQ.sourceNumber} không có phương án trả lời`);
    }
    if (currentQ.a.length >= 2 && currentQ.c === null) {
      diagnostics.push(`Câu ${currentQ.sourceNumber} chưa đánh dấu đáp án đúng`);
    }
  }

  let activeImage = null;
  let activeImageRequiresFigureReference = null;

  for (const pXml of pMatches) {
    const blipMatches = [...pXml.matchAll(/r:embed="([^"]+)"/g)];
    const imagesInP = [];
    for (const m of blipMatches) {
      const imgUrl = await getImageDataUrl(m[1]);
      if (imgUrl) imagesInP.push(imgUrl);
    }
    if (imagesInP.length < blipMatches.length) {
      diagnostics.push('Không trích xuất được một hoặc nhiều hình trong file Word');
    }

    let isRed = /w:color\s+w:val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(pXml);
    let isUnderline = /<w:u\b/i.test(pXml);
    let hasCheckmark = /[✓✔]/.test(pXml);

    let pText = '';
    const runs = pXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
    runs.forEach(r => {
      if (/w:color\s+w:val="(?:FF0000|red|C00000|E00000|ED1C24|FF1744|F44336|D32F2F)"/i.test(r)) isRed = true;
      if (/<w:u\b/i.test(r)) isUnderline = true;
      if (/[✓✔]/.test(r)) hasCheckmark = true;
      const tMatches = r.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      tMatches.forEach(t => { pText += t.replace(/<[^>]+>/g, ''); });
    });

    pText = cleanVietnameseTypo(
      pText.replace(/&quot;/g, '"')
           .replace(/&apos;/g, "'")
           .replace(/&lt;/g, '<')
           .replace(/&gt;/g, '>')
           .replace(/&amp;/g, '&')
           .trim()
    );

    if (imagesInP.length > 0) {
      activeImage = imagesInP[0];
      activeImageRequiresFigureReference = null;
      if (currentQ && currentQ.a.length === 0) {
        currentQ.image = activeImage;
      }
    }

    if (/^Hình minh họa/i.test(pText)) {
      continue;
    }

    const qMatch = pText.match(qHeaderRegex);
    if (qMatch) {
      finishCurrentQ();
      sourceQuestionCount++;
      let qBody = qMatch[2].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
      const hasFigureReference = /\b(?:hình|ảnh)\s*(?:số\s*)?0?\d+\b/i.test(qBody);
      if (activeImageRequiresFigureReference === null && activeImage) {
        activeImageRequiresFigureReference = hasFigureReference;
      }
      currentQ = {
        id: questions.length + 1,
        sourceNumber: Number(qMatch[1]),
        part: 1,
        q: qBody || `Câu ${qMatch[1]}`,
        image: imagesInP[0] || (activeImage &&
          (!activeImageRequiresFigureReference || hasFigureReference) ? activeImage : null),
        a: [],
        c: null
      };
      continue;
    }

    if (imagesInP.length > 0 && currentQ && currentQ.a.length === 0) {
      currentQ.image = imagesInP[0];
    }

    if (!pText) continue;

    if (currentQ) {
      const isTick = hasCheckmark || /^[✓✔\*\[\]x\s]+/.test(pText) || pText.includes('✓') || pText.includes('✔');
      const optMatch = pText.match(optPrefixRegex);

      if (optMatch) {
        let optText = stripCorrectnessMarker(optMatch[4])
          .replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '')
          .replace(/^["'“](.*)["'”]$/, '$1')
          .trim();

        if (optText) {
          currentQ.a.push(optText);
          if (isRed || isUnderline || isTick) {
            currentQ.c = currentQ.a.length - 1;
          }
        }
      } else if (currentQ.a.length === 0) {
        currentQ.q += ' ' + pText;
      } else if (currentQ.a.length > 0) {
        currentQ.a[currentQ.a.length - 1] += ' ' + pText.replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '').trim();
      }
    }
  }

  finishCurrentQ();
  return { questions, sourceQuestionCount, diagnostics };
}

// Phân tích văn bản thô (hỗ trợ cả định dạng EduQuiz PDF, Word, dán Text thủ công)
function parseQuizTextDetailed(fullText) {
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions = [];
  const diagnostics = [];
  let sourceQuestionCount = 0;
  let current = null;

  const qHeaderRegex = /^(?:câu|cau|question|q\s*\.?|bài|bai)\s*(\d+)[\s*:\.\-\)]([\s\S]*)$/i;
  const optPrefixRegex = /^(?:(?:\(([a-hA-H])\)|\[([a-hA-H])\]|([a-hA-H])[\.\:\-\)\]])\s*|\*\s*|[✓✔]\s*)+([\s\S]*)$/i;

  function finishCurrent() {
    if (!current) return;
    if (current.a.length >= 2) {
      current.options = current.a.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`);
      current.correct = current.c;
      questions.push(current);
    } else if (current.a.length > 0) {
      diagnostics.push(`Câu ${current.sourceNumber} chỉ có ${current.a.length} phương án`);
    } else {
      diagnostics.push(`Câu ${current.sourceNumber} không có phương án trả lời`);
    }
    if (current.a.length >= 2 && current.c === null) {
      diagnostics.push(`Câu ${current.sourceNumber} chưa đánh dấu đáp án đúng`);
    }
  }

  lines.forEach(line => {
    const cleanLine = cleanVietnameseTypo(line);
    const qMatch = cleanLine.match(qHeaderRegex);

    if (qMatch) {
      finishCurrent();
      sourceQuestionCount++;
      current = {
        id: questions.length + 1,
        sourceNumber: Number(qMatch[1]),
        part: 1,
        q: qMatch[2].trim() || `Câu ${qMatch[1]}`,
        image: null,
        a: [],
        c: null
      };
      return;
    }

    if (current) {
      const isTick = /^[✓✔\*\[\]x\s]+/.test(cleanLine) || cleanLine.includes('✓') || cleanLine.includes('✔');
      const optMatch = cleanLine.match(optPrefixRegex);

      if (optMatch) {
        let optText = stripCorrectnessMarker(optMatch[4])
          .replace(/TB\s*\(\d+\)\s*=\s*.*$/i, '')
          .trim();

        if (optText) {
          current.a.push(optText);
          if (isTick) {
            current.c = current.a.length - 1;
          }
        }
      } else if (current.a.length === 0) {
        current.q += ' ' + cleanLine;
      } else {
        current.a[current.a.length - 1] += ' ' + cleanLine;
      }
    }
  });

  finishCurrent();
  return { questions, sourceQuestionCount, diagnostics };
}
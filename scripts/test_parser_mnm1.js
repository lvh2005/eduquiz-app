import fs from 'fs';

const mnm1Paras = JSON.parse(fs.readFileSync('c:/Users/LEVUHA/Desktop/eduquiz-app/scripts/mnm1_paras.json', 'utf8'));

// Let's write a parser for mnm1
function parseMnm1() {
  const questions = [];
  let currentSection = "Mã nguồn mở";
  let currentQ = null;
  let currentOptions = [];
  let pendingImages = [];

  for (let i = 0; i < mnm1Paras.length; i++) {
    const item = mnm1Paras[i];
    let text = item.text.trim();
    const images = item.images;

    // Check if section header
    if (/^\[BOLD:Phần\s*\d+\]/i.test(text) || /^Phần\s*\d+/i.test(text)) {
      currentSection = text.replace(/\[BOLD:(.*?)\]/g, '$1').trim();
      continue;
    }

    // Collect pending images
    if (images && images.length > 0) {
      for (let img of images) {
        // e.g. media/image1.png -> IMAGE_1
        const imgMatch = img.match(/image(\d+)/i);
        const imgId = imgMatch ? `IMAGE_${imgMatch[1]}` : img;
        if (!pendingImages.includes(imgId)) {
          pendingImages.push(imgId);
        }
      }
    }

    // Check if question header
    // Pattern: [BOLD:Câu 56. Nhìn vào hình 01...] or Câu 56: ...
    const cleanText = text.replace(/\[BOLD:(.*?)\]/g, '$1').trim();
    const qMatch = cleanText.match(/^Câu\s*(\d+)[\.\:](?:\s*\(.*?\))?\s*(.*)$/i);

    if (qMatch) {
      if (currentQ) {
        finalizeQuestion(currentQ, currentOptions, pendingImages);
        questions.push(currentQ);
        pendingImages = [];
      }

      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();

      currentQ = {
        question_number: qNum,
        raw_text: qText,
        section: currentSection,
        question_type: "SINGLE_CHOICE",
        images: [],
        options: [],
        correct_answer: null,
        explanation: ""
      };
      currentOptions = [];
      continue;
    }

    // If we are inside a question, check if it's an option or continuation of question text or image note
    if (currentQ) {
      if (/^Hình minh họa theo file gốc/i.test(cleanText)) {
        continue;
      }

      // Check if option: e.g. "A. ...", "[BOLD:✓ A. 1]", "✓ A. ...", "[BOLD:A. ...]"
      // Regex for option:
      // Optional [BOLD:
      // Optional (✓|✔|\*|\[x\])
      // Key: A|B|C|D|E|F|G|H
      // . or : or )
      // Text
      const optMatch = text.match(/^(?:\[BOLD:)?\s*(✓|✔|\*|\[x\])?\s*([A-H])[\.\:\)]\s*(.*)$/i);
      if (optMatch) {
        let hasTick = Boolean(optMatch[1]) || text.includes('✓') || text.includes('✔');
        let key = optMatch[2].toUpperCase();
        let optText = optMatch[3].replace(/\[BOLD:(.*?)\]/g, '$1').replace(/[✓✔\*]/g, '').replace(/\]$/, '').trim();
        
        // Also check if the whole option line was bolded and if that meant correct
        // But in mnm1, correct answers have ✓
        currentOptions.push({
          key: key,
          text: optText,
          is_correct: hasTick
        });
      } else if (cleanText.length > 0 && !currentOptions.length) {
        // Append to question text
        currentQ.raw_text += " " + cleanText;
      }
    }
  }

  if (currentQ) {
    finalizeQuestion(currentQ, currentOptions, pendingImages);
    questions.push(currentQ);
  }

  return questions;
}

function finalizeQuestion(q, options, pendingImages) {
  // If there were pending images before or inside question
  let allImgs = [...pendingImages];
  
  // Also check if raw_text mentions [IMAGE_X]
  let text = q.raw_text;
  for (let img of allImgs) {
    if (!text.includes(`[${img}]`)) {
      text = `${text} [${img}]`;
    }
  }
  
  q.question_text = text.trim();
  delete q.raw_text;
  q.images = allImgs;
  q.options = options;

  // Determine correct answer(s)
  const correctOpts = options.filter(o => o.is_correct);
  if (correctOpts.length === 1) {
    q.correct_answer = correctOpts[0].key;
    q.question_type = "SINGLE_CHOICE";
  } else if (correctOpts.length > 1) {
    q.correct_answer = correctOpts.map(o => o.key).join(',');
    q.question_type = "MULTIPLE_CHOICE";
  } else {
    q.correct_answer = null;
    q.question_type = "SINGLE_CHOICE";
  }
}

const parsed = parseMnm1();
console.log('Parsed questions count:', parsed.length);
console.log('Questions without correct answer:', parsed.filter(q => !q.correct_answer).map(q => q.question_number));
console.log('Questions with images:', parsed.filter(q => q.images.length > 0).map(q => ({ num: q.question_number, text: q.question_text, imgs: q.images })));
console.log('Sample parsed Q56:', JSON.stringify(parsed.find(q => q.question_number === 56), null, 2));

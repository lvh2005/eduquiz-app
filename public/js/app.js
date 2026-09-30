const EXAM_ID = 'hubt_csdl_2tc';

let allQuestions = [];
let activeQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let flaggedQuestions = new Set();
let timerInterval = null;
let autoNextTimer = null;
let autoNextTick = null;
let secondsElapsed = 0;
let currentFilter = 'all';
let selectedPart = 'all';
let selectedSubject = 'all';

let settings = {
  shuffleQ: false,
  shuffleOpt: false,
  instantFeedback: true,
  autoNext: false,
  autoNextDelay: 2
};

// 1. Lấy dữ liệu đề thi từ Vercel Serverless API
async function fetchExam() {
  try {
    const res = await fetch(`/api/exam?id=${EXAM_ID}`);
    if (res.ok) {
      const data = await res.json();
      allQuestions = data.questions || [];
      if (data.title) document.getElementById('dashExamTitle').innerText = data.title;
      const subject = data.subject || allQuestions[0]?.subject || data.title;
      allQuestions.forEach(question => {
        if (!question.subject) question.subject = subject || 'Chưa đặt môn';
      });
      if (subject) document.getElementById('dashCoverTitle').innerText = subject.toUpperCase();
    } else {
      console.warn('Chưa có đề trên Redis. Hãy tải file Word lên!');
    }
  } catch (err) {
    console.error('Lỗi fetchExam:', err);
  }
  refreshDashboard();
}

function refreshDashboard() {
  document.getElementById('dashTotalQ').innerText = allQuestions.length;
  const subjects = Array.from(new Set(allQuestions.map(q => q.subject || 'Chưa đặt môn'))).sort();
  const container = document.getElementById('partsContainer');
  let html = `<div class="subject-card ${selectedSubject === 'all' ? 'active' : ''}" onclick="startSubject('all')"><span class="subject-card-name">Tất cả</span><span class="subject-card-count">${allQuestions.length} câu</span></div>`;
  subjects.forEach(subject => {
    const count = allQuestions.filter(q => (q.subject || 'Chưa đặt môn') === subject).length;
    const safeSubject = subject.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const subjectArgument = JSON.stringify(subject).replace(/"/g, '&quot;');
    html += `<div class="subject-card ${selectedSubject === subject ? 'active' : ''}" onclick="startSubject(${subjectArgument})"><span class="subject-card-name">${safeSubject}</span><span class="subject-card-count">${count} câu</span><button class="subject-card-delete" title="Xóa môn này" aria-label="Xóa môn này" onclick="event.stopPropagation(); deleteSubject(${subjectArgument})"><i class="fa-solid fa-trash"></i></button></div>`;
  });
  container.innerHTML = html;
}

function selectPart(p) {
  selectedPart = p;
  refreshDashboard();
}

function startSubject(subject) {
  selectedSubject = subject;
  openStartModal();
}

async function deleteSubject(subject) {
  if (!confirm(`Xóa toàn bộ ${subject} khỏi đề thi?`)) return;
  try {
    const res = await fetch(`/api/exam?id=${EXAM_ID}&subject=${encodeURIComponent(subject)}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Không thể xóa môn');
    if (selectedSubject === subject) selectedSubject = 'all';
    await fetchExam();
  } catch (err) {
    alert('Lỗi xóa môn: ' + err.message);
  }
}

// 2. Upload file Word .docx -> Parse trên Client -> Đẩy JSON lên Vercel API
async function handleWordFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const subject = document.getElementById('subjectInput').value.trim();
    if (!subject) return alert('Vui lòng nhập tên môn trước khi tải file Word!');
    const text = await extractTextFromDocx(file);
    const parsedQuestions = parseQuizText(text);

    if (parsedQuestions.length === 0) {
      return alert('Không bóc tách được câu hỏi nào từ file Word! Hãy kiểm tra định dạng.');
    }

    const title = file.name.replace(/\.[^/.]+$/, '');
    parsedQuestions.forEach(question => { question.subject = subject; });
    const res = await fetch(`/api/exam?id=${EXAM_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, questions: parsedQuestions })
    });

    const result = await res.json();
    if (result.success) {
      alert(`🎉 Đã lưu ${result.count} câu hỏi lên Upstash Redis!`);
      closeModal('uploadModal');
      document.getElementById('subjectInput').value = '';
      await fetchExam();
    } else {
      alert('Lỗi: ' + result.error);
    }
  } catch (err) {
    alert('Lỗi xử lý file: ' + err.message);
  }
  e.target.value = '';
}

// 3. Xử lý dán Text thô
async function handleRawTextSubmit() {
  const text = document.getElementById('rawTextarea').value;
  if (!text.trim()) return alert('Vui lòng dán nội dung câu hỏi!');
  const subject = document.getElementById('subjectInput').value.trim();
  if (!subject) return alert('Vui lòng nhập tên môn trước khi lưu câu hỏi!');

  const parsed = parseQuizText(text);
  if (parsed.length === 0) return alert('Không nhận dạng được câu hỏi!');
  parsed.forEach(question => { question.subject = subject; });

  try {
    const res = await fetch(`/api/exam?id=${EXAM_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Đề thi trắc nghiệm', subject, questions: parsed })
    });
    const result = await res.json();
    if (result.success) {
      alert(`🎉 Đã lưu ${result.count} câu hỏi vào Redis!`);
      closeModal('uploadModal');
      document.getElementById('rawTextarea').value = '';
      document.getElementById('subjectInput').value = '';
      await fetchExam();
    }
  } catch (err) {
    alert('Lỗi lưu Redis: ' + err.message);
  }
}

// 4. Bắt đầu làm bài
function applySettingsAndStart() {
  settings.shuffleQ = document.getElementById('settingShuffleQ').checked;
  settings.shuffleOpt = document.getElementById('settingShuffleOpt').checked;
  settings.instantFeedback = document.getElementById('settingInstantFeedback').checked;
  settings.autoNext = document.getElementById('settingAutoNext').checked;
  settings.autoNextDelay = Number(document.getElementById('settingAutoNextDelay').value);
  isSoundEnabled = document.getElementById('settingSound').checked;
  closeModal('settingsModal');

  let list = [...allQuestions];
  if (selectedSubject !== 'all') list = list.filter(q => (q.subject || 'Chưa đặt môn') === selectedSubject);
  if (selectedPart !== 'all') list = list.filter(q => (q.part || 1) == selectedPart);
  if (list.length === 0) return alert('Phần này chưa có câu hỏi!');

  if (settings.shuffleQ) list.sort(() => Math.random() - 0.5);

  activeQuestions = list.map(item => {
    if (!settings.shuffleOpt) return { ...item };
    const combined = item.a.map((txt, idx) => ({ txt, isCorrect: idx === item.c }));
    combined.sort(() => Math.random() - 0.5);
    return {
      ...item,
      a: combined.map(c => c.txt),
      c: combined.findIndex(c => c.isCorrect)
    };
  });

  currentIndex = 0;
  userAnswers = {};
  flaggedQuestions.clear();
  clearAutoNext();
  secondsElapsed = 0;

  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('quiz-view').style.display = 'block';

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const s = String(secondsElapsed % 60).padStart(2, '0');
    document.getElementById('quizTimer').innerText = `${m}:${s}`;
  }, 1000);

  renderQuestion();
  renderGrid();
}

function renderQuestion() {
  const q = activeQuestions[currentIndex];
  if (!q) return;

  document.getElementById('qCurrentBadge').innerText = `Câu ${currentIndex + 1} / ${activeQuestions.length}`;
  document.getElementById('qQuestionText').innerText = q.q;

  const flagBtn = document.getElementById('flagBtn');
  flagBtn.innerHTML = flaggedQuestions.has(q.id) ? '<i class="fa-solid fa-bookmark" style="color:var(--warning);"></i>' : '<i class="fa-regular fa-bookmark"></i>';

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const container = document.getElementById('qOptionsContainer');
  container.innerHTML = '';
  const ans = userAnswers[q.id];

  q.a.forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'opt-item';

    if (ans !== undefined) {
      if (settings.instantFeedback) {
        if (idx === q.c) div.classList.add('correct');
        else if (idx === ans) div.classList.add('wrong');
      } else {
        if (idx === ans) div.classList.add('selected');
      }
    }

    div.innerHTML = `<div class="opt-circle">${letters[idx]}</div><div>${opt}</div>`;
    div.onclick = () => selectOption(idx);
    container.appendChild(div);
  });

  document.getElementById('btnPrevQ').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('btnNextQ').innerHTML = currentIndex === activeQuestions.length - 1 ? 'Nộp bài <i class="fa-solid fa-check"></i>' : 'Câu tiếp <i class="fa-solid fa-chevron-right"></i>';
  document.getElementById('progressText').innerText = `${Object.keys(userAnswers).length}/${activeQuestions.length}`;
}

function selectOption(idx) {
  const q = activeQuestions[currentIndex];
  const isFirst = userAnswers[q.id] === undefined;
  userAnswers[q.id] = idx;

  if (settings.instantFeedback && isFirst) {
    if (idx === q.c) playSound('correct');
    else playSound('wrong');
  }
  renderQuestion();
  renderGrid();
  if (settings.autoNext && currentIndex < activeQuestions.length - 1) scheduleAutoNext();
  else clearAutoNext();
}

function clearAutoNext() {
  clearTimeout(autoNextTimer);
  clearInterval(autoNextTick);
  autoNextTimer = null;
  autoNextTick = null;
}

function scheduleAutoNext() {
  clearAutoNext();
  const deadline = Date.now() + settings.autoNextDelay * 1000;
  const button = document.getElementById('btnNextQ');
  const updateCountdown = () => {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    button.innerHTML = `<i class="fa-regular fa-clock"></i> Câu tiếp (${remaining}s) <i class="fa-solid fa-chevron-right"></i>`;
  };

  updateCountdown();
  autoNextTick = setInterval(updateCountdown, 100);
  autoNextTimer = setTimeout(() => {
    clearAutoNext();
    nextQuestion();
  }, settings.autoNextDelay * 1000);
}

function prevQuestion() {
  clearAutoNext();
  if (currentIndex > 0) { currentIndex--; renderQuestion(); }
}
function nextQuestion() {
  clearAutoNext();
  if (currentIndex < activeQuestions.length - 1) { currentIndex++; renderQuestion(); }
  else submitExam();
}
function toggleFlagCurrent() {
  const q = activeQuestions[currentIndex];
  if (flaggedQuestions.has(q.id)) flaggedQuestions.delete(q.id);
  else flaggedQuestions.add(q.id);
  renderQuestion();
  renderGrid();
}

function renderGrid() {
  const dGrid = document.getElementById('desktopQuestionGrid');
  const mGrid = document.getElementById('mobileQuestionGrid');

  const html = activeQuestions.map((q, idx) => {
    const ans = userAnswers[q.id];
    let cls = 'q-cell';
    if (idx === currentIndex) cls += ' current';
    if (ans !== undefined) {
      if (settings.instantFeedback) cls += (ans === q.c) ? ' correct' : ' wrong';
      else cls += ' answered';
    }

    if (currentFilter === 'unanswered' && ans !== undefined) return '';
    if (currentFilter === 'wrong' && (ans === undefined || ans === q.c)) return '';

    return `<div class="${cls}" onclick="jumpQuestion(${idx})">${idx + 1}</div>`;
  }).join('');

  dGrid.innerHTML = html;
  mGrid.innerHTML = html;
}

function jumpQuestion(idx) {
  clearAutoNext();
  currentIndex = idx;
  renderQuestion();
  const drawer = document.getElementById('mobileDrawer');
  if (drawer.classList.contains('open')) toggleMobileDrawer();
}

function setGridFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.classList.toggle('active', tag.getAttribute('onclick').includes(f));
  });
  renderGrid();
}

function submitExam() {
  clearAutoNext();
  let correct = 0, wrong = 0, unanswered = 0;
  activeQuestions.forEach(q => {
    const ans = userAnswers[q.id];
    if (ans === undefined) unanswered++;
    else if (ans === q.c) correct++;
    else wrong++;
  });

  const score = ((correct / activeQuestions.length) * 10).toFixed(1);
  document.getElementById('resultScore').innerText = score;
  document.getElementById('statCorrect').innerText = correct;
  document.getElementById('statWrong').innerText = wrong;
  document.getElementById('statUnanswered').innerText = unanswered;

  if (score >= 8.5) playSound('fanfare');
  document.getElementById('resultModal').style.display = 'flex';
  clearInterval(timerInterval);
}

function retryWrongQuestions() {
  clearAutoNext();
  const wrongs = activeQuestions.filter(q => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.c);
  if (wrongs.length === 0) return alert('Bạn không làm sai câu nào!');
  activeQuestions = wrongs;
  currentIndex = 0;
  userAnswers = {};
  closeModal('resultModal');
  renderQuestion();
  renderGrid();
}

function goToDashboard() {
  clearAutoNext();
  document.getElementById('dashboard-view').style.display = 'block';
  document.getElementById('quiz-view').style.display = 'none';
  clearInterval(timerInterval);
}
function openStartModal() { document.getElementById('settingsModal').style.display = 'flex'; }
function openUploadModal() { document.getElementById('uploadModal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleMobileDrawer() {
  const d = document.getElementById('mobileDrawer');
  const o = document.getElementById('mobileDrawerOverlay');
  d.classList.toggle('open');
  o.style.display = d.classList.contains('open') ? 'block' : 'none';
}
function toggleDarkMode() { document.body.classList.toggle('dark'); }
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  document.getElementById('soundHeaderBtn').innerHTML = isSoundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
}
function copyShareLink() {
  navigator.clipboard.writeText(window.location.href);
  alert('Đã sao chép link!');
}
function exportQuestionsJSON() {
  const blob = new Blob([JSON.stringify(allQuestions, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'eduquiz_backup.json';
  a.click();
}

window.addEventListener('keydown', (e) => {
  if (document.getElementById('quiz-view').style.display !== 'block') return;
  const k = e.key.toUpperCase();
  if (['A','B','C','D'].includes(k)) selectOption({ A:0, B:1, C:2, D:3 }[k]);
  else if (e.key === 'ArrowLeft') prevQuestion();
  else if (e.key === 'ArrowRight') nextQuestion();
});

window.onload = () => {
  fetchExam();
};
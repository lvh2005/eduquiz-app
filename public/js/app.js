const EXAM_ID = 'hubt_csdl_2tc';

let isAdmin = false;
const presenceSessionId = sessionStorage.getItem('eduquizPresenceId') || (window.crypto && typeof window.crypto.randomUUID === 'function'
  ? window.crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const randomValue = Math.random() * 16 | 0;
    return (character === 'x' ? randomValue : (randomValue & 0x3 | 0x8)).toString(16);
  }));
sessionStorage.setItem('eduquizPresenceId', presenceSessionId);
let sharedLocation = null;
try {
  sharedLocation = JSON.parse(sessionStorage.getItem('eduquizSharedLocation') || 'null');
} catch {}

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

function getSubjectStats(str, count) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const views = Math.max(count * 3, (abs % 1800) + 120);
  const plays = Math.max(Math.floor(count * 1.2), Math.floor(views * 0.45) + 25);
  const monthly = Math.max(15, (abs % 75) + 18);
  const formattedViews = views >= 1000 ? (views / 1000).toFixed(1) + 'k' : String(views);
  const formattedPlays = plays >= 1000 ? (plays / 1000).toFixed(1) + 'k' : String(plays);
  return { views: formattedViews, plays: formattedPlays, monthly };
}

function refreshDashboard() {
  document.getElementById('dashTotalQ').innerText = allQuestions.length;
  const subjects = Array.from(new Set(allQuestions.map(q => q.subject || 'Chưa đặt môn'))).sort();
  const container = document.getElementById('partsContainer');
  if (!container) return;

  if (allQuestions.length === 0) {
    container.innerHTML = `
      <div class="empty-exams-state">
        <i class="fa-regular fa-folder-open" style="font-size:42px; color:var(--gray-400); margin-bottom:12px;"></i>
        <p style="font-weight:700; font-size:16px;">Chưa có đề thi nào trong hệ thống</p>
        <p style="color:var(--gray-500); font-size:13.5px; margin-top:6px;">Hãy nhấn nút <b>"Thêm đề thi (.docx)"</b> để tải bộ câu hỏi lên</p>
        <button class="btn-cta-upload" style="margin-top:16px;" onclick="openUploadModal()"><i class="fa-solid fa-cloud-arrow-up"></i> Tải đề lên ngay</button>
      </div>`;
    return;
  }

  let html = '';

  // 1. Nếu có nhiều hơn 1 môn, hiển thị card "Tất cả đề thi"
  if (subjects.length > 1) {
    const allStats = getSubjectStats('Tất cả đề thi', allQuestions.length);
    html += `
      <div class="trending-card ${selectedSubject === 'all' ? 'active' : ''}" onclick="startSubject('all')">
        <div class="trending-card-banner">
          <div class="banner-notebook-bg">
            <div class="banner-school">Trường Đại học Kinh doanh<br>và Công nghệ Hà Nội</div>
            <div class="banner-subject-red">TỔNG HỢP TOÀN BỘ ĐỀ THI<br><span class="banner-tc">(TẤT CẢ MÔN)</span></div>
            <div class="banner-year">2026</div>
          </div>
          <div class="banner-actions">
            <button class="banner-btn-icon heart" title="Yêu thích" onclick="event.stopPropagation(); toggleHeart(this)">
              <i class="fa-regular fa-heart"></i>
            </button>
          </div>
        </div>
        <div class="trending-card-body">
          <h3 class="trending-card-title" title="Tổng hợp toàn bộ các môn thi HUBT">
            Tổng hợp toàn bộ đề thi HUBT (Tất cả môn)
          </h3>
          <div class="trending-card-author">
            <span class="author-avatar-sm">T</span>
            <span class="author-name-sm">TNM HUBT</span>
          </div>
          <div class="trending-stats-row">
            <span><i class="fa-regular fa-circle-question"></i> ${allQuestions.length} câu</span>
            <span><i class="fa-regular fa-eye"></i> ${allStats.views}</span>
            <span><i class="fa-regular fa-circle-play"></i> ${allStats.plays}</span>
            <span class="rating"><i class="fa-solid fa-star"></i> 5.0</span>
          </div>
          <div class="trending-tags-row">
            <span class="trending-tag"><i class="fa-solid fa-building-columns"></i> HUBT</span>
            <span class="trending-tag"><i class="fa-solid fa-graduation-cap"></i> Ôn Thi Sinh Viên</span>
          </div>
          <div class="trending-date">23/09/2026</div>
          <div class="trending-footer">
            <span class="fire-flame">🔥</span>
            <span>${allStats.monthly} lượt luyện thi 30 ngày qua</span>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Từng môn thi
  subjects.forEach(subject => {
    const count = allQuestions.filter(q => (q.subject || 'Chưa đặt môn') === subject).length;
    const safeSubject = subject.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const subjectArg = JSON.stringify(subject).replace(/"/g, '&quot;');
    const stats = getSubjectStats(subject, count);

    let displaySubjectRed = safeSubject.toUpperCase();
    if (!displaySubjectRed.includes('TC') && !displaySubjectRed.includes('TÍN')) {
      displaySubjectRed += '<br><span class="banner-tc">(2TC)</span>';
    }

    html += `
      <div class="trending-card ${selectedSubject === subject ? 'active' : ''}" onclick="startSubject(${subjectArg})">
        <div class="trending-card-banner">
          <div class="banner-notebook-bg">
            <div class="banner-school">Trường Đại học Kinh doanh<br>và Công nghệ Hà Nội</div>
            <div class="banner-subject-red">${displaySubjectRed}</div>
            <div class="banner-year">2026</div>
          </div>
          <div class="banner-actions">
            <button class="banner-btn-icon heart" title="Yêu thích" onclick="event.stopPropagation(); toggleHeart(this)">
              <i class="fa-regular fa-heart"></i>
            </button>
            <button class="banner-btn-icon trash" title="Xóa môn thi này" onclick="event.stopPropagation(); deleteSubject(${subjectArg})">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
        <div class="trending-card-body">
          <h3 class="trending-card-title" title="${safeSubject} HUBT (2TC)">
            ${safeSubject} HUBT (2TC)
          </h3>
          <div class="trending-card-author">
            <span class="author-avatar-sm">T</span>
            <span class="author-name-sm">TNM HUBT</span>
          </div>
          <div class="trending-stats-row">
            <span><i class="fa-regular fa-circle-question"></i> ${count} câu</span>
            <span><i class="fa-regular fa-eye"></i> ${stats.views}</span>
            <span><i class="fa-regular fa-circle-play"></i> ${stats.plays}</span>
            <span class="rating"><i class="fa-solid fa-star"></i> 5.0</span>
          </div>
          <div class="trending-tags-row">
            <span class="trending-tag"><i class="fa-solid fa-building-columns"></i> HUBT</span>
            <span class="trending-tag"><i class="fa-solid fa-graduation-cap"></i> Ôn Thi Sinh Viên</span>
          </div>
          <div class="trending-date">23/09/2026</div>
          <div class="trending-footer">
            <span class="fire-flame">🔥</span>
            <span>${stats.monthly} lượt luyện thi 30 ngày qua</span>
          </div>
        </div>
      </div>
    `;
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

function toggleHeart(button) {
  const icon = button.querySelector('i');
  if (icon.classList.contains('fa-solid')) {
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
    button.classList.remove('favorited');
  } else {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
    button.classList.add('favorited');
  }
}

async function deleteSubject(subject) {
  if (!confirm(`Bạn có chắc muốn xóa môn "${subject}" khỏi đề thi?`)) return;
  try {
    const res = await fetch(`/api/exam?id=${EXAM_ID}&subject=${encodeURIComponent(subject)}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Không thể xóa môn');
    alert(`Đã xóa thành công môn "${subject}"!`);
    if (selectedSubject === subject) selectedSubject = 'all';
    await fetchExam();
  } catch (err) {
    alert('Lỗi xóa môn: ' + err.message);
  }
}

// 2. Upload file Word .docx -> Parse trên Client (hỗ trợ ảnh + màu đỏ + gạch chân) -> Đẩy JSON lên Vercel API
async function handleWordFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const rawSubject = document.getElementById('subjectInput').value.trim();
    const defaultSubject = file.name.replace(/\.[^/.]+$/, '').replace(/^[ÔƠO]N\s*TU[ẦA]N\s*\d+_?/i, '').replace(/_/g, ' ');
    const subject = rawSubject || defaultSubject || 'Môn học mới';

    // Parse DOCX trực tiếp để trích xuất cả Ảnh, Đáp án màu đỏ/gạch chân và Câu hỏi
    const parsedResult = await parseDocxFileDetailed(file);
    const parsedQuestions = parsedResult.questions;

    if (parsedQuestions.length === 0) {
      return alert('Không bóc tách được câu hỏi nào từ file Word! Hãy kiểm tra định dạng file.');
    }

    if (parsedResult.diagnostics.length > 0) {
      console.warn('Diagnostics khi đọc file:', parsedResult.diagnostics);
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
      const imgCount = parsedQuestions.filter(q => q.image).length;
      alert(`🎉 Đã lưu thành công ${result.count} câu hỏi vào đề thi!${imgCount > 0 ? ` (Bao gồm ${imgCount} câu có hình ảnh minh họa)` : ''}`);
      closeModal('uploadModal');
      document.getElementById('subjectInput').value = '';
      await fetchExam();
    } else {
      alert('Lỗi lưu đề: ' + (result.error || 'Không thể cập nhật'));
    }
  } catch (err) {
    alert('Lỗi xử lý file docx: ' + err.message);
  }
  e.target.value = '';
}

// 3. Xử lý dán Text thô
async function handleRawTextSubmit() {
  const text = document.getElementById('rawTextarea').value;
  if (!text.trim()) return alert('Vui lòng dán nội dung câu hỏi!');
  const subject = document.getElementById('subjectInput').value.trim();
  if (!subject) return alert('Vui lòng nhập tên môn trước khi lưu câu hỏi!');

  const parsedResult = parseQuizTextDetailed(text);
  const parsed = parsedResult.questions;
  if (parsed.length === 0) return alert('Không nhận dạng được câu hỏi!');
  if (parsedResult.diagnostics.length > 0) {
    alert(`Đã đọc ${parsed.length} câu, nhưng có cảnh báo:\n\n- ${parsedResult.diagnostics.join('\n- ')}`);
  }
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

  // Hiển thị ảnh minh họa câu hỏi nếu có
  const imgBox = document.getElementById('qImageContainer');
  if (imgBox) {
    if (q.image) {
      imgBox.innerHTML = `
        <div class="q-image-wrapper">
          <img src="${q.image}" alt="Hình ảnh minh họa câu hỏi" class="quiz-question-image" onclick="openImageZoom('${q.image}')" />
          <span class="q-image-hint"><i class="fa-solid fa-magnifying-glass-plus"></i> Bấm vào ảnh để xem kích thước lớn</span>
        </div>`;
      imgBox.style.display = 'block';
    } else {
      imgBox.innerHTML = '';
      imgBox.style.display = 'none';
    }
  }

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

    const circle = document.createElement('div');
    circle.className = 'opt-circle';
    circle.textContent = letters[idx];

    const text = document.createElement('div');
    text.textContent = opt;

    div.append(circle, text);
    div.onclick = () => selectOption(idx);
    container.appendChild(div);
  });

  document.getElementById('btnPrevQ').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('btnNextQ').innerHTML = currentIndex === activeQuestions.length - 1 ? 'Nộp bài <i class="fa-solid fa-check"></i>' : 'Câu tiếp <i class="fa-solid fa-chevron-right"></i>';
  document.getElementById('progressText').innerText = `${Object.keys(userAnswers).length}/${activeQuestions.length}`;
}

function openImageZoom(src) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImage');
  if (modal && img) {
    img.src = src;
    modal.style.display = 'flex';
  }
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
function openUploadModal() {
  document.getElementById('uploadModal').style.display = 'flex';
}
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

async function sendPresenceHeartbeat() {
  try {
    await fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: presenceSessionId, location: sharedLocation })
    });
  } catch (error) {
    console.warn('Không gửi được heartbeat:', error);
  }
}

function renderLocationSharing() {
  const button = document.getElementById('locationShareButton');
  const title = document.getElementById('locationShareTitle');
  const description = document.getElementById('locationShareDescription');
  if (!button || !title || !description) return;

  if (sharedLocation) {
    title.innerText = 'Bạn đang chia sẻ vị trí';
    description.innerText = 'Chỉ quản trị viên xem được vị trí. Dữ liệu tự xóa trong tối đa 3 phút sau lần gửi cuối hoặc khi bạn dừng chia sẻ.';
    button.innerHTML = '<i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i> Ngừng chia sẻ';
  } else {
    title.innerText = 'Chia sẻ vị trí (không bắt buộc)';
    description.innerText = 'Chỉ quản trị viên xem được vị trí sau khi bạn đồng ý. Tọa độ tự xóa trong tối đa 3 phút.';
    button.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i> Chia sẻ vị trí';
  }
}

function toggleLocationSharing() {
  if (sharedLocation) {
    sharedLocation = null;
    sessionStorage.removeItem('eduquizSharedLocation');
    renderLocationSharing();
    sendPresenceHeartbeat();
    return;
  }

  if (!navigator.geolocation) return alert('Trình duyệt này không hỗ trợ định vị.');
  navigator.geolocation.getCurrentPosition(position => {
    sharedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
    sessionStorage.setItem('eduquizSharedLocation', JSON.stringify(sharedLocation));
    renderLocationSharing();
    sendPresenceHeartbeat();
  }, error => {
    const message = error.code === error.PERMISSION_DENIED
      ? 'Bạn chưa cấp quyền vị trí. Có thể bật quyền trong cài đặt trình duyệt.'
      : 'Không lấy được vị trí. Hãy thử lại khi trình duyệt cho phép định vị.';
    alert(message);
  }, { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 });
}

function initializePresence() {
  renderLocationSharing();
  sendPresenceHeartbeat();
  setInterval(sendPresenceHeartbeat, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sendPresenceHeartbeat();
  });
}

window.addEventListener('keydown', (e) => {
  if (document.getElementById('quiz-view').style.display !== 'block') return;
  const k = e.key.toUpperCase();
  if (['A','B','C','D'].includes(k)) selectOption({ A:0, B:1, C:2, D:3 }[k]);
  else if (e.key === 'ArrowLeft') prevQuestion();
  else if (e.key === 'ArrowRight') nextQuestion();
});

window.onload = async () => {
  try {
    const response = await fetch('/api/admin-auth');
    const session = response.ok ? await response.json() : { authenticated: false };
    isAdmin = session.authenticated === true;
  } catch {
    isAdmin = false;
  }
  initializePresence();
  await fetchExam();

  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.trending-card');
      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }
};
const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const dashboardMessage = document.getElementById('dashboardMessage');
const logoutButton = document.getElementById('logoutButton');
const sessionList = document.getElementById('sessionList');
let refreshTimer = null;

function showDashboard(isAuthenticated) {
  loginPanel.hidden = isAuthenticated;
  dashboard.hidden = !isAuthenticated;
  logoutButton.hidden = !isAuthenticated;
  if (isAuthenticated) {
    refreshStats();
    clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshStats, 15000);
  } else {
    clearInterval(refreshTimer);
  }
}

function renderSessions(sessions) {
  sessionList.replaceChildren();
  if (!sessions.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Chưa có phiên nào hoạt động.';
    sessionList.append(empty);
    return;
  }

  sessions.sort((first, second) => second.lastSeen - first.lastSeen).forEach((session, index) => {
    const row = document.createElement('li');
    row.className = 'session-row';

    const activity = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'session-title';
    title.textContent = `Phiên ${index + 1}`;
    const time = document.createElement('div');
    time.className = 'session-time';
    time.textContent = `Hoạt động lúc ${new Date(session.lastSeen).toLocaleTimeString('vi-VN')}`;
    activity.append(title, time);

    const location = document.createElement('div');
    location.className = 'session-location';
    if (session.location) {
      if (session.location.label) {
        location.textContent = session.location.label;
        if (session.location.latitude && session.location.longitude) {
          const mapLink = document.createElement('a');
          mapLink.href = `https://www.google.com/maps?q=${session.location.latitude},${session.location.longitude}`;
          mapLink.target = '_blank';
          mapLink.rel = 'noopener noreferrer';
          mapLink.textContent = ' (Bản đồ)';
          mapLink.style.marginLeft = '6px';
          location.append(mapLink);
        }
      } else if (session.location.latitude && session.location.longitude) {
        const { latitude, longitude, accuracy } = session.location;
        const mapLink = document.createElement('a');
        mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`;
        mapLink.target = '_blank';
        mapLink.rel = 'noopener noreferrer';
        mapLink.textContent = 'Mở bản đồ';
        location.append(mapLink);
        if (accuracy) {
          location.append(document.createTextNode(` · sai số ~${Math.round(accuracy)}m`));
        }
      } else {
        location.textContent = 'Đã kết nối';
      }
    } else {
      location.textContent = 'Đã kết nối';
    }

    row.append(activity, location);
    sessionList.append(row);
  });
}

async function refreshStats() {
  try {
    const response = await fetch('/api/presence');
    if (response.status === 401) return showDashboard(false);
    if (!response.ok) throw new Error('Không tải được dữ liệu online.');
    const data = await response.json();
    document.getElementById('onlineCount').textContent = data.count;
    document.getElementById('lastUpdated').textContent = `Cập nhật ${new Date().toLocaleTimeString('vi-VN')}`;
    renderSessions(data.sessions || []);
    dashboardMessage.textContent = '';
  } catch (error) {
    dashboardMessage.textContent = error.message;
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginMessage.textContent = '';
  try {
    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('adminPassword').value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Đăng nhập thất bại.');
    loginForm.reset();
    showDashboard(true);
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener('click', async () => {
  await fetch('/api/admin-auth', { method: 'DELETE' });
  showDashboard(false);
});

fetch('/api/admin-auth')
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Admin chưa được cấu hình trên server.')))
  .then(result => showDashboard(result.authenticated === true))
  .catch(error => { loginMessage.textContent = error.message; });
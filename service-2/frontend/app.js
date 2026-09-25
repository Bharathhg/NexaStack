// ============================================================
//  SERVICE 2 — Frontend JavaScript
//  FE Developer 1: Module 1 (Analytics Overview)
//  FE Developer 2: Module 2 (Event Tracking)
// ============================================================

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:4002'
  : '';  // Nginx reverse proxy routes /api to backend

function showModule(num) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('module' + num).classList.add('active');
  document.querySelectorAll('.nav-btn')[num - 1].classList.add('active');
}

function prettyJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="json-str">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-num">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-bool">$1</span>');
}

function setResponse(id, data, isError = false) {
  const box = document.getElementById(id);
  box.classList.add('active');
  box.innerHTML = `<pre>${isError ? '⚠️ ' + data : prettyJSON(data)}</pre>`;
}

// ============================================================
//  MODULE 1 — FE Developer 1
//  Analytics: GET /api/module1/analytics
// ============================================================
async function fetchModule1Data() {
  const btn = document.querySelector('#module1 .btn.primary');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/module1/analytics`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    animateCounter('m1-views',   data.page_views      ?? 0);
    animateDuration('m1-session', data.avg_session_sec ?? 0);
    animatePercent('m1-conv',    data.conversion_rate  ?? 0);

    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    btn.textContent = '🔄 Refresh Data';
    btn.disabled = false;
  }
}

async function postModule1() {
  const payload = { report_type: 'daily', generated_at: new Date().toISOString() };
  try {
    const res = await fetch(`${API_BASE}/api/module1/analytics/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Export failed: ${err.message}`, true);
  }
}

// ============================================================
//  MODULE 2 — FE Developer 2
//  Events: GET /api/module2/events and POST /api/module2/events
// ============================================================
async function fetchModule2Data() {
  const btn = document.querySelector('#module2 .btn.primary');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/module2/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    animateCounter('m2-events', data.events_today ?? data.events?.length ?? 0);
    animateCounter('m2-alerts', data.alerts_fired ?? 0);
    animateCounter('m2-types',  data.event_types  ?? 0);

    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    btn.textContent = '🔄 Refresh Data';
    btn.disabled = false;
  }
}

async function postModule2() {
  const eventTypes = ['click', 'page_view', 'purchase', 'signup', 'error'];
  const payload = {
    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    timestamp: new Date().toISOString(),
    user_id: `u-${Math.floor(Math.random() * 9999)}`
  };
  try {
    const res = await fetch(`${API_BASE}/api/module2/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `POST failed: ${err.message}`, true);
  }
}

// ---- Helpers ----
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 700, start = performance.now(), from = parseInt(el.textContent) || 0;
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateDuration(id, seconds) {
  const el = document.getElementById(id);
  if (!el) return;
  const m = Math.floor(seconds / 60), s = seconds % 60;
  el.textContent = `${m}m ${s}s`;
}

function animatePercent(id, rate) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = rate.toFixed(1) + '%';
}

// ---- Health check ----
(async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const badge = document.getElementById('statusBadge');
    if (!res.ok) {
      badge.innerHTML = badge.innerHTML.replace('Live', 'Offline');
    }
  } catch (_) {}
})();

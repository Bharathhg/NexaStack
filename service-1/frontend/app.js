// ============================================================
//  SERVICE 1 — Frontend JavaScript
//  FE Developer 1: Module 1 (User Management)
//  FE Developer 2: Module 2 (Product Catalog)
// ============================================================

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:4001'
  : '/api';  // Reverse proxy in production

// ---- Navigation ----
function showModule(num) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('module' + num).classList.add('active');
  document.querySelectorAll('.nav-btn')[num - 1].classList.add('active');
}

// ---- JSON pretty printer ----
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
//  Talks to GET /api/module1/users and POST /api/module1/users
// ============================================================
async function fetchModule1Data() {
  const btn = document.querySelector('#module1 .btn.primary');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/module1/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Update stat cards
    animateCounter('m1-users',  data.total_users   ?? data.users?.length ?? 0);
    animateCounter('m1-active', data.active_users  ?? 0);
    animateCounter('m1-req',    data.api_requests  ?? 0);

    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    btn.textContent = '🔄 Refresh Data';
    btn.disabled = false;
  }
}

async function postModule1() {
  const payload = { name: 'New User', email: `user${Date.now()}@service1.com`, role: 'viewer' };

  try {
    const res = await fetch(`${API_BASE}/api/module1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `POST failed: ${err.message}`, true);
  }
}

// ============================================================
//  MODULE 2 — FE Developer 2
//  Talks to GET /api/module2/products and POST /api/module2/products
// ============================================================
async function fetchModule2Data() {
  const btn = document.querySelector('#module2 .btn.primary');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/module2/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    animateCounter('m2-products', data.total_products ?? data.products?.length ?? 0);
    animateCounter('m2-instock',  data.in_stock       ?? 0);
    animateCounter('m2-orders',   data.orders_today   ?? 0);

    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    btn.textContent = '🔄 Refresh Data';
    btn.disabled = false;
  }
}

async function postModule2() {
  const payload = { name: `Product-${Date.now()}`, price: parseFloat((Math.random() * 100).toFixed(2)), stock: Math.floor(Math.random() * 200) };

  try {
    const res = await fetch(`${API_BASE}/api/module2/products`, {
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

// ---- Counter animation ----
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 700;
  const start = performance.now();
  const from = parseInt(el.textContent) || 0;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---- Health check on load ----
(async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const badge = document.getElementById('statusBadge');
    if (res.ok) {
      badge.style.background = 'rgba(16,185,129,0.1)';
    } else {
      badge.style.background = 'rgba(239,68,68,0.1)';
      badge.style.color = '#f87171';
      badge.style.borderColor = 'rgba(239,68,68,0.2)';
      badge.querySelector('.pulse').style.background = '#f87171';
      badge.innerHTML = badge.innerHTML.replace('Live', 'Offline');
    }
  } catch (_) {
    // Backend not reachable in static preview — silently ignore
  }
})();

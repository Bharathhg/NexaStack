// ============================================================
//  SERVICE 1 — Frontend JavaScript
//  FE Developer 1: Module 1 (User Management)
//  FE Developer 2: Module 2 (Product Catalog)
// ============================================================

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:4001'
  : '';  // Nginx reverse proxy routes /api to backend

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
//  Talks to GET/POST/PATCH/DELETE /api/module1/users
// ============================================================

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  const countBadge = document.getElementById('user-count-badge');
  if (countBadge) countBadge.textContent = `${users.length} Users`;

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No users in database. Use the form above to add a user!</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>#${u.id}</strong></td>
      <td>${escapeHTML(u.name)}</td>
      <td><code>${escapeHTML(u.email)}</code></td>
      <td><span class="role-badge role-${u.role}">${escapeHTML(u.role)}</span></td>
      <td>
        <span class="status-pill ${u.active ? 'active' : 'inactive'}">
          ${u.active ? '● Active' : '○ Inactive'}
        </span>
      </td>
      <td class="action-cell">
        <button class="btn-sm ${u.active ? 'btn-warning' : 'btn-success'}" onclick="toggleUser(${u.id})">
          ${u.active ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn-sm btn-danger" onclick="deleteUser(${u.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function fetchModule1Data() {
  const btn = document.querySelector('#module1 .btn.primary');
  if (btn) { btn.textContent = '⏳ Loading...'; btn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/api/module1/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const userList = data.users || [];
    animateCounter('m1-users',  data.total_users  ?? userList.length);
    animateCounter('m1-active', data.active_users ?? userList.filter(u => u.active).length);
    animateCounter('m1-req',    data.api_requests ?? 0);

    renderUsersTable(userList);
    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    if (btn) { btn.textContent = '🔄 Refresh Data'; btn.disabled = false; }
  }
}

async function postModule1User(e) {
  e.preventDefault();
  const nameInput  = document.getElementById('user-name');
  const emailInput = document.getElementById('user-email');
  const roleInput  = document.getElementById('user-role');

  const payload = {
    name:  nameInput.value.trim(),
    email: emailInput.value.trim(),
    role:  roleInput.value
  };

  try {
    const res = await fetch(`${API_BASE}/api/module1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    nameInput.value = '';
    emailInput.value = '';
    await fetchModule1Data();
    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Failed to add user: ${err.message}`, true);
  }
}

async function toggleUser(id) {
  try {
    const res = await fetch(`${API_BASE}/api/module1/users/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule1Data();
  } catch (err) {
    alert(`Failed to update user: ${err.message}`);
  }
}

async function deleteUser(id) {
  if (!confirm(`Are you sure you want to delete user #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/module1/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule1Data();
  } catch (err) {
    alert(`Failed to delete user: ${err.message}`);
  }
}

async function resetUsers() {
  if (!confirm('Are you sure you want to erase ALL users from the database?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/module1/reset`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule1Data();
    setResponse('m1-response', data);
  } catch (err) {
    alert(`Failed to reset users: ${err.message}`);
  }
}

// ============================================================
//  MODULE 2 — FE Developer 2
//  Talks to GET/POST/DELETE /api/module2/products
// ============================================================

function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  const countBadge = document.getElementById('product-count-badge');
  if (countBadge) countBadge.textContent = `${products.length} Products`;

  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No products in database. Use the form above to add a product!</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><strong>#${p.id}</strong></td>
      <td>${escapeHTML(p.name)}</td>
      <td><span class="cat-badge">${escapeHTML(p.category || 'general')}</span></td>
      <td><strong>$${parseFloat(p.price).toFixed(2)}</strong></td>
      <td>${p.stock} units</td>
      <td>
        <span class="status-pill ${p.stock > 0 ? 'active' : 'inactive'}">
          ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td class="action-cell">
        <button class="btn-sm btn-danger" onclick="deleteProduct(${p.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function fetchModule2Data() {
  const btn = document.querySelector('#module2 .btn.primary');
  if (btn) { btn.textContent = '⏳ Loading...'; btn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/api/module2/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const prodList = data.products || [];
    animateCounter('m2-products', data.total_products ?? prodList.length);
    animateCounter('m2-instock',  data.in_stock       ?? prodList.filter(p => p.stock > 0).length);
    animateCounter('m2-orders',   data.orders_today   ?? 0);

    renderProductsTable(prodList);
    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    if (btn) { btn.textContent = '🔄 Refresh Data'; btn.disabled = false; }
  }
}

async function postModule2Product(e) {
  e.preventDefault();
  const nameInput  = document.getElementById('prod-name');
  const priceInput = document.getElementById('prod-price');
  const stockInput = document.getElementById('prod-stock');
  const catInput   = document.getElementById('prod-category');

  const payload = {
    name:     nameInput.value.trim(),
    price:    parseFloat(priceInput.value),
    stock:    parseInt(stockInput.value, 10),
    category: catInput.value
  };

  try {
    const res = await fetch(`${API_BASE}/api/module2/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    nameInput.value = '';
    priceInput.value = '';
    stockInput.value = '';
    await fetchModule2Data();
    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `Failed to add product: ${err.message}`, true);
  }
}

async function deleteProduct(id) {
  if (!confirm(`Are you sure you want to delete product #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/module2/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule2Data();
  } catch (err) {
    alert(`Failed to delete product: ${err.message}`);
  }
}

async function resetProducts() {
  if (!confirm('Are you sure you want to erase ALL products from the database?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/module2/reset`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule2Data();
    setResponse('m2-response', data);
  } catch (err) {
    alert(`Failed to reset products: ${err.message}`);
  }
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// Auto-load data on page ready
window.addEventListener('DOMContentLoaded', () => {
  fetchModule1Data();
  fetchModule2Data();
});

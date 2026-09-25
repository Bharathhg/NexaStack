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
  if (!box) return;
  box.classList.add('active');
  box.innerHTML = `<pre>${isError ? '⚠️ ' + data : prettyJSON(data)}</pre>`;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  MODULE 1 — FE Developer 1 (Analytics)
// ============================================================

function renderMetricsTable(metrics) {
  const tbody = document.getElementById('metrics-table-body');
  const countBadge = document.getElementById('metric-count-badge');
  if (countBadge) countBadge.textContent = `${metrics.length} Metrics`;

  if (!metrics || metrics.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No metrics in database. Use the form above to add a metric!</td></tr>`;
    return;
  }

  tbody.innerHTML = metrics.map(m => `
    <tr>
      <td><strong>#${m.id}</strong></td>
      <td><strong>${escapeHTML(m.metric)}</strong></td>
      <td>${parseFloat(m.value).toLocaleString()}</td>
      <td><span class="badge">${escapeHTML(m.unit || '—')}</span></td>
      <td><small>${escapeHTML(m.updated_at || 'Just now')}</small></td>
      <td class="action-cell">
        <button class="btn-sm btn-danger" onclick="deleteMetric(${m.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function fetchModule1Data() {
  const btn = document.getElementById('btn-refresh-metrics');
  if (btn) { btn.textContent = '⏳ Loading...'; btn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/api/module1/analytics`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const metricList = data.metrics || [];
    animateCounter('m1-metrics', metricList.length);
    animateDuration('m1-session', data.avg_session_sec ?? 0);
    animatePercent('m1-conv',    data.conversion_rate  ?? 0);

    renderMetricsTable(metricList);
    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    if (btn) { btn.textContent = '🔄 Refresh Data'; btn.disabled = false; }
  }
}

async function postModule1Metric(e) {
  e.preventDefault();
  const nameInput  = document.getElementById('metric-name');
  const valInput   = document.getElementById('metric-value');
  const unitInput  = document.getElementById('metric-unit');

  const payload = {
    metric: nameInput.value.trim(),
    value:  parseFloat(valInput.value),
    unit:   unitInput.value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/module1/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    nameInput.value = '';
    valInput.value = '';
    unitInput.value = '';
    await fetchModule1Data();
    setResponse('m1-response', data);
  } catch (err) {
    setResponse('m1-response', `Failed to add metric: ${err.message}`, true);
  }
}

async function deleteMetric(id) {
  if (!confirm(`Are you sure you want to delete metric #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/module1/metrics/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule1Data();
  } catch (err) {
    alert(`Failed to delete metric: ${err.message}`);
  }
}

async function resetMetrics() {
  if (!confirm('Are you sure you want to erase ALL metrics from the database?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/module1/reset`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule1Data();
    setResponse('m1-response', data);
  } catch (err) {
    alert(`Failed to reset metrics: ${err.message}`);
  }
}

// ============================================================
//  MODULE 2 — FE Developer 2 (Event Tracking)
// ============================================================

function getEventBadgeClass(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('LOGIN')) return 'event-login';
  if (t.includes('PURCHASE')) return 'event-purchase';
  if (t.includes('VIEW')) return 'event-view';
  if (t.includes('ERROR') || t.includes('ALERT')) return 'event-error';
  if (t.includes('USER')) return 'event-user';
  return 'event-default';
}

function renderEventsTable(events) {
  const tbody = document.getElementById('events-table-body');
  const countBadge = document.getElementById('event-count-badge');
  if (countBadge) countBadge.textContent = `${events.length} Events`;

  if (!events || events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No events in database. Use the form above to log an event!</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(e => {
    let metaDisplay = '';
    if (typeof e.metadata === 'object' && e.metadata !== null) {
      metaDisplay = Object.keys(e.metadata).length > 0 ? JSON.stringify(e.metadata) : '—';
    } else {
      metaDisplay = e.metadata || '—';
    }

    return `
      <tr>
        <td><strong>#${e.id}</strong></td>
        <td><span class="event-badge ${getEventBadgeClass(e.type)}">${escapeHTML(e.type)}</span></td>
        <td><code>${escapeHTML(e.user_id)}</code></td>
        <td><small>${escapeHTML(e.timestamp ? new Date(e.timestamp).toLocaleString() : 'Just now')}</small></td>
        <td><code>${escapeHTML(metaDisplay)}</code></td>
        <td class="action-cell">
          <button class="btn-sm btn-danger" onclick="deleteEvent(${e.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function fetchModule2Data() {
  const btn = document.getElementById('btn-refresh-events');
  if (btn) { btn.textContent = '⏳ Loading...'; btn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/api/module2/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const eventList = data.events || [];
    animateCounter('m2-events', data.events_today ?? eventList.length);
    animateCounter('m2-alerts', data.alerts_fired ?? 0);
    animateCounter('m2-types',  data.event_types  ?? 0);

    renderEventsTable(eventList);
    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `Failed to reach backend: ${err.message}`, true);
  } finally {
    if (btn) { btn.textContent = '🔄 Refresh Data'; btn.disabled = false; }
  }
}

async function postModule2Event(e) {
  e.preventDefault();
  const typeSelect = document.getElementById('event-type');
  const userInput  = document.getElementById('event-user');
  const metaInput  = document.getElementById('event-meta');

  let parsedMeta = metaInput.value.trim();
  try {
    parsedMeta = JSON.parse(parsedMeta);
  } catch (_) {
    // Keep as string or note
  }

  const payload = {
    type:      typeSelect.value,
    user_id:   userInput.value.trim(),
    metadata:  parsedMeta || { note: 'Manual log' }
  };

  try {
    const res = await fetch(`${API_BASE}/api/module2/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    userInput.value = '';
    metaInput.value = '';
    await fetchModule2Data();
    setResponse('m2-response', data);
  } catch (err) {
    setResponse('m2-response', `Failed to log event: ${err.message}`, true);
  }
}

async function deleteEvent(id) {
  if (!confirm(`Are you sure you want to delete event #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/module2/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule2Data();
  } catch (err) {
    alert(`Failed to delete event: ${err.message}`);
  }
}

async function resetEvents() {
  if (!confirm('Are you sure you want to erase ALL events from the database?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/module2/reset`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    await fetchModule2Data();
    setResponse('m2-response', data);
  } catch (err) {
    alert(`Failed to reset events: ${err.message}`);
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

// ---- Health check & Initial load ----
(async function init() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const badge = document.getElementById('statusBadge');
    if (!res.ok && badge) {
      badge.innerHTML = badge.innerHTML.replace('Live', 'Offline');
    }
  } catch (_) {}

  // Fetch initial data for both modules
  fetchModule1Data();
  fetchModule2Data();
})();

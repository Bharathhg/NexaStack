// ============================================================
//  SERVICE 2 — Backend (Node.js + Express)
//  BE Developer 1: Module 1 routes (/api/module1/analytics)
//  BE Developer 2: Module 2 routes (/api/module2/events)
// ============================================================

const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 4002;
const SERVICE = 'service-2';

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${SERVICE}] ${req.method} ${req.path}`);
  next();
});

// ----------------------------------------------------------------
//  HEALTH CHECK
// ----------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    service:   SERVICE,
    status:    'healthy',
    uptime:    process.uptime().toFixed(2) + 's',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
//  MODULE 1 — BE Developer 1
//  Domain: Analytics
// ================================================================

let analyticsState = {
  page_views:      48230,
  avg_session_sec: 187,
  conversion_rate: 3.42,
  bounce_rate:     42.1,
  top_pages:       ['/home', '/products', '/pricing', '/about'],
};

// GET analytics summary
app.get('/api/module1/analytics', (_req, res) => {
  // Simulate live drift
  analyticsState.page_views      += Math.floor(Math.random() * 50);
  analyticsState.conversion_rate  = parseFloat((analyticsState.conversion_rate + (Math.random() * 0.2 - 0.1)).toFixed(2));

  res.json({
    service:    SERVICE,
    module:     'module-1',
    developer:  'BE Developer 1',
    ...analyticsState,
    updated_at: new Date().toISOString()
  });
});

// POST export report
app.post('/api/module1/analytics/export', (req, res) => {
  const { report_type = 'daily' } = req.body;
  res.json({
    service:     SERVICE,
    module:      'module-1',
    message:     `${report_type} report queued for export`,
    export_id:   `exp-${Date.now()}`,
    status:      'queued',
    estimated_s: 30
  });
});

// ================================================================
//  MODULE 2 — BE Developer 2
//  Domain: Event Tracking
// ================================================================

const events = [];
const EVENT_TYPES = ['click', 'page_view', 'purchase', 'signup', 'error', 'logout', 'search'];

// Seed some events
for (let i = 0; i < 20; i++) {
  events.push({
    id:        i + 1,
    type:      EVENT_TYPES[i % EVENT_TYPES.length],
    user_id:   `u-${Math.floor(Math.random() * 999)}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    metadata:  {}
  });
}

let alertsFired = 3;

// GET events
app.get('/api/module2/events', (_req, res) => {
  alertsFired += Math.random() > 0.8 ? 1 : 0;
  res.json({
    service:      SERVICE,
    module:       'module-2',
    developer:    'BE Developer 2',
    events_today: events.length,
    alerts_fired: alertsFired,
    event_types:  EVENT_TYPES.length,
    recent_events: events.slice(-5)
  });
});

// POST log event
app.post('/api/module2/events', (req, res) => {
  const { type, user_id, metadata = {} } = req.body;
  if (!type) return res.status(400).json({ error: 'event type is required' });

  const event = {
    id:        events.length + 1,
    type,
    user_id:   user_id || 'anonymous',
    timestamp: new Date().toISOString(),
    metadata
  };
  events.push(event);

  res.status(201).json({
    service: SERVICE,
    module:  'module-2',
    message: 'Event logged successfully',
    event,
    total_events: events.length
  });
});

// GET event by id
app.get('/api/module2/events/:id', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ service: SERVICE, module: 'module-2', event });
});

// ----------------------------------------------------------------
app.use((_req, res) => res.status(404).json({ service: SERVICE, error: 'Route not found' }));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ [${SERVICE}] Backend running on http://localhost:${PORT}`);
    console.log(`   Module 1 (BE Dev 1): /api/module1/analytics`);
    console.log(`   Module 2 (BE Dev 2): /api/module2/events`);
  });
}

module.exports = app;

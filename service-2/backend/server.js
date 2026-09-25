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

const db      = require('./database');

// ----------------------------------------------------------------
//  ROOT & HEALTH CHECK
// ----------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({
    service:   SERVICE,
    status:    'running',
    database:  'SQLite (persistent)',
    endpoints: {
      health:            '/health',
      module1_analytics: '/api/module1/analytics',
      module2_events:    '/api/module2/events'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({
    service:   SERVICE,
    status:    'healthy',
    database:  'SQLite connected',
    uptime:    process.uptime().toFixed(2) + 's',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
//  MODULE 1 — BE Developer 1
//  Domain: Analytics (SQLite analytics table)
// ================================================================

// GET analytics summary
app.get('/api/module1/analytics', (_req, res) => {
  db.all('SELECT * FROM analytics ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      service:         SERVICE,
      module:          'module-1',
      developer:       'BE Developer 1',
      storage:         'SQLite database',
      page_views:      48230 + Math.floor(Math.random() * 50),
      avg_session_sec: 187,
      conversion_rate: 3.42,
      bounce_rate:     42.1,
      metrics:         rows,
      updated_at:      new Date().toISOString()
    });
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
    storage:     'SQLite database',
    estimated_s: 30
  });
});

// ================================================================
//  MODULE 2 — BE Developer 2
//  Domain: Event Tracking (SQLite events table)
// ================================================================

let alertsFired = 3;

// GET events
app.get('/api/module2/events', (_req, res) => {
  alertsFired += Math.random() > 0.8 ? 1 : 0;
  db.all('SELECT * FROM events ORDER BY id DESC LIMIT 50', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => {
      let meta = {};
      try { meta = JSON.parse(r.metadata || '{}'); } catch(_e) {}
      return { ...r, metadata: meta };
    });

    db.get('SELECT COUNT(*) as total FROM events', (_e, countRow) => {
      res.json({
        service:       SERVICE,
        module:        'module-2',
        developer:     'BE Developer 2',
        storage:       'SQLite database',
        events_today:  countRow ? countRow.total : formatted.length,
        alerts_fired:  alertsFired,
        recent_events: formatted.slice(0, 5),
        events:        formatted
      });
    });
  });
});

// POST log event
app.post('/api/module2/events', (req, res) => {
  const { type, user_id = 'anonymous', metadata = {} } = req.body;
  if (!type) return res.status(400).json({ error: 'event type is required' });

  const metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata);
  const stmt = db.prepare('INSERT INTO events (type, user_id, metadata) VALUES (?, ?, ?)');
  stmt.run(type, user_id, metaStr, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const event = {
      id:        this.lastID,
      type,
      user_id,
      timestamp: new Date().toISOString(),
      metadata
    };

    db.get('SELECT COUNT(*) as count FROM events', (_e, countRow) => {
      res.status(201).json({
        service:      SERVICE,
        module:       'module-2',
        message:      'Event logged successfully in SQLite',
        event,
        total_events: countRow ? countRow.count : 0
      });
    });
  });
  stmt.finalize();
});

// GET event by id
app.get('/api/module2/events/:id', (req, res) => {
  db.get('SELECT * FROM events WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Event not found' });
    let meta = {};
    try { meta = JSON.parse(row.metadata || '{}'); } catch(_e) {}
    res.json({ service: SERVICE, module: 'module-2', event: { ...row, metadata: meta } });
  });
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

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
// ================================================================
//  MODULE 1 — BE Developer 1
//  Domain: Analytics (SQLite analytics table)
// ================================================================

// GET analytics summary & all metrics
app.get('/api/module1/analytics', (_req, res) => {
  db.all('SELECT * FROM analytics ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const metrics = rows || [];
    res.json({
      service:         SERVICE,
      module:          'module-1',
      developer:       'BE Developer 1',
      storage:         'SQLite database',
      total_metrics:   metrics.length,
      page_views:      metrics.length > 0 ? 48230 + metrics.length * 10 : 0,
      avg_session_sec: metrics.length > 0 ? 187 : 0,
      conversion_rate: metrics.length > 0 ? 3.42 : 0,
      metrics:         metrics,
      updated_at:      new Date().toISOString()
    });
  });
});

// POST create metric — Module 1
app.post('/api/module1/metrics', (req, res) => {
  const { metric, value, unit = '' } = req.body;
  if (!metric || value === undefined) {
    return res.status(400).json({ error: 'metric and value are required' });
  }
  const stmt = db.prepare('INSERT INTO analytics (metric, value, unit) VALUES (?, ?, ?)');
  stmt.run(metric, parseFloat(value), unit, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newMetric = { id: this.lastID, metric, value: parseFloat(value), unit };
    res.status(201).json({
      service: SERVICE,
      module:  'module-1',
      message: 'Metric added successfully in SQLite',
      metric:  newMetric
    });
  });
  stmt.finalize();
});

// DELETE single metric — Module 1 (Manual Delete)
app.delete('/api/module1/metrics/:id', (req, res) => {
  db.run('DELETE FROM analytics WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as count FROM analytics', (_e, countRow) => {
      if (countRow && countRow.count === 0) {
        db.run("DELETE FROM sqlite_sequence WHERE name = 'analytics'", () => {});
      }
      res.json({ service: SERVICE, module: 'module-1', message: 'Metric deleted successfully' });
    });
  });
});

// POST reset / clear all metrics — Module 1
app.post('/api/module1/reset', (_req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM analytics');
    db.run("DELETE FROM sqlite_sequence WHERE name = 'analytics'", (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ service: SERVICE, module: 'module-1', message: 'All metrics erased and ID sequence reset to 1' });
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

// GET events — Module 2
app.get('/api/module2/events', (_req, res) => {
  db.all('SELECT * FROM events ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = (rows || []).map(r => {
      let meta = {};
      try { meta = JSON.parse(r.metadata || '{}'); } catch(_e) { meta = r.metadata; }
      return { ...r, metadata: meta };
    });

    const uniqueTypes = new Set(formatted.map(e => e.type)).size;
    const alertsFired = formatted.filter(e => {
      const t = String(e.type || '').toLowerCase();
      return t.includes('error') || t.includes('alert') || t.includes('fail');
    }).length;

    res.json({
      service:       SERVICE,
      module:        'module-2',
      developer:     'BE Developer 2',
      storage:       'SQLite database',
      events_today:  formatted.length,
      alerts_fired:  alertsFired,
      event_types:   uniqueTypes,
      events:        formatted
    });
  });
});

// POST log event — Module 2
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

// DELETE single event — Module 2 (Manual Delete)
app.delete('/api/module2/events/:id', (req, res) => {
  db.run('DELETE FROM events WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as count FROM events', (_e, countRow) => {
      if (countRow && countRow.count === 0) {
        db.run("DELETE FROM sqlite_sequence WHERE name = 'events'", () => {});
      }
      res.json({ service: SERVICE, module: 'module-2', message: 'Event deleted successfully' });
    });
  });
});

// POST reset / clear all events — Module 2
app.post('/api/module2/reset', (_req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM events');
    db.run("DELETE FROM sqlite_sequence WHERE name = 'events'", (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ service: SERVICE, module: 'module-2', message: 'All events erased and ID sequence reset to 1' });
    });
  });
});

// GET event by id — Module 2
app.get('/api/module2/events/:id', (req, res) => {
  db.get('SELECT * FROM events WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Event not found' });
    let meta = {};
    try { meta = JSON.parse(row.metadata || '{}'); } catch(_e) { meta = row.metadata; }
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

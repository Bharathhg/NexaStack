// ============================================================
//  SERVICE 1 — Backend (Node.js + Express)
//  BE Developer 1: Module 1 routes (/api/module1/*)
//  BE Developer 2: Module 2 routes (/api/module2/*)
// ============================================================

const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 4001;
const SERVICE = 'service-1';

app.use(cors());
app.use(express.json());

// Request logger
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
      health:          '/health',
      module1_users:   '/api/module1/users',
      module2_products:'/api/module2/products'
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
//  Domain: User Management (SQLite users table)
// ================================================================

let requestCount = 0;

// GET all users — Module 1
app.get('/api/module1/users', (_req, res) => {
  requestCount++;
  db.all('SELECT * FROM users ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(u => ({ ...u, active: Boolean(u.active) }));
    res.json({
      service:       SERVICE,
      module:        'module-1',
      developer:     'BE Developer 1',
      storage:       'SQLite database',
      total_users:   formatted.length,
      active_users:  formatted.filter(u => u.active).length,
      api_requests:  requestCount,
      users:         formatted
    });
  });
});

// POST create user — Module 1
app.post('/api/module1/users', (req, res) => {
  requestCount++;
  const { name, email, role = 'viewer' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const stmt = db.prepare('INSERT INTO users (name, email, role, active) VALUES (?, ?, ?, 1)');
  stmt.run(name, email, role, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newUser = { id: this.lastID, name, email, role, active: true };
    db.get('SELECT COUNT(*) as count FROM users', (_e, countRow) => {
      res.status(201).json({
        service:   SERVICE,
        module:    'module-1',
        message:   'User created successfully in SQLite',
        user:      newUser,
        total_now: countRow ? countRow.count : 0
      });
    });
  });
  stmt.finalize();
});

// GET single user — Module 1
app.get('/api/module1/users/:id', (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ service: SERVICE, module: 'module-1', user: { ...row, active: Boolean(row.active) } });
  });
});

// ================================================================
//  MODULE 2 — BE Developer 2
//  Domain: Product Catalog (SQLite products table)
// ================================================================

let ordersToday = 12;

// GET all products — Module 2
app.get('/api/module2/products', (_req, res) => {
  ordersToday += Math.floor(Math.random() * 3);
  db.all('SELECT * FROM products ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      service:        SERVICE,
      module:         'module-2',
      developer:      'BE Developer 2',
      storage:        'SQLite database',
      total_products: rows.length,
      in_stock:       rows.filter(p => p.stock > 0).length,
      orders_today:   ordersToday,
      products:       rows
    });
  });
});

// POST create product — Module 2
app.post('/api/module2/products', (req, res) => {
  const { name, price, stock = 0, category = 'general' } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }

  const stmt = db.prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
  stmt.run(name, parseFloat(price), parseInt(stock), category, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const product = { id: this.lastID, name, price: parseFloat(price), stock: parseInt(stock), category };
    db.get('SELECT COUNT(*) as count FROM products', (_e, countRow) => {
      res.status(201).json({
        service:   SERVICE,
        module:    'module-2',
        message:   'Product created successfully in SQLite',
        product,
        total_now: countRow ? countRow.count : 0
      });
    });
  });
  stmt.finalize();
});

// GET single product — Module 2
app.get('/api/module2/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json({ service: SERVICE, module: 'module-2', product: row });
  });
});

// ----------------------------------------------------------------
// 404 fallback
// ----------------------------------------------------------------
app.use((_req, res) => res.status(404).json({ service: SERVICE, error: 'Route not found' }));

// ----------------------------------------------------------------
// START
// ----------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ [${SERVICE}] Backend running on http://localhost:${PORT}`);
    console.log(`   Module 1 (BE Dev 1): /api/module1/*`);
    console.log(`   Module 2 (BE Dev 2): /api/module2/*`);
  });
}

module.exports = app;

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

// ----------------------------------------------------------------
//  HEALTH CHECK
// ----------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    service: SERVICE,
    status:  'healthy',
    uptime:  process.uptime().toFixed(2) + 's',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
//  MODULE 1 — BE Developer 1
//  Domain: User Management
// ================================================================

// In-memory user store (replace with real DB in production)
const users = [
  { id: 1, name: 'Alice Smith',   email: 'alice@svc1.com', role: 'admin',   active: true  },
  { id: 2, name: 'Bob Johnson',   email: 'bob@svc1.com',   role: 'editor',  active: true  },
  { id: 3, name: 'Carol Williams',email: 'carol@svc1.com', role: 'viewer',  active: false },
  { id: 4, name: 'Dave Brown',    email: 'dave@svc1.com',  role: 'editor',  active: true  },
];
let requestCount = 0;

// GET all users — Module 1
app.get('/api/module1/users', (_req, res) => {
  requestCount++;
  res.json({
    service:       SERVICE,
    module:        'module-1',
    developer:     'BE Developer 1',
    total_users:   users.length,
    active_users:  users.filter(u => u.active).length,
    api_requests:  requestCount,
    users:         users
  });
});

// POST create user — Module 1
app.post('/api/module1/users', (req, res) => {
  requestCount++;
  const { name, email, role = 'viewer' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const newUser = { id: users.length + 1, name, email, role, active: true };
  users.push(newUser);
  res.status(201).json({
    service:   SERVICE,
    module:    'module-1',
    message:   'User created successfully',
    user:      newUser,
    total_now: users.length
  });
});

// GET single user — Module 1
app.get('/api/module1/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ service: SERVICE, module: 'module-1', user });
});

// ================================================================
//  MODULE 2 — BE Developer 2
//  Domain: Product Catalog
// ================================================================

const products = [
  { id: 1, name: 'Widget Pro',    price: 29.99, stock: 150, category: 'tools'      },
  { id: 2, name: 'Gadget Ultra',  price: 79.99, stock: 80,  category: 'electronics'},
  { id: 3, name: 'Gizmo Plus',    price: 49.99, stock: 0,   category: 'electronics'},
  { id: 4, name: 'Doohickey Max', price: 14.99, stock: 300, category: 'accessories'},
  { id: 5, name: 'Thingamajig',   price: 9.99,  stock: 45,  category: 'accessories'},
];
let ordersToday = 12;

// GET all products — Module 2
app.get('/api/module2/products', (_req, res) => {
  ordersToday += Math.floor(Math.random() * 3);
  res.json({
    service:        SERVICE,
    module:         'module-2',
    developer:      'BE Developer 2',
    total_products: products.length,
    in_stock:       products.filter(p => p.stock > 0).length,
    orders_today:   ordersToday,
    products:       products
  });
});

// POST create product — Module 2
app.post('/api/module2/products', (req, res) => {
  const { name, price, stock = 0 } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const product = { id: products.length + 1, name, price: parseFloat(price), stock: parseInt(stock), category: 'general' };
  products.push(product);
  res.status(201).json({
    service:   SERVICE,
    module:    'module-2',
    message:   'Product created successfully',
    product,
    total_now: products.length
  });
});

// GET single product — Module 2
app.get('/api/module2/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ service: SERVICE, module: 'module-2', product });
});

// ----------------------------------------------------------------
// 404 fallback
// ----------------------------------------------------------------
app.use((_req, res) => res.status(404).json({ service: SERVICE, error: 'Route not found' }));

// ----------------------------------------------------------------
// START
// ----------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ [${SERVICE}] Backend running on http://localhost:${PORT}`);
  console.log(`   Module 1 (BE Dev 1): /api/module1/*`);
  console.log(`   Module 2 (BE Dev 2): /api/module2/*`);
});

module.exports = app;

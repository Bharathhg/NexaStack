// ============================================================
//  SERVICE 1 — SQLite Database Setup & Seeding
//  Domain: Module 1 (Users) & Module 2 (Products)
// ============================================================

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'service1.sqlite');
const db     = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`📦 SQLite database connected: ${dbPath}`);
  }
});

db.serialize(() => {
  // Table 1: Users (Module 1)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 2: Products (Module 2)
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default users if empty
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO users (name, email, role, active) VALUES (?, ?, ?, ?)');
      stmt.run('Alice Smith',   'alice@svc1.com',   'admin',  1);
      stmt.run('Bob Johnson',   'bob@svc1.com',     'editor', 1);
      stmt.run('Carol Williams','carol@svc1.com',   'viewer', 0);
      stmt.run('Dave Brown',    'dave@svc1.com',    'editor', 1);
      stmt.finalize(() => console.log('🌱 Seeded default users in SQLite'));
    }
  });

  // Seed default products if empty
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)');
      stmt.run('Widget Pro',    29.99, 150, 'tools');
      stmt.run('Gadget Ultra',  79.99, 80,  'electronics');
      stmt.run('Gizmo Plus',    49.99, 0,   'electronics');
      stmt.run('Doohickey Max', 14.99, 300, 'accessories');
      stmt.run('Thingamajig',   9.99,  45,  'accessories');
      stmt.finalize(() => console.log('🌱 Seeded default products in SQLite'));
    }
  });
});

module.exports = db;

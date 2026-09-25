// ============================================================
//  SERVICE 2 — SQLite Database Setup & Seeding
//  Domain: Module 1 (Analytics) & Module 2 (Events)
// ============================================================

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'service2.sqlite');
const db     = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`📦 SQLite database connected: ${dbPath}`);
  }
});

db.serialize(() => {
  // Table 1: Analytics (Module 1)
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 2: Events (Module 2)
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      user_id TEXT DEFAULT 'anonymous',
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )
  `);

  // Seed default analytics if empty
  db.get('SELECT COUNT(*) as count FROM analytics', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO analytics (metric, value, unit) VALUES (?, ?, ?)');
      stmt.run('Daily Active Users', 1420, 'users');
      stmt.run('Avg Response Time', 42.5, 'ms');
      stmt.run('Error Rate', 0.12, '%');
      stmt.finalize(() => console.log('🌱 Seeded default analytics in SQLite'));
    }
  });

  // Seed default events if empty
  db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO events (type, user_id, metadata) VALUES (?, ?, ?)');
      stmt.run('user_login', 'user_1', JSON.stringify({ ip: '127.0.0.1' }));
      stmt.run('product_view', 'user_2', JSON.stringify({ product_id: 1 }));
      stmt.finalize(() => console.log('🌱 Seeded default events in SQLite'));
    }
  });
});

module.exports = db;

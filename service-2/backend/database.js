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

  // Ensure auto-increment restarts from 1 when tables are empty
  db.get('SELECT COUNT(*) as count FROM analytics', (err, row) => {
    if (!err && row && row.count === 0) {
      db.run("DELETE FROM sqlite_sequence WHERE name = 'analytics'", () => {});
    }
  });

  db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
    if (!err && row && row.count === 0) {
      db.run("DELETE FROM sqlite_sequence WHERE name = 'events'", () => {});
    }
  });
});

module.exports = db;

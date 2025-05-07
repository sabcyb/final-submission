const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/post-it.db');

// Create data directory if it doesn't exist
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT DEFAULT 'New Note',
    content TEXT DEFAULT '',
    color TEXT DEFAULT '#ffff99',
    positionX INTEGER DEFAULT 100,
    positionY INTEGER DEFAULT 100,
    width INTEGER DEFAULT 250,
    height INTEGER DEFAULT 200,
    adminId INTEGER NOT NULL,
    FOREIGN KEY (adminId) REFERENCES admins(id)
  );
`);

module.exports = db;
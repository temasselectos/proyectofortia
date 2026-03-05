var express = require('express')
const sqlite3 = require('sqlite3').verbose();
var app = express();

app.use(express.json());

const db = new sqlite3.Database('./database/documents.db', (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    return;
  }
  console.log("Connected to the SQLite database.");

  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON;`);
    db.run(`CREATE TABLE IF NOT EXISTS docs (id INTEGER PRIMARY KEY AUTOINCREMENT, info TEXT)`);
    db.run(`
      CREATE TABLE IF NOT EXISTS doc_meta (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id INTEGER NOT NULL,
        key    TEXT NOT NULL,
        value  TEXT,
        FOREIGN KEY (doc_id) REFERENCES docs(id) ON DELETE CASCADE,
        UNIQUE (doc_id, key)
      );
    `);
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
      if (err) console.error(err.message);
      else console.log("Tablas en esta BD:", rows);
    });
  });
});

path = ('./route/route.js')
require(path)(app, db)

app.listen(3000, () => {
  console.log('Server is listening');
});
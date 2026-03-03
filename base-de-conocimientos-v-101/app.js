var express = require('express')
const sqlite3 = require('sqlite3').verbose();
var app = express();

app.use(express.json());

const db = new sqlite3.Database('./database/documents.db', (err) => {
  db.run(`CREATE TABLE IF NOT EXISTS docs (id INTEGER PRIMARY KEY AUTOINCREMENT, info TEXT)`);
  if (err) {
  console.error("Error connecting to the database:", err.message);
  } else {
  console.log("Connected to the SQLite database.");
  }
});

db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
  if (err) console.error(err.message);
  else console.log("Tablas en esta BD:", rows);
});

path = ('./route/route.js')
require(path)(app, db)

app.listen(3000, () => {
  console.log('Server is listening');
});
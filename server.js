const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'football.db');

fs.mkdirSync(dataDir, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', dbPath);

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      available TEXT DEFAULT 'both',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (createErr) => {
    if (createErr) {
      console.error('Failed to create players table:', createErr.message);
      process.exit(1);
    }
  });
});

app.get('/api/players', (req, res) => {
  db.all('SELECT * FROM players ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching players:', err.message);
      return res.status(500).json({ error: 'Could not fetch players' });
    }

    res.json(rows);
  });
});

app.post('/api/players', (req, res) => {
  const { name, available } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const cleanName = name.trim();
  const cleanAvailable = available || 'both';

  db.run(
    'INSERT INTO players (name, available) VALUES (?, ?)',
    [cleanName, cleanAvailable],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'A player with that name already exists.' });
        }

        console.error('Error inserting player:', err.message);
        return res.status(500).json({ error: 'Could not add player' });
      }

      res.status(201).json({
        id: this.lastID,
        name: cleanName,
        available: cleanAvailable,
        created_at: new Date().toISOString()
      });
    }
  );
});

app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM players WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting player:', err.message);
      return res.status(500).json({ error: 'Could not delete player' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ success: true, id: Number(id) });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Football app running at http://localhost:${PORT}`);
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'football.db');
const importFilePath = path.join(dataDir, 'old-data.json');
const legacyFilePath = path.join(dataDir, 'football-data-2026-10-09-2.json');

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }

  console.log('Connected to SQLite database at', dbPath);

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legacy_id INTEGER UNIQUE,
      name TEXT NOT NULL UNIQUE,
      available TEXT DEFAULT 'both',
      pref TEXT DEFAULT 'none',
      guarMon INTEGER DEFAULT 0,
      guarThu INTEGER DEFAULT 0,
      played INTEGER DEFAULT 0,
      reserved INTEGER DEFAULT 0,
      lastPlayed TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (createErr) => {
    if (createErr) {
      console.error('Failed to create players table:', createErr.message);
      process.exit(1);
    }

    importOldData();
  });
});

function importOldData() {
  // Try legacy file first, then fall back to old-data.json
  const fileToImport = fs.existsSync(legacyFilePath) ? legacyFilePath : importFilePath;

  if (!fs.existsSync(fileToImport)) {
    console.log('No legacy data file found. Starting with empty database.');
    return;
  }

  try {
    const raw = fs.readFileSync(fileToImport, 'utf8');
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed.players || parsed.data || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('Legacy data file is empty or not a player array.');
      return;
    }

    let importedCount = 0;

    rows.forEach((player, index) => {
      const name = (player.name || player.player || player.playerName || `Player ${index + 1}`).trim();
      const available = player.avail || player.available || player.status || player.availability || 'both';
      const pref = player.pref || 'none';
      const guarMon = player.guarMon ? 1 : 0;
      const guarThu = player.guarThu ? 1 : 0;
      const played = Number(player.played ?? 0);
      const reserved = Number(player.reserved ?? 0);
      const legacyId = player.id !== undefined && player.id !== null ? Number(player.id) : null;
      const lastPlayed = player.lastPlayed ?? null;

      if (!name) return;

      db.run(
        `INSERT OR IGNORE INTO players
         (legacy_id, name, available, pref, guarMon, guarThu, played, reserved, lastPlayed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [legacyId, name, available, pref, guarMon, guarThu, played, reserved, lastPlayed],
        (err) => {
          if (err) {
            console.error('Error importing player:', err.message);
          } else {
            importedCount++;
          }
        }
      );
    });

    console.log(`Imported ${rows.length} player records from legacy data file`);
  } catch (error) {
    console.error('Failed to import old data:', error.message);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/players', (req, res) => {
  db.all(
    'SELECT id, legacy_id, name, available, pref, guarMon, guarThu, played, reserved, lastPlayed, created_at FROM players ORDER BY name ASC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching players:', err.message);
        return res.status(500).json({ error: 'Could not fetch players' });
      }

      res.json(rows);
    }
  );
});

app.post('/api/players', (req, res) => {
  const { name, available, pref, guarMon, guarThu, played, reserved, lastPlayed } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const cleanName = name.trim();
  const cleanAvailable = available || 'both';
  const cleanPref = pref || 'none';
  const cleanGuarMon = guarMon ? 1 : 0;
  const cleanGuarThu = guarThu ? 1 : 0;
  const cleanPlayed = Number(played ?? 0);
  const cleanReserved = Number(reserved ?? 0);

  db.run(
    `INSERT INTO players (name, available, pref, guarMon, guarThu, played, reserved, lastPlayed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [cleanName, cleanAvailable, cleanPref, cleanGuarMon, cleanGuarThu, cleanPlayed, cleanReserved, lastPlayed || null],
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
        pref: cleanPref,
        guarMon: cleanGuarMon,
        guarThu: cleanGuarThu,
        played: cleanPlayed,
        reserved: cleanReserved,
        lastPlayed: lastPlayed || null,
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Football app running at http://localhost:${PORT}`);
});

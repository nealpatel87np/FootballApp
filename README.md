# Football App Basic Database Example

This project is a very simple football app that stores player data in a local SQLite database.

## What it does
- Shows a simple HTML form to add players
- Saves players in SQLite
- Lists players from the database
- Lets you delete players

## Run it locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

3. Open:
   ```bash
   http://localhost:3000
   ```

## Files
- `server.js` - Express server and SQLite database setup
- `public/index.html` - frontend page
- `public/app.js` - frontend logic
- `public/styles.css` - styling
- `data/football.db` - database file created automatically

## Notes
This is a basic example for learning. For a real app, you would usually add:
- team selection logic
- match history
- login/admin users
- a proper production database like PostgreSQL or MySQL

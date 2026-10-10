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

## Football organisation page
`index.html` in the project root is the football organisation page. It is published with GitHub Pages and saves its data to Supabase.

### WhatsApp message
The page can write the weekly WhatsApp message for you.

- After you build a squad on **Run game**, a **WhatsApp message** card appears under it. It also shows on the confirmation screen.
- Set the date, time and venue, and tick **Pitch has been booked** if you've booked it. The message preview updates as you move players around.
- The message lists the day, date, time, venue, player count and squad, followed by any reserves.
- **Copy for WhatsApp** copies the message so you can paste it into the group. **Open WhatsApp** opens WhatsApp with the message filled in.
- In the game log, each game has a **WhatsApp update** button that writes the same message for that game.
- The time and venue are remembered separately for Monday, Thursday and ad hoc games, and the pitch-booked tick is remembered too. These settings are saved on your device only, not in the database.

### Access
There is no sign-in: anyone who can open the page can view and change the data. If saving stops working because the database has stricter rules, run `supabase/policies.sql` in the Supabase SQL Editor to open the tables back up.

### How saving works
Each save sends only the players and games that changed since the last successful save. A device with an out-of-date copy can't delete rows it never saw. If two organisers edit the same player or game, the later save wins for that row.

## Notes
This is a basic example for learning. For a real app, you would usually add:
- team selection logic
- match history
- login/admin users
- a proper production database like PostgreSQL or MySQL

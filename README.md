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

### Money
The **Money** tab tracks payments, the pitch cost and the kitty.

- Each player pays £8.50 and the pitch costs £80. Anything collected over the pitch cost is the surplus: 10% of it goes to admin and the rest to the kitty. If too few pay to cover the pitch, the shortfall comes out of the kitty. These amounts can be changed on the Money tab, and changes apply to games booked after that.
- The money is held by Neal, Kev or Gav. Choose who's organising on **Run game** before picking the day; that person collects the money and pays for the pitch. On the Money tab you can change a game's organiser, tick who has paid, or mark everyone as paid.
- The kitty is one total, and the Money tab also shows how much of it each organiser holds. Enter what each of them held before the app under **Starting balances**.
- Record kitty spends (dinner, drinks, football) with who paid them. The **Kitty ledger** lists every pound in and out with a running balance.
- Games from before this feature aren't counted unless you press **Track money** on them. Games added by hand can be tracked by choosing an organiser in the add-game form.

**Setup (once):** run `supabase/money.sql` in the Supabase SQL Editor to create the money tables. Until then, money is saved only on the device where it was entered, and the Money tab shows a notice.

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

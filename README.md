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
- The money is held by Neal, Kev or Gav. A new game's money isn't tracked until you're ready: on the Money tab, press **Track money** on the game. The organiser chosen on **Run game** is used by default; that person collects the money and pays for the pitch, and the price and pitch cost are taken from the settings at that moment. Once a game is tracked you can change its organiser, tick who has paid, or mark everyone as paid.
- The kitty is one total, and the Money tab also shows how much of it each organiser holds. Next to it, **Still owed** shows money players haven't paid yet and what the kitty will be once it's collected, and each organiser's card shows what's still owed to them. The 10% admin share is taken off each game but not displayed. The **How each game is split** settings are hidden until you press **Show**. Enter what each of them held before the app under **Starting balances**. These are hidden until you press **Show starting balances**, and each device remembers whether they're shown.
- Record kitty spends (dinner, drinks, football) with who paid them. The **Kitty ledger** lists every pound in and out with a running balance.
- To keep the page short, the Games list shows the latest 5 games plus any older game where money is still owed, and the Kitty ledger shows the latest 15 rows. Use **Show older games** or **Show full ledger** to see the rest. Totals always include everything. The History game log also shows the latest 5 games with a **Show older games** button.
- A game only counts towards the kitty and **Still owed** once its money is tracked. Games added by hand can be tracked straight away by choosing an organiser in the add-game form.

- **Outstanding Payments** and **Credit** are two buttons at the top of the Money tab.
  - **Outstanding Payments** lists only the players who owe money, with each unpaid game, its organiser and the amount. **Clear** marks that game as paid, and **Clear all** clears all of a player's games. It's linked to the Games list: clearing a debt ticks the player as paid there, and ticking someone paid on the Games list takes them off Outstanding Payments. Once a player owes nothing they drop off the list.
  - **Credit** is a simple list of players who have paid ahead. To add credit, choose a player and an amount. If they already owe money, the credit pays off their oldest games first and anything left stays as credit. When a game's money starts being tracked, anyone with enough credit for that game is marked as paid and it comes off their credit. Players drop off the list once their credit is used up, and **Remove** takes it off by hand (for example, if you give it back). Credit isn't part of the kitty until it pays for a game.

**Setup (once):** run `supabase/credit.sql` in the Supabase SQL Editor for the credit list. Until then, credit is saved only on the device where it was entered.

**Setup (once):** run `supabase/money.sql` in the Supabase SQL Editor to create the money tables. Until then, money is saved only on the device where it was entered, and the Money tab shows a notice.

### Teams
Teams are picked on the **Teams** tab, separately from the squad, so you can wait until closer to kick-off.

- **Run game** still picks and confirms the squad. Once it's confirmed, **Go to Teams** takes you to that game.
- On **Teams**, choose the game. If someone drops out, press ✕ to move them to the reserves and **+ In** to bring a reserve in.
- **Generate teams** splits the squad into Team 1 and Team 2 (5v5 for 10, 6v6 for 12, 6v5 for 11). It balances Attack, Defence and Fitness separately, shares regular keepers out evenly (two means one each, three means two and one), and keeps the two teams' keepers as close as possible. With one regular keeper or none, everyone's Goalkeeping score is used, so both teams get the best keeper available. It also follows the team rules. The **Skill balance** card shows how the two teams compare on each skill. It then picks at random from the most even splits, so you won't always get the same teams. A coin flip decides who wears the bibs.
- **Reshuffle** gives a different balanced split, and **Flip for bibs again** redoes just the coin flip. To swap two players by hand, tap one and then one on the other team.
- The **Teams message** uses the group's format, with the date, time and venue at the top. **Copy for WhatsApp** copies it and **Open WhatsApp** opens WhatsApp with it filled in.
- Until you press **Confirm teams**, the teams are a draft. The draft is saved and the other organisers can see it on the Teams tab, but it isn't on the front page. Once confirmed, the teams show on the front page and in History. **Change teams** turns them back into a draft.

### Late arrivals
Mark anyone who turned up late with the **⏰ Late** button next to their name in the History game log, or the ⏰ on their name on the Teams tab. The game log shows how many were late.

The next time a squad is picked that they're available for, late players are picked after everyone else who isn't guaranteed. So if the game is full, they're the first to become reserves. Run game marks them **Late last time** and says who was moved down. Players on the guaranteed list, and last game's reserves who were promised a place, still get in. Once a later game includes them, as playing or reserve, the penalty is cleared.

**Setup (once):** run `supabase/late.sql` in the Supabase SQL Editor. Until then, late arrivals are saved only on the device where they were marked.

### Ratings
The **Ratings** tab is where organisers score each player from 1 to 10 on **Attack**, **Defence**, **Fitness** and **Goalkeeping**. Tap a player to change their scores. **Overall** is the average of Attack, Defence and Fitness. The position (Defender, Striker or Anywhere) is worked out from Attack and Defence unless you choose one. Everyone has a Goalkeeping score in case there aren't enough keepers; switch on **Regular keeper** for your keepers. Players who haven't been scored yet start from their old 1–5 star rating: each skill is the stars × 2, Goalkeeping starts at 7 for keepers and 5 for everyone else, and new players start at 6. **Team rules** keep two players apart or always put them on the same team. Ratings only change when an organiser changes them. The tab isn't shown in View mode, but like the rest of the data, the ratings aren't truly private.

### Scores
After a game, open it in the History game log and enter the score under the teams. The game log then shows the score, or **Score needed** for a played game with no score yet. The winning team is marked **Won**. The **Win / loss record** card lists each player's played, won, drawn and lost, and their win percentage. The **Game log (CSV)** export includes both teams, who wore the bibs and the score, ready for further analysis.

**Setup (once):** run `supabase/teams.sql` and `supabase/skills.sql` in the Supabase SQL Editor. They create the tables for ratings, skill scores, team rules, and each game's teams and score. Until then, these are saved only on the device where they were entered, and the Teams and Ratings tabs show a notice.

### Front page and log in
The page opens on a front page showing the next game (date, time, venue, organiser and squad) and the kitty, with two buttons:

- **View** opens the app read-only: History and Money only, with no buttons to change anything.
- **Log in** asks for the organiser password and opens the full app. The device stays logged in until someone presses **Log out**; until then the button says **Continue as organiser**.

The password is checked inside the page, so this stops accidental changes but isn't real security: the site's code and database key are public.

### Access
Behind the front page there is no database sign-in: the database itself still accepts changes from anyone with the link. If saving stops working because the database has stricter rules, run `supabase/policies.sql` in the Supabase SQL Editor to open the tables back up.

### How saving works
Each save sends only the players and games that changed since the last successful save. A device with an out-of-date copy can't delete rows it never saw. If two organisers edit the same player or game, the later save wins for that row.

## Notes
This is a basic example for learning. For a real app, you would usually add:

- match history
- login/admin users
- a proper production database like PostgreSQL or MySQL

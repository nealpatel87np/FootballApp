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
The design is documented in [`docs/SOLUTION_DESIGN.md`](docs/SOLUTION_DESIGN.md) (Solution Design Document) and [`docs/SYSTEM_SPEC.md`](docs/SYSTEM_SPEC.md) (functional specification). Both include the versioning policy. Current release: **3.7**. The version is shown at the bottom of the front page.

Every file in `supabase/` grants the page access to its tables. Supabase no longer does this automatically for tables created from 30 October 2026, so any new table needs the same `grant` line.

`index.html` in the project root is the football organisation page. It is published with GitHub Pages and saves its data to Supabase.

### WhatsApp message
The page can write the weekly WhatsApp message for you.

- Before the game, open **Availability message** on **Run game** (tap **Show**). Choose Monday or Thursday, check the date, time and venue, then **Copy for WhatsApp** or **Open WhatsApp**. WhatsApp doesn't let a link create a poll, so add the poll in the group yourself (📎 → Poll).

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
- The Games list only shows games that still need something: money still owed, or a recent game whose money isn't tracked yet. Once everyone in a game has paid it drops off the list; **Show paid games** shows every game so you can look back or untick a payment. The Kitty ledger shows the latest 15 rows (**Show full ledger** for the rest). Paid games still count in every total. The History game log also shows the latest 5 games with a **Show older games** button.
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
After a game, open it in the History game log and enter the score under the teams. The game log then shows the score, or **Score needed** for a played game with no score yet. The winning team is marked **Won**. The **Player Stats** tab lists every player's games played, won, drawn and lost, with their win percentage, most games first. It only counts games with confirmed teams and a score. The **Attendance** tab, for organisers only, shows each player's appearances **Before 2026**, in **2026** and in **Total**, plus how many times they've been a reserve. Appearances from before the app come from the old spreadsheet (stored in the page as `LEGACY_APPS`) and are added to the games recorded in the app. They're matched by name, so a player from the old spreadsheet who isn't in the app yet shows their numbers as soon as they're added with the same name. Below the table, **Legacy Player Data** (closed until you tap **Show**) lists every name from the old spreadsheet with their figures and a ✓ for those already in the app. The **Game log (CSV)** export includes both teams, who wore the bibs and the score, ready for further analysis.

**Setup (once):** run `supabase/teams.sql` and `supabase/skills.sql` in the Supabase SQL Editor. They create the tables for ratings, skill scores, team rules, and each game's teams and score. Until then, these are saved only on the device where they were entered, and the Teams and Ratings tabs show a notice.

### Install as an app
The page can be installed on a phone as **Brent Football**, with its own icon on the home screen.

- **Android:** open the link in Chrome and tap **Install app** when it's offered, or ⋮ → **Install app** / **Add to Home screen**.
- **iPhone:** open the link in Safari, tap **Share**, then **Add to Home Screen**.

In the browser, the front page shows a **Welcome** card with these steps and an **Install app** button (Chrome on Android) until you install it or tap **Continue in the browser**. The Notifications page also has an **Install the app** section until it's installed.

It opens full screen with no address bar, and shows the last data even with no signal. It's the same site, so every update reaches the app automatically. The icon files are in `icons/`, and `manifest.webmanifest` and `sw.js` make it installable.

### Push notifications
Players can get notifications on their phone from the installed app. They're told when they're picked or are a reserve, which team they're on, and when they owe money.

- **Turning on:** on the front page, the **Get notified** card asks **Who are you?** Choose your name and tap **Turn on notifications**, then allow them when the phone asks. The **Notifications** page has the same option, plus choices for each kind:
  - Squad picked, Teams confirmed and Payment reminders are on by default.
  - Credit used is off by default.
  - The page also has a test button, **Not you?** and **Turn off**.
- **Android:** install the app from **Chrome**. On Samsung phones, notifications from the Samsung Internet version arrive but don't pop up; the app says so and has an **Open in Chrome** button.
- **iPhone:** first add Brent Football to your Home Screen from Safari (Share → Add to Home Screen) and open it from there. iOS 16.4 or later is needed.
- **Organisers:**
  - **Notify the squad** is ticked on Run game when you confirm a game.
  - **Notify the players** is ticked on Teams when you confirm teams.
  - **Send reminders** on Outstanding Payments sends a reminder to everyone who owes and has notifications on.
  - When credit pays for a game, that player is told automatically.
  - Every day at **12pm** UK time, anyone who still owes on any tracked game gets one reminder with the total, the games and who to pay, until they've paid. Players can switch payment reminders off on the Notifications page.
- Tapping a payment notification opens Payments.

**Setup (once):** until this is done, the Notifications page and options don't appear.
1. Run `supabase/push.sql` in the Supabase SQL Editor.
2. Deploy the Edge Function:
   1. In the Supabase dashboard, open **Edge Functions → Deploy a new function → Via Editor**.
   2. Name it `notify`, paste the whole of `supabase/functions/notify/index.ts`, and press **Deploy**.
   3. Open the function's **Settings**, turn off **Verify JWT** (also called "Enforce JWT verification"), and save.
3. Run `supabase/push-cron.sql` in the SQL Editor for the automatic daily reminders. If it says the extensions can't be created, turn on **pg_cron** and **pg_net** under **Database → Extensions**, then run it again.

If the Notifications page doesn't appear, the 🔔 line at the top of **Setup** says why. If a test says "Received on this phone" but no banner pops up, the phone is showing them silently: on Samsung, long-press the notification in the panel, tap Settings, then choose **Alert** and **Show as pop-up**.

There's no key to create or paste: the function makes its own notification keys the first time it runs. The phones and keys are kept in tables the page can't read. As with the rest of the app, there's no sign-in, so anyone could pick another name under "Who are you?".

### Self-service availability
Players can say whether they're in for the next game in the app. At closing time the squad is picked automatically with the usual Run game rules. It's switched **off** until an organiser turns it on.

- **The switch:** Setup → **Self-service availability** → Show:
  - **Off:** nothing changes.
  - **Trial:** only organisers see it and get its notifications, and every squad waits for you to tap **Confirm and announce**.
  - **On:** everyone.
  - The same card has the times, kick-off, venue, **Announce automatically**, and which player each organiser is. Organisers get the organiser notifications, and they're the only ones notified in Trial.
- **Timetable:** Thursday games open **Tuesday 9am**; Monday games open **Friday 9am**. Both close at **9pm** that day, when the squad is picked, saved like Confirm game, and everyone is told whether they're playing or a reserve. You can open early or close early from Run game.
- **Players:**
  - The first time, they see a welcome and install card, then **Who are you?**.
  - When availability is open, they tap **I'm in** or **I'm out**. Guaranteed players must say they're in too, or they count as out.
  - Players never see late flags. Late arrivals still count when the squad is picked.
- **After 9pm:**
  - **I can't make it any more** moves the first reserve up, and they're told. Organisers are told, and the teams are flagged for redoing.
  - Anyone who says in late joins the squad if there's space, or the reserves.
  - With fewer than 10, the squad is saved and organisers are warned.
  - Changes stop at kick-off.
- **Run game:** shows organisers the live counts, who's guaranteed but hasn't answered, the squad "if it closed now" (with late tags), and buttons for Nudge, Close now, Cancel this week, answering for a player, and Confirm and announce.
- **App users** (organisers, under More) shows who has set up the app, whether it's installed, on which browser, and which notifications they have on.

**Setup (once):**
1. Run `supabase/availability.sql` in the SQL Editor.
2. Redeploy the `notify` function. Open its Code tab, paste the whole of the new `supabase/functions/notify/index.ts`, and press Deploy. Keep Verify JWT off. The function has its own copy of the squad rules from `selection.js`, so if a rule ever changes, both files must change.
3. Turn it to **Trial** on Setup when you're ready to try it.

### Moving around
Once a phone has picked its name, the front page says **Hi {name}** with what matters to them: playing or reserve, whether they've said in, and what they owe. **Not you?** changes the name. Organisers start on the **Dashboard**, which greets them too and shows the next game (live availability counts or the saved squad), a to-do list with a button for each job, money, who's on the app, turnout over the last 10 games, a league table for the year (3 points a win, 1 a draw), and this season's most games and best win %. On a phone the organisers' bar is Dashboard, Run game, Teams and Payments, with **More** for the other pages, including Game Log. On a computer the pages are a row of tabs along the top. In View mode only Game Log, Player Stats and Payments are shown, plus Notifications once they are set up.

The **Payments** tab (called Money before) holds Outstanding Payments, credit, the kitty, games and the ledger.

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

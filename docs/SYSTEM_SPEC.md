# Football Organisation App: System Specification

| | |
|---|---|
| **Document version** | 4.0 |
| **Release** | Production Release 4.0 |
| **Status** | Released |
| **Date** | 24 October 2026 |
| **Application** | `index.html` (repository root), published with GitHub Pages |
| **Owner** | The organisers (Neal, Kev, Gav) |

---

## 1. Document control

### 1.1 Version numbering

This document and the application share one version number, **MAJOR.MINOR**.

| Change type | Version rule | Examples |
|---|---|---|
| **Minor adjustment** | Increase MINOR: 1.0 → 1.1 → 1.2 | Wording or label changes, layout tweaks, a new column on an existing table, a small rule change, bug fixes, adding a legacy player figure |
| **Major overhaul** | Increase MAJOR and reset MINOR: 1.x → 2.0 | A new page or workflow, a change to how squads or teams are picked, a new or restructured database table, a change to how money is calculated, replacing the hosting or database |

If you aren't sure, treat it as minor unless it changes the data model or a core rule in section 7.

### 1.2 How a change is released

1. Agree the change, using a mock-up or preview where it helps.
2. Make the change on a working branch and test it at phone width (375–390px) and desktop width.
3. Update this document:
   - Raise the version number in the table at the top.
   - Add a row to the revision history (1.3).
   - Edit the sections that describe the changed behaviour.
4. Merge the pull request into `main`. GitHub Pages deploys automatically.
5. Tag the merge commit with the version, for example `v1.1`.
6. If the release adds a SQL file, run it once in the Supabase SQL Editor (section 11.2).

### 1.3 Revision history

| Version | Date | Summary |
|---|---|---|
| 1.0 | 22 Oct 2026 | First production release. Covers squad selection, team picking with skill ratings, late arrivals, scores and player stats, attendance with legacy data, payments, credit, the kitty, WhatsApp messages, front page and access, and phone and desktop navigation. |
| 1.1 | 23 Oct 2026 | Every SQL script now grants the page access to its tables through the Data API, as Supabase requires for tables created from 30 Oct 2026. No app change. |
| 1.2 | 23 Oct 2026 | The app is named Brent Football and can be installed on the home screen, with its own icon, a green opening screen and full-screen display. It opens with the last data when there's no signal. |
| 1.3 | 24 Oct 2026 | Run game has an **Availability message** card (hidden until Show) for the pre-game availability message and poll. |
| 2.0 | 24 Oct 2026 | **Push notifications**: players turn them on with "Who are you?" and choose which kinds they get. They're notified when the squad and teams are confirmed, by payment reminder (from Outstanding Payments, and automatically the morning after a game) and when credit is used. New Notifications page, front-page card, `notify` Edge Function and two new tables. |
| 2.1 | 24 Oct 2026 | The daily payment reminder schedule sends the project's public key so Supabase lets it reach the function. Re-run `push-cron.sql`. |
| 2.2 | 24 Oct 2026 | Setup shows organisers a 🔔 line saying whether notifications are connected, and why not. |
| 2.3 | 24 Oct 2026 | Turn on notifications stops with a message saying which step failed, instead of staying on "Turning on…". |
| 2.4 | 24 Oct 2026 | The front page shows the version ("Brent Football 2.4"), turning on shows each step, and new releases reach the installed app straight away. |
| 2.5 | 24 Oct 2026 | Notifications page: a "Received on this phone" confirmation when a push arrives while it's open, a **Show one on this phone** button, and the phone's push service and version. |
| 2.6 | 24 Oct 2026 | Repeat notifications of the same kind still alert and vibrate, rather than quietly replacing the last one. |
| 2.7 | 24 Oct 2026 | A football badge shows in the status bar for each notification. In Samsung Internet, the app advises installing from Chrome for notifications, with an Open in Chrome button. |
| 3.0 | 24 Oct 2026 | **Self-service availability** behind an Off / Trial / On switch. Players say in or out. It opens Tuesday (Thursday games) or Friday (Monday games) at 9am and closes at 9pm, then the squad is picked with the Run game rules, saved and announced. Drop-outs move reserves up, and late joiners fill gaps. Guaranteed players must say in. Late flags are organiser-only. New **App users** page, first-time welcome and Who are you? cards, and an Availability notification type. |
| 3.1 | 24 Oct 2026 | The notify function carries its own copy of the selection rules, so Supabase can deploy it. |
| 3.2 | 24 Oct 2026 | Organiser **Dashboard**, the first page after logging in: next game, to-do list, money, the group, turnout and this season. The organisers' phone bar is now Dashboard, Run game, Teams, Payments and More. |
| 3.3 | 24 Oct 2026 | Dashboard layout: The group under To do; Money, a new League table and This season in one row; Turnout across the bottom, showing reserves. To do groups repeated jobs into one line. |
| 3.4 | 24 Oct 2026 | App users no longer shows when each phone was last seen. |
| 3.5 | 25 Oct 2026 | The install card shows to anyone using the app in a browser, whatever the availability switch. The Notifications page has an **Install the app** section. |
| 3.6 | 25 Oct 2026 | Automatic payment reminders go out every day at 12pm UK time to anyone who still owes, until they've paid. |
| 3.7 | 25 Oct 2026 | "Hi {name}" greeting on the front page (and the Dashboard for organisers) once a phone has picked Who are you?, with chips for the next game, availability, money and credit, and a Not you? link. |
| 3.8 | 25 Oct 2026 | Quieter Supabase traffic: availability refreshes every 30 seconds only while a round is open (otherwise every 5 minutes, and when the app comes back on screen). The availability check runs from 8am to 10:45pm UK time, so Setup only accepts opening and closing times in that window. Nightly tidy-up of schedule history. Run `supabase/schedule-3.8.sql`. |
| 3.9 | 26 Oct 2026 | Dashboard Turnout shows just the numbers, and Money drops who owes most. A game with fewer than 10 playing counts as cancelled: no money, score or late prompts, and Payments shows it only under Show paid and cancelled games, with Track anyway. |
| 4.0 | 26 Oct 2026 | **Cancel a game.** Run game offers Cancel game: not enough players when fewer than 10 are picked. Organisers can cancel any saved game from the Dashboard, Run game or Game Log (Drop-outs, Pitch not available, Weather, Other, plus a note), and Undo it. Availability that closes with fewer than 10 is held: Cancel game, Keep it open or Confirm anyway. Cancelled games stay in the Game Log but don't count and need no money. Players are told and the front page says the game is off. Run `supabase/cancel.sql`, then redeploy the `notify` function. |
| 4.0 (update) | 31 Oct 2026 | No version change. Payments shows players only their own balance. Once availability's closing time has passed, players can't say they're in (they can still drop out); organisers can still add players, and Keep it open lets players in again. Redeploy the `notify` function. |

---

## 2. Purpose and scope

The app organises a regular five-to-six-a-side football group that plays on **Monday** and **Thursday** evenings. It replaces an earlier spreadsheet. It covers:

- the player list and who is available for each day
- choosing the squad of up to 12 and the reserves
- picking balanced teams closer to kick-off
- WhatsApp messages for the squad and the teams
- recording scores and producing player statistics
- attendance history, including figures carried over from the spreadsheet
- collecting money, tracking who owes, player credit and the shared kitty

It doesn't handle bookings with the venue, online payments or player accounts.

## 3. Users and access

| Role | How they get in | What they can do |
|---|---|---|
| **Organiser** (Neal, Kev, Gav) | **Log in** on the front page with the organiser password | Everything |
| **Viewer** (any player) | **View** on the front page | Read-only access to Game Log, Player Stats and Payments. No buttons that change data. |

- The organiser password is checked in the browser against a SHA-256 hash (`ORGANISER_PASS_SHA256`). After a successful login, the device stays logged in (`fbv3_organiser`) until **Log out**, and the front page button then reads **Continue as organiser**.
- **Security limitation:** the page's code and the Supabase key are public, and the database accepts reads and writes from anyone with the key. The login stops accidental changes. It doesn't protect data from a determined person. Organiser-only pages (Ratings, Attendance) are hidden from viewers, but their data can still be read from the database.

## 4. Architecture

| Part | Detail |
|---|---|
| Front end | A single file, `index.html`, holding HTML, CSS and JavaScript. No build step. |
| Hosting | GitHub Pages. The workflow `.github/workflows/static.yml` deploys the repository on every push to `main`. |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js@2` loaded from jsDelivr. Project URL and publishable key are in `index.html`. |
| Icons | Tabler Icons web font, `@tabler/icons-webfont@2.44.0`, from jsDelivr. |
| Local storage | The browser's `localStorage` keeps a full copy of the data, so the page opens immediately and works when the database can't be reached. |
| Legacy figures | Appearance figures from the old spreadsheet are stored in the page itself as `LEGACY_APPS`. They are not in the database. |

The repository also contains an unrelated starter app (`server.js`, `public/`, SQLite) that isn't part of this system.

### 4.1 Layout and themes

- One central column, 680px wide at most.
- Light and dark themes follow the device setting.
- **Phone layout (720px wide or less):** navigation is a bar fixed to the bottom of the screen.
- **Desktop layout (wider than 720px):** navigation is a row of tabs along the top.

## 5. Navigation

| Page | Organiser | Viewer | Phone bottom bar |
|---|---|---|---|
| Dashboard | ✓ | | Bar (first) |
| Setup | ✓ | | More |
| Run game | ✓ | | Bar |
| Teams | ✓ | | Bar |
| Ratings | ✓ | | More |
| Game Log | ✓ | ✓ | More (in the bar for viewers) |
| Player Stats | ✓ | ✓ | More (in the bar for viewers) |
| Attendance | ✓ | | More |
| Payments | ✓ | ✓ | Bar |
| Notifications (once set up) | ✓ | ✓ | More (in the bar for viewers) |
| Availability (when switched on) | ✓ | ✓ (On only) | More (in the bar for viewers) |
| App users | ✓ | | More |

- **Phone bottom bar:**
  - Organisers get four buttons with icons (Dashboard, Run game, Teams, Payments) and **More**. More slides up a sheet with the other pages (Setup, Ratings, Availability, Game Log, Player Stats, Attendance, Notifications and App users). While one of those pages is open, the More button shows its name.
  - Viewers get their three pages in the bar, with no More.
- **Desktop:** one row of tabs with every page available to the user.
- Buttons inside pages that jump elsewhere, such as **Go to Teams**, keep the menu in step.
- The menu is hidden on the front page.

## 6. Functional specification by page

### 6.1 Front page

- When the phone has picked **Who are you?**, a greeting card says **"Hi {name} 👋"**. It has chips for:
  - **the next game:** playing, which reserve, or not in the squad; or, while availability is open, whether they've said in;
  - **money:** what they owe, or All paid up, plus any credit.

  **Not you?** changes the name. Organisers also see it on the Dashboard, with the time of day, their to-do count and how many are in.

- Shows the **next game**: the earliest game dated today or later, or else the most recent game. It includes the date, time, venue and organiser (when money is tracked).
- Shows the **confirmed teams** for that game if there are any. Otherwise it shows the numbered squad and the reserves.
- Shows kitty tiles: **In the kitty** and **Still owed**.
- Has **View** and **Log in** buttons. Log in opens a password box.
- Shows a **Get notified** card at the top until notifications are on or dismissed on that phone (6.10).

### 6.2 Setup (organisers)

- A **Players** count across the top.
- **Add player**, closed until **Show** is tapped. It takes:
  - a name, which must be unique, ignoring capitals;
  - days available: Monday only, Thursday only or both;
  - a preferred day, if they're available on both;
  - whether they're on the guaranteed Monday and/or Thursday list.
- **All players** list showing day badges, preferred day, guaranteed lists and a **→Next** tag for reserves carried over. The edit button opens inline editing and **Remove**.
- **Export data** and **Import data**, each closed until **Show** is tapped (section 10).

### 6.3 Run game (organisers)

1. Choose the **organiser** (Neal, Kev or Gav). It's remembered on the device as `fbv3_org` and becomes the default when money is tracked. Then choose **Monday** or **Thursday**.
2. **Who's available:** lists players eligible for that day.
   - Guaranteed players and last game's reserves (→Next) are pre-ticked.
   - Players with a late penalty are tagged **Late last time**.
3. **Pick squad:** orders the ticked players by the selection rules (7.1). The first 12 play and the rest are reserves.
   - Players can be moved between playing and reserves.
   - Notices explain any reserve guarantee honoured and who was moved down for lateness.
   - The WhatsApp squad message card is shown (section 8).
4. **Confirm game:** saves the game, dated for the next Monday or Thursday (today if it's that day).
   - Updates each player's played and reserved counts and last played date.
   - Sets this game's reserves as the next game's reserve guarantee.
   - Money is **not** tracked automatically.
   - The confirmation screen lets you adjust the squad and offers **Go to Teams**.
5. **Fewer than 10 picked (4.0):** a red "Not enough players" warning replaces the usual note, and the WhatsApp message becomes the cancelled one (8.3).
   - **Cancel game: not enough players** (instead of Confirm game) saves the game as cancelled. It tells those picked "❌ {Day}'s game is cancelled. Not enough players: only N were available and we need 10. No payment needed." (if "Tell the N the game is cancelled" is ticked). Nobody's games played or reserve count changes, and the last game's reserves keep →Next.
   - The confirmation screen then says **Game cancelled: not enough players**, with **Undo cancel**. The squad and Teams cards are hidden.
   - **Confirm game anyway with N** saves and announces it as normal.

### 6.4 Teams (organisers)

- **Choosing a game:** the list shows upcoming games and the two most recent past games. The default is the earliest upcoming game without confirmed teams.
- **Header:** date, time, venue and organiser, with a status of **Teams not picked**, **Draft — not confirmed** or **Teams confirmed**.
- **Squad:**
  - ✕ moves a player to the reserves and **+ In** brings a reserve in. Both only work before the teams are confirmed.
  - ⏰ marks a player as late. This works at any time.
- **Generate teams:** runs the team picker (7.4).
- **Results:**
  - the bibs coin flip;
  - a skill balance card comparing Attack, Defence, Fitness and Keeper for each team, with "Even" or "N apart";
  - checks for the keeper split and team rules;
  - each team listed with keeper, position badge and overall score.
- **Draft actions:** **Reshuffle**, **Flip for bibs again**, and tap two players on opposite teams to swap them.
- **Teams message:** **Copy for WhatsApp** and **Open WhatsApp** (section 8).
- **Draft and confirm:**
  - A draft is saved and shared with all organisers.
  - **Confirm teams** shows them on the front page and in the Game Log.
  - **Change teams** returns them to draft. **Discard draft** deletes a draft.
  - If the squad changes after teams are made, a draft is cleared automatically. Confirmed teams show a warning instead.

### 6.5 Ratings (organisers)

- Each player has 1–10 scores for **Attack**, **Defence**, **Fitness** and **Goalkeeping**, with coloured bars. Tap a player to edit with sliders.
- **Overall** is the average of Attack, Defence and Fitness, to one decimal place.
- **Position:**
  - Auto: Defender if Defence is 2 or more above Attack, Striker if Attack is 2 or more above Defence, otherwise Anywhere.
  - Can be set by hand to Defender, Striker or Anywhere.
- **Regular keeper** switch.
- Sort by name, Overall or any skill.
- **Team rules:**
  - **Keep apart** or **Same team** for a pair of players, with an optional note.
  - Only one rule per pair. Rules can be deleted.

### 6.6 Game Log (everyone)

- Games newest first. The latest 5 are shown, with **Show older games**.
- Each game's summary shows playing and reserve counts, the score, **Score needed**, draft teams, and how many were late.
- An open game shows:
  - the date, which can be corrected (the day type follows the weekday);
  - teams and score: organisers enter scores with **Save score** or **Clear score**, and the winning team is marked **Won**;
  - the playing list with ⏰ Late, Reserve and Remove;
  - the reserves list;
  - add a player;
  - **WhatsApp update** (the squad message for that game, or the cancelled message for a cancelled game);
  - **Cancel game** (organisers, 4.0) and **Delete this game**.
- **Cancelled games** have a **Game cancelled** badge and their reason in the summary ("Weather · 12 left · note"). Open, they show who cancelled and when, **Copy WhatsApp message**, **Open WhatsApp** and **Undo cancel**, with no late or add-player controls. A past game with fewer than 10 and no money tracked also shows the badge ("Only 9").
- **Add game** records a game by hand. It takes a date, a type (Monday, Thursday or ad hoc), players and reserves, an optional organiser (which starts money tracking), and an option to carry the reserves to the next game.

### 6.7 Player Stats (everyone)

- One row per player, with bordered cells: **Played**, **Won**, **Drawn**, **Lost** and **Win %**.
- Only games with **confirmed teams and a recorded score** count, so Played = Won + Drawn + Lost.
- Win % is wins divided by Played, rounded. It shows "–" when Played is 0.
- Sorted by most games played, then most wins, then name.

### 6.8 Attendance (organisers)

- **Main table:**
  - Columns are **Before 2026**, one column per year from 2026, **Total** and **Reserve**.
  - Sorted by Total, then name.
- **Column definitions:**
  - Before 2026 = the legacy "Old" plus "2025" figures.
  - 2026 = the legacy 2026 figure plus 2026 games in the app.
  - Each later year = games in the app only. A new column appears automatically each year.
  - Total = the sum of all columns.
  - Reserve = the app's reserve count.
- **Legacy Player Data:** a section closed until **Show** is tapped. It lists every name in `LEGACY_APPS` with Before 2026, 2026 (before the app) and Total, and a ✓ for names already in the app. It's view-only.

### 6.9 Payments (organisers; players see only their own balance)

**Players (View mode):** only a **Your balance** card for the phone's Who are you? name. It shows **You owe** (total and number of games) or **All paid up**, **Credit**, each unpaid game with its date, who to pay and the amount, and **Not you?**. With no name chosen, it asks them to choose one. Nothing about other players is shown or put on the page.

**Organisers** see the full page:

Sections, from top to bottom:

1. **Outstanding Payments** and **Credit** buttons, each showing its total. Tapping one opens its list.
   - **Outstanding Payments:** only players who owe money. Each unpaid game is listed with its date, organiser and amount, with **✓ Clear** per game and **✓ Clear all** per player. A player drops off once they owe nothing.
   - **Credit:** players with credit and their amounts. Add credit with a player and an amount. **Remove** takes credit off by hand.
2. **Kitty**:
   - **In the kitty**;
   - **Still owed**, with how many payments it covers and what the kitty will be once they're collected;
   - one card per organiser showing the money they hold, the number of games, what's still owed to them, and a warning if they've paid out more than they hold.
3. **Games:**
   - Only games that still need something are listed: money still owed, a recent game whose money isn't tracked (with **Track money**), or the game that's open. When nothing is left, it shows **All games paid up 🎉**.
   - **Show paid games** lists every game. A game with fewer than 10 playing was cancelled, so it isn't listed as waiting for money; the button then says **Show paid and cancelled games**, and the game shows "Game cancelled · only N" with **Track anyway**. A game an organiser cancelled shows "Game cancelled · {reason}" and can't be tracked.
   - An open game shows: Organised by, the Paid ticks, **Mark all paid**, **Stop tracking money**, and the split (collected, pitch, to or from the kitty).
4. **Kitty ledger:**
   - starting balances (shown only when starting balances are shown), each tracked game's amount to or from the kitty, and kitty spends, with a running balance;
   - the latest 5 rows, with **Show full ledger** (and **Show only the latest 5** to collapse it);
   - **Spend from the kitty** (what, type (Dinner, Drinks, Football, Other), paid by, amount, **Add spend**), folded behind **Show** / **Hide** and closed by default;
5. **How each game is split**, at the bottom and closed until **Show** is tapped:
   - the price per player, pitch cost and admin share;
   - **Starting balances** for each organiser, also closed until tapped.

### 6.10 Notifications (everyone)

This page appears only once the `notify` function is set up (11.2). It's under **More** for organisers, and in the bottom bar for viewers.
- **Before turning on:** choose **Who are you?** and tap **Turn on notifications**. The phone asks for permission once.
- **Once on:** the page says "Notifications are on for {name} on this phone" and offers:
  - choices for **Squad picked**, **Teams confirmed**, **Payment reminders** (all on by default) and **Credit used** (off by default);
  - **Send a test notification**;
  - **Not you?**, to change the name;
  - **Turn off notifications**.
- **iPhone:** notifications only work in the app added to the Home Screen. Safari explains this instead.
- **Samsung Internet:** a note advises installing from Chrome, because Samsung phones don't pop up Samsung Internet's notifications. It has an **Open in Chrome** button.
- **Front page:** players who haven't turned notifications on see a **Get notified** card with the same name choice. **Not now** hides it on that phone.
- **Organisers sending:**
  - Run game has **Notify the squad** before Confirm game. It's on by default and shows how many have notifications on. Playing players get "You're playing" with the date, time and venue. Reserves get "You're a reserve this time. You're first in for the next game."
  - Teams has **Notify the players** before Confirm teams. Each player gets their team, and whether it wears the bibs.
  - Outstanding Payments has **Send reminders (N)**. Each player who owes gets the total, the games and who to pay.
  - Credit used is sent automatically when tracking a game's money uses someone's credit.
- **Automatic:** every day at 12pm UK time, each player who still owes on any tracked game gets one payment reminder with the total, the games and who to pay. It repeats daily until they've paid.
- **Tapping:** tapping a payment or credit notification opens Payments. The others open the front page.

### 6.11 Availability (players, when switched on)

Shown on the front page and on the **Availability** page, but only when Self-service availability is **On** (or **Trial** for logged-in organisers).

- **First time:**
  1. In a browser, a welcome card explains how to install the app, with **Install app** and **Continue in the browser**. On Samsung Internet it points to Chrome.
  2. **Who are you?** is picked once per phone.
  3. The Get notified card follows.
- **When nothing is open:** the card shows the next game and when its availability opens.
- **When open:** the card shows the game, then **I'm in** and **I'm out**, the closing time and how long is left, plus counts and the names of players who said in.
  - Guaranteed players see that they must say in by the closing time, or count as out.
  - Players never see late flags.
- **After closing time** (4.0 update): **I'm in** disappears. Players who said in see that the squad is being picked and can still tap **I can't make it any more**. Everyone else sees "Availability closed at 9pm. Contact the organiser if you'd like to play." This applies as soon as closing time passes, even before the squad is picked, and while it's held for an organiser.
- **When closed:** players see whether they're playing or which reserve they are (e.g. 2nd).
  - Players in the squad and reserves can drop out with **I can't make it any more**.
  - Others can't join themselves any more: they see "The squad has been picked and availability is closed. Contact the organiser if you'd like to play." An organiser can add them with **Answer for a player**.
- **Kept open:** if organisers choose **Keep it open** after closing time, **I'm in** comes back with "Kept open for late joiners until the organisers close it."
- **Cancelled:** "{day} is cancelled". If the saved game is cancelled later (4.0), the card says "✕ {Day}'s game is off", the reason and "No payment needed", with no answer buttons.
- **After kick-off:** no changes.

### 6.12 Self-service availability for organisers

- **Setup:** the **Self-service availability** card (Show / Hide). It holds:
  - the Off / Trial / On switch;
  - opening and closing times (between 8am and 10:45pm UK time, when the automatic check runs), and how many days before each game it opens;
  - kick-off time and venue;
  - **Announce automatically**;
  - each organiser's own player name (used for organiser and trial notifications);
  - a link to **App users**.
- **Run game:** a card at the top shows:
  - in / out / no-answer counts, and guaranteed players who haven't said in;
  - the squad "if it closed now", with Guaranteed, →Next and Late last time tags;
  - **Close now**, **Nudge N**, **Cancel this week**, and **Answer for a player** (In or Out);
  - when held, **Confirm and announce** and **Reopen**;
  - when held with fewer than 10 in (4.0), a warning with **Cancel game: not enough players**, **Keep it open** and **Confirm anyway with N**. Availability that closes with fewer than 10 is always held, even in On mode with auto-announce, and organisers are told "only N are in";
  - when the saved game has been cancelled, the cancelled box with Undo;
  - when closed, **WhatsApp message** and **Pick teams →**;
  - when nothing is open, **Open Monday now** and **Open Thursday now**.
- **Availability message:** when the switch is On, the message asks players to answer in the app, with the link.
- **App users (organisers):** counts and a table showing, for each player:
  - whether the app is set up (installed or in a browser), and the browser and platform;
  - whether notifications are on, and which kinds.

### 6.13 Dashboard (organisers)

The first page after logging in. It's a grid on a computer and one column on a phone, with the next game first on a phone.
- **Next game:**
  - **While availability is open:** live counts, time left, guaranteed players who haven't said in, and the squad "if it closed now". Buttons: Nudge, Close now (or Confirm and announce when held), and Answer for a player.
  - **Once the squad is saved:** a checklist (Squad, Teams, Money), the squad, and buttons for Pick teams, WhatsApp, Track money and **Cancel game** (4.0). With fewer than 10 left, a warning shows and Cancel game is red. On the day it's titled "Tonight".
  - **Cancel game** opens a dialog: a reason (Drop-outs, Pitch not available, Weather, Other), an optional note for players, what will happen, and **Send a notification**. Once cancelled, the card shows **Game cancelled**, who and when, the notification result, **Copy WhatsApp message**, **Open WhatsApp** and **Undo cancel**.
  - **Held with fewer than 10:** Cancel game: not enough players, Keep it open, Confirm anyway.
  - **When nothing is open:** when availability opens next, with Open now.
- **To do:** a confirmed squad waiting, guaranteed players not in, missing scores, money not tracked, draft or changed teams, money owed, and late arrivals (optional). Cancelled games (under 10 playing) are left out. Each has a button. "All caught up" when there's nothing.
- **Money:** kitty, owed, credit, each organiser's holdings, and Send reminders.
- **Recent answers** (availability) and **The group** (app and notification counts, who's not on the app, Copy invite message).
- **League** for this year: P, W, D, L, goal difference and points (3 a win, 1 a draw), as many rows as fit beside Money (top 6 on a phone).
- **This season** (most games, best win %).
- **Turnout** across the bottom: the last 12 games, players and reserves stacked, with each game's numbers (for example 12+1). Cancelled games (under 10) are red.
- **Computer layout:** To do and The group on the left beside Next game; Money, League and This season in one row; Turnout full width. Cards in a row are the same height.

## 7. Business rules

### 7.1 Squad selection order

The ticked players are sorted, and the first **12** play. Rules apply in this order:

1. **Guaranteed list** for that day first.
2. **Reserve guarantee:** last game's reserves (`reserveNext`).
3. **Late penalty:** players marked late at their last game go after everyone else not covered by rule 1 or 2.
4. **Day preference:** players available on only this day first, then players whose preferred day is this day, then everyone else.
5. **Most times in reserve** first.

Organisers can override the result by moving players before confirming.

### 7.2 Reserve guarantee

- Confirming a game sets its reserves as `reserveNext`.
- Moving players in or out of the **latest** game updates `reserveNext`.
- Deleting the latest game restores the previous game's reserves.
- A hand-added game carries its reserves only if that option is ticked and it's the newest game.

### 7.3 Late arrivals

- A player marked late for a game has a **late penalty** until a later game includes them, as playing or reserve.
- While the penalty applies, rule 3 in 7.1 places them after everyone who isn't guaranteed. Guaranteed players and reserve-guaranteed players are unaffected.
- Late marks are stored per game (`game_late`). Deleting a game deletes its marks.

### 7.4 Team picker

**Input:** the game's current squad.

1. **Split sizes:** every split into two teams whose sizes differ by at most one (5v5, 6v6, 6v5). For more than 20 players, a random sample of 20,000 splits is used instead.
2. **Hard rules**, which must be met if any split can meet them:
   - **Keep apart** pairs on different teams, and **Same team** pairs together.
   - If there are two or more **regular keepers**, they're shared out evenly: no team has more than one extra.
3. **Score for each split.** Lower is better.
   - The sum of the gaps between the two teams' total Attack, total Defence and total Fitness.
   - Plus **2 ×** the gap between the teams' keeper scores. A team's keeper score is its best regular keeper's Goalkeeping, or, if it has no regular keeper, its best Goalkeeping score among all players.
4. **Choice:** pick at random from the lowest-scoring splits, never repeating the current teams. If necessary, the next score up is allowed.
5. **Labels:** a coin flip decides which side is Team 1, and a second coin flip decides which team wears the **bibs**.

**Display order** within a team: regular keepers, then Defenders, Anywhere, Strikers, then alphabetical. This means the order never reveals ratings.

### 7.5 Skill defaults

A player with no saved skills starts from their old 1–5 star rating (`player_ratings`):

| Setting | Starting value |
|---|---|
| Attack, Defence, Fitness | stars × 2 (6 if there's no rating) |
| Goalkeeping | 7 if they were ticked as a keeper, otherwise 5 |
| Position | the old position, or Auto |
| Regular keeper | the old keeper tick |

Nothing is saved for a player until a score is changed.

### 7.6 Scores

- A score can be entered only for a game with confirmed teams, dated today or earlier.
- Scores are whole numbers, 0 or more.
- The team with more goals is marked **Won**. Equal goals is a draw.

### 7.7 Money

Amounts are stored in pence.

- **Defaults:** £8.50 per player, £80 pitch, 10% admin share of any surplus. The settings apply to games tracked after they're changed.
- **Tracking:** a game's money counts only once it's **tracked**, with **Track money** or a hand-added game with an organiser. Tracking copies the current price, pitch cost and admin percentage onto the game, so later setting changes don't rewrite past games.
- **For each tracked game:**
  - collected = players ticked as paid × price
  - surplus = collected − pitch
  - admin = surplus × admin%, rounded, but only when surplus > 0
  - to the kitty = surplus − admin. A negative figure is a shortfall paid from the kitty.
  - owed = unpaid players × price
- **Kitty:** for each organiser, kitty money = starting balance + to-kitty from the games they organised − spends they paid. The kitty total is the sum across organisers. The admin share is deducted but not displayed.
- **Outstanding Payments** are the tracked games' unpaid players. **Clear** ticks the player as paid on that game, so the two views always match.

### 7.8 Credit

- Credit is a list of players and amounts (`player_credit`). It isn't counted in the kitty until it pays for a game.
- **Adding credit:** the new amount plus any existing credit pays off the player's **oldest unpaid games** first, whole games only. Anything left over stays as credit.
- **When a game's money starts being tracked:** any player in it with credit of at least the game price is marked as paid, and the price comes off their credit.
- Credit below one game's price stays until it's topped up.
- Players with zero credit drop off the list.

### 7.9 Legacy appearances

- `LEGACY_APPS` holds `[name, before 2026, 2026 before the app]` for each name from the old spreadsheet. 2026 figures exclude games already in the app (from 8 Oct 2026).
- **Name tidying applied:**
  - "friend of", "mate", "colleague", "son" and "bro" tags removed;
  - Kevin → Kev, Russell → Russ, David → Dave, Gavin → White Gav, Crhis → Chris;
  - names that would clash keep a label, for example "Carlos (Emad's mate)".
- **Matching:** figures are matched to players by exact name, ignoring capitals. Someone added later with a matching name picks up their figures.
- **Display only:** the figures appear on Attendance only. They never affect played or reserve counts, selection, teams, stats or money.

### 7.10 Cancelled games (4.0)

- A game is **cancelled** when an organiser cancels it, or when it's past, had fewer than 10 playing and its money was never tracked.
- **Cancelling** takes one off each player's games played or times reserved, moves "last played" back, and removes any money tracking. If it's the latest game, the last real game's reserves and this game's reserves keep →Next.
- **Cancelled games don't count** for games played, Attendance, Player Stats, the league, This season, the Teams picker or the late rule.
- **Undo** adds the counts back and tells everyone it's back on ("✅ {Day}'s game is back on").
- **Who's told** about a cancellation: the squad, the reserves and anyone who dropped out through availability (Squad notifications).
- **Front page:** "✕ {Day}'s game is off" with the reason and "No payment needed". The greeting chip says "✕ {Day} cancelled".
- **Payments:** "Game cancelled · {reason}", behind Show paid and cancelled games, with no Track button. **Turnout:** a red ✕.

## 8. WhatsApp messages

Both messages are built from the game's date and the time and venue saved for that day type. Time and venue are remembered per day type on the device, with defaults of 6:30 PM and Harrow Powerleague.

### 8.0 Availability message (Run game, before the game)

Under "Which day are you running?", the **Availability message** card starts hidden (**Show** / **Hide**). Choose Monday or Thursday (it starts on whichever is next); the date defaults to the next one and time and venue come from that day's saved settings, which edits here also update. **Copy for WhatsApp** and **Open WhatsApp** as for the squad message. WhatsApp can't create a poll from a link, so the organiser adds the poll in the group.

**Availability message** (Run game, before the game; then add a WhatsApp poll by hand):

```
⚽️ {Weekday} Football
📅 {Mon} {nth} {Oct} | ⏰ {time, e.g. 6:30pm}
📍 {venue}

Please confirm availability ASAP! The final 12 players will be announced shortly after poll closes. ⚽️🔥
```

### 8.1 Squad message (Run game, confirmation screen, Game Log "WhatsApp update")

```
⚽️ {WEEKDAY} FOOTBALL ⚽️

📅 {Weekday} {day with st/nd/rd/th} {Month}
⏰ {time}
📍 {venue}

{count line}

{player}
…

*Reserve*  or  *Reserves*      (only when there are reserves)

{reserve}
…

*Pitch has been booked*        (only when ticked)
```

The count line is one of:

- "We have 12 and 1 reserve" or "We have 12 and 2 reserves"
- "We have 12 and no reserves"
- "We have 10 and need 2 more" (fewer than 12)

### 8.2 Teams message (Teams tab)

```
⚽️ {WEEKDAY} FOOTBALL ⚽️

📅 {Weekday} {day} {Month}
⏰ {time}
📍 {venue}

Teams for today

*Team 1* (bibs)

{players}


Vs

*Team 2*

{players}

See you later. Please be on time for the {time} kick-off
```

"(bibs)" goes on whichever team won the coin flip.

**Copy for WhatsApp** copies the text, falling back to selecting it. **Open WhatsApp** opens `wa.me` with the text filled in.

### 8.3 Cancelled message (4.0)

Shown on Run game when fewer than 10 are picked, and from the cancelled box.

```
⚽️ {WEEKDAY} FOOTBALL ⚽️

📅 {Weekday} {nth} {Month}
❌ *Game cancelled: not enough players*

Only {n} were available and we need 10. No payment needed.
```

For pitch, weather or other reasons the heading is `❌ *Game cancelled*`, and the organiser's note replaces the sentence if there is one.

## 9. Data model

### 9.1 Supabase tables

| Table | Key | Columns | Created by |
|---|---|---|---|
| `players` | `id` | name, avail (mon/thu/both), pref (none/mon/thu), guar_mon, guar_thu, played, reserved, last_played | original setup |
| `games` | `id` | date (display text), day (mon/thu/adhoc), iso (YYYY-MM-DD), manual, playing_ids[], reserve_ids[]; cancelled_reason (players/dropouts/pitch/weather/other), cancelled_note, cancelled_by, cancelled_at | original setup; `cancel.sql` (4.0) |
| `app_state` | `id` = 1 | reserve_next[] | original setup |
| `game_money` | `game_id` | organiser, price_p, pitch_p, admin_pct, paid_ids[] | `money.sql` |
| `kitty_spends` | `id` | spent_on, what, category, paid_by, amount_p | `money.sql` |
| `money_settings` | `id` = 1 | price_p, pitch_p, admin_pct, opening (JSON of organiser → pence) | `money.sql` |
| `player_ratings` | `player_id` | position, rating (1–5), keeper. The old star rating, used as the starting point for skills. | `teams.sql` |
| `team_rules` | `id` | kind (apart/together), player_a, player_b, note | `teams.sql` |
| `game_teams` | `game_id` | team1_ids[], team2_ids[], bibs (1/2), status (draft/confirmed), score1, score2 | `teams.sql` |
| `player_skills` | `player_id` | attack, defence, fitness, goalkeeping (1–10), position (auto/def/att/any), keeper | `skills.sql` |
| `game_late` | `game_id` | player_ids[] | `late.sql` |
| `player_credit` | `player_id` | amount_p | `credit.sql` |
| `push_subscriptions` | `endpoint` | player_id, p256dh, auth, prefs, updated_at | `push.sql` |
| `push_config` | `id` (= 1) | public_key, private_key | `push.sql` |
| `availability_settings` | `id` (= 1) | mode, open/close times, days before, auto_announce, kickoff_time, venue, organiser_ids | `availability.sql` |
| `availability_rounds` | `game_iso` | day, status, game_id, opened_at, closed_at | `availability.sql` |
| `availability_answers` | `game_iso`, `player_id` | answer, answered_at, by_organiser | `availability.sql` |
| `app_devices` | `device_id` | player_id, installed, browser, platform, notifications, last_seen | `availability.sql` |

Row Level Security is on for every table, with "anyone can read and write" policies (`policies.sql` for the original three tables, and within each later script). Each script also grants the `anon` and `authenticated` roles access to its tables. The two push tables are the exception: they're closed to the page, and only the `notify` Edge Function can use them.

### 9.2 Browser storage (`localStorage`)

| Key | Contents |
|---|---|
| `fbv3` | Full copy of all data |
| `fbv3_synced` | The last copy known to match the database, used to work out what to send |
| `fbv3_backup` | Copy taken just before an import |
| `fbv3_organiser` | "1" when the device is logged in |
| `fbv3_org` | Last organiser chosen on Run game |
| `fbv3_whatsapp` | Time and venue for each day type, and the pitch-booked tick |
| `fbv3_show_opening`, `fbv3_show_split` | Whether the starting balances and split settings are shown |
| `fbv3_push` | This phone's notifications: who it is, its push address, its choices, and whether the Get notified card was dismissed |
| `fbv3_me` | This phone's "Who are you?" player |
| `fbv3_device`, `fbv3_hello`, `fbv3_install_hidden` | Device id and last check-in for App users, and whether the install card was dismissed |

## 10. Saving, sync and data integrity

- **Load:**
  1. Show the device copy straight away.
  2. Fetch every table.
  3. Re-apply any changes made on this device that never reached the database, comparing against `fbv3_synced`.
- **Save:**
  - Each change is saved to the device, then queued.
  - Saves run one after another, so quick edits can't overtake each other.
  - Only rows that changed since the last successful sync are sent (upserts and deletes). A device can't delete rows it never saw.
- **Conflicts:** the last save wins, row by row.
- **Missing tables:** each feature group syncs separately: core, money, teams, skills, late, credit. If a group's table doesn't exist yet, that group stays on the device, a notice explains which SQL file to run, and everything else keeps saving.
- **Export:**
  - Download, Share or Copy the full data as JSON.
  - **Game log (CSV)** has: game number, date, day, playing and reserve counts, players, reserves, Team 1, Team 2, bibs, and both scores.
- **Import:**
  - Replaces all data from a JSON export after a backup is taken.
  - Sections missing from older exports (money, teams) are kept from the current data.
  - The result is pushed to the database.

## 11. Deployment and setup

### 11.1 Deploying

Merging into `main` deploys through GitHub Pages within a few minutes. Each release is tagged `vMAJOR.MINOR`.

### 11.2 Database setup

Run each of these once in the Supabase SQL Editor. All are safe to run again.

1. `supabase/policies.sql`: open access for players, games and app_state.
2. `supabase/money.sql`
3. `supabase/teams.sql`
4. `supabase/skills.sql`
5. `supabase/late.sql`
6. `supabase/credit.sql`

All six had been run on the production database by release 1.0.

For notifications (release 2.0):

7. Run `supabase/push.sql`.
8. Deploy the Edge Function. In the Supabase dashboard, go to **Edge Functions → Deploy a new function → Via Editor**, name it `notify`, paste `supabase/functions/notify/index.ts` and deploy. Then, in the function's settings, turn off **Verify JWT** and save.
9. Run `supabase/push-cron.sql` for the daily payment reminders.

For self-service availability (release 3.0):

10. Run `supabase/availability.sql`.
11. Redeploy the `notify` function with the latest `supabase/functions/notify/index.ts`, keeping Verify JWT off. The feature stays Off until it's switched on under Setup.

For release 3.8:

12. Run `supabase/schedule-3.8.sql`. It limits the availability check to 8am–10:45pm UK time and clears schedule history older than 7 days each night.

For release 4.0 (in this order):

13. Run `supabase/cancel.sql` (adds the cancelled columns to `games`).
14. Redeploy the `notify` function with the latest `supabase/functions/notify/index.ts`, keeping Verify JWT off.

Each script also grants the page (`anon` and `authenticated` roles) select, insert, update and delete on its tables. Supabase stops granting this automatically for tables created from 30 October 2026, so **any new table added in a later release must include the same `grant` line in its script**, or the page gets "permission denied" for it. Re-running the scripts on the existing database is harmless.

## 12. Non-functional requirements

- **Devices:** works on current iPhone and Android browsers and desktop browsers. Tested at 375px, 390px and 1280px wide, with no sideways scrolling.
- **Tap targets and text:** menu text is at least 16px on inputs that could zoom on iPhone. The bottom bar respects the iPhone home-bar area.
- **Install:** the page can be installed as an app called Brent Football (Chrome: Install app; iPhone Safari: Share → Add to Home Screen). It opens full screen with its own icon and a green opening screen, and updates itself with each deploy.
- **Offline:** the installed app opens with no signal, and viewing and editing work from the device copy. Changes are sent when the database is reachable again.
- **Accessibility:** buttons and inputs have labels, focus is visible, and animations respect reduced-motion settings.

## 13. Known limitations

- The login isn't real security, and all data is readable with the public key (section 3).
- If two organisers change the same row at once, the later save wins.
- The Attendance table gains a column every year from 2027. It will get tight on phones from around 2029, when older years may need merging.
- Credit only pays for whole games.
- Legacy figures are matched by name only. Renaming a player in the app breaks the link unless the new name matches.
- The README's top section still describes the old SQLite starter app.

## 14. Glossary

| Term | Meaning |
|---|---|
| Squad | The players picked to play a game, up to 12 |
| Reserve | An available player who didn't make the squad |
| →Next / reserve guarantee | Last game's reserves, picked first next time |
| Guaranteed list | Players always picked for Monday and/or Thursday |
| Late penalty | Placed after non-guaranteed players for the next game |
| Draft teams | Generated teams, shared with organisers, not yet on the front page |
| Tracked game | A game whose money counts towards the kitty and Outstanding Payments |
| Kitty | The shared surplus held by the organisers |
| Credit | Money a player has paid ahead |
| Legacy data | Appearance figures from the old spreadsheet |

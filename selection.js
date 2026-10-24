/* Squad selection rules for Brent Football, shared by the page (Run game and the
   availability preview) and the "notify" Edge Function (the 9pm availability close),
   so both always pick the same squad. Loaded as a plain script in the page; the
   function has an exact copy (supabase/functions/notify/index.ts, between the
   BEGIN and END selection.js lines), so change both together. Sets globalThis.BF_SELECT.

   Players need: { id, avail, pref, guarMon, guarThu, reserved }. */
(function (root) {
  const SQUAD_SIZE = 12;

  // Who goes first, in order:
  //   1. guaranteed for that day
  //   2. last game's reserves (reserveNext)
  //   3. not late last time (late players go after everyone else)
  //   4. only available that day, then prefers that day, then the rest
  //   5. most times in reserve
  //   6. who said they're in first (availability only; Run game keeps the player list order)
  function orderSquad(players, { day, reserveNext = [], late = () => false, answeredAt = null } = {}) {
    const list = [...players];
    if (answeredAt) list.sort((a, b) => (answeredAt.get(a.id) ?? Infinity) - (answeredAt.get(b.id) ?? Infinity));
    const guar = p => (day === 'mon' ? p.guarMon : p.guarThu);
    return list.sort((a, b) => {
      const ag = guar(a) ? 0 : 1, bg = guar(b) ? 0 : 1; if (ag !== bg) return ag - bg;
      const ar = reserveNext.includes(a.id) ? 0 : 1, br = reserveNext.includes(b.id) ? 0 : 1; if (ar !== br) return ar - br;
      const al = late(a.id) ? 1 : 0, bl = late(b.id) ? 1 : 0; if (al !== bl) return al - bl;
      const ap = a.avail !== 'both' ? 0 : (a.pref === day ? 1 : 2), bp = b.avail !== 'both' ? 0 : (b.pref === day ? 1 : 2); if (ap !== bp) return ap - bp;
      return b.reserved - a.reserved;
    });
  }

  function splitSquad(ordered, size = SQUAD_SIZE) {
    return { playing: ordered.slice(0, size), reserves: ordered.slice(size) };
  }

  // Late last time: marked late at a game, and no later game includes them.
  // games: in date order, each { id, playingIds, reserveIds }; lateIdsOf(gameId) -> player ids marked late
  function latePenaltyFor(games, lateIdsOf) {
    return playerId => {
      let last = -1;
      games.forEach((g, i) => { if (lateIdsOf(g.id).includes(playerId)) last = i; });
      return last !== -1 && !games.slice(last + 1).some(g => g.playingIds.includes(playerId) || g.reserveIds.includes(playerId));
    };
  }

  root.BF_SELECT = { SQUAD_SIZE, orderSquad, splitSquad, latePenaltyFor };
})(globalThis);

/* =========================================================================
   Admin tab:
     • Zombie / Hero deck breakdowns per game set
     • Turn Log (every saved Zombie turn, all fields)
     • Games Won / Lost record
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const panel = function () { return document.getElementById("tab-admin"); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  const allSets = [
    { key: "base", name: "Last Night on Earth (Base)" },
    { key: "timber_peak", name: "Timber Peak" },
    { key: "blood_forest", name: "Blood in the Forest" },
    { key: "growing_hunger", name: "Growing Hunger" },
    { key: "survival_fittest", name: "Survival of the Fittest" }
  ];

  let view = "zombie";   // zombie | hero | log | results
  let setKey = "base";

  function render() {
    let h = "";
    h += '<div class="card"><div class="toolbar">';
    h += '<strong>Admin</strong>';
    h += '<select id="ad-view">';
    [["zombie", "Zombie Deck"], ["hero", "Hero Deck"], ["log", "Turn Log"], ["results", "Games Won / Lost"]]
      .forEach(function (v) { h += '<option value="' + v[0] + '"' + (view === v[0] ? " selected" : "") + ">" + v[1] + "</option>"; });
    h += "</select>";
    if (view === "zombie" || view === "hero") {
      h += '<select id="ad-set">';
      allSets.forEach(function (s) { h += '<option value="' + s.key + '"' + (setKey === s.key ? " selected" : "") + ">" + esc(s.name) + "</option>"; });
      h += "</select>";
    }
    h += '<span class="spacer"></span>';
    if (view === "log" || view === "results") h += '<button class="btn btn-ghost" id="ad-refresh">↻ Refresh</button>';
    h += "</div></div>";

    h += '<div id="ad-body"></div>';
    panel().innerHTML = h;

    document.getElementById("ad-view").onchange = function () { view = this.value; render(); };
    const setSel = document.getElementById("ad-set");
    if (setSel) setSel.onchange = function () { setKey = this.value; render(); };
    const rf = document.getElementById("ad-refresh");
    if (rf) rf.onclick = render;

    if (view === "zombie") renderZombieDeck();
    else if (view === "hero") renderHeroDeck();
    else if (view === "log") renderLog();
    else renderResults();
  }

  function zombieCardHtml(c) {
    let h = '<div class="deck-card"><div class="dc-top"><span class="dc-name">' + esc(c.name) + "</span>" +
      '<span class="dc-copies">×' + (c.copies || 1) + "</span></div>";
    h += '<div>';
    if (c.timing === "immediate") h += '<span class="pill tag-immediate">Play Immediately</span>';
    if (c.remains) h += '<span class="pill tag-remains">Remains in Play</span>';
    h += '<span class="pill">' + timingLabel(c.timing) + "</span></div>";
    h += '<div class="dc-text">' + esc(c.text) + "</div>";
    h += '<div class="dc-simple">▶ ' + esc(c.simple) + "</div>";
    if (c.quote) h += '<div class="dc-text" style="font-style:italic">' + esc(c.quote) + "</div>";
    h += "</div>";
    return h;
  }

  function renderZombieDeck() {
    const def = LNOE.zombieDecks[setKey] || [];
    const total = def.reduce(function (s, c) { return s + (c.copies || 1); }, 0);
    let h = '<div class="card"><h2>Zombie Deck — ' + esc(setName(setKey)) + "</h2>";
    if (!def.length) {
      h += emptyNote(setKey, "Zombie");
    } else {
      h += '<p class="section-help">' + def.length + " unique card(s) · " + total + " cards total in the deck.</p>";
      def.forEach(function (c) { h += zombieCardHtml(c); });
    }
    h += "</div>";

    // Advanced add-on deck (base game only).
    const adv = (LNOE.zombieDecksAdvanced && LNOE.zombieDecksAdvanced[setKey]) || null;
    if (adv && adv.length) {
      const advTotal = adv.reduce(function (s, c) { return s + (c.copies || 1); }, 0);
      h += '<div class="card"><h2>Advanced Deck <span class="pill">optional add-on</span></h2>';
      h += '<p class="section-help">Turn this on in Setup to mix these into the base game. ' +
        adv.length + " unique card(s) · " + advTotal + " cards total.</p>";
      adv.forEach(function (c) { h += zombieCardHtml(c); });
      h += "</div>";
    }
    document.getElementById("ad-body").innerHTML = h;
  }

  function renderHeroDeck() {
    const def = LNOE.heroDecks[setKey] || [];
    const total = def.reduce(function (s, c) { return s + (c.copies || 1); }, 0);
    let h = '<div class="card"><h2>Hero Deck — ' + esc(setName(setKey)) + "</h2>";
    if (!def.length) {
      h += emptyNote(setKey, "Hero");
    } else {
      // group by category
      const cats = {};
      def.forEach(function (c) { (cats[c.category] = cats[c.category] || []).push(c); });
      h += '<p class="section-help">' + def.length + " card type(s) · " + total + " cards total.</p>";
      Object.keys(cats).forEach(function (cat) {
        h += "<h3>" + esc(cat) + "</h3>";
        cats[cat].forEach(function (c) {
          h += '<div class="deck-card"><div class="dc-top"><span class="dc-name">' + esc(c.name) + "</span>" +
            '<span class="dc-copies">×' + (c.copies || 1) + "</span></div>";
          h += '<div class="dc-text">' + esc(c.text) + "</div></div>";
        });
      });
    }
    h += "</div>";
    document.getElementById("ad-body").innerHTML = h;
  }

  function emptyNote(key, kind) {
    if (key === "base" && kind === "Zombie") return "";
    return '<p class="empty-note">No ' + kind + ' cards entered for this set yet.<br>' +
      'The Base game ' + (kind === "Zombie" ? "Zombie" : "Hero") + ' deck is fully loaded. ' +
      'To add this set’s cards, drop photos in a “Zombie Deck/' + esc(setName(key)) + '” folder and ask Claude to read them in, ' +
      'or edit <code>js/data/' + (kind === "Zombie" ? "zombiedecks.js" : "herodecks.js") + "</code>.</p>";
  }

  function renderLog() {
    const body = document.getElementById("ad-body");
    body.innerHTML = '<div class="card"><p class="hint">Loading turn log…</p></div>';
    LNOE.Store.getTurns().then(function (turns) {
      let h = '<div class="card"><h2>Turn Log</h2>';
      if (!turns.length) {
        h += '<p class="empty-note">No Zombie turns saved yet. During a game, use “Save this Zombie turn to the log”.</p></div>';
        body.innerHTML = h; return;
      }
      h += '<p class="section-help">' + turns.length + " Zombie turn(s) recorded. Newest first.</p>";
      h += '<table class="log-table"><thead><tr>' +
        "<th>#</th><th>When</th><th>Scenario</th><th>Drawn</th><th>Played</th><th>Movement</th><th>Dice</th><th>Damage</th><th>Outcome</th>" +
        "</tr></thead><tbody>";
      turns.forEach(function (t) {
        const dice = (t.diceRolls || []).map(function (d) { return "[" + (d.rolls || []).join(",") + "]→" + d.highest; }).join(" ");
        h += "<tr>";
        h += "<td>" + esc(t.turnNumber) + "</td>";
        h += "<td>" + esc(fmt(t.timestamp)) + "</td>";
        h += "<td>" + esc(t.scenario || "") + "</td>";
        h += "<td>" + esc((t.cardDrawn || []).join(", ")) + "</td>";
        h += "<td>" + esc((t.cardPlayed || []).join(", ")) + "</td>";
        h += "<td>" + esc(t.movementActions || "") + "</td>";
        h += "<td>" + esc(dice) + "</td>";
        h += "<td>" + esc(t.damageResults || "") + "</td>";
        h += "<td>" + esc(t.outcome || "") + "</td>";
        h += "</tr>";
      });
      h += "</tbody></table></div>";
      body.innerHTML = h;
    }).catch(function (e) {
      body.innerHTML = '<div class="card"><p class="empty-note">Could not load log: ' + esc(e.message || e) + "</p></div>";
    });
  }

  function renderResults() {
    const body = document.getElementById("ad-body");
    body.innerHTML = '<div class="card"><p class="hint">Loading results…</p></div>';
    LNOE.Store.getResults().then(function (games) {
      const wins = games.filter(function (g) { return g.winner === "Heroes"; }).length;
      const losses = games.filter(function (g) { return g.winner === "Zombies"; }).length;
      let h = '<div class="card"><h2>Games Won / Lost</h2>';
      h += '<div class="stat-grid mb">';
      h += '<div class="stat"><div class="num win">' + wins + '</div><div class="lbl">Heroes won</div></div>';
      h += '<div class="stat"><div class="num loss">' + losses + '</div><div class="lbl">Zombies won</div></div>';
      h += '<div class="stat"><div class="num">' + games.length + '</div><div class="lbl">Games played</div></div>';
      h += "</div>";
      if (!games.length) {
        h += '<p class="empty-note">No finished games yet. End a game with “End Game” to record who won.</p>';
      } else {
        h += '<table class="log-table"><thead><tr><th>When</th><th>Winner</th><th>Scenario</th><th>Heroes</th><th>Rounds</th><th>Zombie turns</th></tr></thead><tbody>';
        games.forEach(function (g) {
          h += "<tr><td>" + esc(fmt(g.timestamp)) + "</td>" +
            "<td>" + (g.winner === "Heroes" ? "🏆 Heroes" : "☠ Zombies") + "</td>" +
            "<td>" + esc(g.scenario || "") + "</td>" +
            "<td>" + esc((g.players || []).join(", ")) + "</td>" +
            "<td>" + esc(g.rounds || "") + "</td>" +
            "<td>" + esc(g.zombieTurns || "") + "</td></tr>";
        });
        h += "</tbody></table>";
      }
      h += "</div>";
      body.innerHTML = h;
    }).catch(function (e) {
      body.innerHTML = '<div class="card"><p class="empty-note">Could not load results: ' + esc(e.message || e) + "</p></div>";
    });
  }

  function setName(k) { const s = allSets.find(function (x) { return x.key === k; }); return s ? s.name : k; }
  function timingLabel(t) {
    return { immediate: "Play immediately", zturn_start: "Start of Zombie turn", zturn_end: "End of Zombie turn",
      fight: "During a fight", hero_move: "On a Hero’s move", reaction: "Reaction", anytime: "Any time" }[t] || t || "";
  }
  function fmt(iso) {
    if (!iso) return "";
    try { const d = new Date(iso); return d.toLocaleString(); } catch (e) { return iso; }
  }

  LNOE.Admin = { init: function () {}, render: render };
})();

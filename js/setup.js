/* =========================================================================
   Setup Phase — build a game: base set, expansions, scenario, players.
   When started, hands off to LNOE.Game.start(state).
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const panel = function () { return document.getElementById("tab-start"); };

  // Expansions temporarily unavailable for selection.
  const BLOCKED_EXPANSIONS = ["growing_hunger", "survival_fittest"];

  let rendered = false;
  const state = {
    baseSet: "base",
    expansions: [],
    scenarioIndex: 0,
    advanced: false,  // base-game Advanced add-on deck
    buildings: [],   // selected building names (tags)
    spawnAreas: [],  // labelled Zombie Spawning Pits (one die rolled per pit on the Zombie turn)
    players: [{ name: "", hero: "" }, { name: "", hero: "" }]
  };


  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  }); }

  function heroPool() { return LNOE.heroesFor(state.baseSet, state.expansions); }

  // Hero-deck cards in play (base + Advanced if on) — for starting-gear pickers.
  function deckCards() {
    let cards = ((LNOE.heroDecks && LNOE.heroDecks[state.baseSet]) || []).slice();
    if (state.advanced && state.baseSet === "base" && LNOE.heroDecksAdvanced && LNOE.heroDecksAdvanced[state.baseSet]) {
      cards = cards.concat(LNOE.heroDecksAdvanced[state.baseSet]);
    }
    return cards;
  }
  function dedupe(arr) { const seen = {}, out = []; arr.forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push(n); } }); return out; }
  function setupWeapons() { return dedupe(deckCards().filter(function (c) { return c.category === "Hand Weapon" || c.category === "Ranged Weapon"; }).map(function (c) { return c.name; })); }
  function setupItems() { return dedupe(deckCards().filter(function (c) { return c.category === "Item"; }).map(function (c) { return c.name; })); }

  // Friendly "saved …" label for a save's timestamp.
  function savedWhen(iso) {
    if (!iso) return "just now";
    try {
      const d = new Date(iso);
      const today = new Date();
      const sameDay = d.toDateString() === today.toDateString();
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return sameDay ? "today " + time : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
    } catch (e) { return "earlier"; }
  }

  function render() {
    rendered = true;
    const sets = LNOE.baseSets;
    const exps = LNOE.expansions;
    const scenarios = LNOE.scenariosFor(state.baseSet, state.expansions);
    if (state.scenarioIndex >= scenarios.length) state.scenarioIndex = 0;
    const heroes = heroPool();

    let html = "";

    // Returning with a saved game? Point to the Save / Load tab to resume it.
    if (LNOE.Store.listGames && LNOE.Store.listGames().length) {
      html += '<div class="card" style="border-color:var(--blood-bright)">';
      html += '<p class="section-help" style="margin:0">💾 You have saved game(s). Open the <strong>Save / Load</strong> tab above to pick up where you left off.</p>';
      html += "</div>";
    }

    // ---- Step A: base set + expansions ----
    html += '<div class="card">';
    html += '<span class="step-badge">Setup · Step 1</span>';
    html += "<h2>Choose your game</h2>";
    html += '<p class="section-help">Pick the main game box. The Bot will use that box’s Zombie deck.</p>';
    const COMING_SOON = { timber_peak: true, blood_forest: true };
    html += '<label class="field">Base game set<select id="su-set">';
    sets.forEach(function (s) {
      const soon = COMING_SOON[s.key];
      html += '<option value="' + s.key + '"' + (s.key === state.baseSet ? " selected" : "") +
        (soon ? " disabled" : "") + ">" + esc(s.name) + (soon ? " (coming soon)" : "") + "</option>";
    });
    html += "</select></label>";
    html += '<div class="field"><span>Extra expansions (optional — mix into the base box)</span><div class="checks mt">';
    exps.forEach(function (e) {
      const blocked = BLOCKED_EXPANSIONS.indexOf(e.key) > -1;
      const on = !blocked && state.expansions.indexOf(e.key) > -1;
      html += '<label class="chk" title="' + (blocked ? "Not available yet" : "") + '" style="' +
        (blocked ? "opacity:.5;cursor:not-allowed" : "") + '"><input type="checkbox" class="su-exp" value="' + e.key + '"' +
        (on ? " checked" : "") + (blocked ? " disabled" : "") + ">" + esc(e.name) + (blocked ? " (coming soon)" : "") + "</label>";
    });
    html += "</div></div>";
    // Advanced add-on — base game only.
    if (state.baseSet === "base") {
      html += '<div class="field"><span>Advanced Zombie deck (base game only)</span><div class="checks mt">';
      html += '<label class="chk' + (state.advanced ? " chk-on" : "") + '"><input type="checkbox" id="su-advanced"' +
        (state.advanced ? " checked" : "") + "> Add the Advanced deck (20 extra cards)</label>";
      html += "</div></div>";
    }
    html += "</div>";

    // ---- Step B: scenario ----
    html += '<div class="card">';
    html += '<span class="step-badge">Setup · Step 2</span>';
    html += "<h2>Choose a scenario</h2>";
    html += '<p class="section-help">The scenario is the mission. It decides how the Heroes win — and how they lose.</p>';
    if (!scenarios.length) {
      html += '<p class="empty-note">No scenarios listed for this set yet. You can add them in the Admin tab.</p>';
    } else {
      const baseName = (LNOE.baseSets.find(function (s) { return s.key === state.baseSet; }) || {}).name;
      html += '<label class="field">Scenario<select id="su-scenario">';
      scenarios.forEach(function (sc, i) {
        const tag = sc.source && sc.source !== baseName ? "  —  " + sc.source : "";
        html += '<option value="' + i + '"' + (i === state.scenarioIndex ? " selected" : "") + ">" + esc(sc.name) + esc(tag) + "</option>";
      });
      html += "</select></label>";
      if (state.expansions.length) {
        html += '<p class="hint">Scenarios from your expansions are mixed in and tagged with the expansion name.</p>';
      }
      const obj = scenarios[state.scenarioIndex] ? scenarios[state.scenarioIndex].objective : "";
      html += '<div class="narration" id="su-objective">' + esc(obj) + "</div>";
    }
    html += '<div class="field mt"><span>Buildings on your board (optional) — tap the ones you have</span>';
    html += '<div id="su-buildings" class="checks mt"></div></div>';
    html += '<p class="hint">When a Zombie card says “Roll a Random Building”, the Bot picks one of your selected buildings automatically.</p>';
    // Spawning pits — chosen ONLY from the buildings ticked above. One die is
    // rolled per pit each Zombie turn to spawn Zombies.
    html += '<div class="field mt"><span>Zombie Spawning Pits — tap the buildings that have a pit</span>';
    html += '<div id="su-spawns" class="checks mt"></div></div>';
    html += '<p class="hint">Only the buildings you selected above can be tagged as pits. On the Zombie turn (after the fights), the Bot rolls one die per pit to spawn new Zombies.</p>';
    html += "</div>";

    // ---- Step C: players ----
    html += '<div class="card">';
    html += '<span class="step-badge">Setup · Step 3</span>';
    html += "<h2>Add the Heroes (players)</h2>";
    html += '<p class="section-help">Type each player’s name and pick their character. The order below is the turn order — use the arrow to move a player earlier.</p>';
    html += '<div id="su-players"></div>';
    html += '<button class="btn mt" id="su-add">+ Add another player</button>';
    html += "</div>";

    // ---- Step 4: starting Zombies ----
    html += '<div class="card">';
    html += '<span class="step-badge">Setup · Step 4</span>';
    html += "<h2>🎲 Starting Zombies</h2>";
    html += '<p class="section-help">Roll 2 dice to see how many Zombies start on the board, then place them across your Spawning Pits.</p>';
    html += '<button class="btn btn-rust" id="su-startz-roll">🎲 Roll 2 dice</button>';
    html += '<div id="su-startz-out" class="mt"></div>';
    html += "</div>";

    // ---- Start ----
    html += '<div class="card center">';
    html += '<button class="btn btn-primary btn-lg" id="su-start">Start Game &nbsp;☠</button>';
    html += '<p class="hint mt" id="su-warn"></p>';
    html += "</div>";

    panel().innerHTML = html;
    wire();
    renderPlayers();
  }

  function renderPlayers() {
    const heroes = heroPool();
    const wrap = document.getElementById("su-players");
    if (!wrap) return;
    const wls = setupWeapons(), its = setupItems();
    let html = '<datalist id="su-item-list">' + its.map(function (n) { return '<option value="' + esc(n) + '">'; }).join("") + "</datalist>";
    state.players.forEach(function (p, i) {
      p.weapons = p.weapons || []; p.items = p.items || [];
      html += '<div class="player-row">';
      html += '<div class="order-num">' + (i + 1) + "</div>";
      html += '<label class="field" style="margin:0"><span class="mini">Player name</span>' +
        '<input type="text" class="su-pname" data-i="' + i + '" value="' + esc(p.name) + '" placeholder="e.g. Wing" /></label>';
      html += '<label class="field" style="margin:0"><span class="mini">Character</span><select class="su-phero" data-i="' + i + '">';
      html += '<option value="">— choose —</option>';
      heroes.forEach(function (h) {
        const taken = state.players.some(function (op, oi) { return oi !== i && op.hero === h.name; });
        html += '<option value="' + esc(h.name) + '"' + (p.hero === h.name ? " selected" : "") +
          (taken ? " disabled" : "") + ">" + esc(h.name) + " (" + esc(h.role) + ")" + (taken ? " — taken" : "") + "</option>";
      });
      html += "</select></label>";
      html += '<button class="icon-btn su-up" data-i="' + i + '" title="Move earlier" ' + (i === 0 ? "disabled" : "") + ">▲</button>";
      html += "</div>";
      const hero = heroes.find(function (h) { return h.name === p.hero; });
      if (hero) html += '<p class="hint" style="margin:-4px 0 6px 40px">' + esc(hero.ability) + "</p>";
      // Starting gear (optional): up to 2 weapons + items, 4 things total.
      const wFull = p.weapons.length >= 2, full = (p.weapons.length + p.items.length) >= 4;
      html += '<div class="player-gear" style="margin:0 0 12px 40px">';
      html += '<div class="inv-line"><span class="inv-tag">🗡 Starting weapons</span>';
      p.weapons.forEach(function (w, wi) { html += '<span class="chip chip-wpn">' + esc(w) + '<a href="#" class="chip-x" data-pw="' + i + ":" + wi + '">✕</a></span>'; });
      if (!wFull && !full) html += '<select class="su-pw-add" data-i="' + i + '"><option value="">+ weapon…</option>' + wls.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + "</option>"; }).join("") + "</select>";
      html += "</div>";
      html += '<div class="inv-line"><span class="inv-tag">🎒 Starting items</span>';
      p.items.forEach(function (it, ii) { html += '<span class="chip">' + esc(it) + '<a href="#" class="chip-x" data-pi="' + i + ":" + ii + '">✕</a></span>'; });
      if (!full) { html += '<input type="text" class="su-pi-add" data-i="' + i + '" list="su-item-list" placeholder="add item…" style="width:120px">'; html += '<button class="btn btn-sm su-pi-addbtn" data-i="' + i + '">+ Add</button>'; }
      html += "</div></div>";
    });
    wrap.innerHTML = html;

    wrap.querySelectorAll(".su-pname").forEach(function (el) {
      el.oninput = function () { state.players[+el.dataset.i].name = el.value; };
    });
    wrap.querySelectorAll(".su-phero").forEach(function (el) {
      el.onchange = function () { state.players[+el.dataset.i].hero = el.value; renderPlayers(); };
    });
    wrap.querySelectorAll(".su-up").forEach(function (el) {
      el.onclick = function () {
        const i = +el.dataset.i;
        const t = state.players[i - 1]; state.players[i - 1] = state.players[i]; state.players[i] = t;
        renderPlayers();
      };
    });
    // Starting-gear add/remove.
    wrap.querySelectorAll(".su-pw-add").forEach(function (s) {
      s.onchange = function () {
        const p = state.players[+s.dataset.i];
        if (this.value && p.weapons.length < 2 && (p.weapons.length + p.items.length) < 4) p.weapons.push(this.value);
        renderPlayers();
      };
    });
    wrap.querySelectorAll("[data-pw]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); const pr = a.dataset.pw.split(":"); state.players[+pr[0]].weapons.splice(+pr[1], 1); renderPlayers(); };
    });
    wrap.querySelectorAll(".su-pi-addbtn").forEach(function (b) {
      b.onclick = function () {
        const p = state.players[+b.dataset.i];
        const inp = wrap.querySelector('.su-pi-add[data-i="' + b.dataset.i + '"]');
        const v = (inp && inp.value || "").trim();
        if (v && (p.weapons.length + p.items.length) < 4) p.items.push(v);
        renderPlayers();
      };
    });
    wrap.querySelectorAll("[data-pi]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); const pr = a.dataset.pi.split(":"); state.players[+pr[0]].items.splice(+pr[1], 1); renderPlayers(); };
    });
    wrap.querySelectorAll(".su-pi-add").forEach(function (inp) {
      inp.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); const b = wrap.querySelector('.su-pi-addbtn[data-i="' + inp.dataset.i + '"]'); if (b) b.click(); } };
    });
  }

  function renderBuildings() {
    const el = document.getElementById("su-buildings");
    if (!el) return;
    const opts = LNOE.buildingsFor(state.baseSet, state.expansions);
    state.buildings.forEach(function (b) { if (opts.indexOf(b) === -1) opts.push(b); }); // include custom ones
    el.innerHTML = opts.map(function (b) {
      const on = state.buildings.indexOf(b) > -1;
      return '<label class="chk' + (on ? " chk-on" : "") + '"><input type="checkbox" class="su-bld" value="' +
        esc(b) + '"' + (on ? " checked" : "") + "> " + esc(b) + "</label>";
    }).join("");
    el.querySelectorAll(".su-bld").forEach(function (c) {
      c.onchange = function () {
        const v = c.value;
        if (c.checked) { if (state.buildings.indexOf(v) === -1) state.buildings.push(v); }
        else { state.buildings = state.buildings.filter(function (x) { return x !== v; }); }
        renderBuildings();
        renderSpawns();   // spawning-pit options come ONLY from the selected buildings
      };
    });
  }

  function renderSpawns() {
    const el = document.getElementById("su-spawns");
    if (!el) return;
    if (!state.buildings.length) {
      el.innerHTML = '<span class="hint">Select buildings on your board above first, then tap which ones have a spawning pit.</span>';
      return;
    }
    // A pit can only be a SELECTED building — drop any stragglers.
    state.spawnAreas = state.spawnAreas.filter(function (a) { return state.buildings.indexOf(a) > -1; });
    el.innerHTML = state.buildings.map(function (b) {
      const on = state.spawnAreas.indexOf(b) > -1;
      return '<label class="chk' + (on ? " chk-on" : "") + '"><input type="checkbox" class="su-spawn" value="' +
        esc(b) + '"' + (on ? " checked" : "") + "> ☠ " + esc(b) + "</label>";
    }).join("");
    el.querySelectorAll(".su-spawn").forEach(function (c) {
      c.onchange = function () {
        const v = c.value;
        if (c.checked) { if (state.spawnAreas.indexOf(v) === -1) state.spawnAreas.push(v); }
        else { state.spawnAreas = state.spawnAreas.filter(function (x) { return x !== v; }); }
        renderSpawns();
      };
    });
  }

  function wire() {
    document.getElementById("su-set").onchange = function () {
      state.baseSet = this.value;
      state.scenarioIndex = 0;
      state.buildings = [];   // different board — clear the building tags
      state.spawnAreas = [];  // and clear the old board's spawning pits
      if (state.baseSet !== "base") state.advanced = false;  // Advanced is base-only
      // drop heroes no longer in the pool
      const pool = heroPool().map(function (h) { return h.name; });
      state.players.forEach(function (p) { if (pool.indexOf(p.hero) === -1) p.hero = ""; });
      render();
    };
    document.querySelectorAll(".su-exp").forEach(function (el) {
      el.onchange = function () {
        state.expansions = Array.prototype.map.call(
          document.querySelectorAll(".su-exp:checked"), function (c) { return c.value; })
          .filter(function (k) { return BLOCKED_EXPANSIONS.indexOf(k) === -1; });
        render();
      };
    });
    const sc = document.getElementById("su-scenario");
    if (sc) sc.onchange = function () {
      state.scenarioIndex = +this.value;
      const obj = LNOE.scenariosFor(state.baseSet, state.expansions)[state.scenarioIndex];
      const o = document.getElementById("su-objective"); if (o) o.textContent = obj ? obj.objective : "";
    };
    const adv = document.getElementById("su-advanced");
    if (adv) adv.onchange = function () { state.advanced = this.checked; render(); };
    renderBuildings();
    renderSpawns();
    document.getElementById("su-add").onclick = function () {
      state.players.push({ name: "", hero: "" }); renderPlayers();
    };
    const szRoll = document.getElementById("su-startz-roll");
    if (szRoll) szRoll.onclick = function () {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      const total = d1 + d2;
      const pits = state.spawnAreas.slice();
      let html = '<div class="dice-area"><div class="die skull">' + d1 + '</div><div class="die skull">' + d2 + "</div>";
      html += '<span class="hint" style="margin-left:6px"><strong>' + total + "</strong> Zombies start on the board.</span></div>";
      if (pits.length) {
        const tally = {}; pits.forEach(function (p) { tally[p] = 0; });
        for (let i = 0; i < total; i++) tally[pits[Math.floor(Math.random() * pits.length)]]++;
        html += '<div class="csimple mt"><strong>Place them here:</strong><ul style="margin:6px 0 0 18px">';
        pits.forEach(function (p) { if (tally[p] > 0) html += "<li><strong>+" + tally[p] + "</strong> at " + esc(p) + "</li>"; });
        html += "</ul></div>";
      } else {
        html += '<p class="hint">No Spawning Pits selected above — place the ' + total + " Zombies as the scenario directs.</p>";
      }
      document.getElementById("su-startz-out").innerHTML = html;
    };
    document.getElementById("su-start").onclick = startGame;
  }

  function startGame() {
    const warn = document.getElementById("su-warn");
    const named = state.players.filter(function (p) { return p.name.trim(); });
    if (named.length < 1) { warn.textContent = "Add at least one player with a name."; return; }
    const scenarios = LNOE.scenariosFor(state.baseSet, state.expansions);

    const gameState = {
      baseSet: state.baseSet,
      baseSetName: (LNOE.baseSets.find(function (s) { return s.key === state.baseSet; }) || {}).name,
      expansions: state.expansions.slice(),
      scenario: scenarios[state.scenarioIndex] || { name: "(none)", objective: "" },
      players: named.map(function (p) {
        return { name: p.name.trim(), hero: p.hero || "(no character)", weapons: (p.weapons || []).slice(), items: (p.items || []).slice() };
      }),
      buildings: state.buildings.slice(),
      spawnAreas: state.spawnAreas.slice(),
      advanced: !!(state.advanced && state.baseSet === "base"),
      startedAt: new Date().toISOString()
    };
    rendered = false; // so returning to setup re-renders fresh
    LNOE.Game.start(gameState);
  }

  LNOE.Setup = {
    init: function () { /* state kept in module scope */ },
    ensureRendered: function () {
      // If a game is running, Game owns the panel; don't overwrite it.
      if (LNOE.Game && LNOE.Game.isRunning && LNOE.Game.isRunning()) return;
      if (!rendered) render();
    },
    forceSetup: function () { rendered = false; render(); }
  };
})();

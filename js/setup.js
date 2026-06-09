/* =========================================================================
   Setup Phase — build a game: base set, expansions, scenario, players.
   When started, hands off to LNOE.Game.start(state).
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const panel = function () { return document.getElementById("tab-start"); };

  let rendered = false;
  const state = {
    baseSet: "base",
    expansions: [],
    scenarioIndex: 0,
    buildings: [],   // selected building names (tags)
    players: [{ name: "", hero: "" }, { name: "", hero: "" }]
  };


  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  }); }

  function heroPool() { return LNOE.heroesFor(state.baseSet, state.expansions); }

  function render() {
    rendered = true;
    const sets = LNOE.baseSets;
    const exps = LNOE.expansions;
    const scenarios = LNOE.scenariosFor(state.baseSet, state.expansions);
    if (state.scenarioIndex >= scenarios.length) state.scenarioIndex = 0;
    const heroes = heroPool();

    let html = "";

    // ---- Step A: base set + expansions ----
    html += '<div class="card">';
    html += '<span class="step-badge">Setup · Step 1</span>';
    html += "<h2>Choose your game</h2>";
    html += '<p class="section-help">Pick the main game box. The Bot will use that box’s Zombie deck.</p>';
    html += '<label class="field">Base game set<select id="su-set">';
    sets.forEach(function (s) {
      html += '<option value="' + s.key + '"' + (s.key === state.baseSet ? " selected" : "") + ">" + esc(s.name) + "</option>";
    });
    html += "</select></label>";
    html += '<div class="field"><span>Extra expansions (optional — mix into the base box)</span><div class="checks mt">';
    exps.forEach(function (e) {
      const on = state.expansions.indexOf(e.key) > -1;
      html += '<label class="chk"><input type="checkbox" class="su-exp" value="' + e.key + '"' + (on ? " checked" : "") + ">" + esc(e.name) + "</label>";
    });
    html += "</div></div>";
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
    html += '<div id="su-buildings" class="checks mt"></div>';
    html += '<div class="row mt" style="align-items:center"><input type="text" id="su-bld-custom" placeholder="Add another building…" style="flex:2"><button class="btn" id="su-bld-add" style="flex:0 0 auto">+ Add</button></div></div>';
    html += '<p class="hint">When a Zombie card says “Roll a Random Building”, the Bot picks one of your selected buildings automatically.</p>';
    html += "</div>";

    // ---- Step C: players ----
    html += '<div class="card">';
    html += '<span class="step-badge">Setup · Step 3</span>';
    html += "<h2>Add the Heroes (players)</h2>";
    html += '<p class="section-help">Type each player’s name and pick their character. The order below is the turn order — use the arrow to move a player earlier.</p>';
    html += '<div id="su-players"></div>';
    html += '<button class="btn mt" id="su-add">+ Add another player</button>';
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
    let html = "";
    state.players.forEach(function (p, i) {
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
      if (hero) html += '<p class="hint" style="margin:-4px 0 12px 40px">' + esc(hero.ability) + "</p>";
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
      };
    });
  }

  function wire() {
    document.getElementById("su-set").onchange = function () {
      state.baseSet = this.value;
      state.scenarioIndex = 0;
      state.buildings = [];   // different board — clear the building tags
      // drop heroes no longer in the pool
      const pool = heroPool().map(function (h) { return h.name; });
      state.players.forEach(function (p) { if (pool.indexOf(p.hero) === -1) p.hero = ""; });
      render();
    };
    document.querySelectorAll(".su-exp").forEach(function (el) {
      el.onchange = function () {
        state.expansions = Array.prototype.map.call(
          document.querySelectorAll(".su-exp:checked"), function (c) { return c.value; });
        render();
      };
    });
    const sc = document.getElementById("su-scenario");
    if (sc) sc.onchange = function () {
      state.scenarioIndex = +this.value;
      const obj = LNOE.scenariosFor(state.baseSet, state.expansions)[state.scenarioIndex];
      document.getElementById("su-objective").textContent = obj ? obj.objective : "";
    };
    renderBuildings();
    const addBld = document.getElementById("su-bld-add");
    if (addBld) addBld.onclick = function () {
      const inp = document.getElementById("su-bld-custom");
      const v = (inp.value || "").trim();
      if (v && state.buildings.indexOf(v) === -1) { state.buildings.push(v); inp.value = ""; renderBuildings(); }
    };
    document.getElementById("su-add").onclick = function () {
      state.players.push({ name: "", hero: "" }); renderPlayers();
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
        return { name: p.name.trim(), hero: p.hero || "(no character)" };
      }),
      buildings: state.buildings.slice(),
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

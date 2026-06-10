/* =========================================================================
   Game Play: Sun Track, Hero turns (with plain-English action help), and the
   Zombie (Bot) turn engine — draw, decide, explain, move, roll, log, win/lose.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const panel = function () { return document.getElementById("tab-start"); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  let G = null;          // current game
  let voiceOn = true;    // Scary Voice on by default so cards are narrated aloud
  let musicOn = true;    // continuous horror background music

  // Which music stage fits the current Sun Track progress (escalates toward dawn).
  function musicStage() {
    if (!G) return 0;
    const count = (LNOE.FX && LNOE.FX.stageCount) ? LNOE.FX.stageCount() : 4;
    return Math.min(count - 1, Math.floor((G.sun - 1) / G.sunMax * count));
  }

  // Ensure the background music is playing (it runs continuously during a game).
  function narrationMusic() {
    if (musicOn && LNOE.FX) LNOE.FX.startMusic(musicStage());
  }

  // (Zombie sound effect now plays ONLY when the Zombie wins a fight.)
  function hordeSfx() { /* disabled */ }

  const HERO_ACTIONS = [
    { title: "Move or Search", help: "Roll one die and move that many spaces. If you are INSIDE a building, you may Search instead of moving — draw a Hero card to find weapons or items." },
    { title: "Exchange items", help: "Give or take weapons and items with another Hero standing in the SAME space. This is free and does not use your move." },
    { title: "Shoot a ranged weapon", help: "If you are holding a Gun, you can shoot a Zombie you can see in a straight line (not through walls). Roll the dice to try to hit." },
    { title: "Fight a Zombie", help: "If a Zombie is in your space, you fight it. Both sides roll dice and compare the highest. Higher number wins — the loser takes a wound." }
  ];

  function narrate(key, opts) {
    const line = LNOE.narrate(key);
    if (line) {
      narrationMusic(Math.max(7000, line.length * 70)); // background music under it
      if (LNOE.FX) LNOE.FX.groan();                      // and a zombie groan
      hordeSfx(line);                                    // extra SFX if it mentions a horde
      if (voiceOn) LNOE.TTS.speak(stripQuotes(line));
    }
    return line;
  }
  function stripQuotes(s) { return s.replace(/[“”]/g, ""); }

  // A suspenseful, thematic line for a played card: a dread lead-in + the
  // card's own horror line.
  function cardThematic(card) {
    return LNOE.suspenseLine() + " " + LNOE.cardNarration(card.name);
  }

  // Called whenever the Bot PLAYS a Zombie card. Builds suspense: a sharp
  // sting, a low groan, then the narrator speaks. Returns the thematic text.
  function announceBotCard(card) {
    const line = cardThematic(card);
    narrationMusic(Math.max(10000, line.length * 80)); // horror music under the card
    hordeSfx(line);
    LNOE.FX.stinger();
    setTimeout(function () { LNOE.FX.groan(); }, 300);
    if (voiceOn) setTimeout(function () { LNOE.TTS.speak(stripQuotes(line)); }, 650);
    return line;
  }

  /* ----------------------------- START ----------------------------- */
  function start(gameState) {
    G = gameState;
    G.saveId = "g" + new Date().getTime();   // unique id for this game's auto-save
    G.bot = new LNOE.Bot(G.baseSet, G.advanced);
    // The Zombie player holds cards from the start, so the Bot can intervene
    // even during the very first Hero turn.
    G.bot.draw(); G.bot.draw();
    G.sunMax = 12;
    G.sun = 1;
    G.round = 1;
    G.turnNumber = 0;        // zombie turns completed
    G.playerIndex = 0;
    G.phase = "hero";        // 'hero' | 'zombie'
    G.players.forEach(function (p) { p.dead = false; });  // track who's alive until the end
    G.introText = LNOE.scenarioIntro(G.scenario.name, G.baseSetName, G.scenario.objective) +
      "\n\n" + LNOE.castIntro(G.players);
    newZTurn();
    resetHeroSteps();
    renderHero();
    LNOE.switchTab("start");
    // The Start button click is a user gesture, so audio is allowed now.
    if (musicOn) LNOE.FX.startMusic(musicStage());   // continuous background music
    playIntro();
  }

  // Cinematic opening: dissonant stinger over the music, scary-voice story.
  function playIntro() {
    if (!G || !G.introText) return;
    if (musicOn) LNOE.FX.startMusic(musicStage());
    LNOE.FX.stinger();
    const story = stripQuotes(G.introText);
    hordeSfx(story);
    if (LNOE.TTS.available) {
      setTimeout(function () {
        LNOE.TTS.speak(story, function () { LNOE.FX.groan(); });
      }, 900); // let the stinger land first
    } else {
      setTimeout(function () { LNOE.FX.groan(); }, 4000);
    }
  }
  function stopIntro() { LNOE.TTS.stop(); }

  function newZTurn() {
    G.zturn = { drawn: [], played: [], dice: [], movement: "", damage: "", narration: "", step: "start",
      sunNarr: "", spawnRolls: null, spawnTotal: 0, spawnDone: false };
  }

  // Reset the ordered hero-action stepper at the start of a Hero's turn.
  function resetHeroSteps() { G.heroStep = 0; G.heroDone = []; }

  // Indices of Heroes who are still alive.
  function aliveIndices() {
    return G.players.map(function (p, i) { return i; }).filter(function (i) { return !G.players[i].dead; });
  }

  /* ----------------- Hero weapons & event-card helpers -------------- */
  // Weapons the Heroes can carry, read from the loaded Hero deck.
  function weaponList() {
    const deck = (LNOE.heroDecks && LNOE.heroDecks[G.baseSet]) || [];
    return deck.filter(function (c) {
      return c.category === "Hand Weapon" || c.category === "Ranged Weapon";
    }).map(function (c) {
      const ranged = c.category === "Ranged Weapon";
      return { name: c.name, ranged: ranged, gun: ranged && /\bGun\b/.test(c.text || "") };
    });
  }
  function findWeapon(name) {
    if (!name) return null;
    return weaponList().find(function (w) { return w.name === name; }) || null;
  }
  // A <select> for choosing a carried weapon (Hand / Ranged), with "no weapon".
  function weaponSelect(id, currentName) {
    const ws = weaponList();
    function opts(list) {
      return list.map(function (w) {
        return '<option value="' + esc(w.name) + '"' + (currentName === w.name ? " selected" : "") + ">" + esc(w.name) + "</option>";
      }).join("");
    }
    return '<select id="' + esc(id) + '" class="wpn-select"><option value="">— no weapon (bare hands) —</option>' +
      '<optgroup label="Hand weapons (whack)">' + opts(ws.filter(function (w) { return !w.ranged; })) + "</optgroup>" +
      '<optgroup label="Ranged weapons (gunshot)">' + opts(ws.filter(function (w) { return w.ranged; })) + "</optgroup></select>";
  }
  function weaponLabel(w) { return w ? w.name + (w.ranged ? " (ranged)" : " (hand)") : "bare hands"; }

  // A Hero carries up to 4 things: max 2 weapons + max 2 items. Normalise older
  // saves (which had a single `weapon`) into the new weapons/items arrays.
  function normalizeInventory(p) {
    if (!p) return;
    if (!p.weapons) p.weapons = p.weapon ? [p.weapon] : [];
    if (!p.items) p.items = [];
    if (p.weapon) delete p.weapon;
  }
  function carriedWeapons(p) { return (p && p.weapons || []).filter(Boolean); }
  // Options for a "fighting with" picker: bare hands + the Hero's carried weapons
  // (value is the index into carriedWeapons(p), or -1 for bare hands).
  function fightWeaponOptions(p) {
    let s = '<option value="-1">bare hands</option>';
    carriedWeapons(p).forEach(function (w, i) {
      s += '<option value="' + i + '">' + esc(weaponLabel(w)) + "</option>";
    });
    return s;
  }
  function fightWeaponSelect(id, p) {
    return '<select id="' + esc(id) + '" class="wpn-select">' + fightWeaponOptions(p) + "</select>";
  }
  function fightWeaponFromSelect(id, p) {
    const sel = document.getElementById(id);
    const idx = sel ? +sel.value : -1;
    return idx >= 0 ? (carriedWeapons(p)[idx] || null) : null;
  }
  // Items a Hero can carry, read from the Hero deck (for the item autocomplete).
  function heroItemNames() {
    const deck = (LNOE.heroDecks && LNOE.heroDecks[G.baseSet]) || [];
    return deck.filter(function (c) { return c.category === "Item"; }).map(function (c) { return c.name; });
  }
  function heroItemDatalist() {
    return '<datalist id="hero-items">' + heroItemNames().map(function (n) {
      return '<option value="' + esc(n) + '"></option>';
    }).join("") + "</datalist>";
  }

  // Event-type Hero cards (Event + Townsfolk) for the play-a-card autocomplete.
  function heroEventNames() {
    const deck = (LNOE.heroDecks && LNOE.heroDecks[G.baseSet]) || [];
    return deck.filter(function (c) { return c.category === "Event" || c.category === "Townsfolk"; })
      .map(function (c) { return c.name; });
  }
  function heroEventDatalist() {
    return '<datalist id="hero-events">' + heroEventNames().map(function (n) {
      return '<option value="' + esc(n) + '"></option>';
    }).join("") + "</datalist>";
  }

  // The "Heroes" roster card: mark deaths + add players mid-game. Shared by
  // the Hero and Zombie screens.
  function rosterCard() {
    let h = '<div class="card"><h3>🧍 Heroes</h3>';
    h += '<p class="section-help">Tap a Hero to mark them dead (it’s remembered for the ending). You can also add a player who joins mid-game.</p>';
    h += '<div id="g-roster"></div>';
    h += '<div class="row mt" style="align-items:flex-end">';
    h += '<label class="field" style="margin:0;flex:2"><span class="mini">New player name</span><input type="text" id="g-newname" placeholder="Name"></label>';
    h += '<label class="field" style="margin:0;flex:2"><span class="mini">Character</span><select id="g-newhero"></select></label>';
    h += '<button class="btn" id="g-addplayer" style="flex:0 0 auto">+ Add player</button>';
    h += "</div></div>";
    return h;
  }

  function renderRoster() {
    const el = document.getElementById("g-roster");
    if (!el) return;
    G.players.forEach(normalizeInventory);
    el.innerHTML = heroItemDatalist() + G.players.map(function (p, i) {
      const w = p.weapons;
      let h = '<div class="player-status' + (p.dead ? " dead" : "") + '">';
      h += '<span class="ps-name">' + (p.dead ? "☠ " : "🧍 ") + esc(p.hero) + ' <span class="hint">(' + esc(p.name) + ")</span></span>";
      h += '<button class="btn ' + (p.dead ? "btn-green" : "btn-ghost") + '" data-i="' + i + '" style="margin-left:auto">' +
        (p.dead ? "Bring back" : "Mark dead ☠") + "</button></div>";
      // Inventory row: up to 2 weapons + up to 2 items.
      h += '<div class="inv-row" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0 10px 26px">';
      h += '<span class="hint">🗡 Weapons (max 2):</span>';
      h += weaponSelect("ros-wpn-" + i + "-0", w[0] ? w[0].name : "");
      h += weaponSelect("ros-wpn-" + i + "-1", w[1] ? w[1].name : "");
      h += '<span class="hint">🎒 Items (max 2):</span>';
      h += '<input type="text" id="ros-itm-' + i + '-0" list="hero-items" class="inv-item" value="' + esc(p.items[0] || "") + '" placeholder="Item…" style="flex:0 0 130px">';
      h += '<input type="text" id="ros-itm-' + i + '-1" list="hero-items" class="inv-item" value="' + esc(p.items[1] || "") + '" placeholder="Item…" style="flex:0 0 130px">';
      h += "</div>";
      return h;
    }).join("");
    el.querySelectorAll("button[data-i]").forEach(function (b) {
      b.onclick = function () { const i = +b.dataset.i; G.players[i].dead = !G.players[i].dead; renderRoster(); };
    });
    G.players.forEach(function (p, i) {
      function readInv() {
        const w0 = document.getElementById("ros-wpn-" + i + "-0");
        const w1 = document.getElementById("ros-wpn-" + i + "-1");
        G.players[i].weapons = [w0 && findWeapon(w0.value), w1 && findWeapon(w1.value)].filter(Boolean);
        const t0 = document.getElementById("ros-itm-" + i + "-0");
        const t1 = document.getElementById("ros-itm-" + i + "-1");
        G.players[i].items = [t0 && t0.value.trim(), t1 && t1.value.trim()].filter(Boolean);
      }
      ["ros-wpn-" + i + "-0", "ros-wpn-" + i + "-1"].forEach(function (id) {
        const el2 = document.getElementById(id);
        if (el2) el2.onchange = function () { readInv(); autoSave(); };
      });
      ["ros-itm-" + i + "-0", "ros-itm-" + i + "-1"].forEach(function (id) {
        const el2 = document.getElementById(id);
        if (el2) el2.onchange = function () { readInv(); autoSave(); };
      });
    });
    autoSave();
    const sel = document.getElementById("g-newhero");
    if (sel) {
      const taken = G.players.map(function (p) { return p.hero; });
      const pool = LNOE.heroesFor(G.baseSet, G.expansions);
      sel.innerHTML = '<option value="">— choose —</option>' + pool.map(function (hh) {
        const dis = taken.indexOf(hh.name) > -1;
        return '<option value="' + esc(hh.name) + '"' + (dis ? " disabled" : "") + ">" + esc(hh.name) + (dis ? " — taken" : "") + "</option>";
      }).join("");
    }
  }

  function wireRoster() {
    renderRoster();
    const add = document.getElementById("g-addplayer");
    if (add) add.onclick = function () {
      const name = (document.getElementById("g-newname").value || "").trim();
      const hero = document.getElementById("g-newhero").value;
      if (!name) { alert("Enter the new player’s name."); return; }
      G.players.push({ name: name, hero: hero || "(no character)", dead: false });
      document.getElementById("g-newname").value = "";
      renderRoster();
    };
  }

  // Does a card require a die roll (e.g. "move D6 spaces", "Roll a Random Building")?
  function cardNeedsRoll(text) { return /\bD6\b/i.test(text) || /\broll\b/i.test(text); }
  // Does a card need a building chosen (e.g. "Random Building", "any building")?
  function cardNeedsBuilding(text) { return /random building/i.test(text) || /any building/i.test(text); }
  // Does a card explicitly forbid targeting a building (it must hit some other area)?
  function cardNoBuilding(text) { return /not .{0,14}building|outside (of )?a building|non-?building|may not .{0,20}building/i.test(text); }
  // Does a card target a board LOCATION at all — a building, space or area?
  function cardNeedsTarget(text) {
    return cardNeedsBuilding(text) || cardNoBuilding(text) ||
      /\b(random|any) (space|area|location)\b/i.test(text);
  }
  // Does a card let the Heroes lose the game (e.g. A Town Overrun empties the deck)?
  function cardCanLose(text) { return /automatically lose/i.test(text) || /heroes (auto|immediately )?lose/i.test(text); }
  function pickFrom(list) { return (list && list.length) ? list[Math.floor(Math.random() * list.length)] : null; }
  function pickBuilding() { return pickFrom((G && G.buildings) || []); }
  // Every board location the Bot could target: buildings + labelled spawning pits.
  function allAreas() {
    const out = [];
    (((G && G.buildings) || []).concat(((G && G.spawnAreas) || []))).forEach(function (a) {
      if (a && out.indexOf(a) === -1) out.push(a);
    });
    return out;
  }
  // The pool of legal targets for a given card.
  function targetPoolFor(card) {
    const t = (card && card.text) || "";
    if (cardNoBuilding(t)) {
      // Must avoid buildings — use spawning pits / areas that are not buildings.
      const blds = (G && G.buildings) || [];
      const areas = ((G && G.spawnAreas) || []).filter(function (a) { return blds.indexOf(a) === -1; });
      return areas.length ? areas : allAreas();
    }
    if (cardNeedsBuilding(t)) return (G && G.buildings) || [];
    return allAreas();
  }

  // The Bot's automatic turn: draw to refill its hidden hand, then play the
  // cards a Zombie player plays on its own turn. Fight/reaction cards are kept
  // hidden for later. The player never sees the hand or makes the choice.
  function runBotTurn() {
    for (let i = 0; i < 2; i++) { const c = G.bot.draw(); if (c) G.zturn.drawn.push(c.name); }
    const autoTimings = ["immediate", "zturn_start", "anytime", "zturn_end"];
    const toPlay = G.bot.hand.filter(function (c) { return autoTimings.indexOf(c.timing) > -1; });
    const played = [];
    toPlay.forEach(function (c) {
      G.bot.playFromHand(c.uid);
      G.zturn.played.push(c.name);
      // If the card targets a board location, pick one and always say what
      // happens to it in the narration — naming the chosen area when one is
      // configured, or speaking of "the building/area" generically otherwise.
      const needsTarget = cardNeedsTarget(c.text);
      const target = needsTarget ? pickFrom(targetPoolFor(c)) : null;
      const narr = needsTarget
        ? (LNOE.suspenseLine() + " " + LNOE.cardBuildingNarration(c.name, target))
        : cardThematic(c);
      played.push({ name: c.name, simple: c.simple, text: c.text, remains: c.remains, timing: c.timing,
        narration: narr, target: target });
    });
    return { played: played };
  }

  /* --------------------------- SHARED BITS -------------------------- */
  function header() {
    let h = '<div class="card">';
    h += '<div class="toolbar">';
    h += '<strong>' + esc(G.scenario.name) + "</strong>";
    h += '<span class="pill">' + esc(G.baseSetName) + "</span>";
    G.expansions.forEach(function (k) {
      const e = LNOE.expansions.find(function (x) { return x.key === k; });
      if (e) h += '<span class="pill">+ ' + esc(e.name) + "</span>";
    });
    h += '<span class="spacer"></span>';
    h += '<button class="btn btn-ghost" id="g-music">' + (musicOn ? "🎵 Music: ON" : "🎵 Music: OFF") + "</button>";
    h += '<button class="btn btn-ghost" id="g-voice">' + (voiceOn ? "🔊 Scary Voice: ON" : "🔇 Scary Voice: OFF") + "</button>";
    h += '<select id="g-voicepick" class="hdr-select" title="Narrator voice (from your device)"></select>';
    h += '<button class="btn btn-ghost" id="g-end">End Game</button>';
    h += '<button class="btn btn-ghost" id="g-quit">Back to Setup</button>';
    h += "</div>";
    h += '<p class="section-help" style="margin:0">' + esc(G.scenario.objective) + "</p>";
    h += suntrack();
    if (G.sun >= G.sunMax) {
      h += '<div class="narration" style="border-left-color:var(--blood-bright);color:#ffb3b3;margin-bottom:0">' +
        "⚠ DAWN IS BREAKING — the sun has reached the final hour. The night ends the moment the next Zombie turn begins.</div>";
    }
    h += "</div>";
    return h;
  }

  function suntrack() {
    let h = '<div class="suntrack"><span class="hint" style="margin-right:6px">☀ Sun Track (night → dawn):</span>';
    for (let i = 1; i <= G.sunMax; i++) {
      const cls = i < G.sun ? "past" : (i === G.sun ? "now" : "");
      h += '<div class="sun-cell ' + cls + '">' + i + "</div>";
    }
    h += '<span class="hint" style="margin-left:8px">Round ' + G.round + "</span></div>";
    return h;
  }

  function wireHeader() {
    document.getElementById("g-music").onclick = function () {
      musicOn = !musicOn;
      if (musicOn) LNOE.FX.startMusic(musicStage()); else LNOE.FX.stopMusic();
      this.textContent = musicOn ? "🎵 Music: ON" : "🎵 Music: OFF";
    };
    document.getElementById("g-voice").onclick = function () {
      voiceOn = !voiceOn;
      if (!voiceOn) LNOE.TTS.stop();
      this.textContent = voiceOn ? "🔊 Scary Voice: ON" : "🔇 Scary Voice: OFF";
      if (voiceOn && !LNOE.TTS.available) alert("Your browser has no speech voices available.");
    };
    const vp = document.getElementById("g-voicepick");
    if (vp) {
      const vs = LNOE.TTS.voices();
      if (!vs.length) {
        vp.innerHTML = "<option>Device voice</option>"; vp.disabled = true;
      } else {
        const cur = LNOE.TTS.currentName();
        vp.innerHTML = vs.map(function (v) {
          return '<option value="' + esc(v.name) + '"' + (v.name === cur ? " selected" : "") + ">🗣 " + esc(v.name) + "</option>";
        }).join("");
        vp.onchange = function () {
          LNOE.TTS.setVoice(this.value);
          if (voiceOn) LNOE.TTS.speak("This is the narrator's voice."); // quick preview
        };
      }
    }
    document.getElementById("g-quit").onclick = function () {
      if (confirm("Leave this game and go back to Setup? Progress in this game will be lost (saved turn logs are kept).")) {
        G = null; LNOE.TTS.stop(); LNOE.FX.stopAll(); LNOE.Setup.forceSetup();
      }
    };
    document.getElementById("g-end").onclick = showEnding;
  }

  /* ----------------------------- HERO TURN -------------------------- */
  function renderHero() {
    G.players.forEach(normalizeInventory);
    const p = G.players[G.playerIndex];
    let h = header();

    if (G.round === 1 && G.playerIndex === 0 && G.turnNumber === 0) {
      h += '<div class="card" style="border-color:var(--blood-bright)">';
      h += '<h3>🎬 ' + esc(G.scenario.name) + "</h3>";
      const paras = G.introText.split("\n\n").map(function (p) {
        return '<p style="margin:0 0 10px">' + esc(p) + "</p>";
      }).join("");
      h += '<div class="narration voice-on" id="g-intro">' + paras + "</div>";
      h += '<div class="row mt">';
      h += '<button class="btn btn-rust" id="g-intro-play">▶ Play opening (voice + sound)</button>';
      h += '<button class="btn btn-ghost" id="g-intro-stop">⏹ Stop</button>';
      h += "</div>";
      h += '<p class="hint mt">The opening plays aloud when the game starts. Tap Play to hear it again.</p>';
      h += "</div>";
    }

    h += '<div class="turn-banner">';
    h += '<div class="phase">Hero Turn · ' + aliveIndices().length + " Hero(es) still alive</div>";
    h += '<div class="who">' + esc(p.hero) + ' <span style="color:var(--muted);font-size:16px">— played by ' + esc(p.name) + "</span></div>";
    h += "</div>";

    h += '<div class="card"><h3>Your actions this turn — do them in order</h3>';
    h += '<p class="section-help">Work down the list in order. Mark each step “Did this” or “Skip” to unlock the next one. The Zombie may interrupt at any time.</p>';
    h += '<div class="action-steps">';
    HERO_ACTIONS.forEach(function (a, i) {
      const stateCls = i < G.heroStep ? "resolved" : (i === G.heroStep ? "active" : "locked");
      h += '<div class="step ' + stateCls + '" data-i="' + i + '">';
      h += '<div class="step-no">' + (i + 1) + "</div>";
      h += '<div class="step-body"><h4>' + esc(a.title) + "</h4><p>" + esc(a.help) + "</p>";
      if (stateCls === "active") {
        // The Fight step needs the Zombie (Bot) to roll back.
        if (i === 3) {
          h += '<div class="mt"><span class="hint">A fight means BOTH sides roll. Roll the Zombie’s dice, then compare the highest to the Hero’s highest die (the Hero loses ties unless a card says otherwise):</span>';
          h += '<div class="toolbar mt"><label class="hint">Zombie dice: <select id="hf-ndice">';
          for (let n = 1; n <= 6; n++) h += '<option value="' + n + '"' + (n === 1 ? " selected" : "") + ">" + n + "</option>";
          h += '</select></label><button class="btn btn-rust" id="hf-roll">🎲 Zombie rolls</button></div>';
          h += '<div id="hf-dice-out" class="dice-area"></div>';
          h += '<p class="hint">A basic Zombie rolls 1 die. Add dice for cards like <em>Uuuurrrggghh!</em> (+2) or <em>Cornered</em>.</p>';
          h += '<div class="mt"><label class="hint">🗡 Fighting with: ' + fightWeaponSelect("hf-weapon", p) + "</label>";
          h += '<span class="hint" style="display:block;margin-top:4px">Pick which carried weapon you used. Hand weapon → a heavy whack on a win; ranged weapon → a gunshot. Manage what each Hero carries in the Heroes list below.</span></div>';
          h += '<div class="row mt"><span style="flex-basis:100%" class="hint">State the result — the Zombie may then intervene with a card:</span>';
          h += '<button class="btn btn-green" id="hf-won">🧍 Hero WON the fight</button>';
          h += '<button class="btn btn-primary" id="hf-lost">☠ Hero LOST the fight</button></div></div>';
        }
        h += '<div class="step-btns"><button class="btn btn-green" data-act="done">✓ Did this</button>' +
          '<button class="btn" data-act="skip">Skip</button></div>';
      } else if (stateCls === "resolved") {
        h += '<div class="step-state">' + (G.heroDone[i] === "done" ? "✓ Done" : "— Skipped") +
          ' <a href="#" class="step-undo" data-i="' + i + '">change</a></div>';
      }
      h += "</div></div>";
    });
    h += "</div>";
    if (G.heroStep >= HERO_ACTIONS.length) h += '<p class="hint mt">All actions handled — end the turn below when ready.</p>';
    h += "</div>";

    // Hero plays an Event card → the Zombie secretly decides whether to strike back.
    h += '<div class="card"><h3>☠ Hero plays an Event card — the Zombie may strike back</h3>';
    h += '<p class="section-help">When a Hero plays an <strong>Event</strong> card, start typing its name (it auto-completes) and press play. The Zombie secretly decides whether to answer with one of its own Zombie cards — you don’t see its hand and you don’t control it. If it plays a card, you’ll be told what it does.</p>';
    h += '<label class="field">Event card the Hero plays' + heroEventDatalist() +
      '<input type="text" id="g-herocard" list="hero-events" placeholder="Start typing… e.g. Faith, Get Back You Devils, Just a Scratch"></label>';
    h += '<button class="btn btn-rust" id="g-playcard">🧍 Hero plays this →</button>';
    h += "</div>";

    h += rosterCard();

    h += '<div class="card center">';
    const last = aliveIndices().filter(function (i) { return i > G.playerIndex; }).length === 0;
    h += '<button class="btn btn-primary btn-lg" id="g-endhero">' +
      (last ? "All Heroes done → Zombies awaken ☠" : "End " + esc(p.name) + "’s turn ▶") + "</button>";
    h += "</div>";

    panel().innerHTML = h;
    wireHeader();

    const introPlay = document.getElementById("g-intro-play");
    if (introPlay) introPlay.onclick = playIntro;
    const introStop = document.getElementById("g-intro-stop");
    if (introStop) introStop.onclick = stopIntro;

    panel().querySelectorAll(".step.active [data-act]").forEach(function (btn) {
      btn.onclick = function () {
        G.heroDone[G.heroStep] = btn.dataset.act === "done" ? "done" : "skip";
        G.heroStep++;
        renderHero();
      };
    });
    panel().querySelectorAll(".step-undo").forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        G.heroStep = +a.dataset.i;        // re-open this step and everything after it
        G.heroDone = G.heroDone.slice(0, G.heroStep);
        renderHero();
      };
    });
    const hfRoll = document.getElementById("hf-roll");
    if (hfRoll) hfRoll.onclick = function () {
      const n = +document.getElementById("hf-ndice").value;
      const r = G.bot.roll(n);
      let html = "";
      r.rolls.forEach(function (v) { html += '<div class="die' + (v === r.highest ? " skull" : "") + '">' + v + "</div>"; });
      html += '<span class="hint" style="margin-left:6px">Zombie’s highest: <strong>' + r.highest + "</strong></span>";
      document.getElementById("hf-dice-out").innerHTML = html;
    };
    const hfWon = document.getElementById("hf-won");
    if (hfWon) hfWon.onclick = function () {
      const w = fightWeaponFromSelect("hf-weapon", p);
      startResolution({ type: "fight", heroWinning: true, gun: !!(w && w.gun), weapon: w,
        title: "Hero WON the fight (" + weaponLabel(w) + ")" });
    };
    const hfLost = document.getElementById("hf-lost");
    if (hfLost) hfLost.onclick = function () {
      startResolution({ type: "fight", heroWinning: false, gun: false, weapon: fightWeaponFromSelect("hf-weapon", p), title: "Hero LOST the fight" });
    };

    document.getElementById("g-playcard").onclick = function () {
      const name = document.getElementById("g-herocard").value.trim();
      if (!name) return;
      startResolution({ type: "card", heroCardText: name, title: "Hero plays: " + name });
    };
    wireRoster();
    document.getElementById("g-endhero").onclick = endHeroTurn;
    autoSave();
  }

  function botHandSummary() {
    return '<div class="hand-summary mt">' + handSummaryInner() + "</div>";
  }
  function handSummaryInner() {
    // Count only — the Zombie's hand is hidden from the players.
    return '<span class="hint">The Zombie is secretly holding ' + G.bot.hand.length +
      " Zombie card(s) · " + G.bot.cardsLeft() + " left in its deck. You never see what they are.</span>";
  }


  function endHeroTurn() {
    const next = aliveIndices().filter(function (i) { return i > G.playerIndex; });
    if (next.length) {
      G.playerIndex = next[0];
      resetHeroSteps();
      renderHero();
    } else {
      G.phase = "zombie";
      G.turnNumber++;
      newZTurn();
      // Step 1 of the Zombie turn: the sun marker creeps toward dawn (moved to
      // the START of the turn). If it has already reached dawn, the night is over.
      if (G.sun >= G.sunMax) { showEnding(); return; }
      G.sun++;
      G.zturn.sunNarr = narrate("sunMove");
      if (musicOn && LNOE.FX) LNOE.FX.setStage(musicStage()); // music escalates as dawn nears
      G.zturn.narration = narrate("zombieTurn");
      renderZombie();
    }
  }

  /* ---------------------------- ZOMBIE TURN ------------------------- */
  function renderZombie() {
    let h = header();
    h += '<div class="turn-banner">';
    h += '<div class="phase">Zombie Turn · the Zombie plays</div>';
    h += '<div class="who">☠ Zombie Turn #' + G.turnNumber + "</div>";
    h += "</div>";

    h += '<div class="narration voice-on">' + esc(G.zturn.narration) + ' <button class="btn btn-ghost" id="z-speak" style="float:right">🔊 Read aloud</button></div>';

    // 1 · The sun marker — it advances at the START of the Zombie turn.
    h += '<div class="card"><h3>1 · Move the sun marker</h3>';
    h += '<p class="section-help">The night creeps toward dawn. The sun marker has moved forward one space — it is now hour ' + G.sun + ' of ' + G.sunMax + '.</p>';
    if (G.zturn.sunNarr) h += '<div class="narration voice-on">' + esc(G.zturn.sunNarr) + "</div>";
    if (G.sun >= G.sunMax) h += '<p class="hint" style="color:#ffb3b3">⚠ The sun has reached the final hour — the night ends as soon as the next Zombie turn begins.</p>';
    h += "</div>";

    // 2 · The Zombie plays its own cards — automatically and in secret.
    h += '<div class="card"><h3>2 · Draw Zombie cards</h3>';
    h += '<p class="section-help">The Zombie draws and chooses its own cards in secret — you don’t control it. Reveal only what it decides to play this turn, then apply each effect to the board.</p>';
    h += '<button class="btn btn-rust btn-lg" id="z-run">☠ Reveal the Zombie’s play</button>';
    h += '<div id="z-run-out" class="mt"></div>';
    h += '<hr class="divider">' + botHandSummary();
    h += '<div id="z-played" class="mt"></div>';
    h += "</div>";

    // 3 · Movement
    h += '<div class="card"><h3>3 · Move the Zombies</h3>';
    h += '<p class="section-help">Move every Zombie 1 space toward the nearest Hero (or as a card says). Note anything important below — it’s saved to the turn log.</p>';
    h += '<label class="field">Movement notes (optional)<input type="text" id="z-move" placeholder="e.g. moved 3 zombies toward the barn; Shamble rushed one into the house"></label>';
    h += "</div>";

    // 4 · Fight + dice
    h += '<div class="card"><h3>4 · Fight the Heroes</h3>';
    h += '<p class="section-help">When a Zombie fights a Hero, roll here. Add extra dice for cards like Uuuurrrggghh! or Cornered. Compare the highest die to the Hero’s roll.</p>';
    h += '<div class="toolbar">';
    h += '<label class="hint">Dice to roll: <select id="z-ndice">';
    for (let n = 1; n <= 8; n++) h += '<option value="' + n + '"' + (n === 1 ? " selected" : "") + ">" + n + "</option>";
    h += "</select></label>";
    h += '<button class="btn btn-rust" id="z-roll">🎲 Roll dice</button>';
    h += "</div>";
    h += '<div id="z-dice-out" class="dice-area"></div>';
    h += '<div class="toolbar mt"><label class="hint">Hero in this fight: <select id="zf-hero"></select></label>';
    h += '<label class="hint">Fighting with: <select id="zf-weapon"></select></label></div>';
    h += '<div class="row mt"><span style="flex-basis:100%" class="hint">For each fight, state the result — the Zombie may intervene with a card:</span>';
    h += '<button class="btn btn-green" id="zf-won">🧍 Hero won this fight</button>';
    h += '<button class="btn btn-primary" id="zf-lost">☠ Hero lost this fight</button></div>';
    h += "</div>";

    // 5 · Spawn — AFTER the fights. Auto-roll one die per spawning pit, then place them.
    h += '<div class="card"><h3>5 · Spawn new Zombies</h3>';
    h += '<p class="section-help">Now spawn the Zombies. One die sets how many rise, and the game tells you exactly which pit to add each one to.</p>';
    h += '<div id="z-spawn-pits">' + spawnPitsList() + "</div>";
    h += '<div id="z-addpit-wrap" class="mt">' + spawnAddControl() + "</div>";
    h += '<button class="btn btn-rust btn-lg mt" id="z-spawn">☠ Spawn Zombies</button>';
    h += '<div id="z-spawn-out" class="mt">' + spawnResultText() + "</div>";
    h += "</div>";

    // Aux · Hero reactions during the Zombie turn (a helper, not part of the order).
    h += '<div class="card"><h3>☠ Did a Hero play an Event card?</h3>';
    h += '<p class="section-help">If a Hero plays an <strong>Event</strong> card during your turn, start typing its name (it auto-completes) here. The Zombie decides whether to intervene, and you can counter back and forth until it’s settled.</p>';
    h += '<label class="field">Event card played' + heroEventDatalist() +
      '<input type="text" id="z-herocard" list="hero-events" placeholder="Start typing… e.g. Faith, Recovery, At Last…"></label>';
    h += '<button class="btn btn-rust" id="z-react">🧍 Hero plays this →</button>';
    h += "</div>";

    h += rosterCard();

    // End of turn (auto-saved to the log).
    h += '<div class="card center">';
    h += '<button class="btn btn-primary btn-lg" id="z-end">End Zombie turn → next round ▶</button>';
    h += "</div>";

    panel().innerHTML = h;
    wireHeader();
    wireZombie();
    wireRoster();
    renderPlayed();
    autoSave();
  }

  function wireZombie() {
    document.getElementById("z-speak").onclick = function () { LNOE.TTS.speak(stripQuotes(G.zturn.narration)); };

    document.getElementById("z-run").onclick = function () {
      const out = document.getElementById("z-run-out");
      if (G.zturn.botRan) return;
      if (G.bot.deckEmpty() && !G.bot.hand.length) {
        out.innerHTML = '<p class="empty-note">The Zombie deck for this set is empty. Add cards in the Admin tab, or pick the base game.</p>';
        return;
      }
      const result = runBotTurn();
      let html = "";
      if (!result.played.length) {
        html = '<div class="narration voice-on">The dead shuffle and moan in the dark, but the Zombie keeps its cards hidden this turn. Move the Zombies and fight as normal.</div>';
      } else {
        result.played.forEach(function (p, idx) {
          html += '<div class="card-draw">';
          html += '<div class="ctype">' + (p.remains ? "Zombie Event · Stays in play" : "Zombie Event") + "</div>";
          html += '<div class="ctitle">' + esc(p.name) + "</div>";
          if (p.remains) html += '<span class="pill tag-remains">Stays in play</span>';
          html += '<div class="rnarr" id="zc-narr-' + idx + '">“' + esc(p.narration) + '”</div>';
          html += '<div class="csimple"><strong>Do this:</strong> ' + esc(p.simple) + "</div>";
          if (cardNeedsTarget(p.text)) {
            html += '<div class="csimple mt" id="zc-target-' + idx + '">🏚 The Zombie targets: <strong>' +
              esc(p.target || "— none set —") + "</strong></div>";
            html += '<div class="mt"><button class="btn btn-rust zc-reroll" data-i="' + idx + '">🎲 Re-randomise the area</button> ' +
              '<span class="hint">' + (cardNoBuilding(p.text)
                ? "This card can’t target a building — it picks another area on your board."
                : "Roll a different building/area for this card.") + "</span></div>";
          } else if (cardNeedsRoll(p.text)) {
            html += '<div class="mt"><button class="btn btn-rust zc-roll" data-i="' + idx + '">🎲 Roll the dice for the Zombie</button> ' +
              '<span class="zc-roll-out hint"></span></div>';
          }
          if (cardCanLose(p.text)) {
            html += '<div class="mt"><span class="hint">If this empties the Hero deck, the Heroes lose the game.</span><br>' +
              '<button class="btn btn-primary zc-lose mt">☠ Hero deck is empty — Heroes lose</button></div>';
          }
          html += "</div>";
        });
      }
      out.innerHTML = html;
      G.zturn.botRan = true;
      this.disabled = true; this.textContent = "☠ The Zombie has played";
      narrationMusic(14000); // horror background music for the reveal
      LNOE.FX.stinger();
      setTimeout(function () { LNOE.FX.groan(); }, 300);
      if (result.played.length) {
        const speech = result.played.map(function (p) { return stripQuotes(p.narration); }).join("  ");
        hordeSfx(speech);
        if (voiceOn) setTimeout(function () { LNOE.TTS.speak(speech); }, 650);
      }
      out.querySelectorAll(".zc-roll").forEach(function (b) {
        b.onclick = function () {
          const d = 1 + Math.floor(Math.random() * 6);
          b.nextElementSibling.innerHTML = '🎲 The Zombie rolled a <strong>' + d +
            "</strong> — apply that many (spaces moved / Zombies spawned / building number).";
          LNOE.FX.groan();
        };
      });
      // Re-randomise which building/area a card targets, and re-tell its narration.
      out.querySelectorAll(".zc-reroll").forEach(function (b) {
        b.onclick = function () {
          const i = +b.dataset.i;
          const p = result.played[i];
          const newT = pickFrom(targetPoolFor({ text: p.text }));
          p.target = newT;
          p.narration = LNOE.suspenseLine() + " " + LNOE.cardBuildingNarration(p.name, newT);
          const tEl = document.getElementById("zc-target-" + i);
          if (tEl) tEl.innerHTML = "🏚 The Zombie targets: <strong>" + esc(newT || "(add a building/area in Setup)") + "</strong>";
          const nEl = document.getElementById("zc-narr-" + i);
          if (nEl) nEl.innerHTML = "“" + esc(p.narration) + "”";
          LNOE.FX.groan();
          if (voiceOn && newT) LNOE.TTS.speak(stripQuotes(p.narration));
        };
      });
      out.querySelectorAll(".zc-lose").forEach(function (b) {
        b.onclick = function () { showEnding("Zombies"); };  // Heroes lost — straight to the ending
      });
      refreshHandSummaries();
      renderPlayed();
    };

    document.getElementById("z-roll").onclick = function () {
      const n = +document.getElementById("z-ndice").value;
      const r = G.bot.roll(n);
      G.zturn.dice.push({ n: n, rolls: r.rolls, highest: r.highest });
      let html = "";
      r.rolls.forEach(function (v) {
        html += '<div class="die' + (v === r.highest ? " skull" : "") + '">' + v + "</div>";
      });
      html += '<span class="hint" style="margin-left:6px">Highest: <strong>' + r.highest + "</strong> — compare to the Hero’s highest die.</span>";
      document.getElementById("z-dice-out").innerHTML = html;
    };
    document.getElementById("z-move").oninput = function () { G.zturn.movement = this.value; };
    // "Hero in this fight" + "Fighting with" — the chosen weapon sets the win sound.
    G.players.forEach(normalizeInventory);
    const zfHero = document.getElementById("zf-hero");
    function fillZfWeapon() {
      const hi = document.getElementById("zf-hero");
      const wi = document.getElementById("zf-weapon");
      if (hi && wi) wi.innerHTML = fightWeaponOptions(G.players[+hi.value]);
    }
    if (zfHero) {
      zfHero.innerHTML = aliveIndices().map(function (i) {
        const p = G.players[i];
        const ws = carriedWeapons(p);
        return '<option value="' + i + '">' + esc(p.hero) +
          (ws.length ? " — " + esc(ws.map(function (w) { return w.name; }).join(", ")) : " — bare hands") + "</option>";
      }).join("");
      zfHero.onchange = fillZfWeapon;
    }
    fillZfWeapon();
    function zfWeapon() {
      const hi = document.getElementById("zf-hero");
      const wi = document.getElementById("zf-weapon");
      const p = hi ? G.players[+hi.value] : null;
      const idx = wi ? +wi.value : -1;
      return idx >= 0 ? (carriedWeapons(p)[idx] || null) : null;
    }
    document.getElementById("zf-won").onclick = function () {
      const w = zfWeapon();
      startResolution({ type: "fight", heroWinning: true, gun: !!(w && w.gun), weapon: w,
        title: "Hero won the fight (" + weaponLabel(w) + ")" });
    };
    document.getElementById("zf-lost").onclick = function () {
      startResolution({ type: "fight", heroWinning: false, gun: false, weapon: zfWeapon(), title: "Hero lost the fight" });
    };
    document.getElementById("z-react").onclick = function () {
      const name = document.getElementById("z-herocard").value.trim();
      if (!name) return;
      startResolution({ type: "card", heroCardText: name, title: "Hero plays: " + name });
    };
    document.getElementById("z-end").onclick = endZombieTurn;
    wireSpawn();
  }

  /* ------------------------- SPAWN (step 5) ------------------------- */
  function joinParts(arr) {
    if (arr.length <= 1) return arr[0] || "";
    if (arr.length === 2) return arr[0] + " and " + arr[1];
    return arr.slice(0, -1).join(", ") + ", and " + arr[arr.length - 1];
  }
  // "the High School" / "the Barn" (don't double the article on names like "The Barn").
  function withThe(area) {
    const m = /^the\s+/i.exec(area || "");
    return "the " + (m ? area.slice(m[0].length) : area);
  }
  // A spoken line naming HOW MANY Zombies rise and at WHICH building each goes.
  function spawnNarration() {
    const total = G.zturn.spawnTotal || 0;
    const place = (G.zturn.spawnPlacement || []).filter(function (p) { return p.count > 0; });
    const rise = total === 1 ? "one fresh corpse claws its way" : total + " fresh dead claw their way";
    if (!place.length) {
      return "The earth splits open and " + rise + " up into the night.";
    }
    const parts = place.map(function (p) { return p.count + " at " + withThe(p.area); });
    return "The earth splits open — " + rise + " up into the night: " + joinParts(parts) + ".";
  }
  // The labelled Spawning Pits and how many Zombies each rolled this turn.
  function spawnPitsList() {
    const pits = (G.spawnAreas && G.spawnAreas.length) ? G.spawnAreas : [];
    if (!pits.length) {
      return '<p class="hint">No spawning pits labelled yet. Add one below (or in Setup) so the Zombie knows where the dead rise.</p>';
    }
    return '<span class="hint">Spawning pits on the board:</span> ' + pits.map(function (a, i) {
      return '<span class="pill tag-immediate">☠ ' + esc(a) +
        ' <a href="#" class="pit-del" data-i="' + i + '" style="color:inherit;text-decoration:none" title="Remove">✕</a></span>';
    }).join(" ");
  }
  function spawnResultText() {
    if (!G.zturn.spawnDone) return "";
    let h = "";
    if (G.zturn.spawnNarr) h += '<div class="narration voice-on">' + esc(G.zturn.spawnNarr) + "</div>";
    h += '<div class="dice-area"><div class="die skull">' + G.zturn.spawnTotal + "</div>";
    h += '<span class="hint" style="margin-left:6px">Spawn <strong>' + G.zturn.spawnTotal + "</strong> new Zombie(s).</span></div>";
    const place = (G.zturn.spawnPlacement || []).filter(function (p) { return p.count > 0; });
    if (place.length) {
      h += '<div class="csimple mt"><strong>Add them here:</strong><ul style="margin:6px 0 0 18px">';
      place.forEach(function (p) {
        h += "<li><strong>+" + p.count + "</strong> Zombie" + (p.count === 1 ? "" : "s") + " at " + esc(p.area) + "</li>";
      });
      h += "</ul></div>";
    } else {
      h += '<div class="csimple mt">No spawning pits tagged — place the ' + G.zturn.spawnTotal +
        " Zombie(s) as the scenario directs.</div>";
    }
    return h;
  }
  // Mid-game, a new pit can only be tagged on a building that is on the board
  // and not already a pit — same rule as Setup.
  function spawnAddControl() {
    const avail = ((G.buildings) || []).filter(function (b) { return (G.spawnAreas || []).indexOf(b) === -1; });
    if (!avail.length) {
      return '<p class="hint">Every building on your board is already a pit (or none were selected — add buildings in Setup).</p>';
    }
    let s = '<div class="row" style="align-items:center"><select id="z-newpit" style="flex:2"><option value="">— tag a building as a new pit —</option>';
    avail.forEach(function (b) { s += '<option value="' + esc(b) + '">' + esc(b) + "</option>"; });
    s += '</select><button class="btn" id="z-addpit" style="flex:0 0 auto">+ Add pit</button></div>';
    return s;
  }
  function refreshSpawnUI() {
    const a = document.getElementById("z-spawn-pits"); if (a) a.innerHTML = spawnPitsList();
    const b = document.getElementById("z-addpit-wrap"); if (b) b.innerHTML = spawnAddControl();
    wireSpawnControls();
  }
  function wirePitDeletes() {
    panel().querySelectorAll(".pit-del").forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        G.spawnAreas.splice(+a.dataset.i, 1);
        refreshSpawnUI();
      };
    });
  }
  function wireSpawnControls() {
    wirePitDeletes();
    const addPit = document.getElementById("z-addpit");
    if (addPit) addPit.onclick = function () {
      const sel = document.getElementById("z-newpit");
      const v = (sel && sel.value) || "";
      if (!v) return;
      G.spawnAreas = G.spawnAreas || [];
      if (G.spawnAreas.indexOf(v) === -1) G.spawnAreas.push(v);
      refreshSpawnUI();
    };
  }
  function wireSpawn() {
    wireSpawnControls();
    const spawnBtn = document.getElementById("z-spawn");
    if (spawnBtn) spawnBtn.onclick = function () {
      // A single D6 sets how many Zombies spawn this turn (regardless of pit count).
      const roll = 1 + Math.floor(Math.random() * 6);
      const pits = (G.spawnAreas && G.spawnAreas.length) ? G.spawnAreas.slice() : [];
      // Assign each spawned Zombie to a pit so the player knows exactly where to add them.
      const tally = {};
      pits.forEach(function (p) { tally[p] = 0; });
      for (let i = 0; i < roll && pits.length; i++) {
        tally[pits[Math.floor(Math.random() * pits.length)]]++;
      }
      G.zturn.spawnTotal = roll;
      G.zturn.spawnPlacement = pits.map(function (p) { return { area: p, count: tally[p] }; });
      G.zturn.spawnRolls = [{ area: "spawn", roll: roll }]; // keep a shape for the turn log
      G.zturn.spawnDone = true;
      G.zturn.spawnNarr = spawnNarration();   // names how many rise and at which building
      G.zturn.dice.push({ n: 1, rolls: [roll], highest: roll, kind: "spawn" });
      document.getElementById("z-spawn-out").innerHTML = spawnResultText();
      // Zombie groan AFTER the spawn step, as requested.
      if (LNOE.FX) LNOE.FX.groan();
      if (voiceOn) setTimeout(function () { LNOE.TTS.speak(stripQuotes(G.zturn.spawnNarr)); }, 250);
      autoSave();
    };
  }

  function renderPlayed() {
    const el = document.getElementById("z-played");
    if (!el) return;
    if (!G.zturn.played.length) { el.innerHTML = ""; return; }
    el.innerHTML = '<span class="hint">Played this turn:</span> ' +
      G.zturn.played.map(function (n) { return '<span class="pill tag-immediate">' + esc(n) + "</span>"; }).join("");
  }
  function refreshHandSummaries() {
    panel().querySelectorAll(".hand-summary").forEach(function (el) {
      el.innerHTML = handSummaryInner();
    });
  }

  /* ----------- RESOLUTION LOOP (fights & card plays) -----------
     A Hero states an outcome or plays a card; the Bot decides whether to
     intervene with a card from its hand; the Hero may counter; back and forth
     until both sides pass. Then the final result is recorded. */

  function startResolution(context) {
    G.resolve = { context: context, steps: [], awaiting: "bot", finalOutcome: "" };
    G.resolve.steps.push({ who: "hero", label: context.title });
    // If this is a fight the Bot won't contest, the result the Hero already
    // stated stands — settle it right away rather than opening a second screen
    // that just repeats the dice roll and the win/lose buttons.
    if (context.type === "fight" && !botDecideIntervention(context)) {
      finishResolution(context.heroWinning ? "Heroes won the fight" : "Zombies won the fight");
      return;
    }
    // A Hero played an Event card: narrate it thematically and prepare the
    // simple point-form summary of what to do (shown in the modal).
    if (context.type === "card") {
      context.cardName = context.heroCardText;
      context.heroCardNarr = LNOE.heroCardNarration(context.heroCardText);
      context.heroCardSteps = LNOE.heroCardSteps(context.heroCardText);
      narrationMusic(8000);
      LNOE.FX.stinger();
      setTimeout(function () { LNOE.FX.groan(); }, 250);
      if (voiceOn) setTimeout(function () { LNOE.TTS.speak(stripQuotes(context.heroCardNarr)); }, 500);
    }
    openResolveModal();
    setTimeout(botRespond, 450); // brief "Zombie is deciding…" beat
  }

  // The Bot picks the best card to intervene with, or null to hold back.
  function botDecideIntervention(ctx) {
    const hand = G.bot.hand;
    if (!hand.length) return null;
    const find = function (frag) {
      return hand.find(function (c) { return c.name.toLowerCase().indexOf(frag) > -1; });
    };
    if (ctx.type === "fight") {
      if (ctx.heroWinning && ctx.gun) { const r = find("resilient"); if (r) return r; }
      if (ctx.heroWinning) {
        const order = ["undead hate the living", "braaains", "uuuurrrggghh", "cornered"];
        for (let i = 0; i < order.length; i++) { const c = find(order[i]); if (c) return c; }
      }
      return null; // Hero losing → Bot has no reason to spend a card
    }
    if (ctx.type === "card") {
      const t = (ctx.heroCardText || "").toLowerCase();
      if (t.indexOf("faith") > -1) { const c = find("loss of faith"); if (c) return c; }
      if (/gun|pistol|shotgun|rifle/.test(t)) { const c = find("resilient"); if (c) return c; }
      return null;
    }
    return null;
  }

  function botRespond() {
    const r = G.resolve; if (!r) return;
    const choice = botDecideIntervention(r.context);
    if (choice) {
      G.bot.playFromHand(choice.uid);
      const narr = announceBotCard(choice);
      r.steps.push({ who: "bot", card: choice.name, label: "Zombie plays " + choice.name + ".",
        simple: choice.simple, narration: narr });
    } else {
      r.steps.push({ who: "bot", label: "The Zombie holds back — no card played." });
      r.botPassed = true;
    }
    r.awaiting = "hero";   // hand control back to the Hero (re-roll / counter / settle)
    renderResolution();
  }

  // Suggest how many dice the Zombie rolls, based on fight cards the Bot played.
  function suggestZombieDice(r) {
    let n = 1;
    r.steps.forEach(function (s) {
      if (!s.card) return;
      const nm = s.card.toLowerCase();
      if (nm.indexOf("uuuurrrggghh") > -1) n += 2;
      if (nm.indexOf("cornered") > -1) n += 2;
    });
    return Math.min(n, 8);
  }

  function openResolveModal() {
    let m = document.getElementById("resolve-modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "resolve-modal"; m.className = "modal-overlay";
      document.body.appendChild(m);
    }
    renderResolution();
  }
  function closeResolveModal(rerender) {
    const m = document.getElementById("resolve-modal");
    if (m) m.classList.remove("open");
    G.resolve = null;
    if (rerender) { if (G.phase === "hero") renderHero(); else renderZombie(); }
  }

  function renderResolution() {
    const m = document.getElementById("resolve-modal");
    const r = G.resolve; if (!m || !r) return;
    const isFight = r.context.type === "fight";
    let h = '<div class="modal-card">';
    h += '<button class="modal-x" id="rv-x" title="Cancel">✕</button>';
    h += "<h3>" + (isFight ? "⚔ Fight" : "🃏 Card play") + "</h3>";

    // 1) The exchange so far.
    h += '<div class="resolve-log">';
    r.steps.forEach(function (s) {
      h += '<div class="rstep ' + s.who + '"><strong>' + (s.who === "bot" ? "☠ Zombie" : "🧍 Hero") + ":</strong> " + esc(s.label || s.card || "");
      if (s.narration) h += '<div class="rnarr">“' + esc(s.narration) + '”</div>';
      if (s.simple) h += '<div class="hint">What to do: ' + esc(s.simple) + "</div>";
      h += "</div>";
    });
    h += "</div>";

    // Event-card thematic line + simple point-form summary (card plays only).
    if (!isFight && r.context.heroCardSteps) {
      h += '<div class="rv-panel"><div class="rv-panel-h">🃏 ' + esc(r.context.cardName || "Event card") + "</div>";
      if (r.context.heroCardNarr) h += '<div class="narration voice-on">' + esc(r.context.heroCardNarr) + "</div>";
      h += '<div class="csimple mt"><strong>What to do (simple):</strong><ul style="margin:6px 0 0 18px">' +
        r.context.heroCardSteps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
      h += "</div>";
    }

    if (r.awaiting === "bot") {
      h += '<p class="bot-thinking">☠ The Zombie is deciding…</p>';
      h += '<p class="hint mt" id="rv-saved"></p></div>';
      m.innerHTML = h; m.classList.add("open");
      document.getElementById("rv-x").onclick = function () { closeResolveModal(true); };
      return;
    }

    // 2) For a fight: roll the Zombie's dice again (cards may have changed it).
    if (isFight) {
      const suggest = suggestZombieDice(r);
      h += '<div class="rv-panel"><div class="rv-panel-h">🎲 Fight it out — roll the Zombie’s dice</div>';
      h += '<p class="hint" style="margin:0 0 8px">A card may have changed the fight. Re-roll the Zombie’s dice, then compare the highest to the Hero’s die before you settle it.</p>';
      h += '<div class="toolbar"><label class="hint">Zombie dice: <select id="rv-ndice">';
      for (let n = 1; n <= 8; n++) h += '<option value="' + n + '"' + (n === suggest ? " selected" : "") + ">" + n + "</option>";
      h += '</select></label><button class="btn btn-rust" id="rv-roll">🎲 Roll</button></div>';
      h += '<div id="rv-dice-out" class="dice-area"></div></div>';
    }

    // 3) Hero counter.
    h += '<div class="rv-panel"><div class="rv-panel-h">🧍 Hero’s counter</div>';
    h += '<p class="hint" style="margin:0 0 6px">Play a Hero card in response (or leave blank).</p>';
    h += '<input id="rv-counter" placeholder="e.g. Grit & Determination, Faith, Adrenaline, re-roll">';
    h += '<button class="btn btn-rust mt" id="rv-play">Hero plays this →</button></div>';

    // 4) Settle.
    if (isFight) {
      h += '<div class="rv-panel"><div class="rv-panel-h">Settle the fight — who won?</div>';
      h += '<div class="row"><button class="btn btn-green" data-win="Heroes">🧍 Hero wins</button>';
      h += '<button class="btn btn-primary" data-win="Zombies">☠ Zombie wins</button></div></div>';
    } else {
      h += '<div class="row mt"><button class="btn btn-green" id="rv-close">✓ Done — close</button></div>';
    }

    h += '<p class="hint mt" id="rv-saved"></p></div>';
    m.innerHTML = h;
    m.classList.add("open");

    document.getElementById("rv-x").onclick = function () { closeResolveModal(true); };

    const roll = document.getElementById("rv-roll");
    if (roll) roll.onclick = function () {
      const n = +document.getElementById("rv-ndice").value;
      const res = G.bot.roll(n);
      let out = "";
      res.rolls.forEach(function (v) { out += '<div class="die' + (v === res.highest ? " skull" : "") + '">' + v + "</div>"; });
      out += '<span class="hint" style="margin-left:6px">Zombie’s highest: <strong>' + res.highest + "</strong></span>";
      document.getElementById("rv-dice-out").innerHTML = out;
      r.steps.push({ who: "bot", label: "Zombie rolls " + n + " dice — highest " + res.highest + "." });
    };

    document.getElementById("rv-play").onclick = function () {
      const v = document.getElementById("rv-counter").value.trim();
      if (!v) return;
      r.steps.push({ who: "hero", card: v, label: "Hero plays " + v + "." });
      r.awaiting = "bot"; renderResolution();
      setTimeout(botRespond, 450);
    };

    if (isFight) {
      m.querySelectorAll("button[data-win]").forEach(function (b) {
        b.onclick = function () { finishResolution(b.dataset.win + " won the fight"); };
      });
    } else {
      const close = document.getElementById("rv-close");
      if (close) close.onclick = function () { finishResolution(""); };
    }
  }

  function finishResolution(outcome) {
    const r = G.resolve; if (!r) return;
    const note = document.getElementById("rv-saved");
    if (note) note.textContent = "Saving…";
    const played = r.steps.filter(function (s) { return s.card; })
      .map(function (s) { return (s.who === "bot" ? "Zombie: " : "Hero: ") + s.card; });
    const entry = {
      turnNumber: G.turnNumber,
      round: G.round,
      scenario: G.scenario.name,
      baseSet: G.baseSetName,
      cardDrawn: [],
      cardPlayed: played,
      movementActions: (G.phase === "hero" ? "Hero turn" : "Zombie turn") + " — " +
        (r.context.type === "fight" ? "fight" : "card play") + ": " + r.context.title,
      diceRolls: [],
      damageResults: outcome || "",
      outcome: outcome || "",
      narration: "",
      timestamp: new Date().toISOString()
    };
    if (r.context.type === "fight") {
      const heroWon = outcome.indexOf("Heroes") === 0;
      narrationMusic(8000);
      const line = LNOE.narrate(heroWon ? "heroWins" : "zombieWins");
      if (heroWon) {
        // Ranged weapon → gunshot; hand weapon (or bare hands) → a meaty whack.
        const w = r.context.weapon;
        if (w && w.ranged) LNOE.FX.gunshot(); else LNOE.FX.whack();
        if (voiceOn && line) setTimeout(function () { LNOE.TTS.speak(stripQuotes(line)); }, 450);
      } else {
        // Zombie wins: play the (quieter) zombie sound, then narrate once it ends.
        LNOE.FX.feed(function () { if (voiceOn && line) LNOE.TTS.speak(stripQuotes(line)); });
      }
    }
    LNOE.Store.saveTurn(entry).then(function () { closeResolveModal(true); })
      .catch(function () { closeResolveModal(true); });
  }

  // Silently record the Zombie turn's summary to the log (no UI needed).
  function saveTurn() {
    if (G.zturn.saved) return Promise.resolve();
    if (!G.zturn.drawn.length && !G.zturn.played.length && !G.zturn.dice.length &&
        !G.zturn.movement && !G.zturn.damage) {
      return Promise.resolve(); // nothing happened — don't log an empty turn
    }
    const entry = {
      turnNumber: G.turnNumber,
      round: G.round,
      scenario: G.scenario.name,
      baseSet: G.baseSetName,
      cardDrawn: G.zturn.drawn.slice(),
      cardPlayed: G.zturn.played.slice(),
      movementActions: G.zturn.movement || "",
      diceRolls: G.zturn.dice.slice(),
      damageResults: G.zturn.damage || "",
      outcome: "",
      narration: G.zturn.narration || "",
      timestamp: new Date().toISOString()
    };
    G.zturn.saved = true;
    return LNOE.Store.saveTurn(entry).catch(function () {});
  }

  function endZombieTurn() {
    saveTurn(); // auto-save the turn summary to the log
    // (The sun now advances at the START of the next Zombie turn — see endHeroTurn.)
    G.round++;
    G.phase = "hero";
    const alive = aliveIndices();
    G.playerIndex = alive.length ? alive[0] : 0;
    resetHeroSteps();
    renderHero();
  }

  /* ----------------------------- END GAME --------------------------- */
  // Ending screen: pick the winner, tick who survived, then a cinematic ending
  // narration naming the living and the fallen.
  function showEnding(forceWinner) {
    if (!G) return;
    let m = document.getElementById("ending-modal");
    if (!m) { m = document.createElement("div"); m.id = "ending-modal"; m.className = "modal-overlay"; document.body.appendChild(m); }
    // If the Zombies win, EVERY Hero is dead.
    let winner = forceWinner || (G.players.some(function (p) { return !p.dead; }) ? "Heroes" : "Zombies");
    const survived = {};
    function applyWinner() {
      G.players.forEach(function (p, i) { survived[i] = winner === "Zombies" ? false : !p.dead; });
    }
    applyWinner();

    function render(revealText) {
      let h = '<div class="modal-card">';
      h += "<h3>🌅 The night is over</h3>";
      h += '<p class="section-help">How did it end?</p>';
      h += '<div class="row"><button class="btn ' + (winner === "Heroes" ? "btn-green" : "") + '" data-win="Heroes">🧍 Heroes survived</button>' +
        '<button class="btn ' + (winner === "Zombies" ? "btn-primary" : "") + '" data-win="Zombies">☠ Zombies won</button></div>';
      h += '<p class="section-help mt">Tick the Heroes who are still alive:</p><div class="checks">';
      G.players.forEach(function (p, i) {
        h += '<label class="chk' + (survived[i] ? " chk-on" : "") + '"><input type="checkbox" class="ed-surv" data-i="' + i + '"' +
          (survived[i] ? " checked" : "") + "> " + esc(p.name) + " (" + esc(p.hero) + ")</label>";
      });
      h += "</div>";
      if (revealText) {
        h += '<div class="narration voice-on mt">' + esc(revealText) + "</div>";
        h += '<div class="row mt"><button class="btn btn-primary btn-block" id="ed-finish">Save &amp; new game ▶</button></div>';
      } else {
        h += '<div class="row mt"><button class="btn btn-rust btn-block" id="ed-reveal">▶ Reveal the ending</button></div>';
      }
      h += '<button class="btn btn-ghost mt" id="ed-cancel">Cancel</button></div>';
      m.innerHTML = h; m.classList.add("open");

      m.querySelectorAll("button[data-win]").forEach(function (b) { b.onclick = function () { winner = b.dataset.win; applyWinner(); render(null); }; });
      m.querySelectorAll(".ed-surv").forEach(function (c) { c.onchange = function () { survived[+c.dataset.i] = c.checked; render(revealText); }; });
      document.getElementById("ed-cancel").onclick = function () { m.classList.remove("open"); };

      const rev = document.getElementById("ed-reveal");
      if (rev) rev.onclick = function () {
        const survivors = G.players.filter(function (p, i) { return survived[i]; });
        const fallen = G.players.filter(function (p, i) { return !survived[i]; });
        const text = LNOE.endingNarration(winner, survivors, fallen);
        narrationMusic();
        LNOE.FX.stinger();
        if (winner === "Heroes") setTimeout(function () { LNOE.FX.whack(); }, 300);
        else setTimeout(function () { LNOE.FX.feed(); }, 300);
        if (voiceOn) setTimeout(function () { LNOE.TTS.speak(stripQuotes(text)); }, 1000);
        render(text);
      };
      const fin = document.getElementById("ed-finish");
      if (fin) fin.onclick = function () {
        const result = {
          winner: winner,
          scenario: G.scenario.name,
          baseSet: G.baseSetName,
          players: G.players.map(function (p) { return p.name + " (" + p.hero + ")"; }),
          survivors: G.players.filter(function (p, i) { return survived[i]; }).map(function (p) { return p.name + " (" + p.hero + ")"; }),
          rounds: G.round,
          zombieTurns: G.turnNumber,
          timestamp: new Date().toISOString()
        };
        if (G) LNOE.Store.deleteGame(G.saveId);   // the game is over — drop its auto-save
        LNOE.Store.saveResult(result).then(function () {
          m.classList.remove("open");
          G = null; LNOE.TTS.stop(); LNOE.FX.stopAll(); LNOE.Setup.forceSetup();
        });
      };
    }
    render(null);
  }

  /* --------------------------- SAVE / RESUME ------------------------ */
  // Snapshot the live game into a plain, JSON-safe object (the Bot is an
  // instance with methods, so we store only its card piles and rebuild it).
  function serializeGame() {
    if (!G || !G.bot) return null;
    return {
      saveId: G.saveId,
      baseSet: G.baseSet, baseSetName: G.baseSetName,
      expansions: G.expansions, scenario: G.scenario,
      players: G.players, buildings: G.buildings || [], spawnAreas: G.spawnAreas || [],
      advanced: G.advanced, startedAt: G.startedAt, introText: G.introText,
      sunMax: G.sunMax, sun: G.sun, round: G.round, turnNumber: G.turnNumber,
      playerIndex: G.playerIndex, phase: G.phase,
      zturn: G.zturn, heroStep: G.heroStep, heroDone: G.heroDone,
      bot: { setKey: G.bot.setKey, advanced: G.bot.advanced,
             drawPile: G.bot.drawPile, discard: G.bot.discard, hand: G.bot.hand }
    };
  }
  // Auto-save the current game (called after every screen render / key action).
  function autoSave() {
    if (!G || !G.saveId || !G.bot) return;
    try {
      LNOE.Store.saveGame({
        id: G.saveId,
        label: G.scenario.name + " · " + G.players.map(function (p) { return p.hero; }).join(", "),
        round: G.round, turnNumber: G.turnNumber, phase: G.phase,
        savedAt: new Date().toISOString(),
        state: serializeGame()
      });
    } catch (e) { /* storage full / private mode — ignore */ }
  }
  // Restore a saved game and drop the player straight back where they left off.
  function resumeGame(state) {
    if (!state) return;
    G = {
      saveId: state.saveId,
      baseSet: state.baseSet, baseSetName: state.baseSetName,
      expansions: state.expansions || [], scenario: state.scenario,
      players: state.players || [], buildings: state.buildings || [], spawnAreas: state.spawnAreas || [],
      advanced: state.advanced, startedAt: state.startedAt, introText: state.introText,
      sunMax: state.sunMax, sun: state.sun, round: state.round, turnNumber: state.turnNumber,
      playerIndex: state.playerIndex, phase: state.phase,
      zturn: state.zturn || {}, heroStep: state.heroStep || 0, heroDone: state.heroDone || []
    };
    const b = new LNOE.Bot(state.bot.setKey, state.bot.advanced);
    b.drawPile = state.bot.drawPile || [];
    b.discard = state.bot.discard || [];
    b.hand = state.bot.hand || [];
    G.bot = b;
    LNOE.switchTab("start");
    if (musicOn && LNOE.FX) LNOE.FX.startMusic(musicStage());
    if (G.phase === "zombie") renderZombie(); else renderHero();
  }

  LNOE.Game = {
    init: function () {},
    start: start,
    isRunning: function () { return !!G; },
    resume: function (id) { const s = LNOE.Store.getGame(id); if (s) resumeGame(s.state); }
  };
})();

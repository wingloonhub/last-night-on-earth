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
    G.zturn = { drawn: [], played: [], dice: [], movement: "", damage: "", narration: "", step: "start" };
  }

  // Reset the ordered hero-action stepper at the start of a Hero's turn.
  function resetHeroSteps() { G.heroStep = 0; G.heroDone = []; }

  // Indices of Heroes who are still alive.
  function aliveIndices() {
    return G.players.map(function (p, i) { return i; }).filter(function (i) { return !G.players[i].dead; });
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
    el.innerHTML = G.players.map(function (p, i) {
      return '<div class="player-status' + (p.dead ? " dead" : "") + '">' +
        '<span class="ps-name">' + (p.dead ? "☠ " : "🧍 ") + esc(p.hero) + ' <span class="hint">(' + esc(p.name) + ")</span></span>" +
        '<button class="btn ' + (p.dead ? "btn-green" : "btn-ghost") + '" data-i="' + i + '">' +
        (p.dead ? "Bring back" : "Mark dead ☠") + "</button></div>";
    }).join("");
    el.querySelectorAll("button[data-i]").forEach(function (b) {
      b.onclick = function () { const i = +b.dataset.i; G.players[i].dead = !G.players[i].dead; renderRoster(); };
    });
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
  // Does a card let the Heroes lose the game (e.g. A Town Overrun empties the deck)?
  function cardCanLose(text) { return /automatically lose/i.test(text) || /heroes (auto|immediately )?lose/i.test(text); }
  function pickBuilding() {
    const b = (G && G.buildings) || [];
    return b.length ? b[Math.floor(Math.random() * b.length)] : null;
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
      const building = cardNeedsBuilding(c.text) ? pickBuilding() : null;
      const narr = building
        ? (LNOE.suspenseLine() + " " + LNOE.cardBuildingNarration(c.name, building))
        : cardThematic(c);
      played.push({ name: c.name, simple: c.simple, text: c.text, remains: c.remains, timing: c.timing,
        narration: narr, building: building });
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
        "⚠ DAWN IS BREAKING — this is the FINAL turn of the night. When the Zombie turn ends, the game is over.</div>";
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
    h += '<p class="section-help">Work down the list in order. Mark each step “Did this” or “Skip” to unlock the next one. The Bot may interrupt at any time.</p>';
    h += '<div class="action-steps">';
    HERO_ACTIONS.forEach(function (a, i) {
      const stateCls = i < G.heroStep ? "resolved" : (i === G.heroStep ? "active" : "locked");
      h += '<div class="step ' + stateCls + '" data-i="' + i + '">';
      h += '<div class="step-no">' + (i + 1) + "</div>";
      h += '<div class="step-body"><h4>' + esc(a.title) + "</h4><p>" + esc(a.help) + "</p>";
      if (stateCls === "active") {
        // The Fight step needs the Zombie (Bot) to roll back.
        if (i === 3) {
          h += '<div class="mt"><span class="hint">A fight means BOTH sides roll. Roll the Zombie’s dice for the Bot, then compare the highest to the Hero’s highest die (the Hero loses ties unless a card says otherwise):</span>';
          h += '<div class="toolbar mt"><label class="hint">Zombie dice: <select id="hf-ndice">';
          for (let n = 1; n <= 6; n++) h += '<option value="' + n + '"' + (n === 1 ? " selected" : "") + ">" + n + "</option>";
          h += '</select></label><button class="btn btn-rust" id="hf-roll">🎲 Zombie rolls</button></div>';
          h += '<div id="hf-dice-out" class="dice-area"></div>';
          h += '<p class="hint">A basic Zombie rolls 1 die. Add dice for cards like <em>Uuuurrrggghh!</em> (+2) or <em>Cornered</em>.</p>';
          h += '<label class="chk mt"><input type="checkbox" id="hf-gun"> The Hero killed it with a Gun</label>';
          h += '<div class="row mt"><span style="flex-basis:100%" class="hint">State the result — the Bot may then intervene with a card:</span>';
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

    // Hero plays a card → the Bot secretly decides whether to fight back.
    h += '<div class="card"><h3>☠ Hero plays a card — the Bot may strike back</h3>';
    h += '<p class="section-help">When a Hero plays a card, type its name and press play. The Bot secretly decides whether to answer with one of its own Zombie cards — you don’t see its hand and you don’t control it. If it plays a card, you’ll be told what it does.</p>';
    h += '<label class="field">Card the Hero plays<input type="text" id="g-herocard" placeholder="e.g. Faith / Pistol / Adrenaline / First Aid Kit"></label>';
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
      const gun = document.getElementById("hf-gun").checked;
      startResolution({ type: "fight", heroWinning: true, gun: gun,
        title: "Hero WON the fight" + (gun ? " (using a Gun)" : "") });
    };
    const hfLost = document.getElementById("hf-lost");
    if (hfLost) hfLost.onclick = function () {
      startResolution({ type: "fight", heroWinning: false, gun: false, title: "Hero LOST the fight" });
    };

    document.getElementById("g-playcard").onclick = function () {
      const name = document.getElementById("g-herocard").value.trim();
      if (!name) return;
      startResolution({ type: "card", heroCardText: name, title: "Hero plays: " + name });
    };
    wireRoster();
    document.getElementById("g-endhero").onclick = endHeroTurn;
  }

  function botHandSummary() {
    return '<div class="hand-summary mt">' + handSummaryInner() + "</div>";
  }
  function handSummaryInner() {
    // Count only — the Bot's hand is hidden from the players.
    return '<span class="hint">The Bot is secretly holding ' + G.bot.hand.length +
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
      G.zturn.narration = narrate("zombieTurn");
      renderZombie();
    }
  }

  /* ---------------------------- ZOMBIE TURN ------------------------- */
  function renderZombie() {
    let h = header();
    h += '<div class="turn-banner">';
    h += '<div class="phase">Zombie Turn · the Bot plays</div>';
    h += '<div class="who">☠ Zombie Turn #' + G.turnNumber + "</div>";
    h += "</div>";

    h += '<div class="narration voice-on">' + esc(G.zturn.narration) + ' <button class="btn btn-ghost" id="z-speak" style="float:right">🔊 Read aloud</button></div>';

    // 1. The Bot plays its own cards — automatically and in secret.
    h += '<div class="card"><h3>1 · The Bot’s cards</h3>';
    h += '<p class="section-help">The Bot draws and chooses its own cards in secret — you don’t control it. Reveal only what it decides to play this turn, then apply each effect to the board.</p>';
    h += '<button class="btn btn-rust btn-lg" id="z-run">☠ Reveal the Bot’s play</button>';
    h += '<div id="z-run-out" class="mt"></div>';
    h += '<hr class="divider">' + botHandSummary();
    h += '<div id="z-played" class="mt"></div>';
    h += "</div>";

    // 2. Movement
    h += '<div class="card"><h3>2 · Move the Zombies</h3>';
    h += '<p class="section-help">Move every Zombie 1 space toward the nearest Hero (or as a card says). Note anything important below — it’s saved to the turn log.</p>';
    h += '<label class="field">Movement notes (optional)<input type="text" id="z-move" placeholder="e.g. moved 3 zombies toward the barn; Shamble rushed one into the house"></label>';
    h += "</div>";

    // 3. Fight + dice
    h += '<div class="card"><h3>3 · Fights &amp; dice</h3>';
    h += '<p class="section-help">When a Zombie fights a Hero, roll here. Add extra dice for cards like Uuuurrrggghh! or Cornered. Compare the highest die to the Hero’s roll.</p>';
    h += '<div class="toolbar">';
    h += '<label class="hint">Dice to roll: <select id="z-ndice">';
    for (let n = 1; n <= 8; n++) h += '<option value="' + n + '"' + (n === 1 ? " selected" : "") + ">" + n + "</option>";
    h += "</select></label>";
    h += '<button class="btn btn-rust" id="z-roll">🎲 Roll dice</button>';
    h += "</div>";
    h += '<div id="z-dice-out" class="dice-area"></div>';
    h += '<div class="row mt"><span style="flex-basis:100%" class="hint">For each fight, state the result — the Bot may intervene with a card:</span>';
    h += '<button class="btn btn-green" id="zf-won">🧍 Hero won this fight</button>';
    h += '<button class="btn btn-primary" id="zf-lost">☠ Hero lost this fight</button></div>';
    h += "</div>";

    // 4. Hero reactions during zombie turn
    h += '<div class="card"><h3>4 · Did a Hero play a card?</h3>';
    h += '<p class="section-help">If a Hero plays a card during your turn, type it here. The Bot decides whether to intervene, and you can counter back and forth until it’s settled.</p>';
    h += '<label class="field">Hero card played<input type="text" id="z-herocard" placeholder="e.g. Faith / Shotgun / Adrenaline"></label>';
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
        html = '<div class="narration voice-on">The dead shuffle and moan in the dark, but the Bot keeps its cards hidden this turn. Move the Zombies and fight as normal.</div>';
      } else {
        result.played.forEach(function (p, idx) {
          html += '<div class="card-draw">';
          html += '<div class="ctype">' + (p.remains ? "Zombie Event · Stays in play" : "Zombie Event") + "</div>";
          html += '<div class="ctitle">' + esc(p.name) + "</div>";
          if (p.remains) html += '<span class="pill tag-remains">Stays in play</span>';
          html += '<div class="rnarr">“' + esc(p.narration) + '”</div>';
          html += '<div class="csimple"><strong>Do this:</strong> ' + esc(p.simple) + "</div>";
          if (cardNeedsBuilding(p.text)) {
            if (p.building) {
              html += '<div class="csimple mt">🏚 The Bot targets: <strong>' + esc(p.building) + "</strong></div>";
            } else {
              html += '<div class="mt"><button class="btn btn-rust zc-roll" data-i="' + idx + '">🎲 Roll for which building</button> ' +
                '<span class="zc-roll-out hint">(add your buildings in Setup to have the Bot pick automatically)</span></div>';
            }
          } else if (cardNeedsRoll(p.text)) {
            html += '<div class="mt"><button class="btn btn-rust zc-roll" data-i="' + idx + '">🎲 Roll the dice for the Bot</button> ' +
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
      this.disabled = true; this.textContent = "☠ The Bot has played";
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
          b.nextElementSibling.innerHTML = '🎲 The Bot rolled a <strong>' + d +
            "</strong> — apply that many (spaces moved / Zombies spawned / building number).";
          LNOE.FX.groan();
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
    document.getElementById("zf-won").onclick = function () {
      startResolution({ type: "fight", heroWinning: true, gun: false, title: "Hero won the fight" });
    };
    document.getElementById("zf-lost").onclick = function () {
      startResolution({ type: "fight", heroWinning: false, gun: false, title: "Hero lost the fight" });
    };
    document.getElementById("z-react").onclick = function () {
      const name = document.getElementById("z-herocard").value.trim();
      if (!name) return;
      startResolution({ type: "card", heroCardText: name, title: "Hero plays: " + name });
    };
    document.getElementById("z-end").onclick = endZombieTurn;
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
    openResolveModal();
    setTimeout(botRespond, 450); // brief "Bot is deciding…" beat
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
      r.steps.push({ who: "bot", card: choice.name, label: "Bot plays " + choice.name + ".",
        simple: choice.simple, narration: narr });
    } else {
      r.steps.push({ who: "bot", label: "The Bot holds back — no card played." });
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
      h += '<div class="rstep ' + s.who + '"><strong>' + (s.who === "bot" ? "☠ Bot" : "🧍 Hero") + ":</strong> " + esc(s.label || s.card || "");
      if (s.narration) h += '<div class="rnarr">“' + esc(s.narration) + '”</div>';
      if (s.simple) h += '<div class="hint">What to do: ' + esc(s.simple) + "</div>";
      h += "</div>";
    });
    h += "</div>";

    if (r.awaiting === "bot") {
      h += '<p class="bot-thinking">☠ The Bot is deciding…</p>';
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
      .map(function (s) { return (s.who === "bot" ? "Bot: " : "Hero: ") + s.card; });
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
        LNOE.FX.whack();   // a meaty hit on the zombie
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
    // Advance the sun, narrate the night creeping on.
    if (G.sun < G.sunMax) {
      G.sun++;
      G.zturn.sunNarr = narrate("sunMove");
      if (musicOn && LNOE.FX) LNOE.FX.setStage(musicStage()); // music escalates as dawn nears
    } else {
      // Dawn — the night is over. Go straight to the ending.
      showEnding(); return;
    }
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
        LNOE.Store.saveResult(result).then(function () {
          m.classList.remove("open");
          G = null; LNOE.TTS.stop(); LNOE.FX.stopAll(); LNOE.Setup.forceSetup();
        });
      };
    }
    render(null);
  }

  LNOE.Game = {
    init: function () {},
    start: start,
    isRunning: function () { return !!G; }
  };
})();

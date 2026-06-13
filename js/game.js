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
    { title: "Shoot a ranged weapon", shoot: true, help: "If you’re holding a Gun and can see a Zombie in a straight line (not through walls), shoot it. Pick your gun, roll to hit, then mark the kill — you’ll hear the shot. The Zombie does NOT fight back." },
    { title: "Fight a Zombie", fight: true, help: "Attack a Zombie in your space. Both sides roll dice and compare the highest. Higher number wins; the loser takes a wound. Pick which weapon you used below so the right sound plays." }
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
    return titledNarration(card.name, LNOE.cardNarration(card.name));
  }
  // Just the FIRST sentence of a narration — short enough to read quickly.
  function shortSentence(text) {
    const m = (text || "").match(/^[^.!?“”]*[.!?]/);
    return (m ? m[0] : (text || "")).trim();
  }
  // A card's title, stripped of decorative quotes, for speaking aloud.
  function cardTitleClean(name) { return String(name == null ? "" : name).replace(/[“”"]/g, "").trim(); }
  // Build a reveal/narration line that SAYS THE CARD TITLE FIRST, then the
  // short thematic line tied to what the card does.
  function titledNarration(name, line) {
    const t = cardTitleClean(name);
    const body = shortSentence(line);
    if (!body) return t;
    return /[!?.…]$/.test(t) ? (t + " " + body) : (t + " — " + body);
  }
  // Plain-English point-form "what to do" for a Zombie card the Bot played,
  // with any die roll and target building already filled in (no buttons).
  function zombieCardSteps(p) {
    const n = (p.name || "").toLowerCase();
    const r = p.roll || "?";
    const sp = (p.roll === 1) ? "" : "s";
    // Cards whose wording is "roll, then the player chooses" — spell it out.
    if (n.indexOf("shamble") > -1) {
      const who = p.hero ? (p.hero + (p.heroName ? " (" + p.heroName + ")" : "")) : "the nearest Hero";
      const tail = p.heroLoc === "outdoor" ? " — they’re out in the open." : (p.hero ? " — everyone’s indoors, so this one’s picked at random." : "");
      return ["🎲 The Zombie rolled a " + r + ".",
        "🧍 Lurch toward: " + who + tail,
        "Choose any one Zombie and move it up to " + r + " space" + sp + " toward " + (p.hero || "that Hero") + "."];
    }
    if (n.indexOf("relentless advance") > -1) {
      return ["🎲 The Zombie rolled a " + r + ".",
        "Up to " + r + " Zombie" + sp + " may each move 1 extra space now — you choose which.",
        "Those Zombies can still move and fight normally this turn."];
    }
    if (n.indexOf("too many") > -1) {
      return ["🎲 The Zombie rolled a " + r + ".",
        "Add " + r + " more Zombie" + sp + " on top of the spawn above.",
        "If the pool runs out, take them from anywhere on the board."];
    }
    if (n.indexOf("surprise attack") > -1) {
      if (!p.hero) {
        return ["No Hero is marked as inside a building, so Surprise Attack has no legal target.",
          "Discard it with no effect. (If a Hero really is in a building, set them to “In a building” in the Heroes list, then re-reveal.)"];
      }
      const who = p.hero + (p.heroName ? " (" + p.heroName + ")" : "");
      const where = p.heroBuilding ? "the " + p.heroBuilding : "a building";
      return ["🧍 Drop the Zombie on: " + who + " — inside " + where + ".",
        "Take a Zombie from the pool and place it in the same space as " + p.hero + " in " + where + "."];
    }
    if (n.indexOf("cornered") > -1) {
      return ["For the rest of this turn (until your next Zombie turn) every Zombie rolls 2 extra Fight Dice.",
        "Heroes still win on ties.",
        "✓ The Fight box (step 4) has already added the 2 extra dice for you."];
    }
    if (n.indexOf("taken the") > -1) {
      const b = p.target ? (/^the\s/i.test(p.target) ? p.target : "the " + p.target) : "the rolled building";
      return ["🏚 Target building: " + (p.target || "(roll a random building)") + ".",
        "Place a Taken Over marker on " + b + ".",
        "Fill every empty space in " + b + " with Zombies from the pool.",
        "No Hero may enter or Search " + b + " while it’s Taken Over."];
    }
    if (n.indexOf("lights out") > -1) {
      const b = p.target ? (/^the\s/i.test(p.target) ? p.target : "the " + p.target) : "the chosen building";
      return ["🏚 Target building: " + (p.target || "(pick a building)") + ".",
        "Place a Lights Out marker on " + b + ".",
        "Any Hero who moves into a space in " + b + " immediately ends their move.",
        "This stays in play."];
    }
    if (n.indexOf("heavy rain") > -1) {
      return ["Every Hero who is OUTSIDE a building subtracts 1 from their Movement roll (to a minimum of 1).",
        "Heroes inside a building are unaffected.",
        "This stays in play for the rest of the game."];
    }
    if (n.indexOf("horror") > -1) {
      return ["The Zombie draws 3 extra Zombie cards (done for you automatically).",
        "Any of those it can play this turn appear below."];
    }
    if (n.indexOf("town overrun") > -1) {
      return ["Discard the top 10 cards of the Hero deck (reveal and throw them away).",
        "If that empties the Hero deck, the Heroes lose — use the button below."];
    }
    let s = p.simple || "";
    if (p.roll) {
      s = s.replace(/Roll a die[\s—–-]*it moves that many spaces/i, "It moves " + p.roll + " spaces")
        .replace(/Roll a die[.;,]?\s*/i, "")
        .replace(/\bthat many\b/gi, String(p.roll))
        .replace(/\bD6\b/gi, String(p.roll));
    }
    if (p.target) {
      const the = /^the\s/i.test(p.target) ? p.target : "the " + p.target; // avoid "the The Barn"
      s = s.replace(/Pick a building\.\s*/i, "")
        .replace(/\bthere\b/gi, "in " + the)
        .replace(/\ba building\b/gi, the);
    }
    const pts = s.split(/\.\s+/).map(function (x) { return x.replace(/\.$/, "").trim(); }).filter(Boolean);
    if (p.roll) pts.unshift("🎲 The Zombie already rolled a " + p.roll + " for you.");
    if (p.target) pts.unshift("🏚 Target building: " + p.target + ".");
    return pts;
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

  // Trip!: the moment a Hero finishes a Move or Search, the Zombie may play it
  // to force a re-roll. If it holds the card, play it and tell the player.
  function botPlaysTrip(heroLabel) {
    const t = G.bot.hand.find(function (c) { return /trip/i.test(c.name); });
    if (!t) return;
    G.bot.playFromHand(t.uid);
    G.zturn.played.push(t.name);
    announceBotCard(t);
    let m = document.getElementById("trip-modal");
    if (!m) { m = document.createElement("div"); m.id = "trip-modal"; m.className = "modal-overlay"; document.body.appendChild(m); }
    m.innerHTML = '<div class="modal-card"><h3>☠ Trip!</h3>' +
      '<div class="narration voice-on">“' + esc(LNOE.cardNarration("Trip!") || "The ground gives way — a Hero stumbles among the dead!") + '”</div>' +
      '<div class="csimple mt"><strong>What to do:</strong><ul class="zc-steps"><li><strong>' + esc(heroLabel) +
      '</strong> must RE-ROLL the dice they just rolled for that Move or Search. The new roll stands.</li></ul></div>' +
      '<div class="row mt"><button class="btn btn-green" id="trip-ok">✓ Done</button></div></div>';
    m.classList.add("open");
    document.getElementById("trip-ok").onclick = function () { m.classList.remove("open"); };
    refreshHandSummaries();   // the played card leaves the hand immediately
    autoSave();
  }

  /* ----------------------------- START ----------------------------- */
  function start(gameState) {
    G = gameState;
    G.saveId = "g" + new Date().getTime();   // unique id for this game's auto-save
    G.scenarioLoc = { primary: "", safe: "" };  // other escort scenarios: free-text spots
    G.objectiveCount = 0;   // the scenario's objective counter (kills / saved / etc.)
    G.ending = false;
    // Rescue Mission: build runtime Townsfolk state (each starts in their building).
    if (G.rescue) {
      G.rescue.townsfolk = (G.rescue.townsfolk || []).map(function (t) {
        return { name: t.name, building: t.building, status: "building", withHero: "" };
      });
    }
    // Starting gear from Setup: weapon names → weapon objects; cap to 2 + 4.
    G.players.forEach(function (p) {
      if (p.weapons && p.weapons.length && typeof p.weapons[0] === "string") {
        p.weapons = p.weapons.map(function (n) { return findWeapon(n); }).filter(Boolean);
      }
      normalizeInventory(p);
    });
    G.bot = new LNOE.Bot(G.baseSet, G.advanced);
    // The Zombie player holds cards from the start, so the Bot can intervene
    // even during the very first Hero turn.
    G.bot.draw(); G.bot.draw();
    G.sunMax = G.scenario.turns || 12;   // Sun Track length varies by scenario
    G.sun = 1;
    G.round = 1;
    G.turnNumber = 0;        // zombie turns completed
    G.playerIndex = 0;
    G.phase = "hero";        // 'hero' | 'zombie'
    G.players.forEach(function (p) { p.dead = false; });  // track who's alive until the end
    G.introText = LNOE.scenarioIntro(G.scenario.name, G.baseSetName, G.scenario.objective) +
      "\n\n" + LNOE.castIntro(G.players);
    if (G.rescue) {
      G.introText += "\n\nAll Heroes begin together inside the safe house — the " + G.rescue.safehouse +
        ". The helpless Townsfolk are scattered out in the buildings. Get three of them back to the safe house before the dead claim two.";
    }
    newZTurn();
    resetHeroSteps();
    LNOE.switchTab("start");
    // The Start button click is a user gesture, so audio is allowed now.
    if (musicOn) LNOE.FX.startMusic(musicStage());   // continuous background music
    renderIntro();   // dedicated opening page first — the player listens or skips
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

  // Dedicated opening page shown when a new game starts. The player chooses to
  // listen to the introduction or skip straight into the game.
  function renderIntro() {
    let h = header();
    h += '<div class="card intro-page" style="border-color:var(--blood-bright)">';
    h += '<div class="step-badge">Opening</div>';
    h += "<h2>🎬 " + esc(G.scenario.name) + "</h2>";
    h += '<p class="section-help">' + esc(G.scenario.objective) + "</p>";
    const paras = (G.introText || "").split("\n\n").map(function (p) {
      return '<p style="margin:0 0 10px">' + esc(p) + "</p>";
    }).join("");
    h += '<div class="narration voice-on" id="g-intro">' + paras + "</div>";
    h += '<div class="row mt">';
    h += '<button class="btn btn-rust" id="g-intro-play">▶ Listen to the introduction</button>';
    h += '<button class="btn btn-ghost" id="g-intro-stop">⏹ Stop</button>';
    h += "</div>";
    h += '<div class="row mt"><button class="btn btn-primary btn-lg" id="g-intro-start">Skip / Start the game →</button></div>';
    h += '<p class="hint mt">Tap “Listen” to hear the opening read aloud, or start straight away. You can replay it from the Scary Voice button later.</p>';
    h += "</div>";
    panel().innerHTML = h;
    wireHeader();
    document.getElementById("g-intro-play").onclick = playIntro;
    document.getElementById("g-intro-stop").onclick = stopIntro;
    document.getElementById("g-intro-start").onclick = function () {
      stopIntro();
      renderHero();   // begin the first Hero turn
    };
    autoSave();
  }

  function newZTurn() {
    G.zturn = { drawn: [], played: [], dice: [], movement: "", damage: "", narration: "", step: "start",
      sunNarr: "", spawnRolls: null, spawnTotal: 0, spawnDone: false, spawnCards: [], spawnCardsDone: false,
      revealCards: [], revealTicked: 0, revealEmpty: false };
    G.cornered = false;  // Cornered lasts only until the start of the next Zombie turn
  }

  // Reset the ordered hero-action stepper at the start of a Hero's turn.
  function resetHeroSteps() { G.heroStep = 0; G.heroDone = []; G.heroBot = { ran: false, cards: [] }; }

  // Indices of Heroes who are still alive.
  function aliveIndices() {
    return G.players.map(function (p, i) { return i; }).filter(function (i) { return !G.players[i].dead; });
  }

  /* ----------------- Hero weapons & event-card helpers -------------- */
  // The Hero deck cards in play: base set + the Advanced add-on when it's on.
  function heroDeckCards() {
    let cards = ((LNOE.heroDecks && LNOE.heroDecks[G.baseSet]) || []).slice();
    if (G && G.advanced && LNOE.heroDecksAdvanced && LNOE.heroDecksAdvanced[G.baseSet]) {
      cards = cards.concat(LNOE.heroDecksAdvanced[G.baseSet]);
    }
    return cards;
  }
  function dedupeNames(arr) {
    const seen = {}, out = [];
    arr.forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push(n); } });
    return out;
  }
  // Weapons the Heroes can carry, read from the Hero deck(s) in play.
  function weaponList() {
    const seen = {}, out = [];
    heroDeckCards().forEach(function (c) {
      if ((c.category === "Hand Weapon" || c.category === "Ranged Weapon") && !seen[c.name]) {
        seen[c.name] = 1;
        const ranged = c.category === "Ranged Weapon";
        out.push({ name: c.name, ranged: ranged, gun: ranged && /\bGun\b/.test(c.text || "") });
      }
    });
    return out;
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

  // A Hero carries up to 4 things total; at most 2 of them may be weapons (the
  // rest are items). Normalise older saves (single `weapon`) and enforce caps.
  const CARRY_MAX = 4, WEAPON_MAX = 2;
  function normalizeInventory(p) {
    if (!p) return;
    if (!p.weapons) p.weapons = p.weapon ? [p.weapon] : [];
    if (p.weapon) delete p.weapon;
    p.weapons = p.weapons.filter(Boolean).slice(0, WEAPON_MAX);
    if (!p.items) p.items = [];
    const room = Math.max(0, CARRY_MAX - p.weapons.length);
    if (p.items.length > room) p.items = p.items.slice(0, room);
    // Heroes are assumed Outdoors by default so the location is never forgotten.
    if (p.location !== "building" && p.location !== "outdoor") p.location = "outdoor";
    if (!Array.isArray(p.sameSpace)) p.sameSpace = [];
  }
  function carriedWeapons(p) { return (p && p.weapons || []).filter(Boolean); }
  function carriedCount(p) { return carriedWeapons(p).length + ((p && p.items) || []).length; }
  // Compact gear summary shown in the sticky turn banner.
  function bannerGearText(p) {
    const ws = carriedWeapons(p), it = (p && p.items) || [];
    const g = [];
    if (ws.length) g.push("🗡 " + ws.map(function (w) { return w.name; }).join(", "));
    if (it.length) g.push("🎒 " + it.join(", "));
    return g.length ? g.join("    ·    ") : "No weapons or items yet — add them in the Heroes list below.";
  }
  // Refresh just the banner's gear line when the current Hero's inventory changes.
  function updateBannerGear() {
    if (!G || G.phase !== "hero") return;
    const el = document.querySelector(".banner-gear");
    if (el) el.textContent = bannerGearText(G.players[G.playerIndex]);
  }
  // Options for a "fighting with" picker: bare hands + the Hero's carried weapons.
  // Defaults to the Hero's FIRST weapon (so a ranged weapon fires its gunshot
  // on a win even if the player doesn't touch the picker).
  function fightWeaponOptions(p) {
    const ws = carriedWeapons(p);
    const def = ws.length ? 0 : -1;
    let s = '<option value="-1"' + (def === -1 ? " selected" : "") + ">bare hands</option>";
    ws.forEach(function (w, i) {
      s += '<option value="' + i + '"' + (def === i ? " selected" : "") + ">" + esc(weaponLabel(w)) + "</option>";
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
  // Items a Hero can carry, read from the Hero deck(s) in play (for autocomplete).
  function heroItemNames() {
    return dedupeNames(heroDeckCards().filter(function (c) { return c.category === "Item"; }).map(function (c) { return c.name; }));
  }
  function heroItemDatalist() {
    return '<datalist id="hero-items">' + heroItemNames().map(function (n) {
      return '<option value="' + esc(n) + '"></option>';
    }).join("") + "</datalist>";
  }

  // Event-type Hero cards (Event + Townsfolk) for the play-a-card autocomplete.
  function heroEventNames() {
    return dedupeNames(heroDeckCards().filter(function (c) { return c.category === "Event" || c.category === "Townsfolk"; })
      .map(function (c) { return c.name; }));
  }
  function heroEventOptions() {
    return heroEventNames().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join("");
  }
  function heroEventDatalist() {
    return '<datalist id="hero-events">' + heroEventOptions() + "</datalist>";
  }

  // Heroes (alive) currently carrying an item that completes the scenario's
  // objective — used to name them in the Zombie movement guide.
  function objectiveCarriers() {
    const objs = (LNOE.objectiveItemsFor ? LNOE.objectiveItemsFor(G.scenario.name) : []).map(function (s) { return s.toLowerCase(); });
    if (!objs.length) return [];
    const out = [];
    aliveIndices().forEach(function (i) {
      const p = G.players[i];
      const matched = (p.items || []).filter(function (it) {
        const t = it.toLowerCase();
        return objs.some(function (o) { return t.indexOf(o) > -1 || o.indexOf(t) > -1; });
      });
      if (matched.length) out.push({ p: p, items: matched });
    });
    return out;
  }
  function heroName(p) { return p.hero + " (" + p.name + ")"; }

  /* ----------------------- OBJECTIVE TRACKER ------------------------ */
  // A generic counter card per scenario (zombies killed / townsfolk saved /
  // zombies in the manor). Hitting the target ends the game for that side.
  function deadHeroCount() { return G.players.filter(function (p) { return p.dead; }).length; }
  /* ----------------------- RESCUE MISSION --------------------------- */
  function rescueDead() { return (G.rescue.townsfolk || []).filter(function (t) { return t.status === "dead"; }).length; }
  function rescueSaved() { return (G.rescue.townsfolk || []).filter(function (t) { return t.status === "safehouse"; }).length; }
  function rescueStatusLabel(t) {
    if (t.status === "dead") return "<span style='color:var(--blood-bright)'>☠ killed</span>";
    if (t.status === "safehouse") return "<span style='color:var(--green)'>🏠 safe house</span>";
    if (t.status === "alone") return "<span style='color:#ffb347'>🚶 alone & not safe</span>";
    if (t.status === "hero") return "🧍 with <strong>" + esc(t.withHero || "a Hero") + "</strong>";
    return "in the <strong>" + esc(t.building) + "</strong>";
  }
  function rescueTownsfolkWhere(t) {
    if (t.status === "alone") return "alone & not safe";
    if (t.status === "hero") return "with " + esc(t.withHero || "a Hero");
    if (t.status === "safehouse") return "safe house";
    return "the " + esc(t.building);
  }
  function rescueProtectedBuildings() {
    if (!G.rescue) return [];
    return [G.rescue.safehouse].concat((G.rescue.townsfolk || []).map(function (t) { return t.building; })).filter(Boolean);
  }
  function rescueCard() {
    const saveT = LNOE.RESCUE_SAVE_TO_WIN || 3, deadT = LNOE.RESCUE_DEAD_TO_LOSE || 2;
    const saved = rescueSaved(), dead = rescueDead();
    let h = '<div class="card" id="obj-card"><h3>🎯 Rescue Mission</h3>';
    h += '<div class="obj-kill"><span>🏠 Townsfolk in the safe house: <strong class="obj-big" style="color:var(--green)">' + saved + "</strong> / " + saveT + " to WIN</span></div>";
    h += '<div class="obj-kill"><span>☠ Townsfolk killed: <strong class="obj-big" style="color:var(--blood-bright)">' + dead + "</strong> / " + deadT + " and the dead win</span></div>";
    h += '<div class="mt"><strong>Townsfolk:</strong><ul style="margin:6px 0 0 18px">';
    (G.rescue.townsfolk || []).forEach(function (t) { h += "<li>" + esc(t.name) + " — " + rescueStatusLabel(t) + "</li>"; });
    h += "</ul></div>";
    h += '<p class="hint mt">🏠 Safe house: <strong>' + esc(G.rescue.safehouse) + "</strong>. Update where each Townsfolk is when a Hero ends their turn. A Pit or Taken Over marker can never be placed in the safe house or a Townsfolk’s building.</p>";
    h += "</div>";
    return h;
  }
  // True if the Rescue Mission ended (and the ending was shown).
  function checkRescueEnd() {
    if (!G.rescue || G.ending) return false;
    if (rescueDead() >= (LNOE.RESCUE_DEAD_TO_LOSE || 2)) { G.ending = true; showEnding("Zombies"); return true; }
    if (rescueSaved() >= (LNOE.RESCUE_SAVE_TO_WIN || 3)) { G.ending = true; showEnding("Heroes"); return true; }
    return false;
  }
  function objectiveCard() {
    if (G.rescue) return rescueCard();
    const ot = G.scenario.objTracker;
    if (!ot) return "";
    G.objectiveCount = G.objectiveCount || 0;
    const n = G.objectiveCount, done = n >= ot.target;
    let h = '<div class="card" id="obj-card"><h3>🎯 Objective</h3>';
    h += '<div class="obj-kill"><span>' + esc(ot.emoji) + " " + esc(ot.label) + ': <strong class="obj-big">' + n + "</strong> / " + ot.target + "</span> ";
    h += '<button class="btn btn-sm" id="obj-minus">−</button> <button class="btn btn-sm btn-green" id="obj-plus">+1</button>';
    if (ot.autoKill) h += '<span class="hint" style="flex-basis:100%;margin-top:2px">Counts up automatically when a Zombie is killed (a won fight or a shot). Use − to fix a miscount.</span>';
    if (done) {
      h += '<div class="obj-done mt">✅ ' + esc(ot.label) + " reached " + ot.target + " — the " +
        (ot.win === "Heroes" ? "Heroes" : "Zombies") + " win! Jumping to the ending…</div>";
    }
    if (G.scenario.heroDeathLimit) {
      h += '<div class="hint" style="flex-basis:100%;margin-top:4px">Heroes lost: ' + deadHeroCount() + " / " +
        G.scenario.heroDeathLimit + " — if " + G.scenario.heroDeathLimit + " die, the Zombies win.</div>";
    }
    h += "</div></div>";   // close .obj-kill AND the #obj-card card
    return h;
  }
  function refreshObjectiveCard() {
    const card = document.getElementById("obj-card");
    if (card) { card.outerHTML = objectiveCard(); wireObjectiveCard(); }
  }
  function wireObjectiveCard() {
    const plus = document.getElementById("obj-plus");
    if (plus) plus.onclick = function () { G.objectiveCount = (G.objectiveCount || 0) + 1; autoSave(); refreshObjectiveCard(); checkObjectiveEnd(); };
    const minus = document.getElementById("obj-minus");
    if (minus) minus.onclick = function () { G.objectiveCount = Math.max(0, (G.objectiveCount || 0) - 1); autoSave(); refreshObjectiveCard(); };
  }
  // Auto-count a Zombie kill toward the objective (kill-objective scenarios).
  function recordKill() {
    const ot = G.scenario.objTracker;
    if (!ot || !ot.autoKill) return;
    G.objectiveCount = (G.objectiveCount || 0) + 1;
    autoSave();
    refreshObjectiveCard();
    checkObjectiveEnd();
  }
  // End the game early when an objective/loss condition is met.
  function checkObjectiveEnd() {
    if (!G || G.ending) return;
    if (G.rescue) { checkRescueEnd(); return; }
    const sc = G.scenario, ot = sc.objTracker;
    if (ot && (G.objectiveCount || 0) >= ot.target) { G.ending = true; showEnding(ot.win); return; }
    if (sc.heroDeathLimit && deadHeroCount() >= sc.heroDeathLimit) { G.ending = true; showEnding("Zombies"); return; }
  }

  // The Zombie movement priority guide shown in the Move step. Priorities 2–5
  // name the actual Heroes (not the word "Hero"), since the app has that info.
  function zombieMovementGuide() {
    const carriers = objectiveCarriers();
    const alive = aliveIndices().map(function (i) { return G.players[i]; });
    const unarmed = alive.filter(function (p) { return carriedWeapons(p).length === 0; });
    const nm = function (p) { return "<strong>" + esc(p.hero) + "</strong>"; };
    const names = function (arr) { return arr.length ? arr.map(nm).join(", ") : "the nearest Hero"; };

    const lcfg = LNOE.scenarioLocationCfg ? LNOE.scenarioLocationCfg(G.scenario.name) : null;
    const loc = G.scenarioLoc || { primary: "", safe: "" };

    let h = '<div class="move-guide"><div class="mg-head">🧠 Move each Zombie — use the FIRST that fits:</div><ol class="mg-list">';
    // 1 — general rule (no name)
    h += "<li><strong>Fight a Hero in the same space</strong> — it fights instead of moving (step 4).</li>";
    // 2 — the scenario objective, auto-selected by scenario. Hidden entirely for
    // scenarios that have no movement objective. Folds in chasing the carrier.
    const scName = G.scenario.name || "";
    const objItems = LNOE.objectiveItemsFor ? LNOE.objectiveItemsFor(scName) : [];
    let obj2 = null;
    if (G.rescue) {
      const tf = G.rescue.townsfolk || [];
      // Target Townsfolk in this order: alone & not safe → with a Hero → in a
      // building → in the safe house. (Dead Townsfolk are skipped.)
      const order = [
        { st: "alone", label: "Alone &amp; not safe" },
        { st: "hero", label: "With a Hero" },
        { st: "building", label: "In their building" },
        { st: "safehouse", label: "In the safe house" }
      ];
      const groups = order.map(function (o) {
        return { label: o.label, list: tf.filter(function (t) { return t.status === o.st; }) };
      }).filter(function (g) { return g.list.length; });
      if (groups.length) {
        obj2 = "<strong>🎯 Go for the nearest Townsfolk</strong> — in this priority:<ol style='margin:4px 0 0 18px'>";
        groups.forEach(function (g) {
          obj2 += "<li><strong>" + g.label + "</strong> — " +
            g.list.map(function (t) { return esc(t.name); }).join(", ") + "</li>";
        });
        obj2 += "</ol>";
      } else {
        obj2 = "<strong>🎯 Hunt the Heroes</strong> — every Townsfolk is lost; go for the living.";
      }
    } else if (/defend the manor/i.test(scName)) {
      obj2 = "<strong>🎯 Objective — push into the Manor House.</strong> Every Zombie heads for the Manor and crowds inside.";
    } else if (lcfg) {
      // Escort scenario (e.g. Rescue Mission) — free-text spots set above.
      if (loc.primary || loc.safe) {
        obj2 = "<strong>🎯 Objective — protect it.</strong> Swarm " + esc(lcfg.noun) +
          (loc.primary ? " at <strong>" + esc(loc.primary) + "</strong>" : "") +
          (loc.safe ? " and block the way to <strong>" + esc(loc.safe) + "</strong>" : "") + ".";
      } else {
        obj2 = "<strong>🎯 Objective — protect it.</strong> Set the " + esc(lcfg.noun) + " and safe-house spots above, then swarm them.";
      }
    } else if (objItems.length) {
      const lbl = /escape in the truck/i.test(scName) ? "the gasoline and/or keys"
        : /burn.{0,3}em out/i.test(scName) ? "the gasoline and/or dynamite"
        : "the " + objItems.slice(0, 3).join(" / ");
      if (carriers.length) {
        obj2 = "<strong>🎯 Objective — go for " + lbl + ".</strong> Head straight for " +
          names(carriers.map(function (c) { return c.p; })) +
          " <span class='hint'>(carrying " + carriers.map(function (c) { return esc(c.items.join(", ")); }).join("; ") + ")</span>.";
      } else {
        obj2 = "<strong>🎯 Objective — go for " + lbl + ".</strong> Head for whichever Hero is closest to grabbing it.";
      }
    }
    if (obj2) h += "<li>" + obj2 + "</li>";
    // nearest (list the candidate Heroes by name)
    h += "<li><strong>Go to the closest</strong> — " + names(alive) + "</li>";
    // weakest (name them)
    if (unarmed.length) h += "<li><strong>Hit the weakest</strong> — " + names(unarmed) + " <span class='hint'>(no weapon)</span></li>";
    else h += "<li><strong>Hit the weakest</strong> — " + names(alive) + " <span class='hint'>(go for the most wounded)</span></li>";
    // closest building (no Hero)
    h += "<li><strong>Go to the closest building.</strong></li>";
    h += "</ol></div>";
    return h;
  }

  // Find a Hero card object by name across the deck(s) in play.
  function findHeroCard(name) {
    if (!name) return null;
    return heroDeckCards().find(function (c) { return c.name === name; }) || null;
  }
  // Turn a weapon/item card's rules text into simple point-form "what it does".
  function cardPoints(card) {
    let t = (card.text || "").replace(/\s+/g, " ").trim();
    t = t.replace(/^Item\b[^.]*\.\s*/i, "");             // drop the "Item[ – type]." descriptor
    const pts = [];
    if (card.category === "Hand Weapon") pts.push("Hand weapon — used when you fight a Zombie in your space.");
    else if (card.category === "Ranged Weapon") pts.push("Ranged weapon — shoot a Zombie from a distance.");
    const rangeM = t.match(/^RANGE:\s*(\d+)\.?\s*/i);
    if (rangeM) { pts.push("Range " + rangeM[1] + " — target a Zombie/space up to " + rangeM[1] + " away."); t = t.slice(rangeM[0].length); }
    function pushSentences(str) {
      str.split(/\.\s+/).forEach(function (sent) {
        sent = sent.replace(/\.$/, "").trim();
        if (!sent) return;
        if (/^OR\s+/i.test(sent)) pts.push("Or instead: " + sent.replace(/^OR\s+/i, ""));
        else pts.push(sent);
      });
    }
    // Anything before "COMBAT BONUS:" is a normal/passive effect; what follows
    // is the in-fight bonus.
    const cbIdx = t.search(/COMBAT BONUS:\s*/i);
    if (cbIdx > -1) {
      pushSentences(t.slice(0, cbIdx));
      pts.push("In a fight, it gives you this bonus:");
      pushSentences(t.replace(/^[\s\S]*?COMBAT BONUS:\s*/i, ""));
    } else {
      pushSentences(t);
    }
    return pts;
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

  // A dropdown to ADD a weapon to a Hero (disabled when they're already full).
  function weaponAddSelect(id, disabled) {
    const ws = weaponList();
    function opts(list) { return list.map(function (w) { return '<option value="' + esc(w.name) + '">' + esc(w.name) + "</option>"; }).join(""); }
    return '<select id="' + esc(id) + '" class="wpn-select"' + (disabled ? " disabled" : "") +
      '><option value="">+ add weapon…</option>' +
      '<optgroup label="Hand weapons (whack)">' + opts(ws.filter(function (w) { return !w.ranged; })) + "</optgroup>" +
      '<optgroup label="Ranged weapons (gunshot)">' + opts(ws.filter(function (w) { return w.ranged; })) + "</optgroup></select>";
  }

  function renderRoster() {
    const el = document.getElementById("g-roster");
    if (!el) return;
    G.players.forEach(normalizeInventory);
    el.innerHTML = heroItemDatalist() + G.players.map(function (p, i) {
      const ws = carriedWeapons(p);
      const items = p.items || [];
      const total = ws.length + items.length;
      const weaponsFull = ws.length >= WEAPON_MAX;
      const carryFull = total >= CARRY_MAX;
      let h = '<div class="hero-inv' + (p.dead ? " dead" : "") + '">';
      h += '<div class="hero-inv-top">';
      const gBadge = p.gender === "M" ? " ♂" : p.gender === "F" ? " ♀" : "";
      h += '<span class="ps-name">' + (p.dead ? "☠ " : "🧍 ") + esc(p.hero) + gBadge + ' <span class="hint">(' + esc(p.name) + ")</span></span>";
      h += '<span class="hint inv-count">Carrying ' + total + "/" + CARRY_MAX + " · weapons " + ws.length + "/" + WEAPON_MAX + "</span>";
      h += '<button class="btn ' + (p.dead ? "btn-green" : "btn-ghost") + '" data-dead="' + i + '">' + (p.dead ? "Bring back" : "Mark dead ☠") + "</button>";
      h += "</div>";
      // Where the Hero is right now — in a building or out in the open.
      const loc = p.location || "";
      h += '<div class="inv-line loc-line"><span class="inv-tag">📍 Where</span>';
      h += '<div class="loc-seg">';
      h += '<button class="btn btn-sm loc-btn' + (loc === "building" ? " loc-on" : "") + '" data-loc="' + i + ':building">🏚 In a building</button>';
      h += '<button class="btn btn-sm loc-btn' + (loc === "outdoor" ? " loc-on" : "") + '" data-loc="' + i + ':outdoor">🌲 Outdoors</button>';
      h += "</div>";
      if (loc === "building" && p.building) h += '<span class="hint">in the <strong>' + esc(p.building) + "</strong></span>";
      h += "</div>";
      // Who shares this Hero's space (set when they end their turn).
      const mates = (p.sameSpace || []).filter(Boolean);
      if (mates.length) {
        h += '<div class="inv-line"><span class="inv-tag">🤝 Same space</span><span class="hint">with <strong>' +
          mates.map(esc).join("</strong>, <strong>") + "</strong></span></div>";
      }
      // Weapons (max 2 of the 4).
      h += '<div class="inv-line"><span class="inv-tag">🗡 Weapons</span>';
      ws.forEach(function (w, wi) {
        h += '<span class="chip chip-wpn">' + esc(w.name) + '<span class="chip-kind">' + (w.ranged ? "gun" : "hand") +
          '</span><a href="#" class="chip-x" data-rmw="' + i + ":" + wi + '">✕</a></span>';
      });
      h += weaponAddSelect("rw-" + i, weaponsFull || carryFull);
      h += "</div>";
      // Items (fill the rest of the 4).
      h += '<div class="inv-line"><span class="inv-tag">🎒 Items</span>';
      items.forEach(function (it, ii) {
        h += '<span class="chip">' + esc(it) + '<a href="#" class="chip-x" data-rmi="' + i + ":" + ii + '">✕</a></span>';
      });
      h += '<input type="text" id="ai-' + i + '" list="hero-items" class="inv-item" placeholder="type an item…"' + (carryFull ? " disabled" : "") + ">";
      h += '<button class="btn btn-sm" data-addi="' + i + '"' + (carryFull ? " disabled" : "") + ">+ Add</button>";
      if (carryFull) h += '<span class="hint">— carrying the max of ' + CARRY_MAX + " —</span>";
      h += "</div>";
      // Point-form "what your cards do" for the carried weapons + items.
      const detailCards = ws.map(function (w) { return findHeroCard(w.name); })
        .concat(items.map(function (it) { return findHeroCard(it); })).filter(Boolean);
      if (detailCards.length) {
        h += '<details class="inv-details"><summary>📖 What ' + esc(p.hero) + "’s cards do</summary>";
        detailCards.forEach(function (c) {
          const icon = (c.category === "Hand Weapon" || c.category === "Ranged Weapon") ? "🗡" : "🎒";
          h += '<div class="card-detail"><strong>' + icon + " " + esc(c.name) + "</strong><ul>";
          cardPoints(c).forEach(function (pt) { h += "<li>" + esc(pt) + "</li>"; });
          h += "</ul></div>";
        });
        h += "</details>";
      }
      h += "</div>";
      return h;
    }).join("");
    wireRosterInventory(el);
    updateBannerGear();   // keep the sticky banner's gear line in sync
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

  // Wire the chip inventory: mark-dead, add/remove weapons, add/remove items.
  function wireRosterInventory(el) {
    el.querySelectorAll("[data-dead]").forEach(function (b) {
      b.onclick = function () { const i = +b.dataset.dead; G.players[i].dead = !G.players[i].dead; renderRoster(); refreshObjectiveCard(); checkObjectiveEnd(); };
    });
    el.querySelectorAll("[data-loc]").forEach(function (b) {
      b.onclick = function () {
        const pr = b.dataset.loc.split(":"), p = G.players[+pr[0]];
        p.location = pr[1];   // always set one or the other — default is Outdoors
        renderRoster();
      };
    });
    el.querySelectorAll("[data-rmw]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); const pr = a.dataset.rmw.split(":"); G.players[+pr[0]].weapons.splice(+pr[1], 1); renderRoster(); };
    });
    el.querySelectorAll("[data-rmi]").forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); const pr = a.dataset.rmi.split(":"); G.players[+pr[0]].items.splice(+pr[1], 1); renderRoster(); };
    });
    el.querySelectorAll("select[id^='rw-']").forEach(function (s) {
      s.onchange = function () {
        const i = +s.id.slice(3), p = G.players[i], w = findWeapon(s.value);
        if (w && carriedWeapons(p).length < WEAPON_MAX && carriedCount(p) < CARRY_MAX) {
          p.weapons = (p.weapons || []).concat([w]);
        }
        renderRoster();
      };
    });
    el.querySelectorAll("[data-addi]").forEach(function (b) {
      b.onclick = function () {
        const i = +b.dataset.addi, p = G.players[i];
        const inp = document.getElementById("ai-" + i);
        const v = (inp && inp.value || "").trim();
        if (v && carriedCount(p) < CARRY_MAX) { p.items = (p.items || []).concat([v]); }
        renderRoster();
      };
    });
    el.querySelectorAll(".inv-item").forEach(function (inp) {
      inp.onkeydown = function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const i = +inp.id.slice(3), b = el.querySelector('[data-addi="' + i + '"]');
        if (b) b.click();
      };
    });
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
  // Which phase of the Zombie turn a held card is played in:
  //   draw  → resolved the moment the Zombie reveals its hand (step 2)
  //   spawn → played during "Spawn new Zombies" (step 5)
  //   fight → held for a fight (the fight-resolution modal offers it)
  //   hold  → held for a Hero reaction (only the hidden-hand count shows it)
  function cardPhase(card) {
    const n = (card.name || "").toLowerCase();
    if (n.indexOf("relentless advance") > -1) return "spawn";
    if (n.indexOf("too many") > -1) return "spawn";
    if (card.timing === "zturn_end") return "spawn";
    if (card.timing === "fight") return "fight";
    if (card.timing === "reaction" || card.timing === "hero_move") return "hold";
    return "draw"; // immediate, zturn_start, anytime
  }
  function pickFrom(list) { return (list && list.length) ? list[Math.floor(Math.random() * list.length)] : null; }
  function pickBuilding() { return pickFrom((G && G.buildings) || []); }
  // Cards that drop a Zombie onto a Hero (e.g. Surprise Attack) target a HERO,
  // not a building.
  function cardNeedsHero(card) { return /surprise attack/i.test(card.name || ""); }
  // Pick a living Hero at a given location ("building" or "outdoor"). With
  // strict=true, ONLY heroes at that location are eligible (returns null if
  // none); otherwise it falls back to any living Hero at random.
  function pickHeroPref(pref, strict) {
    const idxs = aliveIndices();
    if (!idxs.length) return null;
    const want = idxs.filter(function (i) { return G.players[i].location === pref; });
    if (strict && !want.length) return null;
    let pool = want.length ? want : idxs;
    // For building targets, prefer Heroes whose exact building we know, so the
    // card can name it (e.g. "in the Hospital") instead of just "a building".
    if (pref === "building") {
      const known = pool.filter(function (i) { return G.players[i].building; });
      if (known.length) pool = known;
    }
    const i = pool[Math.floor(Math.random() * pool.length)];
    const p = G.players[i];
    return { idx: i, hero: p.hero, heroName: p.name, loc: p.location || "", building: p.building || "" };
  }
  // Would playing this card right now actually affect a Hero? The Bot HOLDS
  // cards that would do nothing (rather than wasting them) — e.g. Surprise
  // Attack with no Hero inside a building.
  function cardHasImpact(c) {
    const n = (c.name || "").toLowerCase();
    if (n.indexOf("surprise attack") > -1) {
      // Needs a living Hero who is inside a building.
      return aliveIndices().some(function (i) { return G.players[i].location === "building"; });
    }
    return true;
  }
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
    // Rescue Mission: a Taken Over marker / new Pit can never hit the safe house
    // or a Townsfolk's building — keep those out of the target pool.
    const blocked = rescueProtectedBuildings();
    const allow = function (a) { return blocked.indexOf(a) === -1; };
    if (cardNoBuilding(t)) {
      // Must avoid buildings — use spawning pits / areas that are not buildings.
      const blds = (G && G.buildings) || [];
      const areas = ((G && G.spawnAreas) || []).filter(function (a) { return blds.indexOf(a) === -1 && allow(a); });
      const fb = allAreas().filter(allow);
      return areas.length ? areas : (fb.length ? fb : allAreas());
    }
    if (cardNeedsBuilding(t)) {
      const blds = ((G && G.buildings) || []).filter(allow);
      return blds.length ? blds : ((G && G.buildings) || []);
    }
    const all = allAreas().filter(allow);
    return all.length ? all : allAreas();
  }

  // The Bot's automatic turn: draw to refill its hidden hand, then play the
  // cards a Zombie player plays on its own turn. Fight/reaction cards are kept
  // hidden for later. The player never sees the hand or makes the choice.
  // Resolve a single DRAW-phase card: remove it from the hand and build the
  // point-form play (target/hero/roll baked in). Returns the play object.
  function playDrawCard(c) {
    G.bot.playFromHand(c.uid);
    // If the card targets a board location, pick one and always say what
    // happens to it in the narration — naming the chosen area when one is
    // configured, or speaking of "the building/area" generically otherwise.
    const isShamble = /shamble/i.test(c.name);
    const needsHero = cardNeedsHero(c);
    const needsTarget = !needsHero && !isShamble && cardNeedsTarget(c.text);
    const target = needsTarget ? pickFrom(targetPoolFor(c)) : null;
    // Surprise Attack ONLY hits a Hero inside a building (strict — no target if
    // none). Shamble lurches after a Hero out in the open (falls back to any).
    const heroPref = isShamble ? "outdoor" : "building";
    const heroStrict = needsHero;
    const hp = (needsHero || isShamble) ? pickHeroPref(heroPref, heroStrict) : null;
    // Pre-roll the die for plain/Shamble cards that need one (no button later).
    const roll = ((isShamble || (!needsTarget && !needsHero)) && cardNeedsRoll(c.text)) ? (1 + Math.floor(Math.random() * 6)) : 0;
    // Cornered is a turn-long effect: every Zombie rolls 2 extra fight dice
    // until the next Zombie turn. Flag it so the fight boxes add the dice.
    if (/cornered/i.test(c.name)) G.cornered = true;
    // Narration: SAY THE CARD TITLE FIRST, then one short thematic sentence,
    // and NAME the Hero/building the card actually hits.
    let narr = titledNarration(c.name, needsTarget ? LNOE.cardBuildingNarration(c.name, target) : LNOE.cardNarration(c.name));
    if ((needsHero || isShamble) && hp && hp.hero) {
      narr += " It comes for " + hp.hero + (needsHero && hp.building ? " in the " + hp.building : "") + ".";
    }
    const pl = { name: c.name, simple: c.simple, text: c.text, remains: c.remains, timing: c.timing,
      narration: narr, target: target, roll: roll, heroPref: heroPref, heroStrict: heroStrict,
      hero: hp ? hp.hero : null, heroName: hp ? hp.heroName : "", heroLoc: hp ? hp.loc : "",
      heroBuilding: hp ? hp.building : "" };
    pl.steps = zombieCardSteps(pl);
    return pl;
  }

  function runBotTurn() {
    for (let i = 0; i < 2; i++) { const c = G.bot.draw(); if (c) G.zturn.drawn.push(c.name); }
    // Only resolve DRAW-phase cards now. Fight cards wait for the fight modal;
    // spawn cards (Relentless Advance, There's Too Many) play in step 5.
    const played = [];
    const done = {};   // uids already resolved (guards Oh the Horror cascades / reshuffles)
    // Only play DRAW-phase cards that would actually affect a Hero — no-impact
    // cards (e.g. Surprise Attack with no Hero in a building) stay held.
    const queue = G.bot.hand.filter(function (c) { return cardPhase(c) === "draw" && cardHasImpact(c); });
    while (queue.length) {
      const c = queue.shift();
      if (done[c.uid]) continue;
      done[c.uid] = true;
      G.zturn.played.push(c.name);
      played.push(playDrawCard(c));
      // "Oh the Horror!": the Zombie draws 3 more cards. Any of those that are
      // also draw-phase (and have an effect) get played and shown this turn too.
      if (/horror/i.test(c.name)) {
        for (let i = 0; i < 3; i++) { const nc = G.bot.draw(); if (nc) G.zturn.drawn.push(nc.name); }
        G.bot.hand.forEach(function (hc) {
          if (!done[hc.uid] && cardPhase(hc) === "draw" && cardHasImpact(hc)) queue.push(hc);
        });
      }
    }
    G.bot.capHand(4);   // the Zombie keeps at most 4 cards in hand
    return { played: played };
  }

  // Start-of-turn play on a HERO's turn: the Zombie draws one card and may play
  // any DRAW-phase ("start of any turn") cards it then holds — the same cards it
  // plays during its own Draw step. Returns the cards played.
  function runHeroStartBot() {
    G.bot.draw();   // the Zombie's ongoing card flow
    const played = [];
    const done = {};
    const queue = G.bot.hand.filter(function (c) { return cardPhase(c) === "draw" && cardHasImpact(c); });
    while (queue.length) {
      const c = queue.shift();
      if (done[c.uid]) continue;
      done[c.uid] = true;
      played.push(playDrawCard(c));
      if (/horror/i.test(c.name)) {
        for (let i = 0; i < 3; i++) { G.bot.draw(); }
        G.bot.hand.forEach(function (hc) {
          if (!done[hc.uid] && cardPhase(hc) === "draw" && cardHasImpact(hc)) queue.push(hc);
        });
      }
    }
    G.bot.capHand(4);
    return played;
  }

  function speakHeroCard(idx) {
    const cards = (G.heroBot && G.heroBot.cards) || [];
    const p = cards[idx];
    if (!p || !voiceOn) return;
    setTimeout(function () { LNOE.TTS.speak(stripQuotes(p.narration)); }, 350);
  }

  // Show the Zombie's start-of-turn play on a Hero turn, ONE card at a time:
  // the player ticks each card as played before the next is revealed and read.
  function renderHeroReveal() {
    const out = document.getElementById("h-bot-out");
    if (!out) return;
    const hb = G.heroBot || {};
    if (!hb.ran) { out.innerHTML = ""; return; }
    const cards = hb.cards || [];
    if (!cards.length) {
      out.innerHTML = '<p class="hint">The Zombie draws in the dark… nothing to play at the start of this turn.</p>';
      return;
    }
    const ticked = hb.ticked || 0;
    const total = cards.length;
    const lastIdx = Math.min(ticked, total - 1);   // newest card revealed so far
    let html = total > 1
      ? '<p class="hint">Card <strong>' + Math.min(ticked + 1, total) + '</strong> of <strong>' + total +
        '</strong> — play each one on the board, then tick it to reveal the next.</p>'
      : "";
    for (let idx = 0; idx <= lastIdx; idx++) {
      const p = cards[idx];
      const isCurrent = (idx === ticked);
      const isDone = idx < ticked;
      html += '<div class="card-draw' + (isDone ? " reveal-done" : "") + '">';
      html += '<div class="ctype">' + (p.remains ? "Zombie Event · Stays in play" : "Zombie Event") + (isDone ? " · ✓ played" : "") + "</div>";
      html += '<div class="ctitle">' + esc(p.name) + "</div>";
      if (p.remains) html += '<span class="pill tag-remains">Stays in play</span>';
      html += '<div class="rnarr" id="hb-narr-' + idx + '">“' + esc(p.narration) + '”</div>';
      html += '<div class="csimple"><strong>What to do:</strong><ul class="zc-steps" id="hb-steps-' + idx + '">' +
        p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
      if (isCurrent) {
        if (p.hero) {
          html += '<div class="mt"><a href="#" class="hb-reroll hint" data-i="' + idx + '" data-kind="hero">🧍 Pick a different Hero</a></div>';
        } else if (cardNeedsTarget(p.text)) {
          html += '<div class="mt"><a href="#" class="hb-reroll hint" data-i="' + idx + '">🎲 ' +
            (cardNoBuilding(p.text) ? "Pick a different area" : "Pick a different building") + "</a></div>";
        }
        if (cardCanLose(p.text)) {
          html += '<div class="mt"><span class="hint">If this empties the Hero deck, the Heroes lose the game.</span><br>' +
            '<button class="btn btn-primary hb-lose mt">☠ Hero deck is empty — Heroes lose</button></div>';
        }
        // A tick only when another card waits behind this one.
        if (ticked + 1 < total) {
          html += '<div class="mt"><button class="btn btn-green hb-tick">✓ I’ve played this — reveal the next card ▶</button></div>';
        }
      }
      html += "</div>";
    }
    out.innerHTML = html;

    out.querySelectorAll(".hb-reroll").forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault();
        const p = cards[+b.dataset.i];
        if (b.dataset.kind === "hero") {
          const hp = pickHeroPref(p.heroPref || "building", p.heroStrict);
          p.hero = hp ? hp.hero : null; p.heroName = hp ? hp.heroName : ""; p.heroLoc = hp ? hp.loc : "";
          p.heroBuilding = hp ? hp.building : "";
        } else {
          const newT = pickFrom(targetPoolFor({ text: p.text }));
          p.target = newT;
          p.narration = titledNarration(p.name, LNOE.cardBuildingNarration(p.name, newT));
        }
        p.steps = zombieCardSteps(p);
        renderHeroReveal();
        autoSave();
        LNOE.FX.groan();
      };
    });
    out.querySelectorAll(".hb-lose").forEach(function (b) {
      b.onclick = function () { showEnding("Zombies"); };
    });
    out.querySelectorAll(".hb-tick").forEach(function (b) {
      b.onclick = function () {
        G.heroBot.ticked = (G.heroBot.ticked || 0) + 1;
        const next = G.heroBot.ticked;
        renderHeroReveal();
        autoSave();
        if (next < total) { LNOE.FX.groan(); speakHeroCard(next); }  // read the newly revealed card
      };
    });
  }

  // Play the SPAWN-phase cards the Zombie is holding (There's Too Many,
  // Relentless Advance). Pre-roll their dice and bake in the result. Called
  // once, when the player spawns Zombies in step 5.
  function buildSpawnCards() {
    const out = [];
    G.bot.hand.filter(function (c) { return cardPhase(c) === "spawn"; }).forEach(function (c) {
      G.bot.playFromHand(c.uid);
      G.zturn.played.push(c.name);
      const roll = cardNeedsRoll(c.text) ? (1 + Math.floor(Math.random() * 6)) : 0;
      const narr = titledNarration(c.name, LNOE.cardNarration(c.name));
      const pl = { name: c.name, simple: c.simple, text: c.text, remains: c.remains, narration: narr, roll: roll };
      pl.steps = zombieCardSteps(pl);
      out.push(pl);
    });
    return out;
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
    // Narrator-voice picker lives on the dedicated Voice tab now.
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
    // The narrator-voice chooser moved to its own Voice tab.
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
    h += objectiveCard();

    const _alive = aliveIndices();
    const _pos = _alive.indexOf(G.playerIndex) + 1;
    h += '<div class="turn-banner hero-turn">';
    h += '<div class="phase">🧍 HERO TURN · Hero ' + _pos + " of " + _alive.length + "</div>";
    h += '<div class="who">▶ Now playing: ' + esc(p.hero) + ' <span style="color:var(--muted);font-size:15px">— ' + esc(p.name) + "</span></div>";
    // Current hero's gear, so it stays visible while you scroll.
    h += '<div class="banner-gear">' + esc(bannerGearText(p)) + "</div>";
    h += "</div>";

    // Start-of-turn: the Zombie plays any start-of-turn card automatically.
    h += '<div class="card"><h3>☠ Start of turn — the Zombie may strike</h3>';
    h += '<p class="section-help">The Zombie automatically plays any start-of-turn card now (the same ones it plays during its Draw step). Apply each one to the board, then carry on with your actions.</p>';
    h += '<div id="h-bot-out" class="mt"></div>';
    h += '<hr class="divider">' + botHandSummary();
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
        // The Shoot step: pick a gun, roll to hit, mark the kill (gun sound).
        if (a.shoot) {
          const rw = carriedWeapons(p).filter(function (w) { return w.ranged; });
          h += '<div class="mt">';
          if (!rw.length) {
            h += '<span class="hint">' + esc(p.hero) + " has no ranged weapon (Gun/Flare). Pick one up first, or skip this step.</span>";
          } else {
            h += '<label class="hint">🔫 Shooting with: <select id="hs-weapon">';
            rw.forEach(function (w, idx) { h += '<option value="' + idx + '">' + esc(weaponLabel(w)) + "</option>"; });
            h += "</select></label>";
            h += '<p class="hint">Roll your dice on the table. Then mark the result:</p>';
            h += '<div class="row mt"><button class="btn btn-green" id="hs-kill">🎯 Zombie killed — fire! 🔫</button>';
            h += '<button class="btn" id="hs-miss">✗ Missed</button></div>';
            h += '<div id="hs-out" class="mt"></div>';
          }
          h += "</div>";
        }
        // The Fight step needs the Zombie to roll back. The Zombie ALWAYS rolls
        // 1 die (only a card changes it) — the player can't set the number.
        if (a.fight) {
          const hfDice = 1 + (G.cornered ? 2 : 0);
          h += '<div class="mt"><span class="hint">A fight means BOTH sides roll. Roll the Zombie’s dice, then compare the highest to the Hero’s highest die (the Hero loses ties unless a card says otherwise):</span>';
          if (G.cornered) h += '<p class="hint" style="color:#ffd9a3">⚔ <strong>Cornered</strong> is active — the Zombie rolls 2 extra dice this turn.</p>';
          h += '<div class="toolbar mt"><span class="hint">The Zombie rolls <strong>' + hfDice + '</strong> ' +
            'die' + (hfDice === 1 ? "" : "ce") + (G.cornered ? " (1 base + 2 from Cornered)" : " — just the 1 unless a card adds more") + '.</span>';
          h += '<button class="btn btn-rust" id="hf-roll">🎲 Zombie rolls</button></div>';
          h += '<div id="hf-dice-out" class="dice-area"></div>';
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
    h += '<hr class="divider">' + botHandSummary();
    h += "</div>";

    h += rosterCard();

    h += '<div class="card center">';
    const last = aliveIndices().filter(function (i) { return i > G.playerIndex; }).length === 0;
    h += '<button class="btn btn-primary btn-lg" id="g-endhero">' +
      (last ? "All Heroes done → Zombies awaken ☠" : "End " + esc(p.name) + "’s turn ▶") + "</button>";
    h += "</div>";

    panel().innerHTML = h;
    wireHeader();

    // Start-of-turn Zombie play happens AUTOMATICALLY (once per Hero turn): the
    // Zombie draws 1 and plays any start-of-turn cards. Reads the first card; if
    // more than one, the player ticks each before the next is revealed/read.
    if (!(G.heroBot && G.heroBot.ran)) {
      const played = runHeroStartBot();
      G.heroBot = { ran: true, cards: played, ticked: 0 };
      renderHeroReveal();
      refreshHandSummaries();
      autoSave();
      if (played.length) {
        LNOE.FX.stinger();
        setTimeout(function () { LNOE.FX.groan(); }, 250);
        speakHeroCard(0);   // read ONLY the first card
      }
    } else {
      renderHeroReveal();   // restore at the current ticked position on re-render
    }

    panel().querySelectorAll(".step.active [data-act]").forEach(function (btn) {
      btn.onclick = function () {
        const finishedStep = HERO_ACTIONS[G.heroStep] || {};
        const didMoveOrSearch = btn.dataset.act === "done" && /move or search/i.test(finishedStep.title || "");
        G.heroDone[G.heroStep] = btn.dataset.act === "done" ? "done" : "skip";
        G.heroStep++;
        renderHero();
        // The Zombie can Trip a Hero right after they Move or Search.
        if (didMoveOrSearch) botPlaysTrip(p.hero);
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
    // Shoot step wiring (no dice in the app — the player rolls physically).
    const hsKill = document.getElementById("hs-kill");
    if (hsKill) hsKill.onclick = function () {
      narrationMusic(6000);
      LNOE.FX.gunshot();
      const out = document.getElementById("hs-out");
      if (out) out.innerHTML = '<div class="csimple">💥 Hit! The Zombie drops — remove it from the board.</div>';
      if (voiceOn) setTimeout(function () { LNOE.TTS.speak("The shot rings out across the dark — the dead thing drops where it stood."); }, 400);
      recordKill();
    };
    const hsMiss = document.getElementById("hs-miss");
    if (hsMiss) hsMiss.onclick = function () {
      const out = document.getElementById("hs-out");
      if (out) out.innerHTML = '<span class="hint">Missed — no kill this time.</span>';
    };

    const hfRoll = document.getElementById("hf-roll");
    if (hfRoll) hfRoll.onclick = function () {
      const n = 1 + (G.cornered ? 2 : 0);   // locked: 1, or 3 while Cornered is active
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
    wireObjectiveCard();
    document.getElementById("g-endhero").onclick = function () { askHeroLocation(p, endHeroTurn); };
    autoSave();
  }

  // On ending a Hero's turn, confirm where they finished — ONE dropdown:
  // Outdoors (default) or a building. Captures the building name in one pick.
  function askHeroLocation(p, onDone) {
    let m = document.getElementById("loc-modal");
    if (!m) { m = document.createElement("div"); m.id = "loc-modal"; m.className = "modal-overlay"; document.body.appendChild(m); }
    const blds = G.buildings || [];
    const cur = p.location === "building" ? (p.building || "") : "__out";
    let h = '<div class="modal-card"><h3>📍 ' + esc(p.hero) + '’s position</h3>';
    h += '<p>Where did <strong>' + esc(p.hero) + '</strong> finish the turn?</p>';
    h += '<label class="field">Location<select id="loc-where">';
    h += '<option value="__out"' + (cur === "__out" ? " selected" : "") + ">🌲 Outdoors</option>";
    if (blds.length) {
      h += '<optgroup label="🏚 In a building">';
      blds.forEach(function (b) { h += '<option value="' + esc(b) + '"' + (cur === b ? " selected" : "") + ">" + esc(b) + "</option>"; });
      h += "</optgroup>";
    }
    h += "</select></label>";
    // Same screen: who else is in this Hero's space.
    const others = aliveIndices().map(function (i) { return G.players[i]; }).filter(function (q) { return q !== p; });
    if (others.length) {
      h += '<p style="margin:14px 0 6px">Any other Hero in the <strong>same space</strong>? <span class="hint">(tick all that apply — leave blank if alone)</span></p>';
      h += '<div class="checks">';
      others.forEach(function (q) {
        const on = (p.sameSpace || []).indexOf(q.hero) > -1;
        h += '<label class="chk' + (on ? " chk-on" : "") + '"><input type="checkbox" class="loc-mate" value="' + esc(q.hero) + '"' + (on ? " checked" : "") +
          "> " + esc(q.hero) + "</label>";
      });
      h += "</div>";
    }
    // Rescue Mission: confirm where each Townsfolk is now.
    if (G.rescue) {
      const aliveHeroes = aliveIndices().map(function (i) { return G.players[i]; });
      h += '<p style="margin:16px 0 6px"><strong>🆘 Where are the Townsfolk now?</strong></p>';
      (G.rescue.townsfolk || []).forEach(function (t, ti) {
        const curVal = t.status === "safehouse" ? "safehouse" : t.status === "dead" ? "dead" : t.status === "alone" ? "alone" : t.status === "hero" ? ("hero:" + t.withHero) : "building";
        h += '<label class="field" style="margin:0 0 8px">' + esc(t.name) + "<select class='loc-tf' data-i='" + ti + "'>";
        h += '<option value="building"' + (curVal === "building" ? " selected" : "") + ">🏚 In the " + esc(t.building) + "</option>";
        if (aliveHeroes.length) {
          h += '<optgroup label="🧍 With a Hero">';
          aliveHeroes.forEach(function (q) { h += '<option value="hero:' + esc(q.hero) + '"' + (curVal === "hero:" + q.hero ? " selected" : "") + ">" + esc(q.hero) + "</option>"; });
          h += "</optgroup>";
        }
        h += '<option value="alone"' + (curVal === "alone" ? " selected" : "") + ">🚶 Alone &amp; Not Safe</option>";
        h += '<option value="safehouse"' + (curVal === "safehouse" ? " selected" : "") + ">🏠 Safe house</option>";
        h += '<option value="dead"' + (curVal === "dead" ? " selected" : "") + ">☠ Killed</option>";
        h += "</select></label>";
      });
    }
    h += '<div class="row mt"><button class="btn btn-green" id="loc-confirm">✓ Confirm &amp; end turn</button>' +
      '<button class="btn btn-ghost" id="loc-cancel">Cancel</button></div></div>';
    m.innerHTML = h; m.classList.add("open");
    document.getElementById("loc-cancel").onclick = function () { m.classList.remove("open"); };
    m.querySelectorAll(".loc-mate").forEach(function (cb) {
      cb.onchange = function () { cb.closest(".chk").classList.toggle("chk-on", cb.checked); };
    });
    document.getElementById("loc-confirm").onclick = function () {
      const v = document.getElementById("loc-where").value;
      if (v === "__out") { p.location = "outdoor"; p.building = ""; }
      else { p.location = "building"; p.building = v; }
      p.sameSpace = Array.prototype.map.call(m.querySelectorAll(".loc-mate:checked"), function (c) { return c.value; });
      // Apply Townsfolk updates (Rescue Mission).
      if (G.rescue) {
        m.querySelectorAll(".loc-tf").forEach(function (sel) {
          const t = G.rescue.townsfolk[+sel.dataset.i]; if (!t) return;
          const val = sel.value;
          if (val === "safehouse") { t.status = "safehouse"; t.withHero = ""; }
          else if (val === "dead") { t.status = "dead"; t.withHero = ""; }
          else if (val === "alone") { t.status = "alone"; t.withHero = ""; }
          else if (val.indexOf("hero:") === 0) { t.status = "hero"; t.withHero = val.slice(5); }
          else { t.status = "building"; t.withHero = ""; }
        });
      }
      m.classList.remove("open"); autoSave();
      if (G.rescue && checkRescueEnd()) return;   // game ended — don't continue the turn
      onDone();
    };
  }

  function botHandSummary() {
    return '<div class="hand-summary mt">' + handSummaryInner() + "</div>";
  }
  function handSummaryInner() {
    // Count only — the Zombie's hand is hidden from the players. The deck
    // reshuffles its discards, so the Zombie never runs out of cards.
    const max = G.bot.HAND_MAX || 4;
    return '<span class="hint">🃏 The Zombie is secretly holding <strong>' + G.bot.hand.length +
      " of " + max + "</strong> cards (you never see what they are). Its deck reshuffles — it never runs out.</span>";
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
    h += '<div class="turn-banner zombie-turn">';
    h += '<div class="phase">☠ ZOMBIE TURN · the Zombie plays</div>';
    h += '<div class="who">☠ Zombie Turn #' + G.turnNumber + "</div>";
    h += "</div>";

    h += objectiveCard();
    h += '<div class="narration voice-on">' + esc(G.zturn.narration) + ' <button class="btn btn-ghost" id="z-speak" style="float:right">🔊 Read aloud</button></div>';

    // 1 · The sun marker — it advances at the START of the Zombie turn.
    h += '<div class="card"><h3>1 · Move the sun marker</h3>';
    h += '<p class="section-help">The night creeps toward dawn. The sun marker has moved forward one space — it is now hour ' + G.sun + ' of ' + G.sunMax + '.</p>';
    if (G.zturn.sunNarr) h += '<div class="narration voice-on">' + esc(G.zturn.sunNarr) + "</div>";
    if (G.sun >= G.sunMax) h += '<p class="hint" style="color:#ffb3b3">⚠ The sun has reached the final hour — the night ends as soon as the next Zombie turn begins.</p>';
    h += "</div>";

    // 2 · The Zombie plays its own cards — automatically and in secret.
    h += '<div class="card"><h3>2 · Draw Zombie cards</h3>';
    h += '<p class="section-help">The Zombie draws and plays its cards automatically. Apply each one to the board — if it plays more than one, tick each before the next is revealed.</p>';
    h += '<div id="z-run-out" class="mt"></div>';
    h += '<hr class="divider">' + botHandSummary();
    h += '<div id="z-played" class="mt"></div>';
    h += "</div>";

    // 3 · Movement
    h += '<div class="card"><h3>3 · Move the Zombies</h3>';
    h += '<p class="section-help">Move every Zombie 1 space (or as a card says), following the priority below. Note anything important — it’s saved to the turn log.</p>';
    const _lcfg = LNOE.scenarioLocationCfg ? LNOE.scenarioLocationCfg(G.scenario.name) : null;
    if (_lcfg) {
      G.scenarioLoc = G.scenarioLoc || { primary: "", safe: "" };
      h += '<div class="loc-box"><div class="mg-head">📍 Rescue tracking — the guide below uses these:</div>';
      h += '<label class="field" style="margin:0 0 8px">' + esc(_lcfg.primaryLabel) +
        '<input type="text" id="loc-primary" value="' + esc(G.scenarioLoc.primary || "") + '" placeholder="' + esc(_lcfg.primaryHint) + '"></label>';
      h += '<label class="field" style="margin:0">' + esc(_lcfg.safeLabel) +
        '<input type="text" id="loc-safe" value="' + esc(G.scenarioLoc.safe || "") + '" placeholder="' + esc(_lcfg.safeHint) + '"></label></div>';
    }
    h += zombieMovementGuide();
    h += "</div>";

    // 4 · Fight + dice. The Zombie ALWAYS rolls 1 die — only a card changes it
    // (Cornered +2 for the whole turn; Uuuurrrggghh! +2 in a single fight). The
    // player can't set the number by hand.
    const baseDice = 1 + (G.cornered ? 2 : 0);
    h += '<div class="card"><h3>4 · Fight the Heroes</h3>';
    h += '<p class="section-help">When a Zombie fights a Hero, roll the Zombie’s dice here, then state who won. The Zombie rolls just 1 die unless a card adds more — the game sets the number for you.</p>';
    if (G.cornered) h += '<p class="hint" style="color:#ffd9a3">⚔ <strong>Cornered</strong> is active this turn — the Zombie rolls <strong>2 extra Fight Dice</strong> (Heroes win ties). Already counted below.</p>';
    h += '<div class="toolbar">';
    h += '<span class="hint">The Zombie rolls <strong id="z-ndice-lbl">' + baseDice + '</strong> ' +
      'die' + (baseDice === 1 ? "" : "ce") + (G.cornered ? " (1 base + 2 from Cornered)" : " (just the 1, no card boosting it)") + ".</span>";
    h += '<button class="btn btn-rust" id="z-roll">🎲 Roll the Zombie’s dice</button>';
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
    h += '<p class="section-help">Now spawn the Zombies. One die sets how many rise, and the game tells you exactly which pit to add each one to. The Zombie may also play an end-of-turn card here (extra Zombies or a relentless advance).</p>';
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

  // Read ONE revealed card aloud (the narrator no longer reads them all at once).
  function speakReveal(idx) {
    const cards = (G.zturn && G.zturn.revealCards) || [];
    const p = cards[idx];
    if (!p) return;
    hordeSfx(stripQuotes(p.narration));
    if (voiceOn) setTimeout(function () { LNOE.TTS.speak(stripQuotes(p.narration)); }, 300);
  }

  // The Zombie's played cards, revealed ONE AT A TIME. The player ticks each
  // card as placed on the board; only then is the next card shown and read.
  function renderZombieReveal() {
    const out = document.getElementById("z-run-out");
    if (!out) return;
    if (G.zturn.revealEmpty) {
      out.innerHTML = '<div class="narration voice-on">The dead shuffle and moan in the dark, but the Zombie keeps its cards hidden this turn. Move the Zombies and fight as normal.</div>';
      return;
    }
    const cards = G.zturn.revealCards || [];
    if (!cards.length) { out.innerHTML = ""; return; }
    const ticked = G.zturn.revealTicked || 0;
    const total = cards.length;
    const lastIdx = Math.min(ticked, total - 1);   // newest card shown so far
    let html = '<p class="hint">Card <strong>' + Math.min(ticked + 1, total) + '</strong> of <strong>' + total +
      '</strong> — play each one on the board, then tick it to reveal the next.</p>';
    for (let idx = 0; idx <= lastIdx; idx++) {
      const p = cards[idx];
      const isCurrent = (idx === ticked);   // shown, not yet ticked
      const isDone = idx < ticked;
      html += '<div class="card-draw' + (isDone ? " reveal-done" : "") + '">';
      html += '<div class="ctype">' + (p.remains ? "Zombie Event · Stays in play" : "Zombie Event") +
        (isDone ? " · ✓ played" : "") + "</div>";
      html += '<div class="ctitle">' + esc(p.name) + "</div>";
      if (p.remains) html += '<span class="pill tag-remains">Stays in play</span>';
      html += '<div class="rnarr" id="zc-narr-' + idx + '">“' + esc(p.narration) + '”</div>';
      html += '<div class="csimple"><strong>What to do:</strong><ul class="zc-steps" id="zc-steps-' + idx + '">' +
        p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
      if (isCurrent) {
        if (p.hero) {
          html += '<div class="mt"><a href="#" class="zc-reroll hint" data-i="' + idx + '" data-kind="hero">🧍 Pick a different Hero</a></div>';
        } else if (cardNeedsTarget(p.text)) {
          html += '<div class="mt"><a href="#" class="zc-reroll hint" data-i="' + idx + '">🎲 ' +
            (cardNoBuilding(p.text) ? "Pick a different area" : "Pick a different building") + "</a></div>";
        }
        if (cardCanLose(p.text)) {
          html += '<div class="mt"><span class="hint">If this empties the Hero deck, the Heroes lose the game.</span><br>' +
            '<button class="btn btn-primary zc-lose mt">☠ Hero deck is empty — Heroes lose</button></div>';
        }
        html += '<div class="mt"><button class="btn btn-green zc-tick">✓ I’ve played this on the board' +
          (ticked + 1 < total ? " — reveal the next card ▶" : "") + "</button></div>";
      }
      html += "</div>";
    }
    if (ticked >= total) {
      html += '<p class="hint" style="color:#9fe0a0">✓ All ' + total + ' card(s) played. Carry on with the Zombie turn below.</p>';
    }
    out.innerHTML = html;

    // Re-pick the Hero / building for the CURRENT card only, then rebuild it.
    out.querySelectorAll(".zc-reroll").forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault();
        const p = cards[+b.dataset.i];
        if (b.dataset.kind === "hero") {
          const hp = pickHeroPref(p.heroPref || "building", p.heroStrict);
          p.hero = hp ? hp.hero : null; p.heroName = hp ? hp.heroName : ""; p.heroLoc = hp ? hp.loc : "";
          p.heroBuilding = hp ? hp.building : "";
        } else {
          const newT = pickFrom(targetPoolFor({ text: p.text }));
          p.target = newT;
          p.narration = titledNarration(p.name, LNOE.cardBuildingNarration(p.name, newT));
        }
        p.steps = zombieCardSteps(p);
        renderZombieReveal();
        autoSave();
        LNOE.FX.groan();
      };
    });
    out.querySelectorAll(".zc-lose").forEach(function (b) {
      b.onclick = function () { showEnding("Zombies"); };  // Heroes lost — straight to the ending
    });
    out.querySelectorAll(".zc-tick").forEach(function (b) {
      b.onclick = function () {
        G.zturn.revealTicked = (G.zturn.revealTicked || 0) + 1;
        const next = G.zturn.revealTicked;
        renderZombieReveal();
        autoSave();
        if (next < total) { LNOE.FX.groan(); speakReveal(next); }  // read the newly revealed card
      };
    });
  }

  function wireZombie() {
    document.getElementById("z-speak").onclick = function () { LNOE.TTS.speak(stripQuotes(G.zturn.narration)); };

    // The Zombie draws and plays AUTOMATICALLY (once per Zombie turn). Reads the
    // first card; if more than one, the player ticks each before the next.
    const out = document.getElementById("z-run-out");
    if (!G.zturn.botRan) {
      if (G.bot.deckEmpty() && !G.bot.hand.length) {
        if (out) out.innerHTML = '<p class="empty-note">The Zombie deck for this set is empty. Add cards in the Admin tab, or pick the base game.</p>';
        G.zturn.botRan = true;
      } else {
        const result = runBotTurn();
        G.zturn.revealCards = result.played;
        G.zturn.revealTicked = 0;                 // how many the player has ticked as played
        G.zturn.revealEmpty = !result.played.length;
        G.zturn.botRan = true;
        narrationMusic(14000); // horror background music for the reveal
        LNOE.FX.stinger();
        setTimeout(function () { LNOE.FX.groan(); }, 300);
        renderZombieReveal();
        refreshHandSummaries();   // hand count drops the instant cards are played
        renderPlayed();
        if (result.played.length) speakReveal(0);  // read ONLY the first card
      }
    } else {
      // Restore the reveal where the player left off after a re-render.
      renderZombieReveal();
    }

    document.getElementById("z-roll").onclick = function () {
      const n = 1 + (G.cornered ? 2 : 0);   // locked: 1, or 3 while Cornered is active
      const r = G.bot.roll(n);
      G.zturn.dice.push({ n: n, rolls: r.rolls, highest: r.highest });
      let html = "";
      r.rolls.forEach(function (v) {
        html += '<div class="die' + (v === r.highest ? " skull" : "") + '">' + v + "</div>";
      });
      html += '<span class="hint" style="margin-left:6px">Highest: <strong>' + r.highest + "</strong> — compare to the Hero’s highest die.</span>";
      document.getElementById("z-dice-out").innerHTML = html;
    };
    // Objective card (kill counter / Townsfolk tracker) wiring.
    wireObjectiveCard();
    // Escort-scenario location inputs: update state and refresh the guide live.
    function refreshMoveGuide() {
      const g = document.querySelector(".move-guide");
      if (g) g.outerHTML = zombieMovementGuide();
    }
    const locP = document.getElementById("loc-primary");
    if (locP) locP.oninput = function () { G.scenarioLoc = G.scenarioLoc || {}; G.scenarioLoc.primary = this.value; refreshMoveGuide(); autoSave(); };
    const locS = document.getElementById("loc-safe");
    if (locS) locS.oninput = function () { G.scenarioLoc = G.scenarioLoc || {}; G.scenarioLoc.safe = this.value; refreshMoveGuide(); autoSave(); };

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
    // End-of-turn cards the Zombie played during this spawn step.
    (G.zturn.spawnCards || []).forEach(function (p) {
      h += '<div class="card-draw mt"><div class="ctype">Zombie Event' + (p.remains ? " · Stays in play" : "") + "</div>";
      h += '<div class="ctitle">' + esc(p.name) + "</div>";
      h += '<div class="rnarr">“' + esc(p.narration) + '”</div>';
      h += '<div class="csimple"><strong>What to do:</strong><ul class="zc-steps">' +
        p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div></div>";
    });
    return h;
  }
  // Mid-game, a new pit can only be tagged on a building that is on the board
  // and not already a pit — same rule as Setup.
  function spawnAddControl() {
    const protectedB = rescueProtectedBuildings();
    const avail = ((G.buildings) || []).filter(function (b) {
      return (G.spawnAreas || []).indexOf(b) === -1 && protectedB.indexOf(b) === -1;
    });
    const note = protectedB.length ? '<p class="hint">🚫 A Pit can’t go in the safe house or a Townsfolk’s building.</p>' : "";
    if (!avail.length) {
      return note + '<p class="hint">Every building on your board is already a pit (or none were selected — add buildings in Setup).</p>';
    }
    let s = note + '<div class="row" style="align-items:center"><select id="z-newpit" style="flex:2"><option value="">— tag a building as a new pit —</option>';
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
      // The Zombie also plays any end-of-turn cards it was holding — but only
      // once (re-clicking Spawn re-rolls the dice, it doesn't replay cards).
      if (!G.zturn.spawnCardsDone) {
        G.zturn.spawnCards = buildSpawnCards();
        G.zturn.spawnCardsDone = true;
      }
      document.getElementById("z-spawn-out").innerHTML = spawnResultText();
      // Zombie groan AFTER the spawn step, as requested.
      if (LNOE.FX) LNOE.FX.groan();
      const spawnSpeech = stripQuotes(G.zturn.spawnNarr) +
        (G.zturn.spawnCards || []).map(function (p) { return "  " + stripQuotes(p.narration); }).join("");
      if (voiceOn) setTimeout(function () { LNOE.TTS.speak(spawnSpeech); }, 250);
      renderPlayed();
      refreshHandSummaries();
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
      // Resilient: a Hero killed a Zombie with a ranged weapon → make them ditch it.
      if (ctx.heroWinning && (ctx.gun || (ctx.weapon && ctx.weapon.ranged))) { const r = find("resilient"); if (r) return r; }
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
      refreshHandSummaries();   // the card leaves the hand the instant it's played
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

  // Suggest how many dice the Zombie rolls: 1 base, +2 if Cornered is active
  // this turn, +2 per Uuuurrrggghh! the Bot played this fight.
  function suggestZombieDice(r) {
    let n = 1 + (G.cornered ? 2 : 0);
    r.steps.forEach(function (s) {
      if (s.card && s.card.toLowerCase().indexOf("uuuurrrggghh") > -1) n += 2;
    });
    return Math.min(n, 8);
  }
  // +1 to the Zombie's highest die for each Braaains! played this fight.
  function fightResultBonus(r) {
    let b = 0;
    r.steps.forEach(function (s) { if (s.card && s.card.toLowerCase().indexOf("braaains") > -1) b += 1; });
    return b;
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

    // 2) For a fight: roll the Zombie's dice (the count is fixed by cards — the
    // player never sets it). 1 base, +2 if Cornered, +2 per Uuuurrrggghh!.
    if (isFight) {
      const suggest = suggestZombieDice(r);
      const extra = suggest - 1;
      h += '<div class="rv-panel"><div class="rv-panel-h">🎲 Fight it out — roll the Zombie’s dice</div>';
      h += '<p class="hint" style="margin:0 0 8px">' +
        (extra > 0
          ? "A card boosts this fight — the Zombie rolls <strong>" + suggest + "</strong> dice (1 base + " + extra + " from cards)."
          : "The Zombie rolls <strong>1</strong> die — no card is boosting this fight.") +
        " Roll, then compare the highest to the Hero’s die before you settle it.</p>";
      h += '<div class="toolbar"><span class="hint">Zombie dice: <strong>' + suggest + '</strong></span>' +
        '<button class="btn btn-rust" id="rv-roll">🎲 Roll</button></div>';
      h += '<div id="rv-dice-out" class="dice-area"></div></div>';
    }

    // 3) Hero counter.
    h += '<div class="rv-panel"><div class="rv-panel-h">🧍 Hero’s counter</div>';
    h += '<p class="hint" style="margin:0 0 6px">Play a Hero Event card in response (it auto-completes), or leave blank.</p>';
    h += '<input id="rv-counter" list="rv-events" placeholder="Start typing… e.g. Faith, Get Back You Devils, Just a Scratch">';
    h += '<datalist id="rv-events">' + heroEventOptions() + "</datalist>";
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
      const n = suggestZombieDice(r);   // locked by cards — never a manual pick
      const res = G.bot.roll(n);
      const bonus = fightResultBonus(r);          // +1 per Braaains! played
      const finalHi = res.highest + bonus;
      let out = "";
      res.rolls.forEach(function (v) { out += '<div class="die' + (v === res.highest ? " skull" : "") + '">' + v + "</div>"; });
      out += '<span class="hint" style="margin-left:6px">Zombie’s highest: <strong>' + res.highest + "</strong>";
      if (bonus) out += ' <strong>+' + bonus + '</strong> (Braaains!) = <strong>' + finalHi + "</strong>";
      out += " — compare to the Hero’s die.</span>";
      document.getElementById("rv-dice-out").innerHTML = out;
      r.steps.push({ who: "bot", label: "Zombie rolls " + n + " dice — highest " + res.highest +
        (bonus ? " +" + bonus + " (Braaains!) = " + finalHi : "") + "." });
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
    let killScored = false;
    if (r.context.type === "fight") {
      const heroWon = outcome.indexOf("Heroes") === 0;
      narrationMusic(8000);
      const line = LNOE.narrate(heroWon ? "heroWins" : "zombieWins");
      if (heroWon) {
        // Ranged weapon → gunshot; hand weapon (or bare hands) → a meaty whack.
        const w = r.context.weapon;
        if (w && w.ranged) LNOE.FX.gunshot(); else LNOE.FX.whack();
        if (voiceOn && line) setTimeout(function () { LNOE.TTS.speak(stripQuotes(line)); }, 450);
        // Auto-count the kill toward a kill-objective scenario.
        if (G.scenario.objTracker && G.scenario.objTracker.autoKill) { G.objectiveCount = (G.objectiveCount || 0) + 1; killScored = true; }
      } else {
        // Zombie wins: play the (quieter) zombie sound, then narrate once it ends.
        LNOE.FX.feed(function () { if (voiceOn && line) LNOE.TTS.speak(stripQuotes(line)); });
      }
    }
    LNOE.Store.saveTurn(entry).then(function () { closeResolveModal(true); if (killScored) checkObjectiveEnd(); })
      .catch(function () { closeResolveModal(true); if (killScored) checkObjectiveEnd(); });
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
        const text = LNOE.endingNarration(winner, survivors, fallen, G.scenario.name);
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
      scenarioLoc: G.scenarioLoc, objectiveCount: G.objectiveCount, ending: G.ending, rescue: G.rescue,
      cornered: G.cornered,
      sunMax: G.sunMax, sun: G.sun, round: G.round, turnNumber: G.turnNumber,
      playerIndex: G.playerIndex, phase: G.phase,
      zturn: G.zturn, heroStep: G.heroStep, heroDone: G.heroDone, heroBot: G.heroBot,
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
      scenarioLoc: state.scenarioLoc || { primary: "", safe: "" },
      objectiveCount: state.objectiveCount || 0, ending: state.ending || false, rescue: state.rescue || null,
      cornered: state.cornered || false,
      sunMax: state.sunMax, sun: state.sun, round: state.round, turnNumber: state.turnNumber,
      playerIndex: state.playerIndex, phase: state.phase,
      zturn: state.zturn || {}, heroStep: state.heroStep || 0, heroDone: state.heroDone || [],
      heroBot: state.heroBot || { ran: false, cards: [] }
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

  // Friendly "saved …" time label for the Save / Load tab.
  function fmtSavedWhen(iso) {
    if (!iso) return "just now";
    try {
      const d = new Date(iso), today = new Date();
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return d.toDateString() === today.toDateString() ? "today " + time
        : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
    } catch (e) { return "earlier"; }
  }
  function savesListHtml(saves) {
    if (!saves.length) return '<p class="empty-note">No saved games yet. Start a game — it saves automatically as you play.</p>';
    return saves.map(function (s) {
      const where = "Round " + (s.round || 1) + " · " + (s.phase === "zombie" ? "Zombie turn" : "Hero turn");
      return '<div class="player-status"><span class="ps-name">🎮 ' + esc(s.label || "Saved game") +
        ' <span class="hint">— ' + esc(where) + ", saved " + esc(fmtSavedWhen(s.savedAt)) + "</span></span>" +
        '<button class="btn btn-green" data-resume="' + esc(s.id) + '">▶ Load</button>' +
        '<button class="btn btn-ghost" data-del="' + esc(s.id) + '">🗑 Delete</button></div>';
    }).join("");
  }
  // The "Save / Load" tab: current game status (with a manual Save), plus the
  // list of saved games to Load or Delete.
  function renderSavesTab() {
    const el = document.getElementById("tab-saves");
    if (!el) return;
    const saves = (LNOE.Store.listGames && LNOE.Store.listGames()) || [];
    let h = '<div class="card"><h2>💾 Save / Load games</h2>';
    h += '<p class="section-help">Your game saves automatically as you play, so you can close the app and pick up later. Load a game to jump back in, or delete one you don’t need.</p>';
    if (G) {
      h += '<div class="player-status" style="border-color:var(--blood-bright)">';
      h += '<span class="ps-name">🎮 In progress: ' + esc(G.scenario.name) +
        ' <span class="hint">— Round ' + G.round + " · " + (G.phase === "zombie" ? "Zombie turn" : "Hero turn") + "</span></span>";
      h += '<button class="btn btn-green" id="sv-save-now">💾 Save now</button></div>';
    }
    h += '<div id="sv-list" class="mt">' + savesListHtml(saves) + "</div>";
    h += "</div>";
    el.innerHTML = h;

    const saveNow = document.getElementById("sv-save-now");
    if (saveNow) saveNow.onclick = function () {
      autoSave();
      const me = this; me.textContent = "✓ Saved"; me.disabled = true;
      renderSavesTab();
    };
    el.querySelectorAll("[data-resume]").forEach(function (b) {
      b.onclick = function () {
        if (G && !confirm("Load this saved game? Your current game is already saved, so you can come back to it.")) return;
        const s = LNOE.Store.getGame(b.dataset.resume);
        if (s) resumeGame(s.state);   // resumeGame switches to the Start tab and renders the game
      };
    });
    el.querySelectorAll("[data-del]").forEach(function (b) {
      b.onclick = function () {
        if (!confirm("Delete this saved game? This can’t be undone.")) return;
        LNOE.Store.deleteGame(b.dataset.del);
        renderSavesTab();
      };
    });
  }

  LNOE.Game = {
    init: function () {},
    start: start,
    isRunning: function () { return !!G; },
    resume: function (id) { const s = LNOE.Store.getGame(id); if (s) resumeGame(s.state); },
    renderSaves: renderSavesTab
  };
})();

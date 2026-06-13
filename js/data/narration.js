/* =========================================================================
   Horror Narration bank.
   Simple English so kids understand, but cinematic enough to read aloud with
   the Scary Voice (text-to-speech). Pulled at key game moments.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});

  LNOE.narration = {
    // Said when the game begins.
    gameStart: [
      "The sun is going down. The last light slips behind the trees. Tonight, the dead do not sleep.",
      "Somewhere in the dark, a door creaks open. The town is quiet… too quiet. Stay together. Stay alive.",
      "It started with one. Then ten. Now the whole town walks. This is your last night on Earth — make it count."
    ],
    // Said each time the Sun Track moves (night creeps closer to dawn).
    sunMove: [
      "The hands of the clock crawl forward. The night is long, and the dead are patient.",
      "Another hour bleeds away. Can you hear them? They are getting closer.",
      "The shadows grow longer. Whatever you are going to do… do it now.",
      "Time is running out. The darkness is hungry tonight."
    ],
    // Said at the start of the Zombie (Bot) turn.
    zombieTurn: [
      "Now they come. Shuffling. Moaning. Reaching out with cold grey hands.",
      "The dead lift their heads. They smell the living. And they are so very hungry.",
      "From the cornfield, from the cellar, from under the floorboards — they rise."
    ],
    // Said when a Zombie wins a fight.
    zombieWins: [
      "A scream. Then silence. One less heartbeat in the dark.",
      "The teeth find flesh. There is no getting up from this one.",
      "The Hero falls. The dead do not stop to mourn — they only feed."
    ],
    // Said when a Hero wins a fight.
    heroWins: [
      "A wet crunch — and the thing drops to the floor. One down. So many left.",
      "The Hero stands, breathing hard. For now, they live.",
      "The monster crumples. But the night is far from over."
    ],
    // Said when a powerful Zombie card is played.
    bigCard: [
      "Something has changed. The air turns cold. The dead are not playing fair tonight.",
      "A terrible thing is happening. Even the brave will tremble at this."
    ]
  };

  // Scenario-specific opening stories — a horror-movie intro read aloud when
  // the game begins. Simple English, but cinematic. Keyed by scenario name.
  LNOE.scenarioIntros = {
    "Die, Zombies, Die!": "The radio went dead hours ago. Outside, the shuffling shapes keep coming — more every minute. You grip your weapon and make your choice: you will not hide and wait to die. Tonight, you hunt them. Drop fifteen of the dead before sunrise… or the sun will come up on a town with no one left to see it.",
    "Save the Townsfolk": "They were your neighbours this morning. Now they huddle in the dark, too afraid to run, as the dead close in around them. You can hear them crying out. You can't save everyone — but you have to try. Get them to safety before the night swallows them whole.",
    "Burn 'Em Out!": "The dead are crawling up out of the ground itself, and they will not stop until the holes are sealed. There is gasoline in the shed and a torch on the wall. You know what has to be done. Burn the buildings. Burn the pits. Burn it all, before they bury this town for good.",
    "Escape in the Truck": "The old truck in the yard is your only way out. It needs keys. It needs gas. And it needs you alive long enough to find both. Every door you open could hide the dead. Get the engine running and drive into the night — because staying here means staying forever.",
    "Defend the Manor House": "The big house on the hill has thick walls and heavy doors. It may be the only place that holds. Board the windows. Watch the doors. The dead will come in waves through the long night, and all you have to do is live until dawn. That's all. Just don't die.",
    "Blow up the Town!": "Snow falls on a town that is already dead. There is no saving Timber Peak now — only ending it. Gather the explosives, set the charges, and bring the whole frozen nightmare down. Light the fuse before the cold and the dead take you first.",
    "Radio for Help": "Somewhere out there, someone is still listening. The old radio tower could reach them — if you can fix it and call before the night ends. Climb through the snow and the dark, send the signal, and pray that help comes faster than the dead.",
    "Learn to Survive": "No rescue is coming yet. No way out tonight. All that is left is to last — to scavenge, to fight, to keep breathing in a town that wants you dead. Do what you must. Survive the night, and worry about tomorrow if you live to see it.",
    "Mountain of the Dead": "They rise from the mountain in numbers you cannot count — a tide of cold grey hands pouring down through the pines. Hold your ground. Thin their ranks. The mountain has given up its dead, and it wants you to join them.",
    "Escape in the Plane": "Deep in the woods sits a small plane — your one ticket out of this green hell. It is missing parts. It is low on fuel. And the trees are full of the dead. Find what the plane needs, get it flying, and leave the forest and its hungry shadows far below.",
    "Lost in the Woods": "The trees all look the same in the dark, and every path leads deeper. Somewhere out there is the way out. Somewhere closer, the dead are moving between the trunks. Find your way clear before the forest closes around you for good.",
    "Salvage Mission": "There are supplies scattered through these woods — food, fuel, the things that mean another day alive. The dead are scattered out here too, waiting in the dark between the trees. Grab what you can and get out. Greed gets people killed out here.",
    "Zombie Apocalypse": "This is not an outbreak anymore. It is the end. The dead come not in ones and twos but in a flood — filling the streets, the yards, the doorways. There are too many to kill and nowhere left to run. All you can do now is hold on, and last as long as the living can.",
    "Plague Carriers": "Something is wrong with these dead. They carry the sickness inside them, and it spreads with every bite and every breath. Touch them, and you risk becoming them. Stop the carriers, or hold out against the plague, before it turns the last of you.",
    "Burn It To The Ground!": "There is no cleaning this town. There is only fire. Soak the buildings, strike the match, and let it all burn — the houses, the streets, the dead inside them. Send this place up in flames, and walk away from the ashes… if you can walk away at all.",
    "Alone in the Dark (2-player mini-game)": "One survivor. A town full of the dead. No friends to watch your back, no voices in the dark but the moaning. It is just you now — you and the long, black night. Make every move count. You are alone in the dark, and the dark is alive.",
    "Rescue Mission": "Someone is still alive out there — trapped, terrified, calling into a town gone silent. You are the only ones who heard. Cut through the barricades and the dead, reach them, and bring them home. Leave no one behind to the dark.",
    "Hunker Down": "No more running. You have found a place to make your stand — so nail the boards, block the doors, and dig in. The dead will throw themselves at the walls all night long. Hold the line. Hold each other. Just hold.",
    "Supply Run": "The shelves are bare and the night is long. What you need is out there — scattered through the streets and the sewers, guarded by the dead. Move fast, grab what keeps you alive, and get back before the town takes you for one of its own.",
    "Search for the Truth": "It did not just happen. Something started this — and the answer is hidden somewhere in this town, in files and whispers and locked rooms. Find the truth before the dead find you. Some secrets are worth dying for. This one might be worth surviving for."
  };

  // Short horror line (simple English) spoken when the Bot PLAYS a Zombie card.
  LNOE.cardNarrations = {
    "Shamble": "It drags one foot, then the other — and then all at once it lurches forward, far faster than the dead should ever move. There is no time left to think.",
    "Uuuurrrggghh!": "The creature throws back its head and lets out a long, wet, hungry roar that rattles the windows. This one will not go down easy.",
    "Undead Hate The Living": "Its dead eyes lock onto you and will not let go. There is nothing left inside it but hate — and it swings again, harder this time.",
    "“My God, They’ve Taken the…”": "A low moan rises from inside the building, then another, then dozens. The doors will not open now. Whatever is in there… it belongs to them.",
    "Resilient": "You fired — you saw it hit — and still the thing keeps dragging itself closer. The gun is useless now, and it slips from your shaking hands.",
    "Lights Out": "Every light dies at once, and the dark swallows the room whole. Somewhere in that blackness, you can hear them shuffling toward you.",
    "“Oh the Horror!”": "They pour out of the night faster than you can count — more, and more, and still more. The horde simply will not stop coming.",
    "Surprise Attack": "You thought this room was safe. Then cold, grey hands burst out of the shadows right beside you — they were here the whole time, waiting.",
    "Loss of Faith": "The words of your prayer catch and die in your throat. For one long, terrible moment, you stop believing that anyone is coming to save you.",
    "Relentless Advance": "They do not tire. They do not stop. Step by dragging step, the whole dead crowd presses in and closes off every way out.",
    "New Spawning Pit": "The earth splits open with a wet, tearing sound. More of them claw their way up out of the dark, fresh and hungry, with no end in sight.",
    "“There’s Too Many!”": "You turn to run and freeze where you stand. The street ahead is a wall of the dead — too many to fight, too many to count. So many.",
    "Trip!": "Your foot catches on something soft in the dark. The world tips, the ground rushes up — and the dead are on you before you can scramble up.",
    "Cornered": "You back away, step by step, until your spine hits the wall. There is nowhere left to run now — and they have stopped pretending to be slow.",
    "A Town Overrun": "Screams rise from every street at once, then fall silent one by one. The whole town is gone — swallowed by the dead in a single night.",
    "Heavy Rain": "Cold rain hammers down in blinding sheets and the mud sucks at every step. You can barely make out the shapes lurching closer through the storm.",
    "Braaains!": "It lunges with a strength no dead thing should have, jaws snapping shut inches from your skull. It can smell what is inside your head — and it wants it."
  };
  LNOE.cardNarration = function (cardName) {
    return LNOE.cardNarrations[cardName] || LNOE.narrate("bigCard");
  };

  // When a played card targets a building, say what happens to that building.
  LNOE.cardBuildingNarrations = {
    "Lights Out": "Every light in the {b} dies at once. Whoever steps inside now is blind in the dark.",
    "“My God, They’ve Taken the…”": "The dead have taken the {b}. It is full of them now — and no one living is getting inside.",
    "New Spawning Pit": "The ground tears open inside the {b}. A fresh pit, and the dead keep clawing up out of it.",
    "“I’ve Got to Get to the…”": "A Hero is desperate to reach the {b} — they will not stop to Search until they get there."
  };
  LNOE.cardBuildingNarration = function (cardName, building) {
    // Templates read "…the {b}…", so {b} is a bare noun (e.g. "High School").
    // With no specific building chosen yet, fall back to "building" so it reads
    // "the building" rather than "the the building".
    const b = building || "building";
    const t = LNOE.cardBuildingNarrations[cardName];
    if (t) return t.replace("{b}", b);
    return LNOE.cardNarration(cardName) + " The " + b + " is the target.";
  };

  // ---- Hero EVENT cards: a thematic line + simple point-form "what to do". ----
  LNOE.heroEventNarrations = {
    "Recovery": "Steady hands press a cloth to the wound. The bleeding slows, and for one stolen breath there is hope in the dark.",
    "Get Back You Devils": "No more running. The Hero plants their feet, looks the dead thing dead in the eyes, and finishes it for good.",
    "Faith": "A whispered prayer rises over the moaning dark. Something in the Hero hardens — the grave will not have them tonight.",
    "At Last…": "The nightmare that clung to them all night finally tears loose. Whatever the dead set in motion is undone.",
    "Just a Scratch": "Teeth, claws, a sickening tear — and yet the Hero staggers back up, whole. Not tonight. Not like this.",
    "Mr. Hyde, The Shop Teacher": "A familiar voice cuts through the screaming. The old Shop Teacher steps in, and the odds tilt.",
    "Doc Brody, Country Physician": "The doctor’s bag snaps open. Whatever is broken, he has mended worse — and quickly.",
    "Farmer Sty": "The farmer fills the doorway with a snarl and a raised tool. Nothing dead is getting past him this turn.",
    "Principal Gomez": "Principal Gomez fixes the darkness with an iron stare. Even the dead seem to think twice.",
    "Deputy Taylor": "The deputy’s steady voice pulls order out of the panic — just for a moment, in a town gone mad.",
    "Jeb, The Grease Monkey": "Jeb wipes his hands, hefts the nearest heavy thing, and grins. He isn’t running anywhere."
  };
  LNOE.heroEventSteps = {
    "Recovery": ["Pick any Hero who is NOT in a fight.", "Remove 1 wound from that Hero.", "Discard this card."],
    "Get Back You Devils": ["You just beat a Zombie in a fight.", "Kill that Zombie now — no doubles needed.", "Discard this card."],
    "Faith": ["Pick any Hero.", "That Hero rolls +1 Fight Dice until the end of the turn.", "If they are a Holy Hero, this card stays in play (max one). Otherwise discard it."],
    "At Last…": ["Play at the START of a Hero Turn.", "Pick one Zombie card that is “Remains in Play”.", "Cancel and remove that card.", "Discard this card."],
    "Just a Scratch": ["Play the moment a Hero is about to take a wound.", "Prevent that wound — the Hero takes no damage.", "Discard this card."],
    "Mr. Hyde, The Shop Teacher": ["Choose ONE:", "• Cancel a fight that involves a Student Hero, or", "• Add or subtract 1 from any Fight Dice roll.", "Discard this card."],
    "Doc Brody, Country Physician": ["Pick any Hero who is NOT in a fight.", "Fully heal that Hero (remove ALL wounds).", "If played on Becky, shuffle this card back into the Hero deck. Otherwise discard it."],
    "Farmer Sty": ["Choose ONE:", "• Stop one Zombie from moving this turn, or", "• Add or subtract 1 from any Fight Dice roll.", "Discard this card."],
    "Principal Gomez": ["Choose ONE:", "• Cancel any one Zombie card, or", "• Make a Zombie re-roll its Fight Dice.", "Discard this card."],
    "Deputy Taylor": ["Choose ONE:", "• Cancel a fight involving a Law Enforcement or Strange Hero, or", "• Shuffle up to 3 cards from the Hero discard pile back into the deck.", "Discard this card."],
    "Jeb, The Grease Monkey": ["Choose ONE:", "• Cancel any one Zombie card, or", "• Give a Hero +1 Fight Dice for the rest of the turn.", "Discard this card."]
  };
  // Match whatever the player typed to a known Event card (exact, then partial).
  LNOE.matchHeroCard = function (name) {
    const t = (name || "").toLowerCase().trim();
    if (!t) return null;
    const keys = Object.keys(LNOE.heroEventNarrations);
    let hit = keys.find(function (k) { return k.toLowerCase() === t; });
    if (hit) return hit;
    return keys.find(function (k) {
      const lk = k.toLowerCase();
      return lk.indexOf(t) > -1 || t.indexOf(lk) > -1;
    }) || null;
  };
  LNOE.heroCardNarration = function (name) {
    const k = LNOE.matchHeroCard(name);
    return (k && LNOE.heroEventNarrations[k]) ||
      "The Hero plays their hand against the dark, and for a heartbeat the whole night seems to hold its breath.";
  };
  LNOE.heroCardSteps = function (name) {
    const k = LNOE.matchHeroCard(name);
    return (k && LNOE.heroEventSteps[k]) ||
      ["Do exactly what the card says.", "Then discard it — unless the card says it stays in play."];
  };

  // Suspense lead-ins, spoken just before a Zombie card's line to build dread.
  LNOE.suspenseOpeners = [
    "Wait… do you hear that?",
    "The room goes cold.",
    "A floorboard creaks somewhere close.",
    "Out of the silence…",
    "Something shifts in the dark.",
    "Hold your breath.",
    "Then — it happens.",
    "Your blood runs cold.",
    "Slowly… slowly…",
    "Nobody move."
  ];
  let _lastOpener = "";
  LNOE.suspenseLine = function () {
    const b = LNOE.suspenseOpeners;
    let p;
    do { p = b[Math.floor(Math.random() * b.length)]; } while (p === _lastOpener && b.length > 1);
    _lastOpener = p;
    return p;
  };

  // Movie-style one-liner for each Hero, used in the opening "cast" intro.
  LNOE.heroIntros = {
    "Jake Cartwright": "Jake Cartwright, the drifter — a stranger just passing through, now trapped like everyone else.",
    "Billy": "Billy, the sheriff's boy — too young for this, but brave enough to stand and fight.",
    "Sally": "Sally, the town's sweetheart — softer than she looks, and harder than anyone knows.",
    "Father Joseph": "Father Joseph, the man of the cloth — his faith may be the only weapon the dead truly fear.",
    "Jenny": "Jenny, the farmer's daughter — she knows every field and fence, and she runs like the wind.",
    "Johnny": "Johnny, the star quarterback — all muscle and nerve, swinging for his life now.",
    "Sheriff Anderson": "Sheriff Anderson — the law in a town where the law has stopped meaning anything, pistol drawn.",
    "Becky": "Becky, the nurse — steady hands on a night full of blood, keeping the others breathing.",
    "Amanda": "Amanda, the prom queen — the crown means nothing now; staying alive is the only title left.",
    "Kenny": "Kenny, the bag boy — just a kid from the supermarket, learning to fight in a single night.",
    "Rachelle": "Detective Rachelle Winters — she came to this town asking questions, and found it full of the dead.",
    "Sam": "Sam, the diner cook — handy with a blade, and not about to go down easy.",
    "Bear": "Bear, the mountain man — built like the pines and twice as stubborn.",
    "Deputy Taylor": "Deputy Taylor — young and scared, gripping a gun he prayed he'd never have to use.",
    "Doc Brody": "Doc Brody, the town doctor — stitching wounds faster than the dead can open them.",
    "Sister Ophelia": "Sister Ophelia, the reformed nun — a dark past behind her, redemption only a prayer away.",
    "Agent Carter": "Agent Carter, the federal man — he knows far more about this nightmare than he's letting on."
  };

  // Find a hero's role across all sets (for the fallback line).
  LNOE.findHero = function (name) {
    let found = null;
    Object.keys(LNOE.heroes || {}).forEach(function (k) {
      (LNOE.heroes[k] || []).forEach(function (h) { if (h.name === name) found = h; });
    });
    return found;
  };

  function heroLine(name) {
    if (LNOE.heroIntros[name]) return LNOE.heroIntros[name];
    const h = LNOE.findHero(name);
    if (h && h.role) return name + ", " + h.role + " — another survivor with everything to lose.";
    return name + " — another survivor with everything to lose.";
  }

  // Build the "cast" part of the opening: introduce each chosen Hero in order,
  // call out how they're connected, and tie them together like a movie.
  LNOE.castIntro = function (players) {
    if (!players || !players.length) return "";
    const names = players.map(function (p) { return p.hero; });
    const has = function (n) { return names.indexOf(n) > -1; };
    const lines = [];
    lines.push(players.length === 1 ? "And one soul must face the night:" : "And these are the souls who must live through it:");
    players.forEach(function (p) { lines.push(heroLine(p.hero)); });

    // Relationship callouts (only when both are in the game).
    if (has("Sheriff Anderson") && has("Billy")) lines.push("Father and son — the Sheriff and his boy — stand back to back.");
    if (has("Johnny") && has("Sally")) lines.push("Johnny and Sally, sweethearts who swore they'd never be parted; tonight that promise is put to the test.");
    if (has("Father Joseph") && has("Sister Ophelia")) lines.push("A priest and a nun — two souls of faith — praying the dead can be laid to rest.");
    if (has("Becky") && has("Doc Brody")) lines.push("The nurse and the doctor: the only hope the wounded have left.");
    if (has("Rachelle") && has("Agent Carter")) lines.push("A small-town detective and a federal agent, both chasing the truth behind the outbreak.");
    if (has("Jenny") && has("Jake Cartwright")) lines.push("The farmer's daughter and the drifter — two people who'd never have met, if not for the end of the world.");

    lines.push(players.length > 1
      ? "Strangers and neighbours, thrown together by the dark. Tonight, they are all that stands between this town and the grave."
      : "Alone against the dark. Tonight, they are all that stands between this town and the grave.");
    return lines.join(" ");
  };

  // Build the spoken opening for a scenario (falls back to a generic line).
  LNOE.scenarioIntro = function (scenarioName, setName, objective) {
    if (LNOE.scenarioIntros[scenarioName]) return LNOE.scenarioIntros[scenarioName];
    let s = "Night has fallen on " + (setName || "the town") + ". The dead are awake, and they are hungry.";
    if (objective) s += " Your mission: " + objective;
    s += " Stay together. Stay alive. This is your last night on Earth.";
    return s;
  };

  // A cinematic ending that names who lived and who fell.
  function joinList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }
  // Scenario-specific HEROES-WIN endings. Each ends on a "Last Night on Earth"
  // line; the surviving characters are blended in just before that line.
  LNOE.scenarioEndings = {
    "Defend the Manor House": "The heroes stayed inside the Manor House and fought all night. The zombies broke the doors and smashed the windows, but the heroes did not run away. They helped each other, fought bravely, and stopped the zombies from taking the house. When the sun came up, the Manor House was still standing. They had survived the Last Night on Earth.",
    "Escape in the Truck": "The heroes found the truck and got it started. The zombies were getting closer, but the heroes jumped in quickly. The truck rushed down the road and left the town behind. Everyone was scared, but they were safe. They had escaped the Last Night on Earth.",
    "Rescue Mission": "The heroes searched the town for people who needed help. The streets were dangerous, and zombies were everywhere. But the heroes did not give up. They found the survivors and brought them to safety. Because of their bravery, everyone lived through the Last Night on Earth.",
    "Die, Zombies, Die!": "The heroes fought the zombies again and again. The zombies kept coming, but the heroes stood strong. At last, the final zombie fell, and the town became quiet. The heroes were tired, but they had won. They had beaten the Last Night on Earth.",
    "Burn 'Em Out!": "The heroes found the zombie nest and set it on fire. Bright flames filled the night as the zombies were destroyed. The heroes watched until the danger was gone. When morning came, the town was safe again. They had survived the Last Night on Earth.",
    "Save the Townsfolk": "The heroes ran through the town to save the townsfolk. Some people were hiding, and some were trapped. The heroes helped them escape before the zombies could reach them. When the sun rose, the townsfolk were safe. Together, they lived through the Last Night on Earth."
  };
  // Weave the living (and any fallen) into a scenario ending, just before its
  // final "Last Night on Earth" line.
  LNOE.blendScenarioEnding = function (base, survivors, fallen) {
    const sentences = base.match(/[^.!?]+[.!?]+/g) || [base];
    let idx = -1;
    sentences.forEach(function (s, i) { if (/last night on earth/i.test(s)) idx = i; });
    const body = (idx > 0 ? sentences.slice(0, idx).join("") : (idx === 0 ? "" : base)).trim();
    const finale = idx > -1 ? sentences[idx].trim() : "";
    const surv = joinList(survivors.map(function (p) { return p.hero; }));
    const fell = joinList(fallen.map(function (p) { return p.hero; }));
    let blend = "";
    if (surv) blend = surv + (survivors.length === 1 ? " was" : " were") + " still standing when it was over" +
      (fell ? ", though " + fell + " did not make it" : "") + ". ";
    else if (fell) blend = "The cost was heavy — " + fell + " did not make it. ";
    return (body ? body + " " : "") + blend + finale;
  };

  LNOE.endingNarration = function (winner, survivors, fallen, scenarioName) {
    // Survivors: name the CHARACTER (and the player). Fallen: character only.
    const surv = joinList(survivors.map(function (p) { return p.hero + " (" + p.name + ")"; }));
    const fell = joinList(fallen.map(function (p) { return p.hero; }));
    if (winner === "Heroes") {
      // Use the scenario's own victory ending when we have one.
      const base = scenarioName && LNOE.scenarioEndings[scenarioName];
      if (base) return LNOE.blendScenarioEnding(base, survivors, fallen);
      let s = "Dawn breaks at last over the town. The gunfire stops. The moaning fades into the morning light. ";
      s += surv ? ("Against all the odds, " + surv + (survivors.length === 1 ? " is" : " are") + " still breathing. ")
                : "Somehow, the night has been survived. ";
      if (fell) s += "They will not forget " + fell + ", taken by the dead before the sun could rise. ";
      s += "They lived through the last night on Earth.";
      return s;
    }
    if (winner === "Zombies") {
      let s = "The sun rises on a silent, broken town. ";
      if (fell) s += "One by one the living fell — " + fell + " among them, dragged down into the dark. ";
      if (surv) s += "Even " + surv + " could not hold out until morning. ";
      s += "The dead have won. The town belongs to them now, and the night never truly ends.";
      return s;
    }
    let s = "The night comes to an end. ";
    if (surv) s += surv + (survivors.length === 1 ? " is" : " are") + " still standing" + (fell ? ", but " + fell + " are gone." : "; the rest are gone.") + " ";
    s += "The dead are still out there, waiting in the dark.";
    return s;
  };

  // Grab a random line for a moment, without repeating the last one if possible.
  const lastByKey = {};
  LNOE.narrate = function (key) {
    const bank = LNOE.narration[key];
    if (!bank || !bank.length) return "";
    if (bank.length === 1) return bank[0];
    let pick;
    do {
      pick = bank[Math.floor(Math.random() * bank.length)];
    } while (pick === lastByKey[key]);
    lastByKey[key] = pick;
    return pick;
  };
})();

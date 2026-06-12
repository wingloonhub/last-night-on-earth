/* =========================================================================
   Game Data: base sets, expansions, scenarios, heroes.

   The base Zombie deck is fully verified from Wing's cards (see zombiedecks.js).
   Scenario and Hero lists below are the well-known published line-ups so players
   can pick who they are. Anything here can be edited in the Admin tab.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});

  // The three things you can build a game on top of.
  LNOE.baseSets = [
    { key: "base", name: "Last Night on Earth (Base)" },
    { key: "timber_peak", name: "Timber Peak" },
    { key: "blood_forest", name: "Blood in the Forest" }
  ];

  // Add-on expansions that mix into a base set.
  LNOE.expansions = [
    { key: "growing_hunger", name: "Growing Hunger" },
    { key: "survival_fittest", name: "Survival of the Fittest" }
  ];

  // Scenarios that come in each base box.
  LNOE.scenarios = {
    base: [
      { name: "Die, Zombies, Die!", objective: "Heroes work together to kill 15 Zombies before the night ends." },
      { name: "Save the Townsfolk", objective: "Heroes must rescue a number of helpless Townsfolk and keep them alive." },
      { name: "Burn 'Em Out!", objective: "Heroes find gas and a torch and burn down buildings to wipe out the Zombie spawning pits." },
      { name: "Escape in the Truck", objective: "Heroes find the keys and gas, start the truck, and drive off the board to escape." },
      { name: "Defend the Manor House", objective: "Heroes hold out inside the Manor House until dawn (the Sun Track ends)." }
    ],
    timber_peak: [
      { name: "Blow up the Town!", objective: "Heroes gather explosives and blow the town sky-high before the night ends." },
      { name: "Radio for Help", objective: "Heroes repair the radio and call for rescue." },
      { name: "Learn to Survive", objective: "Heroes complete survival tasks and make it through the frozen night." },
      { name: "Mountain of the Dead", objective: "Heroes face the rising dead on the mountain." }
    ],
    blood_forest: [
      { name: "Escape in the Plane", objective: "Heroes find the plane parts and fuel and fly out before the dead overrun them." },
      { name: "Lost in the Woods", objective: "Heroes find their way out of the forest while the Zombies close in." },
      { name: "Salvage Mission", objective: "Heroes salvage the supplies they need from the forest and survive." }
    ]
  };

  // Scenarios that ADD to the list when an expansion is mixed in.
  LNOE.expansionScenarios = {
    growing_hunger: [
      { name: "Zombie Apocalypse", objective: "A huge horde rises — Heroes must survive overwhelming Zombie numbers." },
      { name: "Plague Carriers", objective: "Infected Zombies spread plague; Heroes must contain it or survive the night." },
      { name: "Burn It To The Ground!", objective: "Heroes burn the buildings to the ground to destroy the Zombie threat." },
      { name: "Alone in the Dark (2-player mini-game)", objective: "A tense one-Hero-versus-Zombies mini-game." }
    ],
    survival_fittest: [
      { name: "Rescue Mission", objective: "Heroes rescue a trapped survivor and get them to safety." },
      { name: "Hunker Down", objective: "Heroes barricade a position and hold it against the dead." },
      { name: "Supply Run", objective: "Heroes gather scattered supplies and make it back alive." },
      { name: "Search for the Truth", objective: "Heroes search the town to uncover the truth behind the outbreak." }
    ]
  };

  // Which carried Hero items COMPLETE each scenario's objective. Used by the
  // Zombie movement guide to name the Hero carrying an objective item. Names are
  // matched loosely (case-insensitive, partial) against what a Hero is carrying.
  LNOE.scenarioObjectiveItems = {
    "Burn 'Em Out!": ["Gasoline", "Gas", "Torch", "Lighter"],
    "Escape in the Truck": ["Car Keys", "Keys", "Gasoline", "Gas"],
    "Blow up the Town!": ["Dynamite", "Explosive", "Explosives", "Gasoline", "Gas"],
    "Escape in the Plane": ["Plane Part", "Plane Parts", "Fuel", "Gasoline", "Gas"],
    "Radio for Help": ["Radio Part", "Radio Parts", "Radio"],
    "Burn It To The Ground!": ["Gasoline", "Gas", "Torch", "Lighter"]
  };
  LNOE.objectiveItemsFor = function (name) { return (LNOE.scenarioObjectiveItems[name] || []).slice(); };

  // Other escort scenarios use a simple free-text spot tracker (Save the
  // Townsfolk has its own structured Townsfolk + safe-house system).
  LNOE.scenarioLocations = {
    "Rescue Mission": { noun: "the survivor", primaryLabel: "Where is the survivor?", primaryHint: "e.g. trapped in the Barn", safeLabel: "Safe spot", safeHint: "e.g. the truck" }
  };
  LNOE.scenarioLocationCfg = function (name) { return LNOE.scenarioLocations[name] || null; };

  // "Save the Townsfolk" — the named Townsfolk that can appear in the game.
  LNOE.townsfolkCharacters = ["Principal Gomez", "Doc Brody", "Mr. Hyde", "Jeb", "Deputy Taylor", "Farmer Sty"];
  LNOE.isTownsfolkScenario = function (name) { return name === "Save the Townsfolk"; };

  // Heroes available, grouped by set/expansion. ability = quick reminder text.
  // When an expansion is mixed in, its heroes are ADDED to the base pool.
  LNOE.heroes = {
    base: [
      { name: "Jake Cartwright", role: "the Drifter", ability: "A tough wanderer who knows how to handle himself." },
      { name: "Billy", role: "the Sheriff's Son", ability: "Small and quick — slips past the dead." },
      { name: "Sally", role: "High School Sweetheart", ability: "Brave and resourceful." },
      { name: "Father Joseph", role: "Man of the Cloth", ability: "Starts with Faith — turns belief against the dead." },
      { name: "Jenny", role: "the Farmer's Daughter", ability: "Light on her feet and hard to corner." },
      { name: "Johnny", role: "High School Quarterback", ability: "Strong — hits hard in a fight." },
      { name: "Sheriff Anderson", role: "the Sheriff", ability: "Starts with a Pistol — a steady shot." },
      { name: "Becky", role: "the Nurse", ability: "Heals wounds on herself and other Heroes." }
    ],
    // Timber Peak (standalone box): 6 Heroes — 3 new + 3 "Woodinvale Survivor"
    // versions of original Heroes.
    timber_peak: [
      { name: "Alice", role: "Diner Waitress", ability: "Timber Peak hero — tough diner waitress." },
      { name: "Nikki", role: "Bush Pilot", ability: "Timber Peak hero — fearless bush pilot." },
      { name: "Ed Baker", role: "Lumberjack", ability: "Timber Peak hero — strong lumberjack." },
      { name: "Sheriff Anderson", role: "Woodinvale Survivor", ability: "A harder, battle-worn version of the Sheriff." },
      { name: "Sally", role: "Woodinvale Survivor", ability: "A harder, battle-worn version of Sally." },
      { name: "Jake Cartwright", role: "Woodinvale Survivor", ability: "A harder, battle-worn version of Jake." }
    ],
    blood_forest: [
      { name: "Sister Ophelia", role: "the Reformed Nun", ability: "Redemption & Dark Past — can cancel a fight or heal on a rolled 6." },
      { name: "Agent Carter", role: "FBI Agent", ability: "Knows more than he lets on — can draw extra while searching (but thins the Hero deck)." }
    ],
    // Growing Hunger expansion Heroes — added on top of the base pool.
    growing_hunger: [
      { name: "Amanda", role: "the Prom Queen", ability: "Growing Hunger hero." },
      { name: "Kenny", role: "Supermarket Bag Boy", ability: "Growing Hunger hero." },
      { name: "Rachelle", role: "Detective Winters", ability: "Growing Hunger hero." },
      { name: "Sam", role: "the Diner Cook", ability: "Growing Hunger hero." }
    ],
    // Survival of the Fittest adds new card decks, mechanics (Barricades, Sewers)
    // and scenarios — but NO new Heroes. Left empty on purpose.
    survival_fittest: []
  };

  // Buildings / locations per set, used for the building tags in Setup.
  LNOE.buildings = {
    base: ["High School", "Gym", "Book Store", "Church", "Hospital", "Police Station",
      "Hardware Store", "Gas Station", "Farmhouse", "Graveyard", "Junkyard", "Corner Store",
      "Manor House", "Town Center", "Main Street", "The Barn", "The Bank", "Morgue"],
    timber_peak: ["Gun Shop", "General Store", "The Plant", "Office Trailer", "Lumber Yard",
      "Sawmill", "Power Relay Station", "Diner", "Tavern", "Bowling Alley", "Sheriff's Office", "Mine"],
    blood_forest: ["Airfield Office", "Airfield Runway", "Ranger Station", "Forest Trail", "Cabins", "Campground"],
    growing_hunger: ["Supermarket", "Post Office", "Drug Store", "Library", "Antique Shop", "Factory", "Airplane Hangar", "Freezer"],
    survival_fittest: []
  };

  // Helper: building list for a base set + any expansions mixed in.
  LNOE.buildingsFor = function (setKey, expansionKeys) {
    let list = (LNOE.buildings[setKey] || []).slice();
    (expansionKeys || []).forEach(function (k) {
      (LNOE.buildings[k] || []).forEach(function (b) { if (list.indexOf(b) === -1) list.push(b); });
    });
    return list;
  };

  // Helper: scenarios available for a chosen base set + any expansions mixed in.
  // Each returned scenario carries a `source` label (the set it came from).
  LNOE.scenariosFor = function (setKey, expansionKeys) {
    const baseName = (LNOE.baseSets.find(function (s) { return s.key === setKey; }) || {}).name || "";
    let list = (LNOE.scenarios[setKey] || []).map(function (sc) {
      return Object.assign({ source: baseName }, sc);
    });
    (expansionKeys || []).forEach(function (k) {
      const exp = LNOE.expansions.find(function (e) { return e.key === k; });
      (LNOE.expansionScenarios[k] || []).forEach(function (sc) {
        list.push(Object.assign({ source: exp ? exp.name : k }, sc));
      });
    });
    return list;
  };

  // Helper: full hero pool for a base set + chosen expansions.
  LNOE.heroesFor = function (setKey, expansionKeys) {
    let list = (LNOE.heroes[setKey] || []).slice();
    (expansionKeys || []).forEach(function (k) {
      if (LNOE.heroes[k]) list = list.concat(LNOE.heroes[k]);
    });
    return list;
  };
})();

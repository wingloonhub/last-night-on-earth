/* =========================================================================
   Zombie Decks
   -------------------------------------------------------------------------
   The "base" deck below was transcribed directly from photographs of Wing's
   physical Last Night on Earth (base game) Zombie Card deck — 40 cards,
   17 unique cards. Copy counts are exact.

   Each card:
     name        - card title
     copies      - how many are in the deck
     timing      - when the Bot can play it (used by the Zombie AI to suggest)
     remains     - true if it stays in play after being played
     text        - the exact rules text from the card
     simple      - plain, kid-friendly explanation of what to do
     quote       - the flavour quote on the card

   timing keys (also used as filter buckets):
     immediate   - "Play Immediately" the moment it is drawn
     zturn_start - play at the start of the Zombie turn
     zturn_end   - play at the end of the Zombie turn
     fight       - play during a fight
     hero_move   - play in reaction to a Hero's movement
     reaction    - play in reaction to something a Hero does
     anytime     - play any time during the Zombie turn / movement
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});

  const base = [
    {
      name: "Shamble",
      copies: 6,
      timing: "anytime",
      remains: false,
      text: "Play this card to move a Zombie D6 spaces instead of its normal move.",
      simple: "Move one Zombie. Roll a die — it moves that many spaces this turn.",
      quote: "“Look out!”"
    },
    {
      name: "Uuuurrrggghh!",
      copies: 5,
      timing: "fight",
      remains: false,
      text: "Fight: Play this card to let a Zombie roll 2 extra Fight Dice.",
      simple: "In a fight, this Zombie rolls 2 extra dice.",
      quote: "“Gurgle, gurgle!” — “That’s not Tom anymore, it’s not even human!”"
    },
    {
      name: "Undead Hate The Living",
      copies: 5,
      timing: "fight",
      remains: false,
      text: "Fight: Play this card to hate a Hero, forcing them to Re-roll any number of their Fight Dice (Zombie's choice).",
      simple: "In a fight, make the Hero re-roll any of their dice you pick.",
      quote: "“Nuumm…Numm…”"
    },
    {
      name: "“My God, They’ve Taken the…”",
      copies: 3,
      timing: "immediate",
      remains: true,
      text: "Roll a Random Building and place a Taken Over marker on it. Place a Zombie from the Zombie Pool in each empty space of this building. No Hero may enter this building or Search here. If the building has already been Taken Over, Re-roll. Zombies placed here may not move this turn.",
      simple: "Pick a building. Fill its empty spaces with Zombies. Heroes can't enter or search there.",
      quote: "“My God, They’ve Taken the…”"
    },
    {
      name: "Resilient",
      copies: 2,
      timing: "reaction",
      remains: false,
      text: "Play this card when a Zombie is Killed by a (Gun) item to immediately discard that Gun.",
      simple: "A Hero killed a Zombie with a gun? They must throw that gun away.",
      quote: "“Why…won’t…you…die?!?”"
    },
    {
      name: "Lights Out",
      copies: 2,
      timing: "zturn_start",
      remains: true,
      text: "Play this card at the start of a Zombie Turn on any building to place a Lights Out marker on it. The Zombies have cut the power. Any Hero moving into a space within this building immediately ends their move.",
      simple: "Pick a building. Any Hero who steps inside must stop moving at once.",
      quote: "“The power’s out!”"
    },
    {
      name: "“Oh the Horror!”",
      copies: 2,
      timing: "immediate",
      remains: false,
      text: "Draw three Zombie Cards. At the start of your next turn, if you have more cards than your hand size will allow, discard down to your normal limit.",
      simple: "Draw 3 extra Zombie cards now.",
      quote: "“Oh the Horror!”"
    },
    {
      name: "Surprise Attack",
      copies: 2,
      timing: "immediate",
      remains: false,
      text: "Take a Zombie from your Zombie Pool and place it in the same space as any Hero within a building. If there are no Zombies in the pool or Heroes in buildings, discard this card with no effect.",
      simple: "Drop a new Zombie onto any Hero who is inside a building.",
      quote: "“Behind you!”"
    },
    {
      name: "Loss of Faith",
      copies: 2,
      timing: "reaction",
      remains: false,
      text: "Play to cancel a Faith card. or Play to force a Hero to Re-roll their dice when checking to see if a Hand Weapon Breaks after use.",
      simple: "Cancel a Hero's Faith card. Or make a Hero re-roll the check to see if their weapon breaks.",
      quote: "“Why God….Why?”"
    },
    {
      name: "Relentless Advance",
      copies: 2,
      timing: "zturn_start",
      remains: false,
      text: "Play at the start of a Zombie Turn. Roll a D6. Immediately move that many Zombies one space. Those Zombies may move and fight normally this turn.",
      simple: "Roll a die. That many Zombies take a free step now — and still act normally this turn.",
      quote: "“How do ya stop these things?!”"
    },
    {
      name: "New Spawning Pit",
      copies: 2,
      timing: "immediate",
      remains: true,
      text: "Roll a Random Building. The Zombie Player places a new Zombie Spawning Pit marker in any space of the building.",
      simple: "Pick a building. Add a new Spawning Pit there (more Zombies will appear).",
      quote: "“They just keep coming!”"
    },
    {
      name: "“There’s Too Many!”",
      copies: 2,
      timing: "zturn_end",
      remains: false,
      text: "Play this card at the end of the Zombie Turn to spawn D6 new Zombies. You may remove them from anywhere on the board if there are not enough out of play.",
      simple: "At the end of the turn, roll a die. Add that many new Zombies.",
      quote: "“We’ll never make it through!”"
    },
    {
      name: "Trip!",
      copies: 1,
      timing: "hero_move",
      remains: false,
      text: "Play this card on any Hero to force them to Re-roll their Movement Dice roll.",
      simple: "Make a Hero re-roll their move. Hope they roll low.",
      quote: "“Aaaaaaaahh…Oof!”"
    },
    {
      name: "Cornered",
      copies: 1,
      timing: "zturn_start",
      remains: false,
      text: "Play this card at the start of a Zombie Turn. Until the start of the next Zombie Turn, Zombies roll 2 extra Fight Dice but Heroes win on ties.",
      simple: "Until next turn, Zombies roll 2 extra dice in fights (but Heroes win ties).",
      quote: "“Good Lord!”"
    },
    {
      name: "A Town Overrun",
      copies: 1,
      timing: "immediate",
      remains: false,
      text: "Immediately reveal and discard the top 10 Hero Cards. If this discards the last Hero Card, the Heroes automatically lose.",
      simple: "Throw away the top 10 Hero cards. If the Hero deck runs out, the Heroes lose!",
      quote: "“What do we do now?”"
    },
    {
      name: "Heavy Rain",
      copies: 1,
      timing: "immediate",
      remains: true,
      text: "All Heroes who start their move outside of a building must subtract 1 from their Movement Dice roll (to a minimum of 1).",
      simple: "Heroes moving outside (not in a building) move 1 space less (at least 1).",
      quote: "“This rain won’t let up.”"
    },
    {
      name: "Braaains!",
      copies: 1,
      timing: "fight",
      remains: false,
      text: "Fight: Play this card to add +1 to a Zombie's highest Fight Dice roll.",
      simple: "In a fight, add 1 to the Zombie's best die.",
      quote: "“Tasty braaains!”"
    }
  ];

  // Expansion decks: structure is ready; cards are added by Wing via the Admin
  // tab (or by dropping photos in the matching Zombie Deck folder later).
  // Each starts empty so the Admin clearly shows "no cards entered yet".
  const empty = [];

  LNOE.zombieDecks = {
    base: base,
    timber_peak: empty.slice(),
    blood_forest: empty.slice(),
    growing_hunger: empty.slice(),
    survival_fittest: empty.slice()
  };

  // Expand copies into a flat draw pile of individual cards.
  LNOE.buildDrawPile = function (setKey) {
    const def = LNOE.zombieDecks[setKey] || [];
    const pile = [];
    def.forEach(function (c, i) {
      for (let n = 0; n < (c.copies || 1); n++) {
        pile.push(Object.assign({ uid: setKey + "-" + i + "-" + n }, c));
      }
    });
    return pile;
  };
})();

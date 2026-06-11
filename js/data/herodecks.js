/* =========================================================================
   Hero Deck breakdowns (for the Admin tab).

   The base Hero deck below was transcribed directly from photographs of Wing's
   physical Last Night on Earth (base game) Hero Card deck — 40 cards, 25 unique
   cards. Copy counts are exact (counted from the photos).

   Each card:
     name      - card title
     category  - grouping bucket shown in the Admin tab
     copies    - how many are in the deck
     text      - the exact rules text from the card
     quote     - the flavour quote on the card (if any)
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});

  const baseHero = [
    /* ----------------------- Ranged Weapons (6) ----------------------- */
    { name: "Signal Flare", category: "Ranged Weapon", copies: 1,
      text: "Item – Ranged Weapon – Flare. RANGE: 4. You may target one Zombie within Range. Roll a D6. The Zombie is Killed on the roll of 2+. Discard when fired. Signal Flare does not count against the Hero's weapon limit." },
    { name: "Revolver", category: "Ranged Weapon", copies: 3,
      text: "Item – Ranged Weapon – Gun. RANGE: 3. You may target one Zombie within Range. Roll a D6. The Zombie is Hit on the roll of 4+. On the roll of 1, the Revolver is out of ammo (discard).",
      quote: "Aim for the head!" },
    { name: "Pump Shotgun", category: "Ranged Weapon", copies: 2,
      text: "Item – Ranged Weapon – Gun. RANGE: 2. You may fire at a space within Range. Roll a D6 for each Zombie in that space. Zombies are Hit on the roll of 3+. Any Hero in that space is unaffected. Each time the Shotgun is fired, roll a D6. On the roll of 1 or 2, the Shotgun is out of ammo (discard)." },

    /* ------------------------ Hand Weapons (8) ------------------------ */
    { name: "Baseball Bat", category: "Hand Weapon", copies: 2,
      text: "Item – Hand Weapon. COMBAT BONUS: The Hero may roll an extra Fight Dice. This ability may be used multiple times per fight. Roll to see if the Baseball Bat Breaks after every use. Breaks on 1 or 2 (Discard)." },
    { name: "Meat Cleaver", category: "Hand Weapon", copies: 1,
      text: "Item – Hand Weapon. COMBAT BONUS: If the Hero rolls a 6 on any of their Fight Dice, the Zombie is instantly Killed.",
      quote: "You want a little o'this?" },
    { name: "Pitchfork", category: "Hand Weapon", copies: 1,
      text: "Item – Hand Weapon. COMBAT BONUS: The Hero may Re-roll any number of their Fight Dice. Limit once per fight. After each use, Breaks on 1 or 2 (Discard). If the Hero also has Torch, only Breaks on a 1." },
    { name: "Fire Axe", category: "Hand Weapon", copies: 1,
      text: "Item – Hand Weapon. The Hero ignores the effects of Locked Door. COMBAT BONUS: Cancel any Zombie Fight: Card. After each use, Breaks on 1, 2, or 3 (Discard)." },
    { name: "Chainsaw", category: "Hand Weapon", copies: 1,
      text: "Item – Hand Weapon. COMBAT BONUS: The Hero rolls an extra Fight Dice. Any Zombie beaten in a fight is automatically Killed, even if no doubles were rolled. If you lose a fight while using Chainsaw, discard (or discard a Gasoline card in its place)." },
    { name: "Welding Torch", category: "Hand Weapon", copies: 1,
      text: "Item – Hand Weapon – Fire. COMBAT BONUS: Re-roll one of the Hero's Fight Dice. May be used multiple times per fight. After each use, Breaks on 1 or 2 (Discard).",
      quote: "I think it's got a little fuel left." },
    { name: "Crowbar", category: "Hand Weapon", copies: 1,
      text: "Item – Hand Weapon. COMBAT BONUS: The Hero may win a fight on a tie. After each use, Breaks on 1 or 2 (Discard as the crowbar gets stuck in the Zombie).",
      quote: "This should even up the odds!" },

    /* --------------------------- Items (7) ---------------------------- */
    { name: "Ammo", category: "Item", copies: 2,
      text: "Item – Ammo. Anytime a (Gun) item would have to be discarded from this Hero, you may discard Ammo in its place.",
      quote: "Never hurts to have a little extra." },
    { name: "Torch", category: "Item", copies: 1,
      text: "Item – Fire. The Hero ignores the effects of Lights Out. COMBAT BONUS: Discard to make a Zombie Re-roll its Fight Dice." },
    { name: "Keys", category: "Item", copies: 2,
      text: "Item. The Hero may ignore the effects of Locked Door. You may discard the Keys while inside a building to draw 2 new Hero Cards.",
      quote: "One of these ought to work." },
    { name: "First Aid Kit", category: "Item", copies: 2,
      text: "Item – First Aid. Discard to Fully Heal any one Hero in the same or an adjacent space (except during a fight).",
      quote: "I couldn't find Doc Brody, but this should help." },

    /* -------------------------- Events (13) --------------------------- */
    { name: "Recovery", category: "Event", copies: 2,
      text: "Event – First Aid. Play on any Hero (except during a fight) to Heal one wound from them.",
      quote: "Hold me." },
    { name: "Get Back You Devils", category: "Event", copies: 3,
      text: "Event. Play to Kill any Zombie beaten in a fight, even if no doubles were rolled.",
      quote: "I mean it!" },
    { name: "Faith", category: "Event", copies: 3,
      text: "Event. Play on any Hero. Until the end of the turn, that Hero rolls an extra Fight Dice. If played on a Holy Hero, Faith Remains in Play (limit one).",
      quote: "Faith is stronger than zombies my son." },
    { name: "At Last…", category: "Event", copies: 3,
      text: "Event. Play at the start of a Hero Turn to cancel any Zombie Card that is marked Remains in Play.",
      quote: "Alright, break it up! You kids know better then to… Billy?! — Hey Dad." },
    { name: "Just a Scratch", category: "Event", copies: 2,
      text: "Event. Play when a Hero is about to take a wound. Prevent that wound.",
      quote: "Not a zombie bite…Really!" },

    /* ------------------- Townsfolk Events (6) ------------------------- */
    { name: "Mr. Hyde, The Shop Teacher", category: "Townsfolk", copies: 1,
      text: "Event – Townsfolk. Immediately cancel any fight involving a Student Hero. OR Add or subtract 1 to any Fight Dice roll.",
      quote: "Run Billy, Run! I'll handle this." },
    { name: "Doc Brody, Country Physician", category: "Townsfolk", copies: 1,
      text: "Event – Townsfolk. Fully Heal any Hero (except during a fight). If played on Becky, shuffle this card back into the Hero Card deck.",
      quote: "There's an old country remedy for Zombies…an AXE!" },
    { name: "Farmer Sty", category: "Townsfolk", copies: 1,
      text: "Event – Townsfolk. Prevent any one Zombie from moving this turn. OR Add or subtract 1 to any Fight Dice roll.",
      quote: "Who's in here? I told you kids to stay outta my barn!" },
    { name: "Principal Gomez", category: "Townsfolk", copies: 1,
      text: "Event – Townsfolk. Immediately cancel any Zombie Card. OR Make a Zombie Re-roll its Fight Dice.",
      quote: "Don't think you're getting out of detention just because you're a zombie." },
    { name: "Deputy Taylor", category: "Townsfolk", copies: 1,
      text: "Event – Townsfolk. Immediately cancel any fight involving a Law Enforcement or Strange Hero. OR Choose up to three Hero Cards from the discard pile and shuffle them back into the deck.",
      quote: "Sheriff Anderson…is that you?" },
    { name: "Jeb, The Grease Monkey", category: "Townsfolk", copies: 1,
      text: "Event – Townsfolk. Immediately cancel any Zombie Card. OR Add 1 extra Fight Dice to a Hero for the rest of the turn.",
      quote: "I ain't runnin'…zombies or no zombies." }
  ];

  // Advanced add-on Hero deck for the BASE game (optional). Transcribed from
  // photos — 20 cards, 11 unique. Mixed into the base Hero deck when the player
  // turns on the Advanced deck in Setup.
  const baseHeroAdvanced = [
    { name: "Signal Flare", category: "Ranged Weapon", copies: 1,
      text: "Item – Ranged Weapon – Flare. RANGE: 4. You may target one Zombie within Range. Roll a D6. The Zombie is Killed on the roll of 2+. Discard when fired. Signal Flare does not count against the Hero's weapon limit." },
    { name: "Lighter", category: "Item", copies: 2,
      text: "Item – Fire. The Hero may ignore the effects of Lights Out.",
      quote: "I knew this would come in handy." },
    { name: "Dynamite", category: "Item", copies: 4,
      text: "Item – Explosive. RANGE: 2. You must have a (Fire) item to use Dynamite. Discard to throw at a space within Range. Roll a D6 for each model in that space. Zombies are Killed on the roll of 2+. Any Hero in that space is Killed on the roll of 5+." },
    { name: "Gasoline", category: "Item", copies: 2,
      text: "Item – Explosive. At any time during your move, you may discard to douse your space or any adjacent space with Gasoline (place a Gas Marker there)." },
    { name: "Old Betsy", category: "Item", copies: 1,
      text: "Item – Animal. At any time, discard to place Old Betsy in any space on the board. No Zombie may move from that space this turn. In future turns, Zombies trying to move from that space must first roll a 5 or 6 to escape. When a Zombie escapes, remove Old Betsy from the board." },
    { name: "Fire Extinguisher", category: "Item", copies: 2,
      text: "Item. Discard to immediately cancel a fight involving the Hero. OR Discard at any time (except during a fight) to move every Zombie adjacent to and in the same space as the Hero, one space each in any direction (Hero's choice).",
      quote: "Back off!!" },
    { name: "Just What I Needed", category: "Event", copies: 4,
      text: "Event – Play Immediately. Take any card from the Hero Cards discard pile. If there are no cards in the discard pile, you may draw a new Hero Card. OR Take any Scenario Search Item from the draw deck, then shuffle the deck." },
    { name: "Heroic Resolve", category: "Event", copies: 1,
      text: "Event – Heroic. Play on any Hero that has 2 or more Zombies in their space. That Hero now rolls an extra Fight Dice and wins on ties. Discard this card if the Hero Searches. Remains in Play. Limit one Heroic card per Hero." },
    { name: "Hero's Rage", category: "Event", copies: 1,
      text: "Event – Heroic. Play on any Hero that has 2 or more Zombies in their space. Until the start of the next Hero Turn, that Hero rolls an extra Fight Dice and Kills any Zombie beaten in a fight, even if no doubles were rolled. Limit one Heroic card per Hero." },
    { name: "Blocked Windows", category: "Event", copies: 1,
      text: "Event. Play to prevent all Zombies from moving through walls this turn (including doors).",
      quote: "That won't hold them for long." },
    { name: "Escape Through the Window", category: "Event", copies: 1,
      text: "Event. Until the end of the Hero Turn, all Heroes may move through walls as long as they do not end their move in a building space. In addition, any Locked Door card played this turn is cancelled." }
  ];
  LNOE.heroDecksAdvanced = { base: baseHeroAdvanced };

  const empty = [];

  LNOE.heroDecks = {
    base: baseHero,
    timber_peak: empty.slice(),
    blood_forest: empty.slice(),
    growing_hunger: empty.slice(),
    survival_fittest: empty.slice()
  };
})();

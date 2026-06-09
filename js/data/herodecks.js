/* =========================================================================
   Hero Deck breakdowns (for the Admin tab).

   The base Zombie deck is verified from Wing's photos. The Hero deck below is
   a reference breakdown of the published base-game Hero deck, grouped by type.
   Wing can correct counts or add the other sets' cards in the Admin tab.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});

  const baseHero = [
    { name: "Pistol", category: "Weapon (Gun)", copies: 2, text: "Ranged Gun. Roll to hit Zombies at a distance." },
    { name: "Shotgun", category: "Weapon (Gun)", copies: 1, text: "Powerful ranged Gun." },
    { name: "Rifle", category: "Weapon (Gun)", copies: 1, text: "Long-range Gun." },
    { name: "Chainsaw", category: "Weapon (Hand)", copies: 1, text: "Brutal hand weapon, but it can run out / break." },
    { name: "Axe", category: "Weapon (Hand)", copies: 1, text: "Reliable hand weapon." },
    { name: "Machete", category: "Weapon (Hand)", copies: 1, text: "Sharp hand weapon." },
    { name: "Kitchen Knife", category: "Weapon (Hand)", copies: 1, text: "Basic hand weapon." },
    { name: "Frying Pan", category: "Weapon (Hand)", copies: 1, text: "Improvised hand weapon." },
    { name: "Baseball Bat", category: "Weapon (Hand)", copies: 1, text: "Swing for the fences." },
    { name: "First Aid Kit", category: "Item", copies: 2, text: "Heal wounds." },
    { name: "Medkit", category: "Item", copies: 1, text: "Heal wounds." },
    { name: "Adrenaline", category: "Item", copies: 1, text: "Burst of speed or strength." },
    { name: "Gasoline", category: "Item / Objective", copies: 2, text: "Needed for some scenarios (truck, burning buildings)." },
    { name: "Car Keys", category: "Item / Objective", copies: 1, text: "Needed to start the truck." },
    { name: "Torch", category: "Item / Objective", copies: 1, text: "Light / set fires." },
    { name: "Lucky Find", category: "Event", copies: 2, text: "Draw extra / search again." },
    { name: "Adrenaline Rush", category: "Event", copies: 1, text: "Extra action this turn." },
    { name: "Grit & Determination", category: "Event", copies: 1, text: "Re-roll or shrug off harm." },
    { name: "I'm Not Going Down Like This", category: "Event", copies: 1, text: "Survive a deadly hit." },
    { name: "Faith", category: "Faith", copies: 3, text: "Holy power — used by Father Joseph and others against the dead." }
  ];

  const empty = [];

  LNOE.heroDecks = {
    base: baseHero,
    timber_peak: empty.slice(),
    blood_forest: empty.slice(),
    growing_hunger: empty.slice(),
    survival_fittest: empty.slice()
  };
})();

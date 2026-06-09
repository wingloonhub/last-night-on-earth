/* =========================================================================
   Zombie Bot brain.
   Holds the Bot's hand, draws from the chosen set's deck, and gives plain
   recommendations on whether/when to play a card. The human applies the
   actual board rules; the Bot advises and explains.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function Bot(setKey, advanced) {
    this.setKey = setKey;
    this.advanced = !!advanced;
    this.drawPile = shuffle(LNOE.buildDrawPile(setKey, advanced));
    this.discard = [];
    this.hand = [];
  }

  Bot.prototype.deckEmpty = function () { return this.drawPile.length === 0; };
  Bot.prototype.cardsLeft = function () { return this.drawPile.length; };

  // Draw one card into the Bot's hand. Reshuffles discard if needed.
  Bot.prototype.draw = function () {
    if (!this.drawPile.length && this.discard.length) {
      this.drawPile = shuffle(this.discard.splice(0));
    }
    if (!this.drawPile.length) return null;
    const c = this.drawPile.pop();
    this.hand.push(c);
    return c;
  };

  Bot.prototype.playFromHand = function (uid) {
    const i = this.hand.findIndex(function (c) { return c.uid === uid; });
    if (i === -1) return null;
    const c = this.hand.splice(i, 1)[0];
    if (!c.remains) this.discard.push(c);
    return c;
  };

  // Decide whether the Bot should play a freshly considered card.
  // phase: 'draw' | 'start' | 'movement' | 'fight' | 'end'
  Bot.prototype.advise = function (card, phase) {
    if (card.timing === "immediate") {
      return { play: true, reason: "This is a “Play Immediately” card — the rules say it happens the moment it is drawn. Do what it says now." };
    }
    if (card.timing === "fight") {
      if (phase === "fight") return { play: true, reason: "You are in a fight and this card helps the Zombie win it. Good time to play." };
      return { play: false, reason: "Hold this. Only play it during a fight, when it can swing the dice your way." };
    }
    if (card.timing === "zturn_start") {
      if (phase === "start") return { play: true, reason: "Best played right now, at the start of the Zombie turn. It sets up the whole turn in your favour." };
      return { play: false, reason: "Save this for the START of a Zombie turn." };
    }
    if (card.timing === "zturn_end") {
      if (phase === "end") return { play: true, reason: "Play it now, at the end of the Zombie turn, to add more Zombies." };
      return { play: false, reason: "Save this for the END of the Zombie turn." };
    }
    if (card.timing === "hero_move") {
      return { play: false, reason: "Hold this. Play it the moment a Hero rolls to move — force the re-roll and ruin a good roll." };
    }
    if (card.timing === "reaction") {
      return { play: false, reason: "Hold this. It reacts to something a Hero does (see the card). Play it the instant that happens." };
    }
    // anytime (e.g. Shamble)
    if (phase === "movement") return { play: true, reason: "Good to use during movement — push a Zombie far toward the Heroes." };
    return { play: false, reason: "Flexible card — play it during Zombie movement when you want to rush a Zombie forward." };
  };

  // When a Hero plays a card, see if the Bot is holding something that reacts.
  // Returns an array of matching hand cards with a hint.
  Bot.prototype.reactTo = function (heroText) {
    const t = (heroText || "").toLowerCase();
    const hits = [];
    this.hand.forEach(function (c) {
      const name = c.name.toLowerCase();
      let match = false, hint = "";
      if (name.indexOf("loss of faith") > -1 && t.indexOf("faith") > -1) {
        match = true; hint = "Hero played a Faith card — you can CANCEL it with Loss of Faith.";
      }
      if (name.indexOf("resilient") > -1 && (t.indexOf("gun") > -1 || t.indexOf("pistol") > -1 || t.indexOf("shotgun") > -1 || t.indexOf("rifle") > -1)) {
        match = true; hint = "A Gun was used to kill a Zombie — Resilient makes the Hero discard that Gun.";
      }
      if (name.indexOf("trip") > -1 && (t.indexOf("move") > -1 || t.indexOf("run") > -1 || t.indexOf("movement") > -1)) {
        match = true; hint = "Hero is moving — Trip! forces them to re-roll their movement.";
      }
      if (match) hits.push({ card: c, hint: hint });
    });
    return hits;
  };

  // Roll d6 fight/movement dice. Returns the rolls and the highest.
  Bot.prototype.roll = function (n) {
    const rolls = [];
    for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * 6));
    return { rolls: rolls, highest: Math.max.apply(null, rolls) };
  };

  LNOE.Bot = Bot;
})();

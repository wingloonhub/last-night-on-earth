# Last Night on Earth Game

A web app where a **Bot plays the Zombie side** of the board game *Last Night on Earth*, so every human can play as a Hero. It runs the Zombie turn, draws and explains Zombie cards, rolls dice, narrates the night like a horror movie (with a scary text-to-speech voice), and logs every turn.

It's a plain static website (HTML + CSS + JavaScript) — **no build step**. Push to GitHub and Vercel serves it.

## What's inside

| Tab | What it does |
|---|---|
| **Start Game** | Setup (base set, expansions, scenario, players & characters, turn order) → then live play: Sun Track, Hero turns with plain-English action help, and the Zombie Bot turn (draw → advise → play → move → roll → log → win/lose). |
| **Admin** | Zombie & Hero deck breakdowns per game set, the full Turn Log (every saved Zombie turn), and your Games Won / Lost record. |

Email **log in / sign up / forgot password** is built on Firebase Auth. Until you add your Firebase keys, the app runs in **Local Mode** (everything saved on the device) so you can try it right away.

## The Zombie deck (base game)

The base-game Zombie deck is fully loaded and verified from your photos in `Zombie Deck/Last night on earth (base)/` — **40 cards, 17 unique**, with exact copy counts and a plain-English "what to do" for each. See the Admin tab → Zombie Deck → *Last Night on Earth (Base)*.

The other sets (Timber Peak, Blood in the Forest, Growing Hunger, Survival of the Fittest) are wired up but empty — drop photos of those decks into a matching `Zombie Deck/<Set Name>/` folder and ask Claude to read them in, or edit `js/data/zombiedecks.js`.

## Go live (Firebase + Vercel)

1. **Firebase console** (https://console.firebase.google.com) → your project.
2. Project settings ⚙ → *Your apps* → Web app → copy the config values.
3. Paste them into **`js/firebase-config.js`**.
4. *Build → Authentication → Sign-in method* → enable **Email/Password**.
5. *Build → Firestore Database* → Create database.
6. Commit & push to GitHub. Vercel auto-deploys.

Suggested Firestore security rule (each user sees only their own data):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{doc=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Files

```
index.html              Page shell + script loading
styles.css              Horror theme
js/firebase-config.js   ← put your Firebase keys here
js/store.js             Auth + saving (Firebase, or Local Mode fallback)
js/tts.js               Scary Voice (text-to-speech)
js/zombieai.js          The Bot: deck, hand, advice, dice
js/setup.js             Setup phase
js/game.js              Sun Track, Hero turns, Zombie turns, logging, win/lose
js/admin.js             Deck breakdowns, Turn Log, Win/Loss record
js/auth.js              Login / sign-up / forgot-password screen
js/app.js               Boot + tab switching
js/data/                Game sets, scenarios, heroes, zombie decks, hero decks, narration
Zombie Deck/            Your original card photos (source for the base deck)
```

/* =========================================================================
   Store: a thin wrapper over Firebase (Auth + Firestore) that falls back to
   localStorage when Firebase isn't configured yet, so the app is usable in
   "Local Mode" out of the box.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const cfg = LNOE.firebaseConfig || {};
  const useFirebase = !!(cfg.apiKey && window.firebase);

  let auth = null, db = null;
  if (useFirebase) {
    firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
  }

  const LS = {
    get: function (k, fallback) {
      try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
      catch (e) { return fallback; }
    },
    set: function (k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };

  let authCb = null;
  function notifyLocal() {
    if (authCb) authCb(LS.get("lnoe_localUser", null));
  }

  const Store = {
    mode: useFirebase ? "firebase" : "local",

    /* ---------- AUTH ---------- */
    onAuth: function (cb) {
      authCb = cb;
      if (useFirebase) {
        auth.onAuthStateChanged(function (u) {
          cb(u ? { uid: u.uid, email: u.email } : null);
        });
      } else {
        cb(LS.get("lnoe_localUser", null));
      }
    },
    signIn: function (email, password) {
      if (useFirebase) return auth.signInWithEmailAndPassword(email, password);
      // local mode: accept any saved account
      const accounts = LS.get("lnoe_localAccounts", {});
      return new Promise(function (resolve, reject) {
        if (accounts[email] && accounts[email] === password) {
          const u = { uid: "local-" + email, email: email };
          LS.set("lnoe_localUser", u); resolve(u); notifyLocal();
        } else {
          reject(new Error("No account found, or wrong password. (Local Mode)"));
        }
      });
    },
    signUp: function (email, password) {
      if (useFirebase) return auth.createUserWithEmailAndPassword(email, password);
      const accounts = LS.get("lnoe_localAccounts", {});
      return new Promise(function (resolve, reject) {
        if (accounts[email]) return reject(new Error("That email already has an account. (Local Mode)"));
        accounts[email] = password; LS.set("lnoe_localAccounts", accounts);
        const u = { uid: "local-" + email, email: email };
        LS.set("lnoe_localUser", u); resolve(u); notifyLocal();
      });
    },
    resetPassword: function (email) {
      if (useFirebase) return auth.sendPasswordResetEmail(email);
      return new Promise(function (resolve, reject) {
        const accounts = LS.get("lnoe_localAccounts", {});
        if (!accounts[email]) return reject(new Error("No account with that email. (Local Mode)"));
        // Local mode can't email; just confirm.
        resolve();
      });
    },
    signOut: function () {
      if (useFirebase) return auth.signOut();
      localStorage.removeItem("lnoe_localUser");
      notifyLocal();
      return Promise.resolve();
    },
    currentUid: function () {
      if (useFirebase) return auth.currentUser ? auth.currentUser.uid : null;
      const u = LS.get("lnoe_localUser", null);
      return u ? u.uid : null;
    },

    /* ---------- TURN LOG ---------- */
    saveTurn: function (entry) {
      const uid = Store.currentUid() || "anon";
      if (useFirebase) {
        return db.collection("users").doc(uid).collection("turns").add(entry);
      }
      const key = "lnoe_turns_" + uid;
      const arr = LS.get(key, []);
      arr.push(entry); LS.set(key, arr);
      return Promise.resolve();
    },
    getTurns: function () {
      const uid = Store.currentUid() || "anon";
      if (useFirebase) {
        return db.collection("users").doc(uid).collection("turns")
          .orderBy("timestamp", "desc").limit(500).get()
          .then(function (snap) { return snap.docs.map(function (d) { return d.data(); }); });
      }
      return Promise.resolve((LS.get("lnoe_turns_" + uid, [])).slice().reverse());
    },

    /* ---------- GAME RESULTS (won / lost) ---------- */
    saveResult: function (result) {
      const uid = Store.currentUid() || "anon";
      if (useFirebase) {
        return db.collection("users").doc(uid).collection("games").add(result);
      }
      const key = "lnoe_games_" + uid;
      const arr = LS.get(key, []);
      arr.push(result); LS.set(key, arr);
      return Promise.resolve();
    },
    getResults: function () {
      const uid = Store.currentUid() || "anon";
      if (useFirebase) {
        return db.collection("users").doc(uid).collection("games")
          .orderBy("timestamp", "desc").limit(500).get()
          .then(function (snap) { return snap.docs.map(function (d) { return d.data(); }); });
      }
      return Promise.resolve((LS.get("lnoe_games_" + uid, [])).slice().reverse());
    },

    /* ---------- ADMIN DECK EDITS (local overrides) ---------- */
    saveDeckOverride: function (kind, setKey, cards) {
      LS.set("lnoe_deck_" + kind + "_" + setKey, cards);
    },
    getDeckOverride: function (kind, setKey) {
      return LS.get("lnoe_deck_" + kind + "_" + setKey, null);
    },

    /* ---------- SAVED GAMES (auto-save / resume) ----------
       Stored in localStorage so a game survives the app being closed. Keyed by
       user so each account keeps its own saves. Newest first, capped at 12. */
    saveGame: function (entry) {
      const uid = Store.currentUid() || "anon";
      const key = "lnoe_saves_" + uid;
      let arr = LS.get(key, []);
      arr = arr.filter(function (s) { return s.id !== entry.id; });
      arr.unshift(entry);
      if (arr.length > 12) arr = arr.slice(0, 12);
      LS.set(key, arr);
      return arr;
    },
    listGames: function () {
      const uid = Store.currentUid() || "anon";
      return LS.get("lnoe_saves_" + uid, []);
    },
    getGame: function (id) {
      return Store.listGames().find(function (s) { return s.id === id; }) || null;
    },
    deleteGame: function (id) {
      const uid = Store.currentUid() || "anon";
      const key = "lnoe_saves_" + uid;
      LS.set(key, LS.get(key, []).filter(function (s) { return s.id !== id; }));
    }
  };

  LNOE.Store = Store;
})();

/* =========================================================================
   LOCAL PREVIEW AUTO-LOGIN  (this file is git-ignored — it is NEVER committed
   or deployed, so your password stays on your machine only).

   It only loads when the app runs on localhost (the preview). On the live
   Vercel site this file does not exist and nothing here runs.

   👉 To turn on auto-login: put your password between the quotes below, save,
      and reload the preview. To turn it off again, blank the password out.
   ========================================================================= */
window.LNOE_DEV_LOGIN = {
  email: "wingloon@gmail.com",
  password: ""   // <-- put your account password here for local auto-login
};

(function () {
  function tryLogin(attempt) {
    const c = window.LNOE_DEV_LOGIN;
    if (!c || !c.email || !c.password) return;            // not configured → do nothing
    if (!window.LNOE || !window.LNOE.Store) {             // app not ready yet — wait
      if ((attempt || 0) < 40) return setTimeout(function () { tryLogin((attempt || 0) + 1); }, 50);
      return;
    }
    // Already signed in (e.g. Firebase restored the session)? Leave it alone.
    if (LNOE.Store.currentUid && LNOE.Store.currentUid()) return;
    LNOE.Store.signIn(c.email, c.password).catch(function (e) {
      console.warn("[dev-login] auto sign-in failed:", (e && e.message) || e);
    });
  }
  // Give Firebase a moment to restore any existing session first.
  setTimeout(function () { tryLogin(0); }, 400);
})();

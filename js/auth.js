/* =========================================================================
   Auth screen behaviour: log in, sign up, forgot password.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const $ = function (id) { return document.getElementById(id); };

  const errEl = $("auth-error"), infoEl = $("auth-info");
  function showErr(msg) { errEl.textContent = msg; errEl.hidden = false; infoEl.hidden = true; }
  function showInfo(msg) { infoEl.textContent = msg; infoEl.hidden = false; errEl.hidden = true; }
  function clearMsgs() { errEl.hidden = true; infoEl.hidden = true; }

  function show(which) {
    clearMsgs();
    ["form-login", "form-signup", "form-forgot"].forEach(function (id) {
      $(id).hidden = id !== which;
    });
  }

  function niceError(e) {
    const m = (e && e.message) || "Something went wrong.";
    return m.replace("Firebase:", "").replace(/\(auth.*\)\.?/, "").trim();
  }

  function init() {
    // Mode note
    const note = $("mode-note");
    if (LNOE.Store.mode === "firebase") {
      note.textContent = "Connected to your account in the cloud.";
    } else {
      note.textContent = "Local Mode: accounts and logs are saved on this device only. " +
        "Add your Firebase keys in js/firebase-config.js to go live.";
    }

    $("link-to-signup").onclick = function (e) { e.preventDefault(); show("form-signup"); };
    $("link-to-login").onclick = function (e) { e.preventDefault(); show("form-login"); };
    $("link-forgot").onclick = function (e) { e.preventDefault(); show("form-forgot"); };
    $("link-back-login").onclick = function (e) { e.preventDefault(); show("form-login"); };

    $("btn-login").onclick = function () {
      const email = $("login-email").value.trim();
      const pw = $("login-password").value;
      if (!email || !pw) return showErr("Enter your email and password.");
      this.disabled = true;
      LNOE.Store.signIn(email, pw)
        .catch(function (e) { showErr(niceError(e)); })
        .finally(function () { $("btn-login").disabled = false; });
    };

    $("btn-signup").onclick = function () {
      const email = $("signup-email").value.trim();
      const pw = $("signup-password").value;
      if (!email || pw.length < 6) return showErr("Enter an email and a password of at least 6 characters.");
      this.disabled = true;
      LNOE.Store.signUp(email, pw)
        .catch(function (e) { showErr(niceError(e)); })
        .finally(function () { $("btn-signup").disabled = false; });
    };

    $("btn-forgot").onclick = function () {
      const email = $("forgot-email").value.trim();
      if (!email) return showErr("Enter your email.");
      this.disabled = true;
      LNOE.Store.resetPassword(email)
        .then(function () {
          showInfo(LNOE.Store.mode === "firebase"
            ? "Reset link sent. Check your email."
            : "Account found. In Local Mode just sign up again with a new password.");
          show("form-forgot"); infoEl.hidden = false;
        })
        .catch(function (e) { showErr(niceError(e)); })
        .finally(function () { $("btn-forgot").disabled = false; });
    };

    // Enter key submits the visible form.
    document.querySelectorAll(".auth-card input").forEach(function (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        if (!$("form-login").hidden) $("btn-login").click();
        else if (!$("form-signup").hidden) $("btn-signup").click();
        else if (!$("form-forgot").hidden) $("btn-forgot").click();
      });
    });
  }

  LNOE.Auth = { init: init };
})();

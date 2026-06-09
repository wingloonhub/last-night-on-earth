/* =========================================================================
   App bootstrap: auth gate + tab routing. Loads last so all modules exist.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const $ = function (id) { return document.getElementById(id); };

  function switchTab(name) {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === name);
    });
    $("tab-start").hidden = name !== "start";
    $("tab-admin").hidden = name !== "admin";
    if (name === "admin") LNOE.Admin.render();
    if (name === "start") LNOE.Setup.ensureRendered();
  }

  function bootApp(user) {
    $("auth-screen").hidden = true;
    $("app").hidden = false;
    $("user-email").textContent = user.email || "Player";

    document.querySelectorAll(".tab").forEach(function (t) {
      t.onclick = function () { switchTab(t.dataset.tab); };
    });
    $("btn-logout").onclick = function () {
      LNOE.TTS.stop();
      if (LNOE.FX) LNOE.FX.stopAll();
      LNOE.Store.signOut();
    };

    LNOE.Setup.init();
    LNOE.Game.init();
    LNOE.Admin.init();
    switchTab("start");
  }

  function showAuth() {
    $("app").hidden = true;
    $("auth-screen").hidden = false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    LNOE.Auth.init();
    LNOE.Store.onAuth(function (user) {
      if (user) bootApp(user);
      else showAuth();
    });
  });

  // Allow other modules to flip tabs (e.g. Setup -> Game stays in Start tab).
  LNOE.switchTab = switchTab;
})();

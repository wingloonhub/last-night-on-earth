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
    $("tab-saves").hidden = name !== "saves";
    $("tab-admin").hidden = name !== "admin";
    if (name === "admin") LNOE.Admin.render();
    if (name === "saves") LNOE.Game.renderSaves();
    if (name === "start") LNOE.Setup.ensureRendered();
  }

  // Measure the sticky topbar so the sticky turn-banner can sit right below it
  // (the topbar can wrap to two lines on a phone, changing its height).
  function setTopbarHeight() {
    const tb = document.querySelector(".topbar");
    if (tb) document.documentElement.style.setProperty("--topbar-h", tb.offsetHeight + "px");
  }

  function bootApp(user) {
    $("auth-screen").hidden = true;
    $("app").hidden = false;
    $("user-email").textContent = user.email || "Player";
    setTopbarHeight();
    window.addEventListener("resize", setTopbarHeight);

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

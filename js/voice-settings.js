/* =========================================================================
   Voice Settings page — let the player choose the narrator voice.

   The available voices come from the DEVICE (Web Speech API), so the list
   differs by phone/computer and loads asynchronously. The choice is saved by
   the TTS module (localStorage) and remembered across sessions.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const SAMPLE = "The dead are coming. Bar the doors, load your gun, and pray for dawn.";

  function panel() { return document.getElementById("tab-voice"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render() {
    const el = panel();
    if (!el) return;
    const tts = LNOE.TTS;
    let h = '<div class="card"><h3>🗣 Narrator Voice</h3>';
    h += '<p class="section-help">Choose the voice that reads the story and the Zombie’s cards aloud. Voices come from your device, so the list differs by phone or computer. Your choice is saved automatically.</p>';

    if (!tts || !tts.available) {
      h += '<p class="empty-note">This browser has no speech voices, so the narrator can’t speak on this device. Try Chrome or Edge, or add voices in your system settings.</p></div>';
      el.innerHTML = h;
      return;
    }

    const voices = tts.voices() || [];
    const cur = tts.currentName() || "";

    if (!voices.length) {
      h += '<p class="hint">Loading your device’s voices… if none appear, tap “Refresh voices”. On some phones the list only loads after the first time the app speaks.</p>';
      h += '<div class="row mt"><button class="btn" id="vs-refresh">↻ Refresh voices</button>' +
        '<button class="btn btn-rust" id="vs-kick">🔊 Wake the voices</button></div></div>';
      el.innerHTML = h;
      bindEmpty();
      return;
    }

    h += '<div class="vs-list">';
    voices.forEach(function (v) {
      const sel = v.name === cur;
      h += '<label class="vs-row' + (sel ? " vs-on" : "") + '">' +
        '<input type="radio" name="vs-voice" value="' + esc(v.name) + '"' + (sel ? " checked" : "") + ">" +
        '<span class="vs-meta"><span class="vs-name">' + esc(v.name) + "</span>" +
        '<span class="vs-lang">' + esc(v.lang || "") + (v.default ? " · device default" : "") + "</span></span>" +
        '<button class="btn btn-sm vs-prev" data-name="' + esc(v.name) + '">▶ Preview</button>' +
        "</label>";
    });
    h += "</div>";
    h += '<p class="hint mt">Now using: <strong id="vs-cur">' + esc(cur || "(device default)") + "</strong></p>";
    h += '<div class="row mt"><button class="btn btn-green" id="vs-test">🔊 Hear the current voice</button>' +
      '<button class="btn" id="vs-refresh">↻ Refresh voices</button></div>';
    h += '<p class="hint mt">Tip: turn the scary voice on or off any time during a game with the 🔊 button in the top bar.</p>';
    h += "</div>";
    el.innerHTML = h;
    bind();
  }

  function bindEmpty() {
    const r = document.getElementById("vs-refresh");
    if (r) r.onclick = render;
    const k = document.getElementById("vs-kick");
    if (k) k.onclick = function () {
      // Speaking once forces some browsers to populate the voice list.
      LNOE.TTS.speak(" ");
      setTimeout(render, 400);
    };
  }

  function bind() {
    const el = panel();
    el.querySelectorAll('input[name="vs-voice"]').forEach(function (radio) {
      radio.onchange = function () {
        LNOE.TTS.setVoice(radio.value);          // save the choice
        const cur = document.getElementById("vs-cur");
        if (cur) cur.textContent = radio.value;
        el.querySelectorAll(".vs-row").forEach(function (row) {
          row.classList.toggle("vs-on", row.querySelector("input").checked);
        });
        LNOE.TTS.speakWith(radio.value, SAMPLE);  // hear it immediately
      };
    });
    el.querySelectorAll(".vs-prev").forEach(function (b) {
      b.onclick = function (e) { e.preventDefault(); LNOE.TTS.speakWith(b.dataset.name, SAMPLE); };
    });
    const test = document.getElementById("vs-test");
    if (test) test.onclick = function () { LNOE.TTS.speak(SAMPLE); };
    const rf = document.getElementById("vs-refresh");
    if (rf) rf.onclick = render;
  }

  // Re-render when the device finishes loading its voices, but only while the
  // Voice tab is the one on screen.
  if (LNOE.TTS && LNOE.TTS.onVoicesChanged) {
    LNOE.TTS.onVoicesChanged(function () {
      const el = panel();
      if (el && !el.hidden) render();
    });
  }

  LNOE.VoiceSettings = { render: render };
})();

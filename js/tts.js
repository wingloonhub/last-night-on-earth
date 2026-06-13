/* =========================================================================
   Scary Voice — text-to-speech using the browser's built-in Speech engine.
   Tuned low and slow for a horror-narrator feel. No internet or keys needed.

   The available voices come from the DEVICE, not the app, so they differ by
   phone/computer. We prefer a deep/male English voice when one exists, but the
   player can also pick any installed voice (remembered on the device).
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const synth = window.speechSynthesis;
  let voices = [];
  let preferredVoice = null;
  let chosenName = "";
  try { chosenName = localStorage.getItem("lnoe_voice") || ""; } catch (e) {}

  // Common male-voice name hints across Windows / Mac / iOS / Android.
  const MALE = /\b(male|daniel|alex|fred|arthur|aaron|oliver|rishi|george|james|david|mark|guy|thomas|gordon|lee|reed|eddy|albert|bruce|junior|ralph)\b/i;

  function pick() {
    voices = synth ? synth.getVoices() : [];
    if (!voices.length) { preferredVoice = null; return; }
    const en = voices.filter(function (v) { return /^en/i.test(v.lang); });
    const pool = en.length ? en : voices;
    if (chosenName) {
      const c = voices.find(function (v) { return v.name === chosenName; });
      if (c) { preferredVoice = c; return; }
    }
    preferredVoice =
      pool.find(function (v) { return MALE.test(v.name); }) ||
      pool.find(function (v) { return /en-GB/i.test(v.lang); }) ||
      pool[0] || voices[0] || null;
  }
  if (synth) { pick(); synth.onvoiceschanged = pick; }

  LNOE.TTS = {
    available: !!synth,
    speak: function (text, onend) {
      if (!synth || !text) { if (onend) onend(); return; }
      if (!preferredVoice) pick();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (preferredVoice) u.voice = preferredVoice;
      u.rate = 0.82;   // slow, deliberate
      u.pitch = 0.5;   // deep (helps make any voice sound more menacing)
      u.volume = 1;
      function unduck() { if (LNOE.FX && LNOE.FX.duck) LNOE.FX.duck(false); }
      if (LNOE.FX && LNOE.FX.duck) LNOE.FX.duck(true);   // quiet the music so the voice is clear
      u.onstart = function () { if (LNOE.FX && LNOE.FX.duck) LNOE.FX.duck(true); };
      u.onend = function () { unduck(); if (onend) onend(); };
      u.onerror = function () { unduck(); if (onend) onend(); };
      synth.speak(u);
    },
    stop: function () { if (synth) synth.cancel(); if (LNOE.FX && LNOE.FX.duck) LNOE.FX.duck(false); },

    // Speak a sample in a SPECIFIC voice (by name) without changing the saved
    // choice — used to preview voices on the Voice Settings page.
    speakWith: function (name, text) {
      if (!synth || !text) return;
      const v = (voices || []).find(function (x) { return x.name === name; });
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (v) u.voice = v;
      u.rate = 0.82; u.pitch = 0.5; u.volume = 1;
      synth.speak(u);
    },

    // Fire a callback whenever the device's voice list changes (loads async).
    onVoicesChanged: function (cb) {
      if (synth && synth.addEventListener) synth.addEventListener("voiceschanged", cb);
    },

    // English voices available on this device (for the picker).
    voices: function () {
      const en = (voices || []).filter(function (v) { return /^en/i.test(v.lang); });
      return en.length ? en : (voices || []);
    },
    currentName: function () { return preferredVoice ? preferredVoice.name : ""; },
    setVoice: function (name) {
      chosenName = name || "";
      try { localStorage.setItem("lnoe_voice", chosenName); } catch (e) {}
      pick();
    }
  };
})();

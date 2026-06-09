/* =========================================================================
   Scary Voice — text-to-speech using the browser's built-in Speech engine.
   Tuned low and slow for a horror-narrator feel. No internet or keys needed.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  const synth = window.speechSynthesis;
  let preferredVoice = null;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    // Prefer a deep / male English voice if available.
    preferredVoice =
      voices.find(function (v) { return /en.*(male|daniel|david|fred|george|james)/i.test(v.name + v.lang); }) ||
      voices.find(function (v) { return /en-GB/i.test(v.lang); }) ||
      voices.find(function (v) { return /^en/i.test(v.lang); }) ||
      voices[0] || null;
  }
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  LNOE.TTS = {
    available: !!synth,
    speak: function (text, onend) {
      if (!synth || !text) { if (onend) onend(); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (preferredVoice) u.voice = preferredVoice;
      u.rate = 0.82;   // slow, deliberate
      u.pitch = 0.55;  // deep
      u.volume = 1;
      if (onend) u.onend = onend;
      synth.speak(u);
    },
    stop: function () { if (synth) synth.cancel(); }
  };
})();

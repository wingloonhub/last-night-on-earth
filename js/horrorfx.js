/* =========================================================================
   Horror sound effects — generated live with the Web Audio API.
   No sound files needed (works on any static host). Provides a low ambience
   bed (drone + wind + heartbeat) plus one-shot stinger and zombie groan,
   designed to sit UNDER the spoken narration like a horror-movie score.
   ========================================================================= */
(function () {
  const LNOE = (window.LNOE = window.LNOE || {});
  let ctx = null;
  let ambience = null;       // { nodes:[], stop:fn }
  let heartbeatTimer = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noiseBuffer(c, seconds) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Waveshaper for a gritty, distorted "growl" on the zombie sounds.
  function distortion(c, amount) {
    const ws = c.createWaveShaper();
    const n = 1024, curve = new Float32Array(n), k = amount || 40;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
    }
    ws.curve = curve; ws.oversample = "4x";
    return ws;
  }

  // Optional custom audio files (see js/sounds-config.js). Returns a path or null.
  function fileFor(key) {
    const f = LNOE.soundFiles && LNOE.soundFiles[key];
    return f ? f : null;
  }
  const audioCache = {};
  function playFile(url, loop, vol) {
    try {
      let a = audioCache[url];
      if (!a) { a = new Audio(url); audioCache[url] = a; }
      a.loop = !!loop;
      a.volume = vol == null ? 1 : vol;
      try { a.currentTime = 0; } catch (e) {}
      a.play().catch(function () {});
      return a;
    } catch (e) { return null; }
  }
  // Smoothly fade an <audio> element's volume; pause it if fading to 0.
  function fadeAudio(el, target, ms) {
    if (!el) return;
    if (el._fade) clearInterval(el._fade);
    const steps = 20, start = el.volume;
    let i = 0;
    el._fade = setInterval(function () {
      i++;
      el.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(el._fade); el._fade = null; if (target === 0) { try { el.pause(); } catch (e) {} } }
    }, Math.max(20, ms / steps));
  }
  function musicLevels() {
    const m = LNOE.musicLevels;
    return (m && m.length) ? m : null;
  }

  // Four music stages that escalate as the night wears on (Sun Track progress).
  // Each gets faster, lower, more dissonant and louder toward dawn.
  const MUSIC_THEMES = [
    { // Stage 1 — uneasy calm (early night)
      chord: [110.0, 130.81, 164.81, 220.0], waves: ["triangle", "sine", "triangle", "sine"],
      melody: [440.0, 523.25, 659.25, 523.25, 415.30, 493.88], melodyMs: 1900,
      pulseMs: 3000, pulseHz: 95, master: 0.26, lp: 1500, detune: 3
    },
    { // Stage 2 — building dread
      chord: [110.0, 130.81, 155.56, 207.65], waves: ["sawtooth", "sine", "triangle", "sine"],
      melody: [466.16, 587.33, 698.46, 466.16, 415.30, 554.37], melodyMs: 1450,
      pulseMs: 2300, pulseHz: 84, master: 0.30, lp: 1700, detune: 6
    },
    { // Stage 3 — tense (the dead are everywhere)
      chord: [103.83, 138.59, 164.81, 207.65], waves: ["sawtooth", "sawtooth", "triangle", "sine"],
      melody: [466.16, 622.25, 698.46, 554.37, 466.16, 739.99], melodyMs: 1050,
      pulseMs: 1700, pulseHz: 72, master: 0.34, lp: 2000, detune: 9
    },
    { // Stage 4 — frantic (dawn approaches / overrun)
      chord: [98.0, 138.59, 185.0, 233.08], waves: ["sawtooth", "sawtooth", "sawtooth", "triangle"],
      melody: [493.88, 698.46, 830.61, 622.25, 493.88, 880.0, 739.99], melodyMs: 720,
      pulseMs: 1100, pulseHz: 64, master: 0.38, lp: 2600, detune: 13
    }
  ];

  const FX = {
    available: !!(window.AudioContext || window.webkitAudioContext),
    _stage: 0,
    _musicBaseVol: 0.3,   // normal background level (kept low so narration is clear)
    _ducked: false,

    // Start the looping ambience bed. Safe to call repeatedly.
    startAmbience: function () {
      const c = getCtx();
      if (!c || ambience) return;
      const out = c.createGain();
      out.gain.value = 0.0001;
      out.connect(c.destination);
      out.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 2.5); // slow fade-in

      const nodes = [out];

      // Low detuned drone (dread).
      [55, 55.4, 41.2].forEach(function (f) {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        const g = c.createGain();
        g.gain.value = 0.06;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 220;
        o.connect(g); g.connect(lp); lp.connect(out);
        o.start();
        nodes.push(o, g, lp);
      });

      // Filtered wind that swells and falls.
      const wind = c.createBufferSource();
      wind.buffer = noiseBuffer(c, 4); wind.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 0.7;
      const wg = c.createGain(); wg.gain.value = 0.05;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.08;
      const lfoG = c.createGain(); lfoG.gain.value = 0.04;
      lfo.connect(lfoG); lfoG.connect(wg.gain);
      wind.connect(bp); bp.connect(wg); wg.connect(out);
      wind.start(); lfo.start();
      nodes.push(wind, bp, wg, lfo, lfoG);

      // Heartbeat: two soft low thumps every ~1.4s.
      function thump(t, vol) {
        const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 60;
        const g = c.createGain(); g.gain.value = 0.0001;
        o.connect(g); g.connect(out);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.start(t); o.stop(t + 0.3);
      }
      heartbeatTimer = setInterval(function () {
        const t = c.currentTime;
        thump(t, 0.5); thump(t + 0.28, 0.32);
      }, 1400);

      ambience = {
        stop: function () {
          if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
          try { out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2); } catch (e) {}
          setTimeout(function () {
            nodes.forEach(function (n) { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
          }, 1300);
        }
      };
    },

    stopAmbience: function () {
      if (ambience) { ambience.stop(); ambience = null; }
    },

    // A sharp dissonant hit — great at the start of the narration.
    stinger: function () {
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime;
      const out = c.createGain(); out.gain.value = 0.5; out.connect(c.destination);
      [880, 932, 1245].forEach(function (f) {
        const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
        const g = c.createGain(); g.gain.value = 0.0001;
        o.connect(g); g.connect(out);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        o.start(t); o.stop(t + 1.5);
      });
      // noise crack
      const n = c.createBufferSource(); n.buffer = noiseBuffer(c, 0.4);
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2000;
      const ng = c.createGain(); ng.gain.value = 0.0001;
      n.connect(hp); hp.connect(ng); ng.connect(out);
      ng.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      n.start(t); n.stop(t + 0.4);
    },

    // A low, guttural, distorted zombie groan.
    groan: function () {
      const f = fileFor("groan"); if (f) { playFile(f, false, 0.9); return; }
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime;
      const out = c.createGain(); out.gain.value = 0.5; out.connect(c.destination);
      const dist = distortion(c, 25); dist.connect(out);
      const o = c.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(72, t);
      o.frequency.linearRampToValueAtTime(48, t + 0.6);
      o.frequency.linearRampToValueAtTime(60, t + 1.1);
      const wobble = c.createOscillator(); wobble.frequency.value = 6.5;
      const wobbleG = c.createGain(); wobbleG.gain.value = 6;
      wobble.connect(wobbleG); wobbleG.connect(o.frequency);
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 360; bp.Q.value = 3.5;
      const g = c.createGain(); g.gain.value = 0.0001;
      o.connect(bp); bp.connect(g); g.connect(dist);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      o.start(t); wobble.start(t); o.stop(t + 1.4); wobble.stop(t + 1.4);
    },

    // HERO WINS a fight: a heavy bat-crack whack on the zombie.
    whack: function () {
      const f = fileFor("heroHit"); if (f) { playFile(f, false, 1); return; }
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime;
      const out = c.createGain(); out.gain.value = 0.9; out.connect(c.destination);
      // sharp transient crack (the "thwack")
      const crack = c.createBufferSource(); crack.buffer = noiseBuffer(c, 0.06);
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
      const cg = c.createGain(); cg.gain.value = 0.0001;
      crack.connect(hp); hp.connect(cg); cg.connect(out);
      cg.gain.exponentialRampToValueAtTime(0.9, t + 0.003);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      crack.start(t); crack.stop(t + 0.06);
      // low body thump (the impact)
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      const g = c.createGain(); g.gain.value = 0.0001;
      o.connect(g); g.connect(out);
      g.gain.exponentialRampToValueAtTime(1.0, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.start(t); o.stop(t + 0.32);
      // bone crunch (the smack body)
      const n = c.createBufferSource(); n.buffer = noiseBuffer(c, 0.2);
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.7;
      const ng = c.createGain(); ng.gain.value = 0.0001;
      n.connect(bp); bp.connect(ng); ng.connect(out);
      ng.gain.exponentialRampToValueAtTime(0.8, t + 0.006);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      n.start(t); n.stop(t + 0.2);
    },

    // ZOMBIE WINS a fight: the zombie clip (quieter), then onDone() once it ends.
    feed: function (onDone) {
      let fired = false;
      function done() { if (fired) return; fired = true; if (onDone) onDone(); }
      const f = fileFor("zombieWin");
      if (f) {
        const a = playFile(f, false, 0.4);   // kept low so the narration after it is clear
        if (a) { a.onended = done; setTimeout(done, 7000); } else done();
        return;
      }
      const c = getCtx();
      if (!c) { done(); return; }
      setTimeout(done, 2200);   // procedural fallback length
      const t = c.currentTime;
      const out = c.createGain(); out.gain.value = 0.45; out.connect(c.destination);
      const dist = distortion(c, 60); dist.connect(out);
      // long, loud, distorted snarl/groan
      const o = c.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(80, t);
      o.frequency.linearRampToValueAtTime(44, t + 0.9);
      o.frequency.linearRampToValueAtTime(58, t + 1.7);
      const wob = c.createOscillator(); wob.frequency.value = 8;
      const wg = c.createGain(); wg.gain.value = 9; wob.connect(wg); wg.connect(o.frequency);
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 330; bp.Q.value = 2.5;
      const g = c.createGain(); g.gain.value = 0.0001;
      o.connect(bp); bp.connect(g); g.connect(dist);
      g.gain.exponentialRampToValueAtTime(0.95, t + 0.2);
      g.gain.setValueAtTime(0.95, t + 1.0);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.start(t); wob.start(t); o.stop(t + 1.9); wob.stop(t + 1.9);
      // wet chewing / tearing bursts
      for (let i = 0; i < 5; i++) {
        const bt = t + 0.35 + i * 0.27;
        const nn = c.createBufferSource(); nn.buffer = noiseBuffer(c, 0.18);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
        const gg = c.createGain(); gg.gain.value = 0.0001;
        nn.connect(lp); lp.connect(gg); gg.connect(out);
        gg.gain.exponentialRampToValueAtTime(0.55, bt + 0.02);
        gg.gain.exponentialRampToValueAtTime(0.0001, bt + 0.16);
        nn.start(bt); nn.stop(bt + 0.2);
      }
    },

    // Continuous, low horror background music for the whole game.
    // Uses a custom file if one is set; otherwise a generated ominous bed.
    startMusic: function (stage) {
      if (typeof stage === "number") FX._stage = stage;
      // Sun-Track music levels: crossfade to the file for the current stage.
      const levels = musicLevels();
      if (levels) {
        const url = levels[Math.min(FX._stage || 0, levels.length - 1)] || levels[0];
        if (FX._musicEl && FX._musicUrl === url) { FX._musicEl.play().catch(function () {}); return; }
        const old = FX._musicEl;
        const el = new Audio(url); el.loop = true; el.volume = 0;
        FX._musicEl = el; FX._musicUrl = url;
        const target = FX._ducked ? 0.1 : FX._musicBaseVol;
        el.play().then(function () { fadeAudio(el, target, 1800); }).catch(function () { /* needs a click first */ });
        if (old && old !== el) fadeAudio(old, 0, 1400);
        return;
      }
      const f = fileFor("music");
      if (f) {
        if (!FX._musicEl) { FX._musicEl = playFile(f, true, 0.45); }
        else { FX._musicEl.play().catch(function () {}); }
        return;
      }
      const c = getCtx();
      if (!c || FX._music) return;
      const T = MUSIC_THEMES[FX._stage] || MUSIC_THEMES[0];
      const out = c.createGain(); out.gain.value = 0.0001; out.connect(c.destination);
      out.gain.linearRampToValueAtTime(T.master, c.currentTime + 2.5);
      FX._musicGain = out; FX._musicGainBase = T.master;
      const nodes = [out];
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = T.lp; lp.connect(out);
      nodes.push(lp);
      const gains = [0.13, 0.11, 0.08, 0.06];
      T.chord.forEach(function (freq, i) {
        const o = c.createOscillator(); o.type = T.waves[i] || "sine"; o.frequency.value = freq;
        o.detune.value = ((i * 5) % (T.detune * 2 + 1)) - T.detune;
        const g = c.createGain(); g.gain.value = gains[i] || 0.05;
        o.connect(g); g.connect(lp); o.start();
        nodes.push(o, g);
      });
      const swell = c.createOscillator(); swell.frequency.value = 0.06;
      const swellG = c.createGain(); swellG.gain.value = 0.09;
      swell.connect(swellG); swellG.connect(out.gain); swell.start();
      nodes.push(swell, swellG);
      const pulse = setInterval(function () {
        const tt = c.currentTime;
        const po = c.createOscillator(); po.type = "sine"; po.frequency.value = T.pulseHz;
        const pg = c.createGain(); pg.gain.value = 0.0001;
        po.connect(pg); pg.connect(out);
        pg.gain.exponentialRampToValueAtTime(0.18, tt + 0.05);
        pg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.9);
        po.start(tt); po.stop(tt + 1);
      }, T.pulseMs);
      let mi = 0;
      const melody = setInterval(function () {
        const tt = c.currentTime;
        const freq = T.melody[mi % T.melody.length]; mi++;
        const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
        const g = c.createGain(); g.gain.value = 0.0001;
        const lp2 = c.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 2400;
        o.connect(g); g.connect(lp2); lp2.connect(out);
        g.gain.exponentialRampToValueAtTime(0.10, tt + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.5);
        o.start(tt); o.stop(tt + 1.6);
      }, T.melodyMs);
      FX._music = {
        stop: function () {
          clearInterval(pulse); clearInterval(melody);
          try { out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.5); } catch (e) {}
          setTimeout(function () {
            nodes.forEach(function (n) { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
          }, 1600);
        }
      };
    },
    stopMusic: function () {
      if (FX._musicEl) { try { FX._musicEl.pause(); } catch (e) {} FX._musicEl = null; FX._musicUrl = null; }
      if (FX._music) { FX._music.stop(); FX._music = null; }
      FX._musicGain = null;
    },
    // How many music stages exist (level files if provided, else the 4 generated themes).
    stageCount: function () { return musicLevels() ? musicLevels().length : MUSIC_THEMES.length; },
    // Switch to a music stage. Crossfades level files; restarts the generated bed.
    setStage: function (n) {
      const max = (musicLevels() ? musicLevels().length : MUSIC_THEMES.length) - 1;
      n = Math.max(0, Math.min(max, n | 0));
      if (n === FX._stage && (FX._music || FX._musicEl)) return;
      const wasPlaying = !!(FX._music || FX._musicEl);
      FX._stage = n;
      if (musicLevels()) { if (wasPlaying) FX.startMusic(n); return; }  // crossfades to the new level
      if (fileFor("music")) return;   // single custom track doesn't change by stage
      if (wasPlaying) { FX.stopMusic(); FX.startMusic(n); }
    },

    // Duck the background music down while the narrator speaks, then restore.
    duck: function (on) {
      FX._ducked = !!on;
      if (FX._musicEl) fadeAudio(FX._musicEl, on ? 0.1 : FX._musicBaseVol, on ? 350 : 1100);
      if (FX._musicGain) {
        try {
          const c = getCtx();
          FX._musicGain.gain.cancelScheduledValues(c.currentTime);
          FX._musicGain.gain.linearRampToValueAtTime(on ? 0.05 : FX._musicGainBase, c.currentTime + (on ? 0.35 : 1.1));
        } catch (e) {}
      }
    },

    // The zombie sound-effect clip (used on a Zombie win and on "horde").
    zombieSfx: function () {
      const f = fileFor("zombieWin");
      if (f) { playFile(f, false, 0.95); return; }
      FX.groan();
    },

    stopAll: function () { FX.stopAmbience(); FX.stopMusic(); }
  };

  LNOE.FX = FX;
})();

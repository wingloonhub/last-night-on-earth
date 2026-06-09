/* =========================================================================
   OPTIONAL custom audio.
   -------------------------------------------------------------------------
   By default the game makes all its sounds live in the browser (no files
   needed). If you want REAL recordings instead, drop audio files into the
   "sounds/" folder and put their paths below. Any left blank fall back to the
   built-in generated sound.

   IMPORTANT: only use music/sounds you are allowed to use — something you own,
   or royalty-free / Creative-Commons-0 (CC0) audio. Do NOT use the official
   Last Night on Earth soundtrack here; it is copyrighted. Good free sources:
     • https://pixabay.com/music/   (free, no attribution)
     • https://freesound.org/       (filter to CC0)
     • https://incompetech.com/     (Kevin MacLeod, CC-BY — credit required)

   Example once you've added files:
     music:     "sounds/horror-loop.mp3",
     zombieWin: "sounds/zombie-snarl.mp3",
     heroHit:   "sounds/bat-hit.mp3",
   ========================================================================= */
window.LNOE = window.LNOE || {};
window.LNOE.soundFiles = {
  music: "",       // looping background music
  zombieWin: "",   // played when a Zombie wins a fight
  heroHit: "",     // played when a Hero wins a fight
  groan: ""        // generic zombie groan (used during narration)
};

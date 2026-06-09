/* =========================================================================
   FIREBASE CONFIG  —  FILL THIS IN, then redeploy.
   -------------------------------------------------------------------------
   1. Go to https://console.firebase.google.com  → your project
   2. Project settings (gear icon) → "Your apps" → Web app → copy the config
   3. Paste the values below.
   4. In the Firebase console: Build → Authentication → Sign-in method →
      enable "Email/Password".
   5. Build → Firestore Database → Create database (start in test mode for now).

   Until you fill this in, the app still runs in LOCAL MODE (saved on this
   device only) so you can try everything before going live.
   ========================================================================= */
window.LNOE = window.LNOE || {};

window.LNOE.firebaseConfig = {
  apiKey: "AIzaSyAUAOs3qBRkw0hK0N9eC6yUt8ONOQbDdW4",
  authDomain: "last-night-on-earth.firebaseapp.com",
  projectId: "last-night-on-earth",
  storageBucket: "last-night-on-earth.firebasestorage.app",
  messagingSenderId: "260570501136",
  appId: "1:260570501136:web:55e191f918de5a82583a95"
};

// Leave this line as-is.
window.LNOE.firebaseReady = !!(window.LNOE.firebaseConfig && window.LNOE.firebaseConfig.apiKey);

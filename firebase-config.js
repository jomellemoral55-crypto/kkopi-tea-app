/* KKOPI.Tea - Firebase setup (shared by every page).
   Loaded from the CDN as ES modules, so no npm or bundler is needed.
   Add this to any page:  <script type="module" src="firebase-config.js"></script>   (use ../firebase-config.js inside phase folders)
   Use it in other module scripts:  import { auth, db, storage } from "./firebase-config.js";
   NOTE: this config is public by design. Security comes from Firebase Auth + Firestore/Storage security rules. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYWIkeqXQv61K-xv2vkYpq3FjRtxjhf_k",
  authDomain: "kkopitea-6de18.firebaseapp.com",
  projectId: "kkopitea-6de18",
  storageBucket: "kkopitea-6de18.firebasestorage.app",
  messagingSenderId: "653990982461",
  appId: "1:653990982461:web:790f573154209a228a4b54",
  measurementId: "G-G7CX06M719"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);          // login / register / reset password
export const db = getFirestore(app);       // products, orders, customers
export const storage = getStorage(app);    // product + profile images
export let analytics = null;               // only starts where the browser supports it
isSupported().then((ok) => { if (ok) analytics = getAnalytics(app); }).catch(() => {});

console.log("Firebase connected:", app.options.projectId);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBoJt1rNZBLkiMl25hIZhypFOXPbEmj_5Q",
  authDomain: "cs2-nades-91ce6.firebaseapp.com",
  projectId: "cs2-nades-91ce6",
  storageBucket: "cs2-nades-91ce6.firebasestorage.app",
  messagingSenderId: "483846987696",
  appId: "1:483846987696:web:89eefaa96eb24b924f8075",
  measurementId: "G-C79S13FNV4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

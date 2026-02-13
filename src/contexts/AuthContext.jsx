import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { updateStreak } from '../firebase/firestore';

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  async function createUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        nickname: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL || null,
        role: 'user',
        favorites: [],
        stats: { totalViewed: 0, learnedCount: 0 },
        createdAt: new Date().toISOString()
      });
    }
    // Обновляем стрик при каждом входе
    const updatedStreak = await updateStreak(user.uid);
    setStreak(updatedStreak);
    
    const updatedSnap = await getDoc(userRef);
    setUserData(updatedSnap.data());
  }

  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await createUserDocument(result.user);
    return result;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user);
    return result;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user);
    return result;
  }

  function logout() {
    setUserData(null);
    setStreak(null);
    return signOut(auth);
  }

  function isAdmin() { return userData?.role === 'admin'; }

  async function refreshUserData() {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) setUserData(userSnap.data());
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          // Обновляем стрик
          const updatedStreak = await updateStreak(user.uid);
          setStreak(updatedStreak);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { user, userData, streak, loading, signup, login, loginWithGoogle, logout, isAdmin, refreshUserData };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

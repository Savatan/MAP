import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc,
  arrayUnion, query, orderBy, where, increment
} from 'firebase/firestore';
import { db } from './config';
import { nanoid } from 'nanoid';

// ============ ИЗБРАННОЕ ============
export async function addToFavorites(userId, grenadeId, mapId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    favorites: arrayUnion({ grenadeId, mapId, addedAt: new Date().toISOString() })
  });
}

export async function removeFromFavorites(userId, grenadeId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const favorites = userSnap.data().favorites || [];
  const updatedFavorites = favorites.filter(f => f.grenadeId !== grenadeId);
  await updateDoc(userRef, { favorites: updatedFavorites });
}

export async function getFavorites(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return [];
    }
    const favorites = userSnap.data()?.favorites || [];

    return favorites
      .map(f => typeof f === 'string' ? f : (typeof f?.grenadeId === 'string' ? f.grenadeId : null))
      .filter(id => id && typeof id === 'string');
  } catch (error) {
    console.error('getFavorites error:', error);
    return [];
  }
}

export async function toggleFavorite(userId, grenadeId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const favorites = userSnap.data()?.favorites || [];
  
  let newFavorites;
  if (favorites.includes(grenadeId)) {
    newFavorites = favorites.filter(id => id !== grenadeId);
  } else {
    newFavorites = [...favorites, grenadeId];
  }
  
  await setDoc(userRef, { favorites: newFavorites }, { merge: true });
  return newFavorites;
}

export async function updateUserProfile(userId, data) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { ...data, updatedAt: new Date().toISOString() });
}

// ============ КАРТЫ ============
export async function getMaps() {
  const mapsCol = collection(db, 'maps');
  const mapsSnapshot = await getDocs(mapsCol);
 
  const maps = await Promise.all(
    mapsSnapshot.docs.map(async (docSnap) => {
      const mapData = docSnap.data();
      const grenadesQuery = query(
        collection(db, 'grenades'),
        where('mapId', '==', docSnap.id)
      );
      const grenadesSnap = await getDocs(grenadesQuery);
      
      return {
        id: docSnap.id,
        ...mapData,
        available: true,
        grenadeCount: grenadesSnap.size
      };
    })
  );
  
  return maps;
}

export async function getMap(mapId) {
  const mapRef = doc(db, 'maps', mapId);
  const mapSnap = await getDoc(mapRef);
  return mapSnap.exists() ? { id: mapSnap.id, ...mapSnap.data() } : null;
}

export async function addMap(mapData) {
  const mapsCol = collection(db, 'maps');
  return await addDoc(mapsCol, { ...mapData, createdAt: new Date().toISOString() });
}

export async function updateMap(mapId, mapData) {
  const mapRef = doc(db, 'maps', mapId);
  await updateDoc(mapRef, { ...mapData, updatedAt: new Date().toISOString() });
}

export async function deleteMap(mapId) {
  await deleteDoc(doc(db, 'maps', mapId));
}

// ============ РАСКИДКИ ============
export async function getGrenades(mapId) {
  const grenadesCol = collection(db, 'grenades');
  const q = query(grenadesCol, where('mapId', '==', mapId));
  const grenadesSnapshot = await getDocs(q);
  return grenadesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getGrenade(grenadeId) {
  const grenadeRef = doc(db, 'grenades', grenadeId);
  const grenadeSnap = await getDoc(grenadeRef);
  return grenadeSnap.exists() ? { id: grenadeSnap.id, ...grenadeSnap.data() } : null;
}

export const getGrenadeById = getGrenade;

export async function addGrenade(grenadeData) {
  const grenadesCol = collection(db, 'grenades');
  return await addDoc(grenadesCol, { ...grenadeData, createdAt: new Date().toISOString() });
}

export async function updateGrenade(grenadeId, grenadeData) {
  const grenadeRef = doc(db, 'grenades', grenadeId);
  await updateDoc(grenadeRef, { ...grenadeData, updatedAt: new Date().toISOString() });
}

export async function deleteGrenade(grenadeId) {
  await deleteDoc(doc(db, 'grenades', grenadeId));
}

export async function incrementGrenadeViews(grenadeId) {
  const grenadeRef = doc(db, 'grenades', grenadeId);
  await updateDoc(grenadeRef, { views: increment(1) });
}

// ============ ПОЛЬЗОВАТЕЛЬСКИЕ РАСКИДКИ ============
export async function getUserGrenades(userId) {
  const q = query(collection(db, 'userGrenades'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserGrenadeByShareLink(shareLink) {
  const q = query(collection(db, 'userGrenades'), where('shareLink', '==', shareLink));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function addUserGrenade(grenadeData) {
  const shareLink = nanoid(10);
  const grenadesCol = collection(db, 'userGrenades');
  return await addDoc(grenadesCol, { 
    ...grenadeData, 
    shareLink,
    createdAt: new Date().toISOString() 
  });
}

export async function updateUserGrenade(grenadeId, grenadeData) {
  const grenadeRef = doc(db, 'userGrenades', grenadeId);
  await updateDoc(grenadeRef, { ...grenadeData, updatedAt: new Date().toISOString() });
}

export async function deleteUserGrenade(grenadeId) {
  await deleteDoc(doc(db, 'userGrenades', grenadeId));
}

export async function getAllPublicUserGrenades() {
  const q = query(collection(db, 'userGrenades'), where('isPublic', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============ СТРИКИ И СТАТИСТИКА ============
export async function updateStreak(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data() || {};
  
  const now = new Date();
  const today = now.toDateString();
  const lastVisit = data.streak?.lastVisit ? new Date(data.streak.lastVisit) : null;
  const lastVisitDate = lastVisit?.toDateString();

  if (lastVisitDate === today) {
    return data.streak || { currentStreak: 1, maxStreak: 1, lastVisit: now.toISOString() };
  }
  
  let currentStreak = data.streak?.currentStreak || 0;
  let maxStreak = data.streak?.maxStreak || 0;
  
  if (lastVisit) {
    const diffTime = now.getTime() - lastVisit.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
 
      currentStreak += 1;
    } else if (diffDays > 1) {

      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }
  
  maxStreak = Math.max(maxStreak, currentStreak);
  
  const streak = {
    currentStreak,
    maxStreak,
    lastVisit: now.toISOString()
  };
  
  await setDoc(userRef, { streak }, { merge: true });
  return streak;
}

export async function updateUserStats(userId, statUpdate) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data() || {};
  const stats = data.stats || { totalViewed: 0, learnedCount: 0, favoriteMaps: [], favoriteTypes: [] };
  
  const newStats = { ...stats, ...statUpdate };
  await setDoc(userRef, { stats: newStats }, { merge: true });
  return newStats;
}

export async function incrementViewedCount(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data() || {};
  const stats = data.stats || { totalViewed: 0 };
  
  stats.totalViewed = (stats.totalViewed || 0) + 1;
  await setDoc(userRef, { stats }, { merge: true });
}

export async function getImportantGrenades(mapId, limit = 7) {
  const q = query(
    collection(db, 'grenades'),
    where('mapId', '==', mapId),
    orderBy('importance', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(g => (g.importance || 0) >= 3)
    .slice(0, limit);
}

// ============ АДМИН СТАТИСТИКА ============
export async function getAdminStats() {
  const [mapsSnap, grenadesSnap, usersSnap, userGrenadesSnap] = await Promise.all([
    getDocs(collection(db, 'maps')),
    getDocs(collection(db, 'grenades')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'userGrenades'))
  ]);
  
  const grenades = grenadesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const topGrenades = grenades
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10);
  
  return {
    totalMaps: mapsSnap.size,
    totalGrenades: grenadesSnap.size,
    totalUsers: usersSnap.size,
    totalUserGrenades: userGrenadesSnap.size,
    topGrenades
  };
}

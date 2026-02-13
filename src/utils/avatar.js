// Генерация уникальной аватарки через DiceBear API
export function generateAvatar(seed, style = 'bottts') {
  const encodedSeed = encodeURIComponent(seed || 'default');
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}&backgroundColor=ff6b00,ff8533,1a1a24`;
}

export function getUserAvatar(user, userData) {
  if (userData?.photoURL) return userData.photoURL;
  if (user?.photoURL) return user.photoURL;
  const seed = user?.uid || user?.email || 'anonymous';
  return generateAvatar(seed);
}

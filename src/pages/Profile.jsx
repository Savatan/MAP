import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getUserAvatar } from '../utils/avatar';
import { 
  getFavorites, getGrenadeById, updateUserProfile, 
  getUserGrenades, deleteUserGrenade, getMaps 
} from '../firebase/firestore';
import { uploadAvatar } from '../firebase/storage';
import { grenadeTypes } from '../data/grenades';
import './Profile.css';

const ACHIEVEMENTS = [
  { days: 3, icon: '🔥', title: 'Начинающий', desc: '3 дня подряд' },
  { days: 7, icon: '⭐', title: 'Упорный', desc: '7 дней подряд' },
  { days: 14, icon: '💎', title: 'Мастер', desc: '14 дней подряд' },
  { days: 30, icon: '👑', title: 'Легенда', desc: '30 дней подряд' },
];

export default function Profile() {
  const { user, userData, streak, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [favorites, setFavorites] = useState([]);
  const [myGrenades, setMyGrenades] = useState([]);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (userData?.nickname) {
      setNickname(userData.nickname);
    }
  }, [userData]);

  const loadData = async () => {
    try {
      const [favIds, userGrenades, mapsData] = await Promise.all([
        getFavorites(user.uid),
        getUserGrenades(user.uid),
        getMaps()
      ]);
      
      const favGrenades = await Promise.all(
        favIds.map(id => getGrenadeById(id))
      );
      setFavorites(favGrenades.filter(Boolean));
      setMyGrenades(userGrenades);
      setMaps(mapsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const photoURL = await uploadAvatar(user.uid, file);
      await updateUserProfile(user.uid, { photoURL });
      await refreshUserData();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка загрузки аватарки');
    }
    setUploading(false);
  };

  const saveNickname = async () => {
    if (!nickname.trim()) return;
    try {
      await updateUserProfile(user.uid, { nickname: nickname.trim() });
      await refreshUserData();
      setEditingNickname(false);
    } catch (error) {
      console.error('Error saving nickname:', error);
    }
  };

  const handleDeleteGrenade = async (grenadeId) => {
    if (!confirm('Удалить эту раскидку?')) return;
    try {
      await deleteUserGrenade(grenadeId);
      setMyGrenades(prev => prev.filter(g => g.id !== grenadeId));
    } catch (error) {
      console.error('Error deleting grenade:', error);
    }
  };

  const copyShareLink = (shareLink) => {
    const url = `${window.location.origin}/shared/${shareLink}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована!');
  };

  const getMapName = (mapId) => {
    return maps.find(m => m.id === mapId)?.name || 'Карта';
  };

  if (!user) return null;

  return (
    <div className="profile">
      {/* Шапка профиля */}
      <div className="profile-header">
        <div className="avatar-section">
          <motion.div 
            className="avatar-wrapper"
            whileHover={{ scale: 1.05 }}
            onClick={handleAvatarClick}
          >
            <img 
              src={getUserAvatar(user, userData)} 
              alt="Avatar" 
              className="profile-avatar"
            />
            <div className="avatar-overlay">
              {uploading ? '⏳' : '📷'}
            </div>
          </motion.div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            hidden
          />
        </div>
        
        <div className="user-info">
          <div className="nickname-row">
            {editingNickname ? (
              <div className="nickname-edit">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
                <button onClick={saveNickname}>✓</button>
                <button onClick={() => setEditingNickname(false)}>✕</button>
              </div>
            ) : (
              <h1 onClick={() => setEditingNickname(true)}>
                {userData?.nickname || user.displayName || user.email?.split('@')[0]}
                <span className="edit-hint">✏️</span>
              </h1>
            )}
          </div>
          <p className="email">{user.email}</p>
          
          <div className="badges">
            {userData?.role === 'admin' && (
              <span className="admin-badge">Администратор</span>
            )}
            {streak && streak.currentStreak > 0 && (
              <span className="streak-badge">
                🔥 {streak.currentStreak} {getDaysWord(streak.currentStreak)} подряд
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{favorites.length}</div>
          <div className="stat-label">Избранных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{myGrenades.length}</div>
          <div className="stat-label">Своих раскидок</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userData?.stats?.totalViewed || 0}</div>
          <div className="stat-label">Просмотрено</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{streak?.maxStreak || 0}</div>
          <div className="stat-label">Макс. стрик</div>
        </div>
      </div>

      {/* Достижения */}
      <section className="achievements-section">
        <h2>🏆 Достижения</h2>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map(achievement => {
            const unlocked = (streak?.maxStreak || 0) >= achievement.days;
            return (
              <div 
                key={achievement.days}
                className={`achievement ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <span className="achievement-icon">{achievement.icon}</span>
                <div className="achievement-info">
                  <span className="achievement-title">{achievement.title}</span>
                  <span className="achievement-desc">{achievement.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Табы */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'favorites' ? 'active' : ''}
          onClick={() => setActiveTab('favorites')}
        >
          ⭐ Избранное ({favorites.length})
        </button>
        <button 
          className={activeTab === 'my' ? 'active' : ''}
          onClick={() => setActiveTab('my')}
        >
          📝 Мои раскидки ({myGrenades.length})
        </button>
      </div>

      {/* Контент табов */}
      <AnimatePresence mode="wait">
        {activeTab === 'favorites' && (
          <motion.section 
            key="favorites"
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : favorites.length === 0 ? (
              <div className="empty-state">
                <p>У вас пока нет избранных раскидок</p>
                <p className="hint">Добавляйте раскидки в избранное на страницах карт</p>
              </div>
            ) : (
              <div className="grenades-grid">
                {favorites.map(grenade => (
                  <motion.div
                    key={grenade.id}
                    className="grenade-card"
                    whileHover={{ y: -5 }}
                  >
                    <div className="grenade-header">
                      <span className="type-icon">
                        {grenadeTypes[grenade.type]?.icon || '💣'}
                      </span>
                      <span className="type-name">
                        {grenadeTypes[grenade.type]?.name || grenade.type}
                      </span>
                    </div>
                    <h3>{grenade.name}</h3>
                    {grenade.throwPosition && (
                      <p className="throw-pos">📍 {grenade.throwPosition}</p>
                    )}
                    <div className="grenade-map">{getMapName(grenade.mapId)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {activeTab === 'my' && (
          <motion.section 
            key="my"
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="my-grenades-header">
              <Link to="/create-grenade" className="create-btn">
                + Создать раскидку
              </Link>
            </div>
            
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : myGrenades.length === 0 ? (
              <div className="empty-state">
                <p>У вас пока нет своих раскидок</p>
                <p className="hint">Создайте свою первую раскидку!</p>
              </div>
            ) : (
              <div className="grenades-grid">
                {myGrenades.map(grenade => (
                  <motion.div
                    key={grenade.id}
                    className="grenade-card my-grenade"
                    whileHover={{ y: -5 }}
                  >
                    <div className="grenade-header">
                      <span className="type-icon">
                        {grenadeTypes[grenade.type]?.icon || '💣'}
                      </span>
                      <span className="privacy-badge">
                        {grenade.isPublic ? '🌐 Публичная' : '🔒 Приватная'}
                      </span>
                    </div>
                    <h3>{grenade.name}</h3>
                    <div className="grenade-map">{getMapName(grenade.mapId)}</div>
                    {grenade.description && (
                      <p className="grenade-desc">{grenade.description}</p>
                    )}
                    <div className="grenade-actions">
                      <button 
                        className="share-btn"
                        onClick={() => copyShareLink(grenade.shareLink)}
                      >
                        🔗 Копировать ссылку
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteGrenade(grenade.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function getDaysWord(n) {
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return 'дней';
  if (last === 1) return 'день';
  if (last >= 2 && last <= 4) return 'дня';
  return 'дней';
}

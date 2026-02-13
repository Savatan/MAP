import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toggleFavorite, getFavorites } from '../firebase/firestore';
import { grenadeTypes, difficultyColors } from '../data/grenades';
import './GrenadeModal.css';

export default function GrenadeModal({ grenade, onClose }) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const images = grenade.images || [];
  const hasImages = images.length > 0;

  useEffect(() => {
    if (user) {
      getFavorites(user.uid).then(favs => {
        console.log('Favorites:', favs, 'Grenade ID:', grenade.id);
        setIsFavorite(favs.includes(grenade.id));
      }).catch(err => console.error('Error getting favorites:', err));
    }
  }, [user, grenade.id]);

  const handleFavorite = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const newFavorites = await toggleFavorite(user.uid, grenade.id);
      console.log('New favorites:', newFavorites);
      setIsFavorite(newFavorites.includes(grenade.id));
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Ошибка сохранения. Проверьте правила Firestore.');
    }
    setSaving(false);
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return url;
  };

  const videoUrl = getVideoEmbedUrl(grenade.video);
  const grenadeType = grenadeTypes[grenade.type] || { name: grenade.type, icon: '💣' };
  const difficultyColor = difficultyColors[grenade.difficulty] || '#888';

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="grenade-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={onClose}>✕</button>
          
          <div className="modal-header">
            <div className="grenade-badges">
              <span className="type-badge">
                {grenadeType.icon} {grenadeType.name}
              </span>
              <span 
                className="difficulty-badge"
                style={{ background: difficultyColor }}
              >
                {grenade.difficulty}
              </span>
            </div>
            <h2>{grenade.name}</h2>
            {grenade.throwPosition && (
              <p className="throw-position">📍 {grenade.throwPosition}</p>
            )}
          </div>

          <div className="modal-content">
            {hasImages && (
              <div className="image-gallery">
                <div className="main-image">
                  <img src={images[currentImageIndex]} alt={grenade.name} />
                  {images.length > 1 && (
                    <>
                      <button 
                        className="gallery-nav prev"
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === 0 ? images.length - 1 : prev - 1
                        )}
                      >
                        ‹
                      </button>
                      <button 
                        className="gallery-nav next"
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === images.length - 1 ? 0 : prev + 1
                        )}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="gallery-dots">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {videoUrl && (
              <div className="video-container">
                <iframe
                  src={videoUrl}
                  title={grenade.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {grenade.description && (
              <div className="description">
                <h4>Описание</h4>
                <p>{grenade.description}</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            {user ? (
              <motion.button 
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={handleFavorite}
                whileTap={{ scale: 0.95 }}
                disabled={saving}
              >
                {saving ? '⭐ Сохранение...' : (isFavorite ? '★ В избранном' : '☆ В избранное')}
              </motion.button>
            ) : (
              <span className="demo-notice">Войдите чтобы добавить в избранное</span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

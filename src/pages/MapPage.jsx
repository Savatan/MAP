import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMaps, getGrenades } from '../firebase/firestore';
import { grenadeTypes } from '../data/grenades';
import GrenadeModal from '../components/GrenadeModal';
import './MapPage.css';

export default function MapPage() {
  const { mapId } = useParams();
  const [map, setMap] = useState(null);
  const [grenades, setGrenades] = useState([]);
  const [selectedGrenade, setSelectedGrenade] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [mapId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const maps = await getMaps();
      const foundMap = maps.find(m => m.id === mapId);
      setMap(foundMap);

      const firebaseGrenades = await getGrenades(mapId);
      setGrenades(firebaseGrenades);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const filteredGrenades = filter === 'all' 
    ? grenades 
    : grenades.filter(g => g.type === filter);

  if (loading) {
    return <div className="map-page loading">Загрузка...</div>;
  }

  if (!map) {
    return (
      <div className="map-page not-found">
        <h2>Карта не найдена</h2>
        <Link to="/">← Вернуться на главную</Link>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <Link to="/" className="back-link">← Назад</Link>
        <h1>{map.name}</h1>
        <span className="grenade-total">{grenades.length} раскидок</span>
      </div>

      <div className="map-content">
        <aside className="sidebar">
          <h3>Фильтр</h3>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            {Object.entries(grenadeTypes).map(([key, { name, icon }]) => (
              <button
                key={key}
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {icon} {name}
              </button>
            ))}
          </div>

          <h3>Раскидки ({filteredGrenades.length})</h3>
          <div className="grenades-list">
            {filteredGrenades.map(grenade => (
              <motion.button
                key={grenade.id}
                className="grenade-item"
                onClick={() => setSelectedGrenade(grenade)}
                whileHover={{ x: 5 }}
              >
                <span className="grenade-icon">
                  {grenadeTypes[grenade.type]?.icon || '💣'}
                </span>
                <span className="grenade-name">{grenade.name}</span>
              </motion.button>
            ))}
          </div>
        </aside>

        <div className="radar-container">
          <div className="radar-wrapper">
            <img src={map.radar || map.image} alt={map.name} />
            {filteredGrenades.map(grenade => (
              <div
                key={grenade.id}
                className={`radar-point ${grenade.type}`}
                style={{
                  left: `${grenade.x}%`,
                  top: `${grenade.y}%`
                }}
                onClick={() => setSelectedGrenade(grenade)}
                title={`${grenade.name} (${grenade.x}%, ${grenade.y}%)`}
              >
                {grenadeTypes[grenade.type]?.icon || '💣'}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedGrenade && (
          <GrenadeModal 
            grenade={selectedGrenade} 
            onClose={() => setSelectedGrenade(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

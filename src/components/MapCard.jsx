import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './MapCard.css';

export default function MapCard({ map, index }) {
  const isAvailable = map.available !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {isAvailable ? (
        <Link to={`/map/${map.id}`} className="map-card">
          <div 
            className="map-image"
            style={{ backgroundImage: `url(${map.image})` }}
          >
            <div className="map-overlay" />
          </div>
          <div className="map-info">
            <h3>{map.name}</h3>
            <span className="grenade-count">{map.grenadeCount || 0} раскидок</span>
          </div>
        </Link>
      ) : (
        <div className="map-card disabled">
          <div 
            className="map-image"
            style={{ backgroundImage: `url(${map.image})` }}
          >
            <div className="map-overlay" />
            <span className="coming-soon">Скоро</span>
          </div>
          <div className="map-info">
            <h3>{map.name}</h3>
            <span className="grenade-count">В разработке</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

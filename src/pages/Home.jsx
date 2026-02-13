import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMaps } from '../firebase/firestore';
import MapCard from '../components/MapCard';
import './Home.css';

export default function Home() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      const firebaseMaps = await getMaps();
      setMaps(firebaseMaps);
    } catch (error) {
      console.error('Ошибка загрузки карт:', error);
    }
    setLoading(false);
  };

  return (
    <div className="home">
      <section className="hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>
            Раскидки гранат
            <span className="accent"> CS2</span>
          </h1>
          <p>Изучай лучшие позиции для смоков, флешек и молотовов на всех картах</p>
        </motion.div>
        <div className="hero-decoration">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
      </section>

      <section className="maps-section">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Выбери карту
        </motion.h2>
        
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <div className="maps-grid">
            {maps.map((map, index) => (
              <MapCard key={map.id} map={map} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

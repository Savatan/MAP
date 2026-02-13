import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMaps, addMap, updateMap, deleteMap, getGrenades, addGrenade, updateGrenade, deleteGrenade } from '../firebase/firestore';
import { uploadMapImage, uploadGrenadeImage } from '../firebase/storage';
import { grenadeTypes } from '../data/grenades';
import './Admin.css';

export default function Admin() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const radarRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('maps');
  const [maps, setMaps] = useState([]);
  const [grenades, setGrenades] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState('');
  const [selectedMap, setSelectedMap] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [mapForm, setMapForm] = useState({ name: '', image: '', radar: '' });
  const [grenadeForm, setGrenadeForm] = useState({
    name: '', type: 'smoke', x: 50, y: 50, difficulty: 'Легко',
    throwPosition: '', description: '', video: '', images: []
  });
  const [editingMap, setEditingMap] = useState(null);
  const [editingGrenade, setEditingGrenade] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || userData?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, userData, navigate]);

  const loadData = async () => {
    try {
      const mapsData = await getMaps();
      setMaps(mapsData);
      
      // Если нет выбранной карты или она удалена - выбираем первую
      if (mapsData.length > 0) {
        const currentMapExists = mapsData.find(m => m.id === selectedMapId);
        if (!currentMapExists) {
          setSelectedMapId(mapsData[0].id);
          setSelectedMap(mapsData[0]);
        } else {
          // Обновляем данные текущей карты
          setSelectedMap(currentMapExists);
        }
      }
    } catch (error) {
      console.error('Error loading maps:', error);
    }
    setLoading(false);
  };

  // Обновляем selectedMap при смене выбранной карты
  useEffect(() => {
    if (selectedMapId && maps.length > 0) {
      const map = maps.find(m => m.id === selectedMapId);
      if (map) {
        setSelectedMap(map);
        loadGrenades();
      }
    }
  }, [selectedMapId]);

  const loadGrenades = async () => {
    try {
      const grenadesData = await getGrenades(selectedMapId);
      setGrenades(grenadesData);
    } catch (error) {
      console.error('Error loading grenades:', error);
    }
  };

  // Клик по радару для установки позиции
  const handleRadarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const roundedX = Math.round(x * 10) / 10; // 1 decimal place
    const roundedY = Math.round(y * 10) / 10;
    console.log(`Click: ${roundedX}%, ${roundedY}%`);
    setGrenadeForm(prev => ({ ...prev, x: roundedX, y: roundedY }));
  };

  // Map handlers
  const handleMapImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMapImage(file);
      setMapForm(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Ошибка загрузки. Используйте URL.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleMapSubmit = async (e) => {
    e.preventDefault();
    if (!mapForm.name.trim()) {
      alert('Введите название карты');
      return;
    }
    try {
      if (editingMap) {
        await updateMap(editingMap.id, mapForm);
      } else {
        await addMap(mapForm);
      }
      setMapForm({ name: '', image: '', radar: '' });
      setEditingMap(null);
      loadData();
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Ошибка сохранения: ' + error.message);
    }
  };

  const handleDeleteMap = async (mapId) => {
    if (!confirm('Удалить карту и все её раскидки?')) return;
    try {
      await deleteMap(mapId);
      loadData();
    } catch (error) {
      console.error('Error deleting map:', error);
    }
  };

  // Grenade handlers
  const handleGrenadeImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(file => uploadGrenadeImage(file)));
      setGrenadeForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Ошибка загрузки изображений');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleGrenadeSubmit = async (e) => {
    e.preventDefault();
    if (!grenadeForm.name.trim()) {
      alert('Введите название раскидки');
      return;
    }
    try {
      const data = { ...grenadeForm, mapId: selectedMapId };
      if (editingGrenade) {
        await updateGrenade(editingGrenade.id, data);
      } else {
        await addGrenade(data);
      }
      setGrenadeForm({
        name: '', type: 'smoke', x: 50, y: 50, difficulty: 'Легко',
        throwPosition: '', description: '', video: '', images: []
      });
      setEditingGrenade(null);
      loadGrenades();
    } catch (error) {
      console.error('Error saving grenade:', error);
      alert('Ошибка сохранения: ' + error.message);
    }
  };

  const handleEditGrenade = (grenade) => {
    setEditingGrenade(grenade);
    setGrenadeForm({
      name: grenade.name,
      type: grenade.type,
      x: grenade.x,
      y: grenade.y,
      difficulty: grenade.difficulty || 'Легко',
      throwPosition: grenade.throwPosition || '',
      description: grenade.description || '',
      video: grenade.video || '',
      images: grenade.images || []
    });
  };

  const handleDeleteGrenade = async (grenadeId) => {
    if (!confirm('Удалить раскидку?')) return;
    try {
      await deleteGrenade(grenadeId);
      loadGrenades();
    } catch (error) {
      console.error('Error deleting grenade:', error);
    }
  };

  if (loading) {
    return <div className="admin loading">Загрузка...</div>;
  }

  return (
    <div className="admin">
      <h1>🛠️ Админ панель</h1>

      <div className="tabs">
        <button className={activeTab === 'maps' ? 'active' : ''} onClick={() => setActiveTab('maps')}>
          📍 Карты
        </button>
        <button className={activeTab === 'grenades' ? 'active' : ''} onClick={() => setActiveTab('grenades')}>
          💣 Раскидки
        </button>
      </div>

      {activeTab === 'maps' && (
        <section className="admin-section">
          <h2>{editingMap ? '✏️ Редактировать карту' : '➕ Добавить карту'}</h2>
          <form onSubmit={handleMapSubmit} className="admin-form">
            <input
              type="text"
              placeholder="Название карты (например: Mirage)"
              value={mapForm.name}
              onChange={(e) => setMapForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            
            <div className="upload-group">
              <label>Фон карты</label>
              <input
                type="url"
                placeholder="URL изображения"
                value={mapForm.image}
                onChange={(e) => setMapForm(prev => ({ ...prev, image: e.target.value }))}
              />
              <div className="file-upload">
                <span>или загрузить:</span>
                <input type="file" accept="image/*" onChange={(e) => handleMapImageUpload(e, 'image')} disabled={uploading} />
              </div>
              {mapForm.image && <img src={mapForm.image} alt="Preview" className="preview" />}
            </div>

            <div className="upload-group">
              <label>Радар карты</label>
              <input
                type="url"
                placeholder="URL радара"
                value={mapForm.radar}
                onChange={(e) => setMapForm(prev => ({ ...prev, radar: e.target.value }))}
              />
              <div className="file-upload">
                <span>или загрузить:</span>
                <input type="file" accept="image/*" onChange={(e) => handleMapImageUpload(e, 'radar')} disabled={uploading} />
              </div>
              {mapForm.radar && <img src={mapForm.radar} alt="Radar" className="preview" />}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? '⏳ Загрузка...' : (editingMap ? '💾 Сохранить' : '➕ Добавить')}
              </button>
              {editingMap && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingMap(null); setMapForm({ name: '', image: '', radar: '' }); }}>
                  ❌ Отмена
                </button>
              )}
            </div>
          </form>

          <h2>📋 Список карт ({maps.length})</h2>
          <div className="items-list">
            {maps.map(map => (
              <div key={map.id} className="item-card">
                {map.image && <img src={map.image} alt={map.name} />}
                <div className="item-info">
                  <h3>{map.name}</h3>
                  <span>{map.grenadeCount || 0} раскидок</span>
                </div>
                <div className="item-actions">
                  <button onClick={() => { setEditingMap(map); setMapForm({ name: map.name, image: map.image || '', radar: map.radar || '' }); }}>✏️</button>
                  <button onClick={() => handleDeleteMap(map.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {maps.length === 0 && <p className="empty">Карт пока нет. Добавьте первую!</p>}
          </div>
        </section>
      )}

      {activeTab === 'grenades' && (
        <section className="admin-section grenades-section">
          <div className="map-selector">
            <label>Карта:</label>
            <select value={selectedMapId} onChange={(e) => setSelectedMapId(e.target.value)}>
              {maps.map(map => (
                <option key={map.id} value={map.id}>{map.name}</option>
              ))}
            </select>
          </div>

          {maps.length === 0 ? (
            <p className="empty">Сначала добавьте карту во вкладке "Карты"</p>
          ) : (
            <div className="grenades-editor">
              {/* Радар с кликабельной позицией */}
              <div className="radar-editor">
                <h3>📍 Кликните на радар для выбора позиции</h3>
                {selectedMap?.radar || selectedMap?.image ? (
                  <div className="radar-wrapper" ref={radarRef} onClick={handleRadarClick}>
                    <img src={selectedMap.radar || selectedMap.image} alt="Radar" />
                    
                    {/* Существующие раскидки */}
                    {grenades.map(g => (
                      <div
                        key={g.id}
                        className={`radar-point existing ${editingGrenade?.id === g.id ? 'editing' : ''}`}
                        style={{ left: `${g.x}%`, top: `${g.y}%` }}
                        onClick={(e) => { e.stopPropagation(); handleEditGrenade(g); }}
                        title={g.name}
                      >
                        {grenadeTypes[g.type]?.icon || '💣'}
                      </div>
                    ))}
                    
                    {/* Текущая позиция новой раскидки */}
                    <div
                      className="radar-point current"
                      style={{ left: `${grenadeForm.x}%`, top: `${grenadeForm.y}%` }}
                    >
                      {grenadeTypes[grenadeForm.type]?.icon || '💣'}
                    </div>
                  </div>
                ) : (
                  <p className="no-radar">Загрузите радар для этой карты</p>
                )}
              </div>

              {/* Форма раскидки */}
              <div className="grenade-form-wrapper">
                <h3>{editingGrenade ? '✏️ Редактировать' : '➕ Новая раскидка'}</h3>
                <form onSubmit={handleGrenadeSubmit} className="admin-form">
                  <input
                    type="text"
                    placeholder="Название (например: Смок на окно)"
                    value={grenadeForm.name}
                    onChange={(e) => setGrenadeForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />

                  <div className="form-row">
                    <select value={grenadeForm.type} onChange={(e) => setGrenadeForm(prev => ({ ...prev, type: e.target.value }))}>
                      {Object.entries(grenadeTypes).map(([key, { name, icon }]) => (
                        <option key={key} value={key}>{icon} {name}</option>
                      ))}
                    </select>
                    <select value={grenadeForm.difficulty} onChange={(e) => setGrenadeForm(prev => ({ ...prev, difficulty: e.target.value }))}>
                      <option value="Легко">🟢 Легко</option>
                      <option value="Средне">🟡 Средне</option>
                      <option value="Сложно">🔴 Сложно</option>
                    </select>
                  </div>

                  <div className="position-display">
                    📍 Позиция: X: {grenadeForm.x}%, Y: {grenadeForm.y}%
                  </div>

                  <input
                    type="text"
                    placeholder="Откуда бросать (например: T Spawn)"
                    value={grenadeForm.throwPosition}
                    onChange={(e) => setGrenadeForm(prev => ({ ...prev, throwPosition: e.target.value }))}
                  />

                  <textarea
                    placeholder="Описание раскидки..."
                    value={grenadeForm.description}
                    onChange={(e) => setGrenadeForm(prev => ({ ...prev, description: e.target.value }))}
                  />

                  <input
                    type="url"
                    placeholder="Ссылка на YouTube видео"
                    value={grenadeForm.video}
                    onChange={(e) => setGrenadeForm(prev => ({ ...prev, video: e.target.value }))}
                  />

                  <div className="upload-group">
                    <label>Скриншоты</label>
                    <input type="file" accept="image/*" multiple onChange={handleGrenadeImageUpload} disabled={uploading} />
                    {grenadeForm.images.length > 0 && (
                      <div className="images-preview">
                        {grenadeForm.images.map((url, i) => (
                          <div key={i} className="image-item">
                            <img src={url} alt="" />
                            <button type="button" onClick={() => setGrenadeForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={uploading}>
                      {editingGrenade ? '💾 Сохранить' : '➕ Добавить'}
                    </button>
                    {editingGrenade && (
                      <button type="button" className="btn-secondary" onClick={() => {
                        setEditingGrenade(null);
                        setGrenadeForm({ name: '', type: 'smoke', x: 50, y: 50, difficulty: 'Легко', throwPosition: '', description: '', video: '', images: [] });
                      }}>
                        ❌ Отмена
                      </button>
                    )}
                  </div>
                </form>

                <h3>📋 Раскидки на карте ({grenades.length})</h3>
                <div className="grenades-list-admin">
                  {grenades.map(g => (
                    <div key={g.id} className={`grenade-item-admin ${editingGrenade?.id === g.id ? 'editing' : ''}`}>
                      <span className="icon">{grenadeTypes[g.type]?.icon}</span>
                      <span className="name">{g.name}</span>
                      <div className="actions">
                        <button onClick={() => handleEditGrenade(g)}>✏️</button>
                        <button onClick={() => handleDeleteGrenade(g.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {grenades.length === 0 && <p className="empty">Раскидок пока нет</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

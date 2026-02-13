export const demoGrenades = [
  { id: 1, mapId: 'mirage', type: 'smoke', name: 'Смок на Window', x: 45, y: 62, throwPosition: 'T Spawn', description: 'Закрывает обзор снайперу на окне.', difficulty: 'Легко' },
  { id: 2, mapId: 'mirage', type: 'smoke', name: 'Смок на CT', x: 52, y: 35, throwPosition: 'A Ramp', description: 'Блокирует ротацию CT через коннектор.', difficulty: 'Средне' },
  { id: 3, mapId: 'mirage', type: 'smoke', name: 'Смок на Jungle', x: 38, y: 42, throwPosition: 'T Ramp', description: 'Закрывает джангл для выхода на А.', difficulty: 'Легко' },
  { id: 4, mapId: 'mirage', type: 'flash', name: 'Флешка на A Site', x: 48, y: 38, throwPosition: 'Palace', description: 'Ослепляет защитников на А плэнте.', difficulty: 'Легко' },
  { id: 5, mapId: 'mirage', type: 'molotov', name: 'Молотов под балкон', x: 55, y: 45, throwPosition: 'A Main', description: 'Выкуривает из-под балкона.', difficulty: 'Средне' },
  { id: 6, mapId: 'mirage', type: 'smoke', name: 'Смок на Short', x: 60, y: 50, throwPosition: 'Mid', description: 'Блокирует шорт при захвате мида.', difficulty: 'Сложно' },
  { id: 7, mapId: 'mirage', type: 'he', name: 'HE на Ticket', x: 35, y: 55, throwPosition: 'T Spawn', description: 'Урон на Ticket Booth.', difficulty: 'Средне' },
  { id: 8, mapId: 'mirage', type: 'flash', name: 'Поп-флешка на B', x: 25, y: 70, throwPosition: 'B Apartments', description: 'Флешка для выхода на B.', difficulty: 'Сложно' }
];

export const grenadeTypes = {
  smoke: { name: 'Smoke', color: '#8B8B8B', icon: '💨' },
  flash: { name: 'Flashbang', color: '#FFD700', icon: '💥' },
  molotov: { name: 'Molotov', color: '#FF4500', icon: '🔥' },
  he: { name: 'HE Grenade', color: '#32CD32', icon: '💣' }
};

export const difficultyColors = {
  'Легко': '#4CAF50',
  'Средне': '#FF9800',
  'Сложно': '#f44336'
};

const NodeCache = require('node-cache');
const crypto = require('crypto');


const aiCache = new NodeCache({
  stdTTL: 86400, // 24 години в секундах
  checkperiod: 3600, // Перевірка застарілих записів кожну годину
  maxKeys: 1000 // Максимум 1000 кешованих відповідей
});

/**
 * Генерує унікальний ключ для кешу на основі типу запиту та даних
 * @param {string} type - Тип AI запиту (product, daily, weekly, suggestions)
 * @param {object} data - Дані запиту
 * @returns {string} MD5 хеш ключа
 */
const generateCacheKey = (type, data) => {
  const normalized = JSON.stringify(data);
  const hash = crypto.createHash('md5').update(normalized).digest('hex');
  return `ai:${type}:${hash}`;
};

/**
 * Отримує кешовану AI відповідь
 * @param {string} type - Тип AI запиту
 * @param {object} data - Дані запиту
 * @returns {object|null} Кешована відповідь або null
 */
const getCachedResponse = (type, data) => {
  const key = generateCacheKey(type, data);
  const cached = aiCache.get(key);

  if (cached) {
    console.log(`✓ AI cache HIT for ${type} (key: ${key.substring(0, 20)}...)`);
    return cached;
  }

  console.log(`✗ AI cache MISS for ${type}`);
  return null;
};

/**
 * Зберігає AI відповідь в кеш
 * @param {string} type - Тип AI запиту
 * @param {object} data - Дані запиту
 * @param {object} response - AI відповідь для кешування
 */
const setCachedResponse = (type, data, response) => {
  const key = generateCacheKey(type, data);
  const success = aiCache.set(key, response);

  if (success) {
    console.log(`✓ AI response cached for ${type} (TTL: 24h)`);
  } else {
    console.warn(`✗ Failed to cache AI response for ${type}`);
  }
};

/**
 * Очищає кеш для конкретного типу або весь кеш
 * @param {string} type - Опціонально: тип для очищення
 */
const clearCache = (type = null) => {
  if (type) {
    const keys = aiCache.keys().filter(k => k.startsWith(`ai:${type}:`));
    aiCache.del(keys);
    console.log(`🗑️ Cleared ${keys.length} cache entries for ${type}`);
  } else {
    aiCache.flushAll();
    console.log('🗑️ Cleared all AI cache');
  }
};

/**
 * Отримує статистику кешу
 * @returns {object} Статистика кешу
 */
const getCacheStats = () => {
  const stats = aiCache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%' : '0%'
  };
};

module.exports = {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats
};

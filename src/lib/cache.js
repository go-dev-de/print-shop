// src/lib/cache.js
// Простая система кэширования в памяти с TTL

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 минут по умолчанию
    
    // Автоматическая очистка устаревших записей каждые 2 минуты
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  // Установка значения в кэш
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, value);
    this.ttl.set(key, expiresAt);
    
    console.log(`💾 Cache SET: ${key} (expires in ${ttl/1000}s)`);
  }

  // Получение значения из кэша
  get(key) {
    const expiresAt = this.ttl.get(key);
    
    if (!expiresAt) {
      return null; // Ключ не существует
    }
    
    if (Date.now() > expiresAt) {
      // Запись устарела, удаляем
      this.delete(key);
      return null;
    }
    
    console.log(`📖 Cache HIT: ${key}`);
    return this.cache.get(key);
  }

  // Проверка существования ключа
  has(key) {
    const expiresAt = this.ttl.get(key);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Удаление ключа
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
  }

  // Очистка всего кэша
  clear() {
    this.cache.clear();
    this.ttl.clear();
    console.log('🧹 Cache CLEAR: all entries removed');
  }

  // Очистка устаревших записей
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, expiresAt] of this.ttl.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cache CLEANUP: ${cleanedCount} expired entries removed`);
    }
  }

  // Получение статистики кэша
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage?.() || 'N/A'
    };
  }
}

// Создаем глобальный экземпляр кэша
const cache = new MemoryCache();

export default cache; 
// src/components/useProductsCache.js
// Хук для умного кэширования товаров на клиентской стороне

import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_KEY = 'printshop_products_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 минут

export function useProductsCache() {
  const [cache, setCache] = useState(new Map());
  const [lastUpdate, setLastUpdate] = useState(0);
  const cacheRef = useRef(new Map());
  
  // Загрузка кэша из localStorage
  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Проверяем TTL
        if (now - timestamp < CACHE_TTL) {
          cacheRef.current = new Map(Object.entries(data));
          setCache(cacheRef.current);
          setLastUpdate(timestamp);
          console.log('📖 Products cache loaded from localStorage');
          return true;
        } else {
          console.log('⏰ Products cache expired, clearing...');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading products cache:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, []);

  // Сохранение кэша в localStorage
  const saveCache = useCallback((data) => {
    try {
      const cacheData = {
        data: Object.fromEntries(cacheRef.current),
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Products cache saved to localStorage');
    } catch (error) {
      console.error('Error saving products cache:', error);
    }
  }, []);

  // Получение данных из кэша
  const getCachedData = useCallback((key) => {
    return cacheRef.current.get(key);
  }, []);

  // Установка данных в кэш
  const setCachedData = useCallback((key, data) => {
    cacheRef.current.set(key, data);
    setCache(new Map(cacheRef.current));
    
    // Автосохранение в localStorage
    setTimeout(() => saveCache(), 100);
  }, [saveCache]);

  // Проверка существования данных в кэше
  const hasCachedData = useCallback((key) => {
    return cacheRef.current.has(key);
  }, []);

  // Очистка кэша
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setCache(new Map());
    localStorage.removeItem(CACHE_KEY);
    setLastUpdate(0);
    console.log('🧹 Products cache cleared');
  }, []);

  // Получение статистики кэша
  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys()),
      lastUpdate: new Date(lastUpdate).toLocaleString(),
      age: lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : 0
    };
  }, [lastUpdate]);

  // Инициализация кэша при монтировании
  useEffect(() => {
    loadCache();
    
    // Автоочистка устаревшего кэша
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdate > CACHE_TTL) {
        console.log('⏰ Auto-clearing expired cache...');
        clearCache();
      }
    }, 60000); // Проверяем каждую минуту
    
    return () => clearInterval(cleanupInterval);
  }, [loadCache, lastUpdate, clearCache]);

  // Синхронизация с другими вкладками
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CACHE_KEY) {
        console.log('🔄 Products cache updated from another tab');
        loadCache();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadCache]);

  return {
    // Основные методы
    getCachedData,
    setCachedData,
    hasCachedData,
    clearCache,
    
    // Статистика
    getCacheStats,
    cacheSize: cache.size,
    lastUpdate,
    
    // Утилиты
    loadCache,
    saveCache
  };
} 
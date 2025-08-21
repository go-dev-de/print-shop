// src/components/useInfiniteScroll.js
// Хук для автоматической загрузки при скролле вниз

import { useEffect, useCallback, useRef } from 'react';

export function useInfiniteScroll(loadMore, hasMore, isLoading) {
  const observerRef = useRef();
  const lastElementRef = useRef();

  // Функция для создания Intersection Observer
  const lastElementCallback = useCallback(
    (node) => {
      if (isLoading) return;
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          console.log('🔄 Last element visible, loading more...');
          loadMore();
        }
      }, {
        rootMargin: '100px', // Загружаем заранее, когда элемент в 100px от видимости
        threshold: 0.1
      });
      
      if (node) {
        observerRef.current.observe(node);
        lastElementRef.current = node;
      }
    },
    [isLoading, hasMore, loadMore]
  );

  // Очистка observer при размонтировании
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { lastElementCallback };
} 
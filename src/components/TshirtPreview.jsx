"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

export default function TshirtPreview({ uploadedImage, selectedColor, printSize = { scale: 1, label: '21×30 см' }, onViewChange, activeView: parentActiveView = 'front', onPrintPositionChange }) {
  const [printPosition, setPrintPosition] = useState({ x: 50, y: 50 });

  const [printRotation, setPrintRotation] = useState(0); // Новое состояние для поворота
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Используем activeView из родительского компонента или локальное состояние
  const previewRef = useRef(null);
  const tshirtRef = useRef(null); // Новый ref для области футболки

  // Получаем activeView из props или используем локальное состояние
  const [localActiveView, setLocalActiveView] = useState('front');
  const activeView = localActiveView; // Упрощаем логику - используем только локальное состояние

  // Убираем состояние для позиции скролла, так как оно больше не используется
  // const [savedScrollPosition, setSavedScrollPosition] = useState({ x: 0, y: 0 });



  // Размер принта в px (тот же, что в style)
  const PRINT_SIZE = 80;

  // Вспомогательная функция для получения размера принта (не вызывает setState)
  const getPrintScale = () => {
    if (typeof printSize === 'object' && printSize.scale) {
      return printSize.scale;
    } else if (typeof printSize === 'number') {
      return printSize / PRINT_SIZE;
    } else {
      return 1;
    }
  };

  // Синхронизируем с родителем только при монтировании компонента
  // useEffect(() => {
  //   if (onImagePositionChange) {
  //     onImagePositionChange({
  //       x: printPosition.x,
  //       y: printPosition.y,
  //       scale: getPrintScale(),
  //       rotation: printRotation
  //     });
  //   }
  // }, []); // Пустой массив зависимостей - вызов только при монтировании

  // Синхронизируем с родителем при окончании перетаскивания
  // useEffect(() => {
  //   if (!isDragging && onImagePositionChange) {
  //     // Небольшая задержка чтобы позиция успела обновиться
  //     const timer = setTimeout(() => {
  //       onImagePositionChange({
  //         x: printPosition.x,
  //         y: printPosition.y,
  //         scale: getPrintScale(),
  //         rotation: printRotation
  //       });
  //     }, 50);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [isDragging]); // Только при изменении isDragging

  // Убираем неиспользуемый useEffect для мониторинга isDragging
  // useEffect(() => {
  //   if (!isDragging) {
  //     // При окончании перетаскивания дополнительно стабилизируем позицию
  //     const timer = setTimeout(() => {
  //       // Убираем автоматическое восстановление позиции скролла
  //       // чтобы избежать прыжков страницы
  //     }, 100);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [isDragging]);

  // Обработчик изменения вида (перед/зад)
  const handleViewChange = useCallback((view) => {
    // Обновляем локальное состояние
    setLocalActiveView(view);
    // Передаем изменение в родительский компонент
    if (onViewChange) {
      onViewChange(view);
    }
  }, []);

  const colors = {
    white: '#ffffff',
    black: '#000000',
    gray: '#808080',
    navy: '#000080',
    red: '#ff0000',
    blue: '#0000ff',
    green: '#008000',
    yellow: '#ffff00',
    pink: '#ffc0cb',
    purple: '#800080'
  };

  // Функция для получения CSS фильтров для изменения цвета
  const getColorFilter = (colorName) => {
    switch (colorName) {
      case 'white':
        return 'none'; // Без изменений
      case 'black':
        return 'brightness(0) saturate(100%)'; // Делаем черным
      case 'gray':
        return 'brightness(0.4) saturate(0%) contrast(1.8)'; // Делаем серым #272727
      case 'navy':
        return 'brightness(0.6) saturate(400%) hue-rotate(240deg) contrast(1.2)'; // Делаем ярко-синим #0000fe
      default:
        return 'none';
    }
  };

  // Функция для получения дополнительных стилей в зависимости от цвета
  const getColorStyles = (colorName) => {
    switch (colorName) {
      case 'white':
        return { filter: 'none' };
      case 'black':
        return { filter: 'brightness(0) saturate(100%)' };
      case 'gray':
        return { 
          filter: 'brightness(0.4) saturate(0%) contrast(1.8)',
          mixBlendMode: 'multiply'
        };
      case 'navy':
        return { 
          filter: 'brightness(0.6) saturate(400%) hue-rotate(240deg) contrast(1.2)',
          mixBlendMode: 'multiply'
        };
      default:
        return { filter: 'none' };
    }
  };

  const handleMouseDown = useCallback((e) => {
    if (!uploadedImage) return;
    if (!tshirtRef.current) return;
    
    const rect = tshirtRef.current.getBoundingClientRect();
    // Центр принта в px относительно tshirtRef
    const printCenterX = (printPosition.x / 100) * rect.width;
    const printCenterY = (printPosition.y / 100) * rect.height;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left - printCenterX,
      y: e.clientY - rect.top - printCenterY
    });
  }, [uploadedImage, printPosition.x, printPosition.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !uploadedImage) return;
    if (!tshirtRef.current) return;
    
    const rect = tshirtRef.current.getBoundingClientRect();
    // Новая позиция центра принта в px относительно tshirtRef
    const newCenterX = e.clientX - rect.left - dragOffset.x;
    const newCenterY = e.clientY - rect.top - dragOffset.y;
    // Пересчет в проценты относительно tshirtRef
    const x = (newCenterX / rect.width) * 100;
    const y = (newCenterY / rect.height) * 100;
    
    const newPos = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      scale: getPrintScale(),
      rotation: printRotation,
    };
    setPrintPosition(newPos);
    
    // Уведомляем родительский компонент об изменении позиции принта
    if (onPrintPositionChange) {
      onPrintPositionChange(newPos);
    }
  }, [isDragging, uploadedImage, dragOffset.x, dragOffset.y, printRotation, onPrintPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch события для мобильных устройств
  const handleTouchStart = useCallback((e) => {
    if (!uploadedImage) return;
    if (!tshirtRef.current) return;
    
    const touch = e.touches[0];
    const rect = tshirtRef.current.getBoundingClientRect();
    // Центр принта в px относительно tshirtRef
    const printCenterX = (printPosition.x / 100) * rect.width;
    const printCenterY = (printPosition.y / 100) * rect.height;
    
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - rect.left - printCenterX,
      y: touch.clientY - rect.top - printCenterY
    });
  }, [uploadedImage, printPosition.x, printPosition.y]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !uploadedImage) return;
    if (!tshirtRef.current) return;
    
    const touch = e.touches[0];
    const rect = tshirtRef.current.getBoundingClientRect();
    // Новая позиция центра принта в px относительно tshirtRef
    const newCenterX = touch.clientX - rect.left - dragOffset.x;
    const newCenterY = touch.clientY - rect.top - dragOffset.y;
    // Пересчет в проценты относительно tshirtRef
    const x = (newCenterX / rect.width) * 100;
    const y = (newCenterY / rect.height) * 100;
    
    const newPos = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      scale: getPrintScale(),
      rotation: printRotation,
    };
    
    // Логируем изменение позиции
    console.log('📍 TouchMove - новая позиция принта:', {
      touchX: touch.clientX,
      touchY: touch.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height,
      newCenterX,
      newCenterY,
      newPosX: newPos.x,
      newPosY: newPos.y
    });
    
    setPrintPosition(newPos);
    
    // Уведомляем родительский компонент об изменении позиции принта
    if (onPrintPositionChange) {
      onPrintPositionChange(newPos);
    }
  }, [isDragging, uploadedImage, dragOffset.x, dragOffset.y, printRotation, onPrintPositionChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Простой подход - используем только CSS touch-action
  // Никаких глобальных обработчиков и манипуляций с body

  // Восстанавливаем обработчики для мыши (десктоп)
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden tshirt-preview-root" data-testid="tshirt-preview">
      <style jsx>{`
        /* Стили для области превью */
        .preview-area {
          touch-action: pan-x pan-y;
        }
        
        .preview-area.dragging {
          touch-action: none !important;
        }
        
        /* Стили для контейнера футболки */
        .tshirt-container {
          touch-action: none;
          user-select: none;
        }
      `}</style>
      <div className="bg-gray-700 rounded-lg shadow-lg p-4 lg:p-6 flex flex-col w-full max-w-full overflow-hidden">
        {/* Превью и управление поворотом */}
        <div className="flex-1 w-full max-w-full overflow-hidden">
          <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-white">2D-превью вашей футболки</h3>
          <div className="flex flex-wrap gap-2 mb-3 lg:mb-4 w-full max-w-full">
            <button 
              onClick={() => {
                handleViewChange('front');
              }} 
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors flex-shrink-0 ${
                activeView === 'front' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
            >
              Перед
            </button>
            <button 
              onClick={() => {
                handleViewChange('back');
              }} 
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors flex-shrink-0 ${
                activeView === 'back' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
            >
              Зад
            </button>
          </div>
        <div 
          ref={previewRef}
          className={`relative w-full h-96 sm:h-80 lg:h-80 bg-gray-600 rounded-lg flex items-center justify-center cursor-crosshair preview-area overflow-hidden ${isDragging ? 'dragging' : ''}`}
        >
          {uploadedImage ? (
              <div 
                ref={tshirtRef} 
                className="relative w-full h-full overflow-hidden tshirt-container" 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  userSelect: 'none'
                }}
              >
                {/* Фоновая футболка - показываем разные изображения для передней и задней части */}
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                  <Image 
                    src={activeView === 'front' ? '/front.png' : '/back.png'}
                    alt={`T-shirt ${activeView === 'front' ? 'front' : 'back'}`}
                    width={0}
                    height={0}
                    sizes="(max-width: 640px) 192px, (max-width: 1024px) 240px, 320px"
                    className="h-full w-full scale-150 sm:scale-100 sm:object-contain sm:h-auto sm:w-auto"
                    draggable={false}
                    style={{
                      ...getColorStyles(selectedColor),
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
                {/* Принт */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${printPosition.x}%`,
                    top: `${printPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                >
                  <div 
                    className="relative"
                    style={{
                      width: `${80 * getPrintScale()}px`, 
                      height: `${80 * getPrintScale()}px`,
                      transform: `rotate(${printRotation}deg)`,
                    }}
                  >
                    <Image
                      src={uploadedImage}
                      alt="Design preview"
                      fill
                      sizes="(max-width: 640px) 40px, (max-width: 1024px) 80px, 128px"
                      className="object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
                {/* Индикаторы */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs">
                  {activeView === 'front' ? 'Перед' : 'Зад'}
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs">
                  <span className="hidden lg:inline">Перетащите принт</span>
                  <span className="lg:hidden">Коснитесь и перетащите</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 w-full max-w-full overflow-hidden">
                <div className="w-48 h-96 sm:w-60 sm:h-80 lg:w-80 lg:h-80 bg-gray-500 rounded-lg flex items-center justify-center mx-auto">
                  <div className="px-4">
                    <p className="text-sm lg:text-base font-medium mb-2 text-gray-200">Загрузите изображение</p>
                    <p className="text-xs lg:text-sm text-gray-300">чтобы увидеть превью на футболке</p>
                  </div>
                </div>
              </div>
            )}
              </div>

          {/* Настройки принта объединены здесь */}
      {uploadedImage && (
            <div className="mt-6 p-4 rounded-lg bg-gray-600 border border-gray-500 w-full max-w-full overflow-hidden">
                     <h4 className="font-semibold mb-3 text-white">Настройки принта</h4>
                            <div className="space-y-4 w-full max-w-full">
                {/* Размер принта */}
                <div className="w-full max-w-full">
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Размер принта: {typeof printSize === 'object' && printSize.label ? printSize.label : '21×30 см'}
                  </label>
                </div>
                {/* Поворот */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full max-w-full">
                  <label htmlFor="print-rotation" className="text-sm text-gray-200 font-medium flex-shrink-0">Поворот</label>
              <input
                type="range"
                    id="print-rotation"
                    min={-180}
                    max={180}
                    step={1}
                    value={printRotation}
                    onChange={e => {
                      const value = Number(e.target.value);
                      setPrintRotation(value);
                      // Уведомляем родительский компонент об изменении поворота
                      if (onPrintPositionChange) {
                        onPrintPositionChange({
                          x: printPosition.x,
                          y: printPosition.y,
                          scale: getPrintScale(),
                          rotation: value,
                        });
                      }
                    }}
                    className="w-full sm:w-64 accent-blue-500 flex-1"
                  />
                  <span className="text-xs text-gray-300 flex-shrink-0">{printRotation}&deg;</span>
            </div>
                {/* Кнопка сброса */}
                <div className="pt-2 w-full max-w-full">
                             <button
                 onClick={() => {
                      const resetPosition = { x: 50, y: 50 };
                      const resetRotation = 0;
                      setPrintPosition(resetPosition); 
                      setPrintRotation(resetRotation);
                      // Уведомляем родительский компонент об изменении позиции
                      if (onPrintPositionChange) {
                        onPrintPositionChange({
                          x: resetPosition.x,
                          y: resetPosition.y,
                          scale: getPrintScale(),
                          rotation: resetRotation,
                        });
                      }
                 }}
                 className="w-full sm:w-auto px-3 py-2 bg-gray-500 hover:bg-gray-400 rounded text-sm font-medium transition-colors border-2 border-gray-400 hover:border-gray-300 text-white"
               >
                    Сбросить позицию и поворот
               </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

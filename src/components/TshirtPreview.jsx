"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

export default function TshirtPreview({ uploadedImage, selectedColor, printSize = { scale: 1, label: '21×30 см' }, onImagePositionChange, onViewChange }) {
  const [printPosition, setPrintPosition] = useState({ x: 50, y: 50 });

  const [printRotation, setPrintRotation] = useState(0); // Новое состояние для поворота
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeView, setActiveView] = useState('front');
  const previewRef = useRef(null);
  const tshirtRef = useRef(null); // Новый ref для области футболки

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

  // Размер принта в px (тот же, что в style)
  const PRINT_SIZE = 80;

  const handleMouseDown = (e) => {
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
  };

  const handleMouseMove = (e) => {
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
      scale: printSize?.scale ?? 1,
      rotation: printRotation,
    };
    setPrintPosition(newPos);
    onImagePositionChange?.(newPos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch события для мобильных устройств
  const handleTouchStart = (e) => {
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
  };

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
      scale: printSize?.scale ?? 1,
      rotation: printRotation,
    };
    setPrintPosition(newPos);
    onImagePositionChange?.(newPos);
  }, [isDragging, uploadedImage, dragOffset.x, dragOffset.y, onImagePositionChange, printRotation, printSize?.scale]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Добавляем глобальные обработчики для touch событий (без preventDefault в слушателе)
  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      if (isDragging) {
        handleTouchMove(e);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, handleTouchMove]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 flex flex-col">
        {/* Превью и управление поворотом */}
        <div className="flex-1">
          <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">2D-превью вашей футболки</h3>
          <div className="flex space-x-2 mb-3 lg:mb-4">
            <button 
              onClick={() => {
                setActiveView('front');
                onViewChange?.('front');
              }} 
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                activeView === 'front' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Перед
            </button>
            <button 
              onClick={() => {
                setActiveView('back');
                onViewChange?.('back');
              }} 
              className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
                activeView === 'back' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Зад
            </button>
          </div>
        <div 
          ref={previewRef}
          className="relative w-full h-80 lg:h-96 bg-gray-100 rounded-lg flex items-center justify-center cursor-crosshair tshirt-preview-root"
        >
          {uploadedImage ? (
              <div 
                ref={tshirtRef} 
                className="relative w-60 h-80 lg:w-80 lg:h-96 overflow-hidden" 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ userSelect: 'none', touchAction: 'none' }}
              >
                {/* Фоновая футболка - показываем только нужную часть с изменением цвета */}
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className="relative w-full h-full"
                    style={{
                      width: '200%', // Увеличиваем ширину в 2 раза
                      transform: activeView === 'front' 
                        ? 'translateX(0%)' 
                        : 'translateX(-50%)', // Сдвигаем влево для показа правой части
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <Image 
                      src="/futbolka-muzhskaya-basic.png" 
                      alt="T-shirt template" 
                      fill 
                      sizes="100vw"
                      className="object-contain"
                      draggable={false}
                      style={{
                        ...getColorStyles(selectedColor),
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                </div>
                {/* Принт */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${printPosition.x}%`,
                    top: `${printPosition.y}%`,
                    width: '100%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                >
                  <div 
                    className="relative"
                    style={{
                      width: `${80 * printSize.scale}px`, 
                      height: `${80 * printSize.scale}px`,
                      transform: `rotate(${printRotation}deg)`
                    }}
                  >
                    <Image
                      src={uploadedImage}
                      alt="Design preview"
                      fill
                      sizes="100vw"
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
              <div className="text-center text-gray-500">
                <div className="w-60 h-80 lg:w-80 lg:h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div>
                    <p className="text-base lg:text-lg font-medium mb-2">Загрузите изображение</p>
                    <p className="text-xs lg:text-sm">чтобы увидеть превью на футболке</p>
              </div>
            </div>
            </div>
          )}
      </div>

          {/* Настройки принта объединены здесь */}
      {uploadedImage && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                     <h4 className="font-semibold mb-3 text-black">Настройки принта</h4>
                            <div className="space-y-4">
                {/* Размер принта */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                    Размер принта: {printSize.label}
              </label>
                </div>
                {/* Поворот */}
                <div className="flex items-center space-x-4">
                  <label htmlFor="print-rotation" className="text-sm text-gray-700 font-medium">Поворот</label>
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
                      const newPos = { ...printPosition, scale: printSize?.scale ?? 1, rotation: value };
                      setPrintPosition(newPos);
                      onImagePositionChange?.(newPos);
                    }}
                    className="w-64 accent-blue-500"
                  />
                  <span className="text-xs text-gray-600">{printRotation}&deg;</span>
            </div>
                {/* Кнопка сброса */}
                <div className="pt-2">
                             <button
                 onClick={() => {
                      setPrintPosition({ x: 50, y: 50 }); 
                      setPrintRotation(0);
                 }}
                 className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors border-2 border-gray-400 hover:border-black text-black"
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
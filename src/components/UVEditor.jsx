'use client';

import { useRef, useState, useEffect } from 'react';

export default function UVEditor({ uploadedImage, onTextureGenerated }) {
  const canvasRef = useRef(null);
  const [printPosition, setPrintPosition] = useState({ x: 0.5, y: 0.5 });
  const [printScale, setPrintScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Базовая UV-развёртка футболки (можно заменить на реальную)
  const generateBaseUV = (ctx, width, height) => {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Рисуем контуры футболки
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Передняя часть (грудь)
    ctx.beginPath();
    ctx.rect(width * 0.3, height * 0.2, width * 0.4, height * 0.6);
    ctx.stroke();
    
    // Рукава
    ctx.beginPath();
    ctx.rect(width * 0.1, height * 0.3, width * 0.2, height * 0.4);
    ctx.rect(width * 0.7, height * 0.3, width * 0.2, height * 0.4);
    ctx.stroke();
    
    // Подписи
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('Грудь', width * 0.4, height * 0.5);
    ctx.fillText('Рукав', width * 0.15, height * 0.5);
    ctx.fillText('Рукав', width * 0.75, height * 0.5);
  };

  const handleMouseDown = (e) => {
    if (!uploadedImage) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setPrintPosition({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !uploadedImage) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setPrintPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const generateTexture = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем базовую UV-развёртку
    generateBaseUV(ctx, canvas.width, canvas.height);
    
    // Если есть принт, рисуем его
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        const printSize = 100 * printScale;
        const x = printPosition.x * canvas.width - printSize / 2;
        const y = printPosition.y * canvas.height - printSize / 2;
        
        ctx.drawImage(img, x, y, printSize, printSize);
        
        // Генерируем data URL для использования как текстуры
        const textureDataURL = canvas.toDataURL('image/png');
        onTextureGenerated(textureDataURL);
      };
      img.src = uploadedImage;
    }
  };

  useEffect(() => {
    generateTexture();
  }, [uploadedImage, printPosition, printScale]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h4 className="font-semibold mb-3 text-black">UV-редактор принта</h4>
      
      <div className="space-y-4">
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="w-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            Масштаб принта: {Math.round(printScale * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="2"
            step="0.1"
            value={printScale}
            onChange={(e) => setPrintScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="text-xs text-gray-500">
          Перетащите принт на нужное место на UV-развёртке. Красная область — грудь футболки.
        </div>
      </div>
    </div>
  );
} 
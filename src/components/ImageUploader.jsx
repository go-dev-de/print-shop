'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

export default function ImageUploader({ onImageUpload, onImageRemove }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const processImage = useCallback((file) => {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setImageError('Пожалуйста, выберите изображение');
      return;
    }

    // Разрешаем до 20MB (iPhone фото часто большие)
    if (file.size > 20 * 1024 * 1024) {
      setImageError('Размер файла не должен превышать 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      const img = new window.Image();
      img.onload = () => {
        // Проверяем минимальные размеры
        if (img.width < 100 || img.height < 100) {
          setImageError('Минимальный размер изображения: 100x100 пикселей');
          return;
        }

        // Если сверхбольшое изображение — уменьшаем до 4032 по большей стороне
        const maxDim = 4032;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const needDownscale = Math.max(w, h) > maxDim;

        if (needDownscale || file.type === 'image/heic' || file.type === 'image/heif') {
          const canvas = document.createElement('canvas');
          const scale = needDownscale ? Math.min(1, maxDim / Math.max(w, h)) : 1;
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Транскодируем в JPEG для совместимости
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setUploadedImage(jpegDataUrl);
          setImageError('');
          onImageUpload(jpegDataUrl, file);
        } else {
          setUploadedImage(src);
          setImageError('');
          onImageUpload(src, file);
        }
      };
      img.onerror = () => {
        setImageError('Ошибка загрузки изображения');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setImageError('');
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageRemove]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4 w-full max-w-full image-uploader">
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center cursor-pointer transition-all duration-200 w-full max-w-full overflow-hidden image-uploader ${
          uploadedImage
            ? 'border-green-400 bg-green-900/20'
            : isDragOver
            ? 'border-blue-400 bg-blue-900/20'
            : 'border-gray-500 hover:border-gray-400 bg-gray-700/50'
        }`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploadedImage ? (
          <div className="space-y-4 w-full max-w-full">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto">
              <Image
                src={uploadedImage}
                alt="Uploaded design"
                fill
                sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 128px"
                className="object-cover rounded-lg"
              />
            </div>
            <div className="space-y-2 w-full max-w-full">
              <p className="text-xs sm:text-sm lg:text-base font-medium text-green-300 px-2">
                ✅ Изображение загружено
              </p>
              <button
                onClick={handleRemoveImage}
                className="text-xs text-red-400 hover:text-red-300 underline px-2"
              >
                Удалить изображение
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-full">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="space-y-2 w-full max-w-full">
              <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-200 px-2">
                Перетащите изображение сюда или кликните для выбора
              </p>
              <p className="text-xs text-gray-400 px-2">
                Поддерживаемые форматы: JPG, PNG, HEIC
              </p>
              <p className="text-xs text-gray-400 px-2">
                Максимальный размер: 20MB
              </p>
            </div>
          </div>
        )}
      </div>

      {imageError && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 sm:p-4 w-full max-w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-red-200">{imageError}</p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploadedImage && (
        <div className="text-center w-full max-w-full px-2">
          <p className="text-xs sm:text-sm text-gray-300">
            Изображение готово к использованию в дизайне
          </p>
        </div>
      )}
    </div>
  );
} 
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
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          uploadedImage
            ? 'border-green-300 bg-green-50'
            : isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploadedImage ? (
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={uploadedImage}
                alt="Uploaded design"
                fill
                className="object-contain rounded"
              />
            </div>
            <div>
              <p className="text-green-600 font-medium">Изображение загружено!</p>
              <p className="text-sm text-gray-700 mt-1">
                Кликните для загрузки нового изображения
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Удалить изображение
            </button>
          </div>
        ) : (
          <div>
            <div className="mx-auto w-16 h-16 text-gray-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-800 mb-2">
              Загрузите ваш дизайн
            </p>
            <p className="text-gray-700 mb-2">
              Перетащите изображение сюда или кликните для выбора
            </p>
            <p className="text-sm text-gray-600">
              Поддерживаются форматы: JPG, PNG, SVG, WebP (HEIC/HEIF конвертируются автоматически)
            </p>
            <p className="text-sm text-gray-600">
              Максимальный размер: 20MB
            </p>
          </div>
        )}
      </div>

      {imageError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{imageError}</p>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Изображение успешно загружено! Теперь вы можете настроить его положение на футболке.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
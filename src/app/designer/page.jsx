'use client';

import { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import ImageUploader from '@/components/ImageUploader';
import TshirtPreview from '@/components/TshirtPreview';
import CartNotification from '@/components/CartNotification';
import Header from '@/components/Header';

export default function Designer() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const [printSize, setPrintSize] = useState(0); // Индекс выбранного размера принта
  const [activeView, setActiveView] = useState('front');
  const [selectedProductPrice, setSelectedProductPrice] = useState(null); // Цена выбранного товара
  const [printPosition, setPrintPosition] = useState({ x: 50, y: 50, scale: 1, rotation: 0 }); // Позиционирование принта

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'white', hex: '#ffffff', label: 'Белый' },
    { name: 'black', hex: '#000000', label: 'Черный' },
    { name: 'light-gray', hex: '#d3d3d3', label: 'Светло-серый' },
    { name: 'gray', hex: '#6b7280', label: 'Серый' },
  ];

  // Размеры принта с ценами
  const printSizes = [
    { label: '10×15 см', width: 10, height: 15, price: 390, scale: 0.6 },
    { label: '15×21 см', width: 15, height: 21, price: 590, scale: 0.8 },
    { label: '21×30 см', width: 21, height: 30, price: 740, scale: 1.0 },
    { label: '30×42 см', width: 30, height: 42, price: 940, scale: 1.3 },
  ];

  const handleImageUpload = (imageData, file) => {
    setUploadedImage(imageData);
  };

  const handlePrintPositionChange = (newPosition) => {
    setPrintPosition(newPosition);
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
  };

  // Оценка размера dataURL в байтах
  const estimateDataUrlBytes = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string') return 0;
    const commaIdx = dataUrl.indexOf(',');
    const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    // 4 символа base64 ~ 3 байта
    return Math.floor((base64.length * 3) / 4);
  };

  // Сжатие изображения в JPEG с ограничением по максимальной стороне
  const compressDataUrlToJpeg = async (dataUrl, maxDim = 3000, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        try {
          const jpeg = canvas.toDataURL('image/jpeg', quality);
          resolve(jpeg);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const [discountPercent, setDiscountPercent] = useState(0);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  
  useEffect(() => {
    // Загрузка активных скидок
    const fetchDiscounts = async () => {
      try {
        const response = await fetch('/api/discounts');
        if (response.ok) {
          const data = await response.json();
          const discounts = data.discounts || [];
          setActiveDiscounts(discounts);
          
          // Вычисляем лучшую глобальную скидку для основного калькулятора
          const globalDiscounts = discounts.filter(discount => {
            const hasNoCategories = !discount.sectionIds || discount.sectionIds.length === 0;
            const hasNoProducts = !discount.productIds || discount.productIds.length === 0;
            return hasNoCategories && hasNoProducts;
          });
          
          const bestGlobal = globalDiscounts.reduce((max, discount) => 
            Math.max(max, Number(discount.percent || 0)), 0
          );
          setDiscountPercent(bestGlobal);
        }
      } catch (error) {
        console.error('Ошибка загрузки скидок:', error);
      }
    };
    
    fetchDiscounts();
  }, []);

  // Обработка выбранного товара из страницы товаров
  useEffect(() => {
    const selectedProduct = localStorage.getItem('selectedProduct');
    if (selectedProduct) {
      try {
        const productData = JSON.parse(selectedProduct);
        // Устанавливаем параметры товара
        if (productData.size) setSelectedSize(productData.size);
        if (productData.color) setSelectedColor(productData.color);
        if (productData.quantity) setQuantity(productData.quantity);
        
        // Устанавливаем цену товара (если есть)
        if (productData.basePrice) {
          setSelectedProductPrice({
            basePrice: productData.basePrice,
            originalPrice: productData.originalPrice,
            hasDiscount: productData.hasDiscount,
            discountPercent: productData.discountPercent
          });
        }
        
        // Очищаем localStorage после использования
        localStorage.removeItem('selectedProduct');
        
        // Прокручиваем к форме заказа
        setTimeout(() => {
          const orderSection = document.getElementById('order-form');
          if (orderSection) {
            orderSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } catch (error) {
        console.error('Error parsing selected product:', error);
      }
    }
  }, []);

  const calculatePrice = () => {
    // Используем цену выбранного товара, если есть, иначе базовую цену футболки
    const basePrice = selectedProductPrice ? selectedProductPrice.basePrice : 1500;
    const printPrice = uploadedImage ? printSizes[printSize].price : 0;
    const subtotal = (basePrice + printPrice) * quantity;
    
    // Если у выбранного товара уже есть скидка, не применяем дополнительную
    if (selectedProductPrice && selectedProductPrice.hasDiscount) {
      return subtotal;
    }
    
    // Применяем глобальную скидку только если нет скидки на товар
    if (!discountPercent) return subtotal;
    const discount = Math.round((subtotal * discountPercent) / 100);
    return Math.max(0, subtotal - discount);
  };

  const handleOrder = async () => {
    if (!uploadedImage) {
      alert('Пожалуйста, загрузите изображение для принта');
      return;
    }
    
    // Пытаемся сделать скриншот превью с принтом
    let previewImageDataUrl = null;
    try {
      const { toPng } = await import('html-to-image');
      
      // Ищем элемент превью разными способами
      let previewElement = document.querySelector('[data-testid="tshirt-preview"]');
      console.log('🔍 Ищем элемент [data-testid="tshirt-preview"]:', previewElement);
      
      if (!previewElement) {
        // Попробуем найти по классу
        previewElement = document.querySelector('.tshirt-preview-root');
        console.log('🔍 Ищем элемент .tshirt-preview-root:', previewElement);
      }
      
      if (!previewElement) {
        // Попробуем найти по классу
        previewElement = document.querySelector('.tshirt-preview');
        console.log('🔍 Ищем элемент .tshirt-preview:', previewElement);
      }
      
      if (!previewElement) {
        // Попробуем найти по ID
        previewElement = document.getElementById('tshirt-preview');
        console.log('🔍 Ищем элемент #tshirt-preview:', previewElement);
      }
      
      if (!previewElement) {
        // Попробуем найти по классу preview-area напрямую
        previewElement = document.querySelector('.preview-area');
        console.log('🔍 Ищем элемент .preview-area напрямую:', previewElement);
      }
      
      // Если элемент найден, попробуем найти более конкретный элемент для скриншота
      if (previewElement) {
        // Ищем элемент с классом preview-area, который содержит футболку и принт
        const specificElement = previewElement.querySelector('.preview-area');
        if (specificElement) {
          previewElement = specificElement;
          console.log('🎯 Найден конкретный элемент .preview-area для скриншота');
        }
      }
      
      // Выведем все элементы с похожими классами
      const allElements = document.querySelectorAll('*');
      const tshirtElements = Array.from(allElements).filter(el => {
        try {
          return el.className && typeof el.className === 'string' && el.className.includes('tshirt');
        } catch (e) {
          return false;
        }
      });
      console.log('🔍 Все элементы с "tshirt" в классе:', tshirtElements);
      
      // Также выведем все элементы с data-testid
      const testIdElements = Array.from(allElements).filter(el => 
        el.getAttribute('data-testid')
      );
      console.log('🔍 Все элементы с data-testid:', testIdElements.map(el => ({
        tagName: el.tagName,
        className: typeof el.className === 'string' ? el.className : 'N/A',
        dataTestid: el.getAttribute('data-testid')
      })));
      
      if (previewElement) {
        console.log('🎯 Элемент превью найден:', {
          tagName: previewElement.tagName,
          className: previewElement.className,
          id: previewElement.id,
          dataTestid: previewElement.getAttribute('data-testid'),
          offsetWidth: previewElement.offsetWidth,
          offsetHeight: previewElement.offsetHeight,
          children: previewElement.children.length
        });
        
        // Проверим содержимое элемента
        console.log('🔍 HTML содержимое элемента:', previewElement.innerHTML.substring(0, 300) + '...');
        
        // Проверим стили элемента
        const computedStyle = window.getComputedStyle(previewElement);
        console.log('🎨 Стили элемента:', {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          width: computedStyle.width,
          height: computedStyle.height
        });
        
        // Логируем текущее позиционирование принта
        console.log('📍 Текущее позиционирование принта:', {
          x: printPosition.x,
          y: printPosition.y,
          scale: printPosition.scale,
          rotation: printPosition.rotation
        });
        
        // Логируем размеры контейнера для превью
        console.log('📏 Размеры контейнера для превью:', {
          offsetWidth: previewElement.offsetWidth,
          offsetHeight: previewElement.offsetHeight,
          clientWidth: previewElement.clientWidth,
          clientHeight: previewElement.clientHeight,
          scrollWidth: previewElement.scrollWidth,
          scrollHeight: previewElement.scrollHeight
        });
        
        // Находим .tshirt-container для сравнения размеров
        const tshirtContainer = previewElement.querySelector('.tshirt-container');
        if (tshirtContainer) {
          console.log('👕 Размеры .tshirt-container:', {
            offsetWidth: tshirtContainer.offsetWidth,
            offsetHeight: tshirtContainer.offsetHeight,
            clientWidth: tshirtContainer.clientWidth,
            clientHeight: tshirtContainer.clientHeight
          });
          
          // Вычисляем коэффициент масштабирования
          const scaleX = previewElement.offsetWidth / tshirtContainer.offsetWidth;
          const scaleY = previewElement.offsetHeight / tshirtContainer.offsetHeight;
          console.log('📐 Коэффициенты масштабирования:', { scaleX, scaleY });
        }
        
        try {
          console.log('🚀 Начинаем создание превью...');
          console.log('📊 Параметры для toPng:', {
            element: previewElement,
            width: previewElement.offsetWidth,
            height: previewElement.offsetHeight,
            cacheBust: true,
            pixelRatio: 1.5
          });
          
          // PNG для лучшего качества
          previewImageDataUrl = await toPng(previewElement, { 
            cacheBust: true, 
            pixelRatio: 1.5
          });
          console.log('✅ Превью создано, размер:', previewImageDataUrl?.length || 0);
        } catch (error) {
          console.error('❌ Ошибка при создании превью:', error);
          console.error('🔍 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          // Попробуем альтернативный способ
          console.log('🔄 Пробуем альтернативный способ...');
          try {
            const alternativeElement = previewElement.querySelector('.tshirt-container');
            if (alternativeElement) {
              console.log('🎯 Пробуем создать превью из .tshirt-container');
              console.log('📊 Размеры .tshirt-container:', {
                width: alternativeElement.offsetWidth,
                height: alternativeElement.offsetHeight
              });
              const alternativePreview = await toPng(alternativeElement, {
                cacheBust: true,
                pixelRatio: 1.5
              });
              console.log('✅ Альтернативное превью создано!');
              previewImageDataUrl = alternativePreview;
            } else {
              console.log('❌ Элемент .tshirt-container не найден внутри .preview-area');
            }
          } catch (altError) {
            console.error('❌ Альтернативный способ тоже не сработал:', altError);
            console.error('🔍 Детали альтернативной ошибки:', {
              message: altError.message,
              stack: altError.stack,
              name: altError.name
            });
          }
        }
      } else {
        console.warn('❌ Элемент превью не найден ни одним способом');
      }
    } catch (e) {
      console.error('❌ Ошибка создания превью:', e);
    }
    
    // Сжимать исходник, если он слишком большой для передачи на бэкенд
    const MAX_REQUEST_BYTES = 4.5 * 1024 * 1024; // приблизительный лимит на полезную нагрузку
    let imageForOrder = uploadedImage;
    try {
      if (estimateDataUrlBytes(imageForOrder) > MAX_REQUEST_BYTES) {
        imageForOrder = await compressDataUrlToJpeg(imageForOrder, 3000, 0.85);
      }
    } catch (e) {
      console.warn('Не удалось сжать изображение перед отправкой:', e);
    }

    const orderData = {
      image: imageForOrder,
      imagePosition: printPosition, // Используем реальное позиционирование принта
      imageSide: activeView,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      // Сохраняем выбор размера принта и цену за единицу для страницы заказа
      printSizeIndex: printSize,
      printSizeLabel: uploadedImage ? printSizes[printSize].label : null,
      printPricePerUnit: uploadedImage ? printSizes[printSize].price : 0,
      previewImage: previewImageDataUrl,
      discountPercent,
      totalPrice: calculatePrice(),
    };
    
    console.log('📦 Данные заказа:', {
      hasImage: !!orderData.image,
      hasPreviewImage: !!orderData.previewImage,
      imagePosition: orderData.imagePosition,
      imageSize: orderData.image?.length || 0,
      previewSize: orderData.previewImage?.length || 0
    });
    
    // Сохраняем данные заказа в localStorage
    localStorage.setItem('designer_order', JSON.stringify(orderData));
    console.log('💾 Сохранено в localStorage:', {
      key: 'designer_order',
      hasImage: !!orderData.image,
      hasPreviewImage: !!orderData.previewImage,
      imageSize: orderData.image?.length || 0,
      previewSize: orderData.previewImage?.length || 0
    });
    
    // Проверяем, что сохранилось
    const saved = localStorage.getItem('designer_order');
    console.log('🔍 Проверяем сохраненное:', saved ? 'Есть данные' : 'Нет данных');
    
    // Перенаправляем на страницу оформления заказа (как кнопка из корзины)
    window.location.href = '/checkout';
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full main-container designer-page" style={{ touchAction: 'pan-y', maxWidth: '100vw', width: '100%' }}>
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="container py-12 lg:py-16 bg-gray-800 overflow-hidden w-full max-w-full" style={{ maxWidth: '100vw', width: '100%' }}>
        <div id="order-form" className="animate-fade-in w-full max-w-full overflow-hidden">
          {/* Мобильная версия - одна колонка */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4 sm:gap-6 animate-fade-in px-2 sm:px-0 w-full max-w-full" style={{animationDelay: '0.2s'}}>
            {/* 1. Загрузка принта */}
            <div className="card card-md w-full max-w-full overflow-hidden">
              <h3 className="text-subheading text-white mb-4">Загрузите ваш принт</h3>
              <div className="w-full max-w-full">
              <ImageUploader 
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
              />
              </div>
            </div>

            {/* 2. Выбор цвета */}
            <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5 w-full max-w-full overflow-hidden">
              <h3 className="text-lg font-semibold mb-3 text-white">Выберите цвет футболки</h3>
              <div className="grid grid-cols-2 gap-4 w-full max-w-full">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors text-white w-full max-w-full ${
                      selectedColor === color.name
                        ? 'border-white bg-gray-600'
                        : 'border-gray-400 hover:border-white'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <span className="font-medium truncate">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Выбор размера */}
            <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5 w-full max-w-full overflow-hidden">
              <h3 className="text-lg font-semibold mb-3 text-white">Выберите размер</h3>
              <div className="grid grid-cols-3 gap-3 w-full max-w-full">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-white w-full max-w-full ${
                      selectedSize === size
                        ? 'border-white bg-gray-600'
                        : 'border-gray-400 hover:border-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Размер принта */}
            {uploadedImage && (
              <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5 w-full max-w-full overflow-hidden">
                <h3 className="text-lg font-semibold mb-3 text-white">Размер принта</h3>
                <div className="grid grid-cols-2 gap-3 w-full max-w-full">
                  {printSizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setPrintSize(index)}
                      className={`p-3 rounded-lg border-2 transition-colors text-white w-full max-w-full ${
                        printSize === index
                          ? 'border-white bg-gray-600'
                          : 'border-gray-400 hover:border-white'
                      }`}
                    >
                      <div className="text-sm font-medium">{size.label}</div>
                      <div className="text-xs text-gray-300">+{size.price}₽</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

                        {/* 5. Превью */}
            <div className="w-full max-w-full overflow-hidden">
              <TshirtPreview
                uploadedImage={uploadedImage}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                printSize={printSizes[printSize]}
                onViewChange={setActiveView}
                activeView={activeView}
                onPrintPositionChange={handlePrintPositionChange}
              />
            </div>

            {/* 6. Информация о заказе */}
            <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5 w-full max-w-full overflow-hidden">
              <h3 className="text-lg font-semibold mb-3 text-white">Информация о заказе</h3>
              
              <div className="space-y-3 mb-6 w-full max-w-full">
                <div className="flex justify-between w-full max-w-full">
                  <span className="text-white">Размер:</span>
                  <span className="font-medium text-white">{selectedSize}</span>
                </div>
                <div className="flex justify-between w-full max-w-full">
                  <span className="text-white">Цвет:</span>
                  <span className="font-medium text-white">
                    {colors.find(c => c.name === selectedColor)?.label}
                  </span>
                </div>
                <div className="flex justify-between w-full max-w-full">
                  <span className="text-white">Количество:</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-white font-bold flex-shrink-0"
                    >
                      -
                    </button>
                    <span className="text-white font-medium min-w-[2rem] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-white font-bold flex-shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between w-full max-w-full">
                  <span className="text-white">Принт:</span>
                  <span className="font-medium text-white">
                    {uploadedImage ? 'Включен' : 'Не выбран'}
                  </span>
                </div>
                {uploadedImage && (
                  <div className="flex justify-between w-full max-w-full">
                    <span className="text-white">Масштаб принта:</span>
                    <span className="font-medium text-white">100%</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-600 pt-4 w-full max-w-full">
                <div className="flex justify-between text-xl font-bold text-white w-full max-w-full">
                  <span>Итого:</span>
                  <span>{calculatePrice()} ₽</span>
                </div>
              </div>
            </div>

            {/* 7. Кнопка заказа */}
            <button
              type="button"
              onClick={handleOrder}
              onTouchEnd={handleOrder}
              onPointerUp={handleOrder}
              aria-disabled={!uploadedImage}
                              className={`group relative z-50 pointer-events-auto w-full max-w-full py-4 px-6 rounded-xl text-lg font-bold transition-all duration-300 ${
                  uploadedImage
                    ? 'bg-gray-600 hover:bg-gray-500 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative z-10 flex items-center justify-center w-full max-w-full">
                <svg className="w-6 h-6 mr-3 group-hover:animate-bounce flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="truncate">Оформить заказ</span>
                <svg className={`w-6 h-6 ml-3 transition-transform duration-300 flex-shrink-0 ${uploadedImage ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {uploadedImage && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              )}
            </button>
          </div>

          {/* Десктопная версия - две колонки */}
          <div className="hidden lg:grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in w-full max-w-full" style={{animationDelay: '0.3s'}}>
            {/* Левая колонка - Форма */}
            <div className="space-y-8 w-full max-w-full">
              {/* Загрузка принта */}
              <div className="card card-lg w-full max-w-full overflow-hidden">
                <h3 className="text-heading text-white mb-6">Загрузите ваш принт</h3>
                <div className="w-full max-w-full">
                <ImageUploader 
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                />
                </div>
              </div>

              {/* Выбор цвета */}
              <div className="card card-lg w-full max-w-full overflow-hidden">
                <h3 className="text-heading text-white mb-6">Выберите цвет футболки</h3>
                <div className="grid grid-cols-2 gap-4 w-full max-w-full">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors text-white w-full max-w-full ${
                        selectedColor === color.name
                          ? 'border-white bg-gray-600'
                          : 'border-gray-400 hover:border-white'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <span className="font-medium truncate">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Выбор размера */}
              <div className="card card-lg w-full max-w-full overflow-hidden">
                <h3 className="text-heading text-white mb-6">Выберите размер</h3>
                <div className="grid grid-cols-3 gap-3 w-full max-w-full">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-black w-full max-w-full ${
                        selectedSize === size
                          ? 'border-black bg-gray-600'
                          : 'border-gray-400 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Размер принта */}
              {uploadedImage && (
                <div className="card card-lg w-full max-w-full overflow-hidden">
                  <h3 className="text-heading text-white mb-6">Размер принта</h3>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-full">
                    {printSizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setPrintSize(index)}
                        className={`p-3 rounded-lg border-2 transition-colors text-black w-full max-w-full ${
                          printSize === index
                            ? 'border-black bg-gray-600'
                            : 'border-gray-400 hover:border-black'
                        }`}
                      >
                        <div className="text-sm font-medium">{size.label}</div>
                        <div className="text-xs text-gray-600">+{size.price}₽</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Количество */}
              <div className="card card-lg w-full max-w-full overflow-hidden">
                <h3 className="text-heading text-white mb-6">Количество</h3>
                <div className="flex items-center space-x-4 w-full max-w-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center border-2 border-gray-400 hover:border-black text-white font-bold flex-shrink-0"
                  >
                    -
                  </button>
                  <span className="text-black font-medium min-w-[3rem] text-center text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center border-2 border-gray-400 hover:border-black text-white font-bold flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Правая колонка - Превью и заказ */}
            <div className="space-y-8 w-full max-w-full">
                            {/* Превью футболки */}
              <div className="w-full max-w-full overflow-hidden">
                <TshirtPreview
                  uploadedImage={uploadedImage}
                  selectedColor={selectedColor}
                  selectedSize={selectedSize}
                  printSize={printSizes[printSize]}
                  onViewChange={setActiveView}
                  activeView={activeView}
                  onPrintPositionChange={handlePrintPositionChange}
                />
              </div>

              {/* Информация о заказе */}
              <div className="bg-gray-700 rounded-lg shadow-lg p-4 lg:p-6 w-full max-w-full overflow-hidden">
                <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-white">Информация о заказе</h3>
                
                <div className="space-y-3 mb-6 w-full max-w-full">
                  <div className="flex justify-between w-full max-w-full">
                    <span className="text-white">Размер:</span>
                    <span className="font-medium text-white">{selectedSize}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-full">
                    <span className="text-white">Цвет:</span>
                    <span className="font-medium text-white">
                      {colors.find(c => c.name === selectedColor)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between w-full max-w-full">
                    <span className="text-white">Количество:</span>
                    <span className="font-medium text-white">{quantity} шт.</span>
                  </div>
                  <div className="flex justify-between w-full max-w-full">
                    <span className="text-white">Принт:</span>
                    <span className="font-medium text-white">
                      {uploadedImage ? 'Включен' : 'Не выбран'}
                    </span>
                  </div>
                  {uploadedImage && (
                    <div className="flex justify-between w-full max-w-full">
                      <span className="text-white">Масштаб принта:</span>
                      <span className="font-medium text-white">100%</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-600 pt-4 w-full max-w-full">
                  <div className="flex justify-between text-xl font-bold text-white w-full max-w-full">
                    <span>Итого:</span>
                    <span>{calculatePrice()} ₽</span>
                  </div>
                </div>
              </div>

              {/* Кнопка заказа */}
              <button
                type="button"
                onClick={handleOrder}
                onTouchEnd={handleOrder}
                onPointerUp={handleOrder}
                aria-disabled={!uploadedImage}
                className={`group relative z-50 pointer-events-auto w-full max-w-full py-4 lg:py-5 px-6 lg:px-8 rounded-xl text-lg lg:text-xl font-bold transition-all duration-300 transform ${
                  uploadedImage
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative z-10 flex items-center justify-center w-full max-w-full">
                  <svg className="w-6 h-6 mr-3 group-hover:animate-bounce flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="truncate">Оформить заказ</span>
                  <svg className={`w-6 h-6 ml-3 transition-transform duration-300 flex-shrink-0 ${uploadedImage ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                {uploadedImage && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Уведомления о добавлении в корзину */}
      <div className="w-full max-w-full overflow-hidden">
      <CartNotification />
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageUploader from '../../components/ImageUploader';
import TshirtPreview from '../../components/TshirtPreview';
import UserProfile from '@/components/UserProfile';
import Breadcrumbs from '@/components/Breadcrumbs';
import MobileMenu from '@/components/MobileMenu';
import CartDropdown from '@/components/CartDropdown';
import CartNotification from '@/components/CartNotification';

export default function Designer() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('white');
  const [quantity, setQuantity] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50, scale: 1 });

  const [printSize, setPrintSize] = useState(0); // Индекс выбранного размера принта
  const [activeView, setActiveView] = useState('front');
  const [selectedProductPrice, setSelectedProductPrice] = useState(null); // Цена выбранного товара

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

  const handleImageRemove = () => {
    setUploadedImage(null);
    setImagePosition({ x: 50, y: 50, scale: 1 });
  };

  const handleImagePositionChange = (position) => {
    setImagePosition(position);
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
      const { toJpeg } = await import('html-to-image');
      const previewElement = document.querySelector('.tshirt-preview-root');
      if (previewElement) {
        // JPEG меньше весит, что повышает шанс успешной отправки в Telegram
        previewImageDataUrl = await toJpeg(previewElement, { cacheBust: true, pixelRatio: 1.5, quality: 0.85 });
      }
    } catch (e) {
      console.warn('Не удалось создать изображение превью:', e);
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
      imagePosition: imagePosition,
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
    
    // Сохраняем данные заказа в localStorage
    localStorage.setItem('printShopOrder', JSON.stringify(orderData));
    
    // Перенаправляем на страницу оформления заказа
    window.location.href = '/order';
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full main-container" style={{ touchAction: 'pan-y' }}>
      {/* Premium Header */}
      <header className="bg-[#727272] border-b border-gray-600 sticky top-0 z-50 transition-all duration-300">
        <div className="container">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold tracking-tight">
                <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-200">
                  Print<span className="font-light">Style</span>
                </Link>
              </h1>
              

            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                Главная
              </Link>
              <a href="/products" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                Товары
              </a>
              <a href="/designer" className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 transition-colors rounded-lg">
                Дизайнер
              </a>
              <a href="/reviews" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                Отзывы
              </a>
              <a href="#about" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                О нас
              </a>
              <div className="ml-4 flex items-center space-x-3">
                <CartDropdown />
                <UserProfile />
              </div>
            </nav>
            
            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </header>
      
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Designer Hero */}
      <section className="bg-gray-700 py-16">
        <div className="container text-center">
          <h1 className="text-4xl lg:text-5xl font-light text-white mb-6 tracking-tight">
            Создайте свою
            <span className="block font-semibold">уникальную футболку</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light">
            Загрузите свой дизайн и получите качественную футболку<br/>
            с профессиональной печатью
          </p>
        </div>
      </section>

      <main className="relative bg-gray-800">
        <div className="container py-16 lg:py-24">
        <div id="order-form" className="animate-fade-in">
        {/* Мобильная версия - одна колонка */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
          {/* 1. Загрузка принта */}
          <div className="card card-md">
            <h3 className="text-subheading text-white mb-4">Загрузите ваш принт</h3>
            <ImageUploader 
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* 2. Выбор цвета */}
          <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-white">Выберите цвет футболки</h3>
            <div className="grid grid-cols-2 gap-4">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors text-black ${
                    selectedColor === color.name
                      ? 'border-black bg-gray-100'
                      : 'border-gray-400 hover:border-black'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <span className="font-medium">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Выбор размера */}
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Выберите размер</h3>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-black ${
                    selectedSize === size
                      ? 'border-black bg-gray-100'
                      : 'border-gray-400 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Размер принта */}
          {uploadedImage && (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-5">
              <h3 className="text-lg font-semibold mb-3 text-black">Размер принта</h3>
              <div className="grid grid-cols-2 gap-3">
                {printSizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => setPrintSize(index)}
                    className={`p-3 rounded-lg border-2 transition-colors text-black ${
                      printSize === index
                        ? 'border-black bg-gray-100'
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

          {/* 5. Превью */}
          <TshirtPreview
            uploadedImage={uploadedImage}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            printSize={printSizes[printSize]}
            onImagePositionChange={handleImagePositionChange}
            onViewChange={setActiveView}
          />

          {/* 6. Информация о заказе */}
          <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-white">Информация о заказе</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white">Размер:</span>
                <span className="font-medium text-white">{selectedSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Цвет:</span>
                <span className="font-medium text-white">
                  {colors.find(c => c.name === selectedColor)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Количество:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center border-2 border-gray-400 hover:border-white text-white font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="font-medium text-white w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center border-2 border-gray-400 hover:border-white text-white font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Принт:</span>
                <span className="font-medium text-white">
                  {uploadedImage ? 'Включен' : 'Не выбран'}
                </span>
              </div>
              {uploadedImage && (
                <div className="flex justify-between">
                  <span className="text-white">Размер принта:</span>
                  <span className="font-medium text-white">{printSizes[printSize].label}</span>
                </div>
              )}
              {uploadedImage && (
                <div className="flex justify-between">
                  <span className="text-white">Масштаб принта:</span>
                  <span className="font-medium text-white">{Math.round(imagePosition.scale * 100)}%</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-600 pt-4">
              <div className="flex justify-between text-xl font-bold text-white">
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
            className={`group relative z-50 pointer-events-auto w-full py-4 px-6 rounded-xl text-lg font-bold transition-all duration-300 transform ${
              uploadedImage
                ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Оформить заказ
              <svg className={`w-5 h-5 ml-2 transition-transform duration-300 ${uploadedImage ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            {uploadedImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        {/* Десктопная версия - две колонки */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12">
          {/* Левая колонка - Загрузка и настройки */}
          <div className="space-y-8">
            {/* Загрузка изображения */}
            <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                             <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Загрузите ваш принт</h3>
              <ImageUploader 
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
              />
            </div>

            {/* Выбор размера */}
                         <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                              <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Выберите размер</h3>
              <div className="grid grid-cols-3 gap-3">
                {sizes.map((size) => (
                                     <button
                     key={size}
                     onClick={() => setSelectedSize(size)}
                     className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-black ${
                       selectedSize === size
                         ? 'border-black bg-gray-100'
                         : 'border-gray-400 hover:border-black'
                     }`}
                   >
                     {size}
                   </button>
                ))}
              </div>
            </div>

            {/* Выбор цвета */}
                         <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                              <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Выберите цвет футболки</h3>
              <div className="grid grid-cols-2 gap-4">
                {colors.map((color) => (
                                     <button
                     key={color.name}
                     onClick={() => setSelectedColor(color.name)}
                     className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors text-black ${
                       selectedColor === color.name
                         ? 'border-black bg-gray-100'
                         : 'border-gray-400 hover:border-black'
                     }`}
                   >
                     <div
                       className="w-8 h-8 rounded-full border-2 border-gray-300"
                       style={{ backgroundColor: color.hex }}
                     ></div>
                     <span className="font-medium">{color.label}</span>
                   </button>
                ))}
              </div>
            </div>

            {/* Размер принта */}
            {uploadedImage && (
              <div className="bg-gray-700 rounded-lg shadow-lg p-2 sm:p-5">
                <h3 className="text-lg font-semibold mb-3 text-white">Размер принта</h3>
                <div className="grid grid-cols-2 gap-3">
                  {printSizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setPrintSize(index)}
                      className={`p-3 rounded-lg border-2 transition-colors text-white ${
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

            {/* Количество */}
                         <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                              <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Количество</h3>
              <div className="flex items-center space-x-4">
                                 <button
                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
                   className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold"
                 >
                   -
                 </button>
                 <span className="text-xl font-semibold w-12 text-center text-black">{quantity}</span>
                 <button
                   onClick={() => setQuantity(quantity + 1)}
                   className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold"
                 >
                   +
                 </button>
              </div>
            </div>
          </div>

          {/* Правая колонка - Превью и заказ */}
          <div className="space-y-8">
            {/* Превью футболки */}
          <TshirtPreview
              uploadedImage={uploadedImage}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              printSize={printSizes[printSize]}
              onImagePositionChange={handleImagePositionChange}
              onViewChange={setActiveView}
            />

            {/* Информация о заказе */}
            <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                             <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Информация о заказе</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-black">Размер:</span>
                  <span className="font-medium text-black">{selectedSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Цвет:</span>
                  <span className="font-medium text-black">
                    {colors.find(c => c.name === selectedColor)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Количество:</span>
                  <span className="font-medium text-black">{quantity} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Принт:</span>
                  <span className="font-medium text-black">
                    {uploadedImage ? 'Включен' : 'Не выбран'}
                  </span>
                </div>
                {uploadedImage && (
                  <div className="flex justify-between">
                    <span className="text-black">Масштаб принта:</span>
                    <span className="font-medium text-black">{Math.round(imagePosition.scale * 100)}%</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                                 <div className="flex justify-between text-xl font-bold text-black">
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
              className={`group relative z-50 pointer-events-auto w-full py-4 lg:py-5 px-6 lg:px-8 rounded-xl text-lg lg:text-xl font-bold transition-all duration-300 transform ${
                uploadedImage
                  ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg className="w-6 h-6 mr-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Оформить заказ
                <svg className={`w-6 h-6 ml-3 transition-transform duration-300 ${uploadedImage ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </main>
      
      {/* Уведомления о добавлении в корзину */}
      <CartNotification />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUploader from '../components/ImageUploader';
import TshirtPreview from '../components/TshirtPreview';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('white');
  const [quantity, setQuantity] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50, scale: 1 });
  const [currentReview, setCurrentReview] = useState(0);
  const [printSize, setPrintSize] = useState(0); // Индекс выбранного размера принта

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'white', hex: '#ffffff', label: 'Белый' },
    { name: 'black', hex: '#000000', label: 'Черный' },
    { name: 'navy', hex: '#d3d3d3', label: 'Светло-серый' },
    { name: 'gray', hex: '#6b7280', label: 'Серый' },
  ];

  // Размеры принта с ценами
  const printSizes = [
    { label: '10×15 см', width: 10, height: 15, price: 390, scale: 0.6 },
    { label: '15×21 см', width: 15, height: 21, price: 590, scale: 0.8 },
    { label: '21×30 см', width: 21, height: 30, price: 740, scale: 1.0 },
    { label: '30×42 см', width: 30, height: 42, price: 940, scale: 1.3 },
  ];

  // Массив с 15 отзывами
  const reviews = [
    {
      name: "Иван Петров",
      photo: "https://i.pravatar.cc/128?u=ivan",
      review: "Нашли подходящий автомобиль за 2 дня, все оформили, украсили и подвезли к назначенному месту. Очень благодарен!",
      additionalText: "Я деловой человек, и времени на поиск и оформление машины у меня нет. Хотел сделать сюрприз девушке. Был бюджет и предпочтения. Нашли подходящий автомобиль за 2 дня, все оформили, украсили и подвезли к назначенному месту. Очень благодарен."
    },
    {
      name: "Мария Смирнова",
      photo: "https://i.pravatar.cc/128?u=maria",
      review: "Очень доволен качеством печати! Футболка после стирки как новая.",
      additionalText: "Заказывала футболки для всей семьи с нашими фотографиями. Качество печати превзошло все ожидания. Принт не выцветает даже после множественных стирок."
    },
    {
      name: "Алексей Кузнецов",
      photo: "https://i.pravatar.cc/128?u=alex",
      review: "Принт яркий, футболка удобная. Спасибо за индивидуальный подход!",
      additionalText: "Нужна была футболка с логотипом компании для корпоративного мероприятия. Сделали быстро и качественно. Все сотрудники остались довольны."
    },
    {
      name: "Елена Воробьева",
      photo: "https://i.pravatar.cc/128?u=elena",
      review: "Быстрое изготовление и отличное качество! Рекомендую всем.",
      additionalText: "Заказывала футболки для спортивной команды. Сделали за 3 дня, как и обещали. Материал приятный к телу, принт держится отлично."
    },
    {
      name: "Дмитрий Соколов",
      photo: "https://i.pravatar.cc/128?u=dmitry",
      review: "Профессиональный подход к каждому клиенту. Очень доволен результатом.",
      additionalText: "Нужен был сложный дизайн с множеством цветов. Мастера справились на отлично! Футболка выглядит именно так, как я и представлял."
    },
    {
      name: "Анна Морозова",
      photo: "https://i.pravatar.cc/128?u=anna",
      review: "Заказывала футболки для детского сада. Все дети в восторге!",
      additionalText: "Сделали яркие футболки с героями мультфильмов для выпускного. Родители и дети остались довольны. Качество на высоте!"
    },
    {
      name: "Сергей Новиков",
      photo: "https://i.pravatar.cc/128?u=sergey",
      review: "Отличный сервис! Помогли с выбором материала и дизайном.",
      additionalText: "Хотел сделать подарок другу на день рождения. Консультант помог выбрать лучший вариант. Друг был в восторге от подарка!"
    },
    {
      name: "Ольга Козлова",
      photo: "https://i.pravatar.cc/128?u=olga",
      review: "Быстрая доставка и качественная работа. Спасибо!",
      additionalText: "Заказывала футболки для фитнес-клуба. Сделали быстро, доставили вовремя. Принт яркий и стойкий к поту."
    },
    {
      name: "Михаил Лебедев",
      photo: "https://i.pravatar.cc/128?u=mikhail",
      review: "Профессиональная команда! Все сделали в срок и качественно.",
      additionalText: "Нужны были футболки для турнира по волейболу. Сделали за 2 дня, все команды получили свои футболки вовремя."
    },
    {
      name: "Татьяна Семенова",
      photo: "https://i.pravatar.cc/128?u=tatiana",
      review: "Заказывала футболки для школьного класса. Все получилось идеально!",
      additionalText: "Сделали футболки с номером класса и именами учеников. Дети были в восторге! Качество печати отличное."
    },
    {
      name: "Андрей Волков",
      photo: "https://i.pravatar.cc/128?u=andrey",
      review: "Отличное качество и быстрая работа. Рекомендую!",
      additionalText: "Заказывал футболки для команды по футболу. Сделали быстро, принт не выцветает. Играем уже полгода - все отлично!"
    },
    {
      name: "Наталья Петрова",
      photo: "https://i.pravatar.cc/128?u=natalia",
      review: "Очень довольна качеством! Футболка удобная и красивая.",
      additionalText: "Заказывала футболку с собственным дизайном. Получилось именно то, что хотела. Материал приятный, принт яркий."
    },
    {
      name: "Виктор Смирнов",
      photo: "https://i.pravatar.cc/128?u=victor",
      review: "Быстрое изготовление и отличное качество печати!",
      additionalText: "Нужны были футболки для корпоратива. Сделали за 4 дня, все получилось отлично. Коллеги остались довольны."
    },
    {
      name: "Ирина Николаева",
      photo: "https://i.pravatar.cc/128?u=irina",
      review: "Профессиональный подход и качественная работа!",
      additionalText: "Заказывала футболки для детского лагеря. Сделали быстро, качественно. Дети носили с удовольствием весь сезон."
    },
    {
      name: "Павел Иванов",
      photo: "https://i.pravatar.cc/128?u=pavel",
      review: "Отличный сервис! Помогли с выбором и сделали качественно.",
      additionalText: "Хотел сделать подарок жене. Консультант помог выбрать лучший вариант. Жена была в восторге от подарка!"
    }
  ];

  // Автоматическое переключение отзывов каждые 7 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  // Функции для зацикленной навигации
  const goToPrevReview = () => {
    setCurrentReview((prev) => prev === 0 ? reviews.length - 1 : prev - 1);
  };

  const goToNextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

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

  const calculatePrice = () => {
    const basePrice = 1500; // Базовая цена за футболку
    const printPrice = uploadedImage ? printSizes[printSize].price : 0; // Цена за принт зависит от размера
    return (basePrice + printPrice) * quantity;
  };

  const handleOrder = () => {
    if (!uploadedImage) {
      alert('Пожалуйста, загрузите изображение для принта');
      return;
    }
    
    const orderData = {
      image: uploadedImage,
      imagePosition: imagePosition,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      totalPrice: calculatePrice(),
    };
    
    // Сохраняем данные заказа в localStorage
    localStorage.setItem('printShopOrder', JSON.stringify(orderData));
    
    // Перенаправляем на страницу оформления заказа
    window.location.href = '/order';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden w-full main-container" style={{ touchAction: 'pan-y' }}>
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">PrintStyle</h1>
              
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#main" className="text-gray-800 hover:text-blue-600">Главная</a>
              <a href="#reviews" className="text-gray-800 hover:text-blue-600">Отзывы</a>
              <a href="#about" className="text-gray-800 hover:text-blue-600">О нас</a>
              <a href="#contacts" className="text-gray-800 hover:text-blue-600">Контакты</a>
            </nav>
          </div>
        </div>
      </header>

      <main id="main" className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8 py-6 lg:py-12 scroll-smooth">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4">
            Создайте свою уникальную футболку
          </h2>
          <p className="text-base lg:text-xl text-gray-800 max-w-2xl mx-auto">
            Загрузите свой дизайн и получите качественную футболку с принтом
          </p>
        </div>

        {/* Мобильная версия - одна колонка */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4 sm:gap-6">
          {/* 1. Загрузка принта */}
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Загрузите ваш принт</h3>
            <ImageUploader 
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* 2. Выбор цвета */}
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Выберите цвет футболки</h3>
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
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-5">
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
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-5">
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
          />

          {/* 6. Информация о заказе */}
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Информация о заказе</h3>
            
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="font-medium text-black w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Принт:</span>
                <span className="font-medium text-black">
                  {uploadedImage ? 'Включен' : 'Не выбран'}
                </span>
              </div>
              {uploadedImage && (
                <div className="flex justify-between">
                  <span className="text-black">Размер принта:</span>
                  <span className="font-medium text-black">{printSizes[printSize].label}</span>
                </div>
              )}
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
            onClick={handleOrder}
            disabled={!uploadedImage}
            className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition-colors ${
              uploadedImage
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Оформить заказ
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
              <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Размер принта</h3>
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
              onClick={handleOrder}
              disabled={!uploadedImage}
              className={`w-full py-3 lg:py-4 px-4 lg:px-6 rounded-lg text-base lg:text-lg font-semibold transition-colors ${
                uploadedImage
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Оформить заказ
            </button>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
                         <h3 className="text-lg font-semibold mb-2 text-black">Быстрое производство</h3>
            <p className="text-gray-800">Изготовление за 3-5 рабочих дней</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
                         <h3 className="text-lg font-semibold mb-2 text-black">Качественные материалы</h3>
            <p className="text-gray-800">100% хлопок, стойкие принты</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
                         <h3 className="text-lg font-semibold mb-2 text-black">Поддержка 24/7</h3>
            <p className="text-gray-800">Поможем с любыми вопросами</p>
          </div>
        </div>

        {/* Секция отзывов */}
        <section id="reviews" className="mt-8 lg:mt-16 mb-0">
          <h3 className="text-xl lg:text-2xl font-bold text-center mb-6 lg:mb-8 text-gray-900">ОТЗЫВЫ КЛИЕНТОВ</h3>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Стрелка влево */}
            <button 
              onClick={goToPrevReview}
              className="absolute left-2 lg:left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Стрелка вправо */}
            <button 
              onClick={goToNextReview}
              className="absolute right-2 lg:right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Контейнер отзывов */}
            <div className="px-4 sm:px-4 lg:px-16">
              <div className="bg-white rounded-lg shadow-lg p-4 lg:p-8">
                <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
                  {/* Фото клиента */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-gray-200">
                      <Image 
                        src={reviews[currentReview].photo} 
                        alt={reviews[currentReview].name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://i.pravatar.cc/128?u=${reviews[currentReview].name}`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Текст отзыва */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="space-y-3 lg:space-y-4">
                      <p className="text-gray-800 text-sm lg:text-lg leading-relaxed">
                        &ldquo;{reviews[currentReview].review}&rdquo;
                      </p>
                      <p className="text-gray-800 text-sm lg:text-lg leading-relaxed">
                        {reviews[currentReview].additionalText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Точки пагинации */}
            <div className="flex justify-center mt-6 space-x-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentReview ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 !text-white">PrintStyle</h3>
              <p className="text-gray-300">
                Создавайте уникальные футболки <br/>
            с вашими дизайнами
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 !text-white">Услуги</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Футболки с принтом</a></li>
                <li><a href="#" className="hover:text-white">Худи с принтом</a></li>
                <li><a href="#" className="hover:text-white">Кепки с принтом</a></li>
                <li><a href="#" className="hover:text-white">Оптовые заказы</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 !text-white">Информация</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">О компании</a></li>
                <li><a href="#" className="hover:text-white">Доставка</a></li>
                <li><a href="#" className="hover:text-white">Оплата</a></li>
                <li><a href="#" className="hover:text-white">Контакты</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 !text-white">Контакты</h4>
              <div className="space-y-2 text-gray-300">
                <p>+7 (999) 123-45-67</p>
                <p>зайчикГэнг@yandex.ru</p>
                <p>Ижевск, ул. Примерная, 123</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 PrintStyle. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
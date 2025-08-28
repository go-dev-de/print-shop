'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const STATUS_LABELS = {
  new: 'Новый',
  processing: 'В обработке',
  printed: 'Напечатан',
  shipped: 'Отправлен',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const StatusBadge = ({ status }) => {
  const colors = {
    new: 'bg-blue-900/50 text-blue-200 border-blue-600',
    processing: 'bg-yellow-900/50 text-yellow-200 border-yellow-600',
    printed: 'bg-purple-900/50 text-purple-200 border-purple-600',
    shipped: 'bg-orange-900/50 text-orange-200 border-orange-600',
    completed: 'bg-green-900/50 text-green-200 border-green-600',
    cancelled: 'bg-red-900/50 text-red-200 border-red-600',
  };
  
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-700 text-gray-200 border-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`, { cache: 'no-store' });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Заказ не найден');
        }
        
        console.log('📦 Загружен заказ:', data.order);
        console.log('🖼️ Payload image:', data.order?.payload?.image);
        console.log('👕 Payload previewImage:', data.order?.payload?.previewImage);
        console.log('📍 Payload imagePosition:', data.order?.payload?.imagePosition);
        console.log('🔍 Все ключи payload:', Object.keys(data.order?.payload || {}));
        console.log('📄 Полный payload:', data.order?.payload);
        
        setOrder(data.order);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadImage = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const calculateDisplayTotal = (order) => {
    if (order.payload?.totalPrice && order.payload.totalPrice > 0) {
      return order.payload.totalPrice;
    }
    
    if (order.payload?.pricing?.orderTotal && order.payload.pricing.orderTotal > 0) {
      return order.payload.pricing.orderTotal;
    }
    
    const basePrice = order.payload?.pricing?.baseTshirtPrice || 700;
    const printPrice = order.payload?.pricing?.printPricePerUnit || order.payload?.printPricePerUnit || 0;
    const quantity = order.payload?.quantity || order.payload?.pricing?.quantity || 1;
    const shipping = order.payload?.pricing?.shippingCost || 0;
    const discountPercent = order.payload?.discountPercent || 0;
    
    let subtotal = (basePrice + printPrice) * quantity;
    
    if (discountPercent > 0) {
      const discount = Math.round((subtotal * discountPercent) / 100);
      subtotal = Math.max(0, subtotal - discount);
    }
    
    const total = subtotal + shipping;
    
    if (total <= 0 && order.totalPrice && order.totalPrice > 0) {
      return order.totalPrice;
    }
    
    return total;
  };

  const renderPriceBreakdown = (order) => {
    const basePrice = order.payload?.pricing?.baseTshirtPrice || 700;
    const printPrice = order.payload?.pricing?.printPricePerUnit || order.payload?.printPricePerUnit || 0;
    const quantity = order.payload?.quantity || order.payload?.pricing?.quantity || 1;
    const shipping = order.payload?.pricing?.shippingCost || 0;
    const discountPercent = order.payload?.discountPercent || 0;
    
    const subtotal = (basePrice + printPrice) * quantity;
    const discountAmount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
    
    return (
      <div className="space-y-1">
        <div>Футболка: {basePrice} ₽</div>
        {printPrice > 0 && <div>Принт: {printPrice} ₽</div>}
        {quantity > 1 && <div>Количество: {quantity} шт.</div>}
        {quantity > 1 && <div>Промежуточная сумма: {subtotal} ₽</div>}
        {discountPercent > 0 && (
          <div className="text-red-400">Скидка {discountPercent}%: -{discountAmount} ₽</div>
        )}
        {shipping > 0 && <div>Доставка: {shipping} ₽</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Ошибка</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Заказ не найден</div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  // Debug render
  console.log('🎨 OrderPage render:', {
    orderId: order.id,
    hasImage: !!order.payload?.image,
    hasPreviewImage: !!order.payload?.previewImage,
    hasImagePosition: !!order.payload?.imagePosition,
    payloadKeys: Object.keys(order.payload || {})
  });

  return (
    <div className="min-h-screen bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-white mb-2">Заказ #{order.id?.slice(0, 8)}...</h1>
              <p className="text-gray-300">Детальная информация о заказе</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={order.status} />
              <button 
                onClick={() => router.back()}
                className="px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500 font-medium transition-all duration-200"
              >
                Назад
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-700 rounded-xl border border-gray-600 shadow-lg">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Order Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Order Info */}
                <div className="bg-gray-600 rounded-xl border border-gray-500 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Основная информация</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">ID заказа:</span>
                      <div className="font-mono text-gray-100">{order.id}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Статус:</span>
                      <div className="font-semibold text-white">{STATUS_LABELS[order.status] || order.status}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Создан:</span>
                      <div className="text-gray-100">{new Date(order.createdAt).toLocaleString('ru-RU')}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Итого:</span>
                      <div className="font-bold text-green-400 text-lg">
                        {calculateDisplayTotal(order)} ₽
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-300">
                    {renderPriceBreakdown(order)}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-600 rounded-xl border border-gray-500 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Информация о клиенте</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">Имя:</span>
                      <div className="text-gray-100">{order.payload?.customerName || order.payload?.customer?.name || 'Не указано'}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Email:</span>
                      <div className="text-gray-100">{order.payload?.email || order.payload?.customer?.email || 'Не указано'}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Телефон:</span>
                      <div className="text-gray-100">{order.payload?.phone || order.payload?.customer?.phone || 'Не указано'}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Способ получения:</span>
                      <div className="text-gray-100">
                        {order.payload?.deliveryMethod === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
                      </div>
                    </div>
                    {order.payload?.deliveryMethod === 'delivery' && (
                      <div className="md:col-span-2">
                        <span className="text-gray-300">Адрес доставки:</span>
                        <div className="text-gray-100">
                          {order.payload?.address || order.payload?.customer?.address || 'Не указано'}
                          {order.payload?.city || order.payload?.customer?.city ? `, ${order.payload.city || order.payload.customer.city}` : ''}
                          {order.payload?.postalCode || order.payload?.customer?.postalCode ? `, ${order.payload.postalCode || order.payload.customer.postalCode}` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="bg-gray-600 rounded-xl border border-gray-500 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Детали товара</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">Товар:</span>
                      <div className="text-gray-100">{order.payload?.productName || 'Футболка с принтом'}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Размер:</span>
                      <div className="text-gray-100">{order.payload?.size || 'M'}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Цвет:</span>
                      <div className="text-gray-100">{order.payload?.color || 'белый'}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Количество:</span>
                      <div className="text-gray-100">{order.payload?.quantity || 1} шт.</div>
                    </div>
                  </div>
                </div>

                {/* Print Position Info */}
                {order.payload?.imagePosition && (
                  <div className="bg-gray-600 rounded-xl border border-gray-500 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Параметры принта</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-300">Позиция X:</span>
                        <div className="text-gray-100 font-mono">{Math.round(order.payload.imagePosition.x)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-300">Позиция Y:</span>
                        <div className="text-gray-100 font-mono">{Math.round(order.payload.imagePosition.y)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-300">Масштаб:</span>
                        <div className="text-gray-100 font-mono">{Math.round((order.payload.imagePosition.scale || 1) * 100)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-300">Сторона:</span>
                        <div className="text-gray-100">{order.payload.imageSide || 'front'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Images and Downloads */}
              <div className="space-y-6">
                {/* Download Buttons */}
                <div className="bg-gray-600 rounded-xl border border-gray-500 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Скачать файлы</h2>
                  <div className="space-y-3">
                    {order.payload?.image ? (
                      <button 
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        onClick={() => downloadImage(order.payload.image, `order-${order.id}-print.png`)}
                      >
                        🖼️ Скачать принт
                      </button>
                    ) : (
                      <button 
                        className="w-full px-4 py-3 bg-gray-500 text-gray-300 rounded-lg cursor-not-allowed"
                        disabled
                      >
                        🖼️ Принт не найден
                      </button>
                    )}
                    
                    {order.payload?.previewImage ? (
                      <button 
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        onClick={() => downloadImage(order.payload.previewImage, `order-${order.id}-preview.jpg`)}
                      >
                        👕 Скачать превью футболки
                      </button>
                    ) : (
                      <button 
                        className="w-full px-4 py-3 bg-gray-500 text-gray-300 rounded-lg cursor-not-allowed"
                        disabled
                      >
                        👕 Превью не найдено
                      </button>
                    )}
                  </div>
                </div>

                {/* Images Preview */}
                <div className="bg-gray-600 rounded-xl border border-gray-500 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Изображения</h2>
                  
                  {/* Debug Info */}
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg text-xs text-gray-300">
                    <div>🖼️ Image: {order.payload?.image ? 'Есть' : 'Нет'}</div>
                    <div>👕 PreviewImage: {order.payload?.previewImage ? 'Есть' : 'Нет'}</div>
                    <div>📍 ImagePosition: {order.payload?.imagePosition ? 'Есть' : 'Нет'}</div>
                    {order.payload?.imagePosition && (
                      <div className="mt-2">
                        <div>X: {Math.round(order.payload.imagePosition.x)}%</div>
                        <div>Y: {Math.round(order.payload.imagePosition.y)}%</div>
                        <div>Scale: {Math.round((order.payload.imagePosition.scale || 1) * 100)}%</div>
                        <div>Side: {order.payload.imageSide || 'front'}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {order.payload?.image && (
                      <div>
                        <h3 className="font-medium text-gray-200 mb-2">Исходный принт</h3>
                        <div className="relative">
                          <img 
                            src={order.payload.image} 
                            alt="Принт" 
                            className="w-full h-48 object-contain bg-gray-500 rounded-lg border border-gray-400"
                            onError={(e) => {
                              console.error('❌ Ошибка загрузки принта:', e);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {order.payload?.previewImage && (
                      <div>
                        <h3 className="font-medium text-gray-200 mb-2">Превью футболки</h3>
                        <div className="relative">
                          <img 
                            src={order.payload.previewImage} 
                            alt="Превью футболки" 
                            className="w-full h-48 object-contain bg-gray-500 rounded-lg border border-gray-400"
                            onError={(e) => {
                              console.error('❌ Ошибка загрузки превью:', e);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {!order.payload?.image && !order.payload?.previewImage && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p>Изображения не найдены</p>
                        <p className="text-sm mt-1">Возможно, заказ был создан без принта</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useMemo, useState } from 'react';

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
    new: 'bg-blue-600 text-white',
    processing: 'bg-yellow-600 text-white',
    printed: 'bg-purple-600 text-white',
    shipped: 'bg-orange-600 text-white',
    completed: 'bg-green-600 text-white',
    cancelled: 'bg-red-600 text-white',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-600 text-white'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

export default function AdminPanel() {
  const [tab, setTab] = useState('orders');
  
  // Safe JSON parsing helper
  const safeJsonParse = async (response) => {
    const text = await response.text();
    if (!text || text.trim() === '') return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  // Consistent styles for better contrast
  const inputStyles = "border-2 border-gray-400 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none";
  const selectStyles = "border-2 border-gray-400 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-600 focus:outline-none";
  const buttonStyles = "px-3 py-1 rounded-md border-2 border-gray-400 text-gray-800 hover:bg-gray-200 hover:border-gray-500 font-medium";
  const deleteButtonStyles = "px-3 py-1 rounded-md border-2 border-red-400 text-red-800 hover:bg-red-100 hover:border-red-500 font-medium";
  const primaryButtonStyles = "px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500";
  const downloadButtonStyles = "px-3 py-1 rounded-md border-2 border-green-400 text-green-800 hover:bg-green-100 hover:border-green-500 font-medium";

  // Download helper functions
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

  // Price calculation functions
  const calculateDisplayTotal = (order) => {
    // Priority 1: Use totalPrice from payload (calculated on main page with discounts)
    // This is the most reliable source as it includes all discounts and calculations
    if (order.payload?.totalPrice && order.payload.totalPrice > 0) {
      return order.payload.totalPrice;
    }
    
    // Priority 2: Use pricing.orderTotal from order page calculation
    if (order.payload?.pricing?.orderTotal && order.payload.pricing.orderTotal > 0) {
      return order.payload.pricing.orderTotal;
    }
    
    // Priority 3: Manual calculation with discount support (improved)
    const basePrice = order.payload?.pricing?.baseTshirtPrice || 700;
    const printPrice = order.payload?.pricing?.printPricePerUnit || order.payload?.printPricePerUnit || 0;
    const quantity = order.payload?.quantity || order.payload?.pricing?.quantity || 1;
    const shipping = order.payload?.pricing?.shippingCost || 0;
    const discountPercent = order.payload?.discountPercent || 0;
    
    let subtotal = (basePrice + printPrice) * quantity;
    
    // Apply discount if present
    if (discountPercent > 0) {
      const discount = Math.round((subtotal * discountPercent) / 100);
      subtotal = Math.max(0, subtotal - discount);
    }
    
    const total = subtotal + shipping;
    
    // Priority 4: Use stored totalPrice only as absolute fallback
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
      <div className="text-xs text-gray-600">
        <div>Футболка: {basePrice} ₽</div>
        {printPrice > 0 && (
          <div>Принт: {printPrice} ₽</div>
        )}
        {quantity > 1 && (
          <div>Количество: {quantity} шт.</div>
        )}
        {quantity > 1 && (
          <div>Промежуточная сумма: {subtotal} ₽</div>
        )}
        {discountPercent > 0 && (
          <div className="text-red-600">Скидка {discountPercent}%: -{discountAmount} ₽</div>
        )}
        {shipping > 0 && (
          <div>Доставка: {shipping} ₽</div>
        )}
      </div>
    );
  };

  // Helper function to shorten IDs for better mobile display
  const shortenId = (id, length = 8) => {
    if (!id || typeof id !== 'string') return 'N/A';
    return id.length > length ? id.substring(0, length) + '...' : id;
  };
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await safeJsonParse(res);
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки заказов');
      setOrders(data.orders || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await safeJsonParse(res);
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки пользователей');
      setUsers(data.users || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sections', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки разделов');
      setSections(data.sections || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки товаров');
      setProducts(data.products || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const loadDiscounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/discounts', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки скидок');
      setDiscounts(data.discounts || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Загрузка разделов при инициализации (нужны для всех вкладок)
  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'users') loadUsers();
    if (tab === 'sections') loadSections();
    if (tab === 'products') loadProducts();
    if (tab === 'discounts') loadDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = statusFilter === 'all' || o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const text = JSON.stringify(o).toLowerCase();
      const searchOk = q.length === 0 || text.includes(q);
      return statusOk && searchOk;
    });
  }, [orders, statusFilter, search]);

  const updateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления статуса');
      setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm('Удалить заказ?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  const changeUserRole = async (userId, role) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления роли');
      setUsers(data.users || []);
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  // Sections CRUD
  const createSection = async (name) => {
    try {
      console.log('🗂️ Создание раздела с именем:', name);
      const requestBody = { name };
      console.log('📤 Отправляемые данные:', requestBody);
      
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Статус ответа:', res.status);
      const data = await res.json();
      console.log('📄 Данные ответа:', data);
      
      if (!res.ok) throw new Error(data.error || 'Ошибка создания раздела');
      
      console.log('✅ Раздел создан, обновляем список. Количество разделов:', data.sections?.length);
      setSections(data.sections || []);
    } catch (e) {
      console.error('❌ Ошибка создания раздела:', e);
      alert(String(e.message || e));
    }
  };

  const renameSection = async (id, name) => {
    try {
      const res = await fetch(`/api/admin/sections?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления раздела');
      setSections((prev) => prev.map((s) => (s.id === id ? data.section : s)));
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  const removeSection = async (id) => {
    if (!id) {
      alert('Ошибка: ID раздела не найден');
      return;
    }
    if (!confirm('Удалить раздел?')) return;
    try {
      console.log('🗑️ Удаление раздела с ID:', id);
      
      // Оптимистическое обновление UI
      setSections((prev) => prev.filter((s) => s.id !== id));
      
      const res = await fetch(`/api/admin/sections?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        // Откатываем изменения при ошибке
        await loadSections();
        throw new Error(data.error || 'Ошибка удаления');
      }
      console.log('✅ Раздел удален успешно');
    } catch (e) {
      console.error('❌ Ошибка удаления раздела:', e);
      alert(String(e.message || e));
    }
  };

  // Products CRUD
  const createProduct = async (payload) => {
    try {
      let imageUrls = [];
      
      // Если есть изображения (base64), сначала загружаем их в S3
      console.log('🔍 DEBUG: Checking images condition:', {
        hasImages: !!payload.images,
        imagesLength: payload.images?.length || 0,
        firstImageType: typeof payload.images?.[0]
      });
      
      if (payload.images && payload.images.length > 0) {
        console.log('📤 Uploading images to S3...');
        
        const formData = new FormData();
        
        // Конвертируем base64 обратно в файлы
        for (let i = 0; i < payload.images.length; i++) {
          const base64 = payload.images[i];
          const response = await fetch(base64);
          const blob = await response.blob();
          formData.append('files', blob, `image-${i}.jpg`);
        }
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Ошибка загрузки изображений');
        
        imageUrls = uploadData.urls;
        console.log('✅ Images uploaded:', imageUrls);
      }
      
      // Создаем товар с URLs вместо base64
      const productData = {
        ...payload,
        images: imageUrls // Заменяем base64 на URLs
      };
      
      console.log('📡 DEBUG: Creating product with S3 URLs:');
      console.log('   📝 Name:', productData.name);
      console.log('   🖼️ Image URLs:', imageUrls);
      
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания товара');
      setProducts(data.products || []);
      
    } catch (e) {
      console.error('❌ Product creation error:', e);
      alert(String(e.message || e));
    }
  };

  const updateProductReq = async (id, patch) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления товара');
      setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  const removeProduct = async (id) => {
    if (!id) {
      alert('Ошибка: ID товара не найден');
      return;
    }
    if (!confirm('Удалить товар?')) return;
    try {
      console.log('🗑️ Удаление товара с ID:', id);
      console.log('🔍 Тип ID:', typeof id, 'Длина:', id.length);
      
      // Оптимистическое обновление UI
      setProducts((prev) => prev.filter((p) => p.id !== id));
      
      const url = `/api/admin/products?id=${encodeURIComponent(id)}`;
      console.log('📡 Отправка запроса на:', url);
      
      const res = await fetch(url, { method: 'DELETE' });
      console.log('📥 Статус ответа:', res.status);
      
      const data = await res.json();
      console.log('📄 Данные ответа:', data);
      
      if (!res.ok) {
        // Откатываем изменения при ошибке
        await loadProducts();
        throw new Error(data.error || 'Ошибка удаления');
      }
      console.log('✅ Товар удален успешно');
    } catch (e) {
      console.error('❌ Ошибка удаления товара:', e);
      alert(String(e.message || e));
    }
  };

  // Discounts CRUD
  const createDiscount = async (payload) => {
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания скидки');
      setDiscounts(data.discounts || []);
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  const updateDiscountReq = async (id, patch) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления скидки');
      setDiscounts((prev) => prev.map((d) => (d.id === id ? data.discount : d)));
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  const removeDiscount = async (id) => {
    if (!id) {
      alert('Ошибка: ID скидки не найден');
      return;
    }
    if (!confirm('Удалить скидку?')) return;
    try {
      console.log('🗑️ Удаление скидки с ID:', id);
      
      // Оптимистическое обновление UI
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      
      const res = await fetch(`/api/admin/discounts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        // Откатываем изменения при ошибке
        await loadDiscounts();
        throw new Error(data.error || 'Ошибка удаления');
      }
      console.log('✅ Скидка удалена успешно');
    } catch (e) {
      console.error('❌ Ошибка удаления скидки:', e);
      alert(String(e.message || e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-max gap-2 rounded-full bg-gray-100 p-1" role="tablist">
            {[
              { key: 'orders', label: 'Заказы' },
              { key: 'users', label: 'Пользователи' },
              { key: 'sections', label: 'Разделы' },
              { key: 'products', label: 'Товары' },
              { key: 'discounts', label: 'Скидки' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === t.key ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'orders' && (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
            <div className="flex gap-2">
                          <select className={selectStyles} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Все статусы</option>
              {Object.keys(STATUS_LABELS).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <input className={inputStyles} placeholder="Поиск заказов..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={loadOrders}>Обновить</button>
            </div>
          </div>
        )}
        {tab === 'users' && (
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={loadUsers}>Обновить</button>
          </div>
        )}
      </div>

      {error && <div className="text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">{error}</div>}

      {tab === 'orders' && (
        <div className="space-y-3">
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  {['ID','Создан','Статус','Клиент','Итого','Действия'].map((h) => (
                    <th key={h} className="sticky top-0 z-10 bg-gray-900 text-white font-semibold p-3 first:rounded-tl-lg last:rounded-tr-lg text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => (
                  <tr key={o.id || `order-${idx}`} className={idx % 2 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 align-top text-xs text-gray-800 font-mono" title={o.id}>
                      {shortenId(o.id)}
                    </td>
                    <td className="p-3 align-top text-sm text-gray-800">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <select className={`${selectStyles} text-sm`} value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}>
                          {Object.keys(STATUS_LABELS).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-3 align-top text-sm">
                      <div className="font-semibold text-gray-800">
                        {o.payload?.customerInfo?.name || o.payload?.customer?.name || 'Не указано'}
                      </div>
                    </td>
                    <td className="p-3 align-top font-bold text-green-700 text-lg">
                      {calculateDisplayTotal(o)} ₽
                    </td>
                  <td className="p-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button className={deleteButtonStyles} onClick={() => deleteOrder(o.id)}>Удалить</button>
                      <button className={buttonStyles} onClick={() => setOrderDetails(o)}>Детали</button>
                        {o.previewImage && (
                          <a className={buttonStyles} href={o.previewImage} target="_blank" rel="noreferrer">Превью</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-900 font-semibold" colSpan={6}>Нет заказов</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid md:hidden gap-3">
                            {filteredOrders.map((o, idx) => (
                  <div key={o.id || `mobile-order-${idx}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-gray-800 font-mono" title={o.id}>
                    {shortenId(o.id)}
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-1 text-xs text-gray-700">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-800 font-medium">Клиент</div>
                  <div className="font-medium">
                    {o.payload?.customerInfo?.name || o.payload?.customer?.name || 'Не указано'}
                  </div>
                  <div className="text-gray-800 font-medium">Итого</div>
                  <div className="font-semibold">{calculateDisplayTotal(o)} ₽</div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select className="border border-gray-300 rounded px-2 py-1 bg-white" value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}>
                    {Object.keys(STATUS_LABELS).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <button className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100" onClick={() => deleteOrder(o.id)}>Удалить</button>
                  <button className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100" onClick={() => setOrderDetails(o)}>Детали</button>
                  {o.previewImage && (
                    <a className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100" href={o.previewImage} target="_blank" rel="noreferrer">Превью</a>
                  )}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center text-gray-900 font-semibold">Нет заказов</div>
            )}
          </div>
        </div>
      )}
      {orderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Детали заказа</h3>
              <button className={buttonStyles} onClick={() => setOrderDetails(null)}>Закрыть</button>
            </div>
            
            {/* Basic order info */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="text-gray-700 font-medium">ID</div>
              <div className="text-gray-900 font-mono text-xs break-all">{orderDetails.id}</div>
              <div className="text-gray-700 font-medium">Статус</div>
              <div className="text-gray-900 font-semibold">{STATUS_LABELS[orderDetails.status] || orderDetails.status}</div>
              <div className="text-gray-700 font-medium">Создан</div>
              <div className="text-gray-900">{new Date(orderDetails.createdAt).toLocaleString()}</div>
              <div className="text-gray-700 font-medium">Итого</div>
              <div className="space-y-1">
                <div className="font-bold text-green-700 text-lg">
                  {calculateDisplayTotal(orderDetails)} ₽
                </div>
                {renderPriceBreakdown(orderDetails)}
              </div>
            </div>

            {/* Download buttons */}
            <div className="flex flex-wrap gap-2">
              <button 
                className={downloadButtonStyles}
                onClick={() => downloadJSON(orderDetails, `order-${orderDetails.id}.json`)}
              >
                📄 Скачать JSON
              </button>
              {orderDetails.payload?.image && (
                <button 
                  className={downloadButtonStyles}
                  onClick={() => downloadImage(orderDetails.payload.image, `order-${orderDetails.id}-print.png`)}
                >
                  🖼️ Скачать принт
                </button>
              )}
              {orderDetails.payload?.previewImage && (
                <button 
                  className={downloadButtonStyles}
                  onClick={() => downloadImage(orderDetails.payload.previewImage, `order-${orderDetails.id}-preview.jpg`)}
                >
                  👕 Скачать превью
                </button>
              )}
            </div>

            {/* Images section */}
            {(orderDetails.payload?.image || orderDetails.payload?.previewImage) && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Изображения</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderDetails.payload?.image && (
                    <div className="border-2 border-gray-300 rounded-lg p-3">
                      <h5 className="font-medium text-gray-800 mb-2">Исходный принт</h5>
                      <img 
                        src={orderDetails.payload.image} 
                        alt="Принт" 
                        className="w-full h-48 object-contain bg-gray-100 rounded"
                      />
                      {orderDetails.payload?.imagePosition && (
                        <div className="mt-2 text-xs text-gray-800">
                          <div>Позиция: x={Math.round(orderDetails.payload.imagePosition.x)}%, y={Math.round(orderDetails.payload.imagePosition.y)}%</div>
                          <div>Масштаб: {Math.round((orderDetails.payload.imagePosition.scale || 1) * 100)}%</div>
                          <div>Сторона: {orderDetails.payload.imageSide || 'front'}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {orderDetails.payload?.previewImage && (
                    <div className="border-2 border-gray-300 rounded-lg p-3">
                      <h5 className="font-medium text-gray-800 mb-2">Превью футболки</h5>
                      <img 
                        src={orderDetails.payload.previewImage} 
                        alt="Превью футболки" 
                        className="w-full h-48 object-contain bg-gray-100 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Структурированные данные заказа */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Детали заказа</h4>
              
              {/* Информация о товаре */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Товар</h5>
                    <div className="text-gray-900">{orderDetails.payload?.productName || 'Футболка с принтом'}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">ID товара</h5>
                    <div className="font-mono text-sm text-gray-800" title={orderDetails.payload?.productId}>
                      {shortenId(orderDetails.payload?.productId || 'custom-print', 12)}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Размер</h5>
                    <div className="text-gray-900">{orderDetails.payload?.size || 'M'}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Цвет</h5>
                    <div className="text-gray-900">{orderDetails.payload?.color || 'белый'}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Количество</h5>
                    <div className="text-gray-900">{orderDetails.payload?.quantity || 1} шт.</div>
                  </div>
                </div>
                
                {/* Контактная информация */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Имя клиента</h5>
                    <div className="text-gray-900">{orderDetails.payload?.customerInfo?.name || orderDetails.payload?.customer?.name || 'Не указано'}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Email</h5>
                    <div className="text-gray-900">{orderDetails.payload?.customerInfo?.email || orderDetails.payload?.customer?.email || 'Не указано'}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Телефон</h5>
                    <div className="text-gray-900">{orderDetails.payload?.customerInfo?.phone || orderDetails.payload?.customer?.phone || 'Не указано'}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Способ получения</h5>
                    <div className="text-gray-900">
                      {orderDetails.payload?.deliveryMethod === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Адрес доставки</h5>
                    <div className="text-gray-900">
                      {orderDetails.payload?.deliveryMethod === 'delivery' 
                        ? (orderDetails.payload?.customerInfo?.address || orderDetails.payload?.customer?.address)
                          ? `${orderDetails.payload?.customerInfo?.address || orderDetails.payload?.customer?.address}${(orderDetails.payload?.customerInfo?.city || orderDetails.payload?.customer?.city) ? `, ${orderDetails.payload?.customerInfo?.city || orderDetails.payload?.customer?.city}` : ''}`
                          : 'Не указано'
                        : 'Самовывоз'
                      }
                      {(orderDetails.payload?.customerInfo?.postalCode || orderDetails.payload?.customer?.postalCode) && (
                        <div className="text-sm text-gray-600">Индекс: {orderDetails.payload?.customerInfo?.postalCode || orderDetails.payload?.customer?.postalCode}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Способ оплаты</h5>
                    <div className="text-gray-900">
                      {orderDetails.payload?.paymentMethod === 'online' ? 'Онлайн оплата' : 'Наличными'}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Статус оплаты</h5>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      orderDetails.payload?.paymentMethod === 'online' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orderDetails.payload?.paymentMethod === 'online' ? 'Оплачено' : 'Ожидает оплаты'}
                    </div>
                  </div>
                  
                  {orderDetails.payload?.customer?.notes && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Примечания</h5>
                      <div className="text-gray-900">{orderDetails.payload.customer.notes}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Информация о принте */}
              {orderDetails.payload?.imagePosition && (
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Параметры принта</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Позиция X:</span>
                      <span className="ml-2 text-gray-900">{Math.round(orderDetails.payload.imagePosition.x)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Позиция Y:</span>
                      <span className="ml-2 text-gray-900">{Math.round(orderDetails.payload.imagePosition.y)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Масштаб:</span>
                      <span className="ml-2 text-gray-900">{Math.round((orderDetails.payload.imagePosition.scale || 1) * 100)}%</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Сторона:</span>
                    <span className="ml-2 text-gray-900">{orderDetails.payload.imageSide || 'front'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left first:rounded-tl-lg">ID</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Имя</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Email</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left last:rounded-tr-lg">Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id || `user-${idx}`} className={idx % 2 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-3 text-xs text-gray-800 font-mono" title={u.id}>
                    {shortenId(u.id)}
                  </td>
                  <td className="p-3 text-gray-900 font-medium">{u.name}</td>
                  <td className="p-3 text-gray-900">{u.email}</td>
                  <td className="p-3">
                    <select className={`${selectStyles} text-sm`} value={u.role} onChange={(e) => changeUserRole(u.id, e.target.value)}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-900 font-semibold" colSpan={4}>Нет пользователей</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sections' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Добавить раздел</h3>
            <SectionCreateForm onCreate={createSection} />
          </div>
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left first:rounded-tl-lg">ID</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Название</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left last:rounded-tr-lg">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s, idx) => (
                <tr key={s.id || `section-${idx}`} className={`${idx % 2 ? 'bg-white' : 'bg-gray-50'} ${!s.id || s.id.trim() === '' ? 'border-l-4 border-red-400 bg-red-50' : ''}`}>
                  <td className="p-3 text-xs text-gray-800 font-mono" title={s.id}>
                    {s.id ? shortenId(s.id) : <span className="text-red-600 font-bold">⚠️ ПУСТОЙ ID</span>}
                  </td>
                  <td className="p-3 text-gray-900 font-medium" title={`Slug: ${s.slug || 'не задан'}`}>{s.name}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <InlineEditButton 
                        text={s.name} 
                        onSave={(name) => renameSection(s.id, name)}
                        disabled={!s.id || s.id.trim() === ''}
                      />
                      <button 
                        className={deleteButtonStyles} 
                        disabled={!s.id || s.id.trim() === ''}
                        onClick={() => {
                          if (!s.id || s.id.trim() === '') {
                            alert('Ошибка: Невозможно удалить раздел без ID. Попробуйте обновить страницу.');
                            return;
                          }
                          removeSection(s.id);
                        }}
                        title={!s.id || s.id.trim() === '' ? 'Невозможно удалить: отсутствует ID' : 'Удалить раздел'}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-900 font-semibold" colSpan={3}>Нет разделов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Добавить товар</h3>
            <ProductCreateForm sections={sections} onCreate={createProduct} />
          </div>
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left first:rounded-tl-lg">ID</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Название</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Раздел</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">База цена</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Изображение</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left last:rounded-tr-lg">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => (
                <tr key={p.id || `product-${idx}`} className={`${idx % 2 ? 'bg-white' : 'bg-gray-50'} ${!p.id || p.id.trim() === '' ? 'border-l-4 border-red-400 bg-red-50' : ''}`}>
                  <td className="p-3 text-xs text-gray-800 font-mono" title={p.id}>
                    {p.id ? shortenId(p.id) : <span className="text-red-600 font-bold">⚠️ ПУСТОЙ ID</span>}
                  </td>
                  <td className="p-3 text-gray-900 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-800">{sections.find((s) => s.id === p.sectionId)?.name || '-'}</td>
                  <td className="p-3 text-gray-900 font-semibold">{p.basePrice} ₽</td>
                  <td className="p-3">
                    {p.images && p.images.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {p.images.slice(0, 3).map((img, idx) => (
                            <img 
                    key={`product-${p.id || idx}-image-${idx}`}
                              src={img} 
                              alt={`${p.name} ${idx + 1}`} 
                              className="w-6 h-6 object-cover rounded border-2 border-white" 
                            />
                          ))}
                          {p.images.length > 3 && (
                            <div className="w-6 h-6 bg-gray-500 text-white text-xs rounded border-2 border-white flex items-center justify-center">
                              +{p.images.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-green-600 text-xs">✓ {p.images.length} фото</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Нет фото</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <ProductEditButton 
                        product={p} 
                        sections={sections} 
                        onSave={(updatedData) => updateProductReq(p.id, updatedData)}
                        disabled={!p.id || p.id.trim() === ''}
                      />
                      <button 
                        className={deleteButtonStyles} 
                        disabled={!p.id || p.id.trim() === ''}
                        onClick={() => {
                          if (!p.id || p.id.trim() === '') {
                            alert('Ошибка: Невозможно удалить товар без ID. Попробуйте обновить страницу.');
                            return;
                          }
                          removeProduct(p.id);
                        }}
                        title={!p.id || p.id.trim() === '' ? 'Невозможно удалить: отсутствует ID' : 'Удалить товар'}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-900 font-semibold" colSpan={6}>Нет товаров</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'discounts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Создать скидку</h3>
            <DiscountCreateForm sections={sections} products={products} onCreate={createDiscount} />
          </div>
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left first:rounded-tl-lg">ID</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Название</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">%</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Период</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left">Активна</th>
                <th className="p-3 bg-gray-900 text-white font-semibold text-left last:rounded-tr-lg">Действия</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d, idx) => (
                <tr key={d.id || `discount-${idx}`} className={idx % 2 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-3 text-xs text-gray-800 font-mono" title={d.id}>
                    {shortenId(d.id)}
                  </td>
                  <td className="p-3 text-gray-900 font-medium">{d.name}</td>
                  <td className="p-3 text-gray-900 font-bold text-orange-600">{d.percent}%</td>
                  <td className="p-3 text-sm text-gray-800">{new Date(d.startsAt).toLocaleDateString()} — {new Date(d.endsAt).toLocaleDateString()}</td>
                  <td className="p-3">{d.active ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">Активна</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-white">Не активна</span>}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className={d.active ? deleteButtonStyles : primaryButtonStyles} onClick={() => updateDiscountReq(d.id, { active: !d.active })}>{d.active ? 'Остановить' : 'Запустить'}</button>
                      <button className={deleteButtonStyles} onClick={() => removeDiscount(d.id)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-900 font-semibold" colSpan={6}>Нет скидок</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductEditButton({ product, sections, onSave, disabled = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    basePrice: product.basePrice,
    sectionId: product.sectionId || '',
    description: product.description || ''
  });

  const handleSave = () => {
    const updatedData = {
      ...formData,
      basePrice: Number(formData.basePrice) || 0
    };
    onSave(updatedData);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setFormData({
      name: product.name,
      basePrice: product.basePrice,
      sectionId: product.sectionId || '',
      description: product.description || ''
    });
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      <button 
        className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
          disabled 
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        disabled={disabled}
        onClick={() => !disabled && setIsModalOpen(true)}
        title={disabled ? 'Невозможно редактировать: отсутствует ID' : 'Редактировать товар'}
      >
        Ред.
      </button>

      {/* Попап */}
      {isModalOpen && (
        <>
          {/* Невидимый слой для закрытия при клике вне попапа */}
          <div 
            className="fixed inset-0 z-40"
            onClick={handleCancel}
          />
          
          {/* Сам попап */}
          <div className="absolute bottom-full right-0 mb-2 w-80 max-w-screen-sm bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Редактировать товар</h3>
                <button 
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Раздел</label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">—</option>
                                {sections.map((s, idx) => (
              <option key={s.id || `select-section-${idx}`} value={s.id || ''}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:border-blue-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Сохранить
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-md hover:bg-gray-600 transition-colors font-medium text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InlineEditButton({ text, onSave, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  return (
    <div className="inline-flex items-center gap-2">
      {editing ? (
        <>
          <input className="border-2 border-gray-300 rounded px-2 py-1 w-40 text-sm focus:border-blue-500 focus:outline-none" value={value} onChange={(e) => setValue(e.target.value)} />
          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors" onClick={() => { setEditing(false); onSave(value); }}>Сохранить</button>
          <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors" onClick={() => { setEditing(false); setValue(text); }}>Отмена</button>
        </>
      ) : (
        <button 
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            disabled 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
          }`}
          disabled={disabled}
          onClick={() => !disabled && setEditing(true)}
          title={disabled ? 'Невозможно редактировать: отсутствует ID' : 'Редактировать'}
        >
          Изм.
        </button>
      )}
    </div>
  );
}

function SectionCreateForm({ onCreate }) {
  const [name, setName] = useState('');
  return (
    <form className="flex flex-col md:flex-row gap-2 items-end" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onCreate(name.trim()); setName(''); } }}>
      <div className="flex-1 min-w-56">
        <label className="block text-sm mb-1 text-gray-900">Название раздела</label>
        <input className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Футболки" />
      </div>
      <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" type="submit">Добавить</button>
    </form>
  );
}

function ProductCreateForm({ sections, onCreate }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('1500');
  const [sectionId, setSectionId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      // Проверяем размер файла (максимум 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой. Максимальный размер: 2MB`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        console.log('🖼️ DEBUG: Image loaded successfully:');
        console.log('   📁 File name:', file.name);
        console.log('   📏 Base64 size:', Math.round(result.length / 1024), 'KB');
        console.log('   ✅ Added to images array');
        setImages(prev => {
          const newImages = [...prev, result];
          console.log('   📦 Total images now:', newImages.length);
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    });
    // Очищаем input для возможности загрузки тех же файлов повторно
    e.target.value = '';
  };
  
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const productData = { name: name.trim(), basePrice: Number(price)||0, sectionId: sectionId || 'general', description, images };
        console.log('🖼️ DEBUG: Creating product with images:');
        console.log('   📝 Name:', name.trim());
        console.log('   🖼️ Images count:', images.length);
        console.log('   📏 First image length:', images[0]?.length || 'No images');
        console.log('   📦 Images array:', images.length > 0 ? 'Has images' : 'Empty');
        onCreate(productData);
        setName(''); setPrice('1500'); setSectionId(''); setDescription(''); setImages([]);
      }}>
        {/* Основные поля товара */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1 text-gray-900">Название товара</label>
            <input className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Футболка Basic" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-900">Цена</label>
            <input className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-900">Раздел</label>
            <select className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 focus:border-blue-600 focus:outline-none" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Общий раздел</option>
              {sections.map((s, idx) => <option key={s.id || `edit-section-${idx}`} value={s.id || ''}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-900">Описание</label>
            <input className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Загрузка изображений */}
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="product-image-upload"
          />
          <label
            htmlFor="product-image-upload"
            className="cursor-pointer inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Добавить изображения
          </label>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG до 2MB (можно выбрать несколько)</p>

          {/* Список загруженных изображений */}
          {images.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-600 font-medium">Загружено изображений: {images.length}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Изображение ${index + 1}`} 
                      className="w-full h-20 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-80 group-hover:opacity-100"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка отправки */}
        <div className="flex justify-end">
          <button className="px-6 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium transition-colors" type="submit">
            Добавить товар
          </button>
        </div>
      </form>
    </div>
  );
}

function DiscountCreateForm({ sections, products, onCreate }) {
  const [name, setName] = useState('Весенняя акция');
  const [percent, setPercent] = useState('10');
  const [active, setActive] = useState(true);
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState(() => new Date(Date.now()+7*24*3600*1000).toISOString().slice(0, 10));
  const [productIds, setProductIds] = useState([]);
  const [sectionIds, setSectionIds] = useState([]);

  const toggleInArray = (arr, setArr, id) => {
    setArr((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toEpoch = (yyyyMmDd) => new Date(yyyyMmDd + 'T00:00:00').getTime();

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault();
      onCreate({ name, percent: Number(percent)||0, active, startsAt: toEpoch(startsAt), endsAt: toEpoch(endsAt), productIds, sectionIds });
      setName(''); setPercent('10'); setActive(false); setProductIds([]); setSectionIds([]);
    }}>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-sm mb-1 text-gray-900">Название</label>
          <input className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-900">Процент</label>
          <input className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" value={percent} onChange={(e) => setPercent(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-900">Старт</label>
          <input type="date" className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 focus:border-blue-600 focus:outline-none" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-900">Окончание</label>
          <input type="date" className="border-2 border-gray-400 rounded-md px-3 py-2 w-full bg-white text-gray-900 focus:border-blue-600 focus:outline-none" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" className="h-4 w-4" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-gray-900">Активна</label>
        </div>
        <div>
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 w-full" type="submit">Создать</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3">
          <div className="font-semibold mb-1 text-gray-900">Применить к разделам</div>
          <div className="flex flex-wrap gap-2">
            {sections.map((s, idx) => (
              <button type="button" key={s.id || `discount-section-${idx}`} className={`px-3 py-2 rounded-full border-2 font-medium transition-colors ${sectionIds.includes(s.id) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-800 border-gray-400 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700'}`} onClick={() => toggleInArray(sectionIds, setSectionIds, s.id)}>{s.name}</button>
            ))}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="font-semibold mb-1 text-gray-900">Применить к товарам</div>
          <div className="flex flex-wrap gap-2">
            {products.map((p, idx) => (
              <button type="button" key={p.id || `discount-product-${idx}`} className={`px-3 py-2 rounded-full border-2 font-medium transition-colors ${productIds.includes(p.id) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-800 border-gray-400 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700'}`} onClick={() => toggleInArray(productIds, setProductIds, p.id)}>{p.name}</button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}



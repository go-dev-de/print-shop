import { NextResponse } from 'next/server';
import { addOrder, listOrders } from '@/lib/orderStore';
import { getSession } from '@/lib/session';
import { initSchemaIfNeeded, createOrderYdb, listOrdersYdb } from '@/lib/ydb/repo';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Robust body parsing to avoid JSON parse errors from malformed requests
    let orderData = {};
    try {
      const raw = await request.text();
      orderData = raw ? JSON.parse(raw) : {};
    } catch {
      orderData = {};
    }
    
    // Get user session
    const user = await getSession();
    
    // Calculate total price
    let totalPrice = Number(orderData?.totalPrice || 0);
    if (!totalPrice || totalPrice <= 0) {
      const basePrice = 1500;
      const printPrice = orderData?.printPricePerUnit ? Number(orderData.printPricePerUnit) : 0;
      const qty = Number(orderData?.quantity || 1);
      const subtotal = (basePrice + printPrice) * qty;
      const dp = Number(orderData?.discountPercent || 0);
      const discount = Math.round((subtotal * dp) / 100);
      totalPrice = Math.max(0, subtotal - discount);
    }
    
    // Store order (try YDB first, fallback to memory)
    let stored;
    try {
      await initSchemaIfNeeded();
      const orderPayload = {
        userId: user?.id,
        status: orderData?.paymentMethod === 'online' ? 'pending_payment' : 'new',
        payload: orderData,
        totalPrice
      };
      
      console.log('📦 Создание заказа в YDB:', {
        hasImage: !!orderData.image,
        hasPreviewImage: !!orderData.previewImage,
        hasImagePosition: !!orderData.imagePosition,
        payloadKeys: Object.keys(orderData)
      });
      
      // Детальное логирование previewImage
      if (orderData.previewImage) {
        console.log('🖼️ previewImage найден:', {
          type: typeof orderData.previewImage,
          length: orderData.previewImage.length,
          startsWith: orderData.previewImage.substring(0, 50) + '...'
        });
      } else {
        console.log('❌ previewImage отсутствует в orderData');
      }
      
      stored = await createOrderYdb(orderPayload);
    } catch (ydbError) {
      console.warn('YDB order failed, using memory store:', ydbError.message);
      const orderPayload = {
        userId: user?.id,
        status: orderData?.paymentMethod === 'online' ? 'pending_payment' : 'new',
        payload: orderData,
        totalPrice
      };
      stored = addOrder(orderPayload);
    }
    return NextResponse.json({ success: true, orderId: stored.id, message: 'Заказ успешно создан', order: stored });
    
  } catch (error) {
    console.error('Ошибка при обработке заказа:', error);
    const dev = process.env.NODE_ENV !== 'production';
    const details = dev ? String(error?.stack || error?.message || error) : undefined;
    return NextResponse.json({ success: false, message: 'Произошла ошибка при обработке заказа', error: details }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get orders from both YDB and memory store
    let ydbOrders = [];
    try {
      await initSchemaIfNeeded();
      ydbOrders = await listOrdersYdb();
    } catch (error) {
      console.warn('YDB orders fetch failed:', error.message);
    }
    
    const memoryOrders = listOrders();
    
    // Merge orders, avoiding duplicates by id
    const ordersByIid = new Map();
    
    // Add memory orders first
    memoryOrders.forEach(order => {
      ordersByIid.set(order.id, order);
    });
    
    // Add YDB orders (will overwrite memory orders if same id)
    ydbOrders.forEach(order => {
      ordersByIid.set(order.id, order);
    });
    
    const orders = Array.from(ordersByIid.values());
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders GET error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({ 
      error: 'Ошибка загрузки заказов', 
      details: dev ? String(error?.stack || error?.message || error) : undefined 
    }, { status: 500 });
  }
}
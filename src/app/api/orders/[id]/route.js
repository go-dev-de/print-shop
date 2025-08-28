import { NextResponse } from 'next/server';
import { getOrderByIdYdb, updateOrderStatusYdb, deleteOrderYdb } from '@/lib/ydb/repo';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID заказа не указан' }, { status: 400 });
    }

    const order = await getOrderByIdYdb(id);
    
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('❌ Error getting order by ID:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID заказа не указан' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Статус не указан' }, { status: 400 });
    }

    // Обновляем статус заказа в YDB
    await updateOrderStatusYdb(id, status);
    
    // Получаем обновленный заказ
    const updatedOrder = await getOrderByIdYdb(id);
    
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID заказа не указан' }, { status: 400 });
    }

    // Удаляем заказ из YDB
    await deleteOrderYdb(id);
    
    return NextResponse.json({ message: 'Заказ успешно удален' });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const orderData = await request.json();
    
    // Здесь будет логика сохранения заказа в базу данных
    console.log('Получен новый заказ:', orderData);
    
    // Телеграм уведомление
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (BOT_TOKEN && CHAT_ID) {
      const caption = [
        `Новый заказ`,
        `Имя: ${orderData?.customerInfo?.name || '-'}`,
        `Телефон: ${orderData?.customerInfo?.phone || '-'}`,
        `Email: ${orderData?.customerInfo?.email || '-'}`,
        `Адрес: ${orderData?.customerInfo?.address || '-'}, ${orderData?.customerInfo?.city || '-'} ${orderData?.customerInfo?.postalCode || ''}`,
        `Размер: ${orderData?.size}`,
        `Цвет: ${orderData?.color}`,
        `Количество: ${orderData?.quantity}`,
        `Размер принта: ${orderData?.printSizeLabel || '-'}`,
        // Позицию принта не отправляем цифрами — она видна на превью
        `Цена футболки: 1500 ₽`,
        `Цена принта: ${orderData?.printPricePerUnit ? `${orderData.printPricePerUnit} ₽` : '0 ₽'}`,
        `Итого (клиент): ${orderData?.totalPrice} ₽`,
        orderData?.customerInfo?.notes ? `Пожелания: ${orderData.customerInfo.notes}` : null,
      ].filter(Boolean).join('\n');

      // Пытаемся собрать серверный композит из public/ шаблона и пользовательского принта
      let composedBuffer = null;
      try {
        composedBuffer = await composeTshirtImage(orderData);
      } catch (e) {
        console.error('Не удалось сгенерировать серверный композит:', e);
      }

      // Если собрали композит — отправляем его, иначе используем превью из клиента
      if (composedBuffer) {
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: createFormDataForTelegramBuffer(CHAT_ID, composedBuffer, 'composite.jpg', caption)
          });
        } catch (e) {
          console.error('Ошибка отправки серверного композита в Telegram:', e);
        }
      } else if (orderData?.previewImage?.startsWith('data:image')) {
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: createFormDataForTelegramImage(CHAT_ID, orderData.previewImage, 'preview.jpg', caption)
          });
        } catch (e) {
          console.error('Ошибка отправки изображения в Telegram:', e);
        }
      } else {
        // Иначе отправляем текст
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: caption, parse_mode: 'HTML' })
          });
        } catch (e) {
          console.error('Ошибка отправки текста в Telegram:', e);
        }
      }

      // Отправляем исходный принт документом (высокое разрешение, без сжатия)
      if (orderData?.image?.startsWith('data:image')) {
        try {
          const { buffer: originalBuffer, extension, mime } = await dataURLtoBufferAndExt(orderData.image);
          const filename = `print.${extension || 'png'}`;
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: createFormDataForTelegramBufferWithMime(CHAT_ID, originalBuffer, filename, 'Исходный принт (оригинальное разрешение)', mime)
          });
        } catch (e) {
          console.error('Ошибка отправки исходного принта в Telegram:', e);
        }
      }
    } else {
      console.warn('TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не настроены. Уведомление не отправлено.');
    }

    // Имитация обработки заказа
    const orderId = `ORDER-${Date.now()}`;
    
    // В реальном приложении здесь будет:
    // 1. Валидация данных
    // 2. Сохранение в базу данных
    // 3. Отправка уведомлений
    // 4. Интеграция с платежными системами
    
    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: 'Заказ успешно создан'
    });
    
  } catch (error) {
    console.error('Ошибка при обработке заказа:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Произошла ошибка при обработке заказа'
      },
      { status: 500 }
    );
  }
}

function createFormDataForTelegramImage(chatId, dataUrl, filename, caption) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('caption', caption);
  const blob = dataURLtoBlob(dataUrl);
  // В Node используем Blob напрямую с указанием имени файла
  formData.append('photo', blob, filename);
  return formData;
}

function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = Buffer.from(arr[1], 'base64');
  return new Blob([bstr], { type: mime });
}

function createFormDataForTelegramBuffer(chatId, buffer, filename, caption) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('caption', caption);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('photo', blob, filename);
  return formData;
}

function createFormDataForTelegramBufferWithMime(chatId, buffer, filename, caption, mime) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  if (caption) formData.append('caption', caption);
  const blob = new Blob([buffer], { type: mime || 'application/octet-stream' });
  formData.append('document', blob, filename);
  return formData;
}

async function composeTshirtImage(orderData) {
  // Путь к шаблону футболки в public
  const publicDir = path.join(process.cwd(), 'public');
  const templatePath = path.join(publicDir, 'futbolka-muzhskaya-basic.png');
  // Загружаем шаблон
  // Подготавливаем шаблон с учетом выбранного цвета
  const coloredTemplateBuffer = await getColoredTemplateBuffer(templatePath, orderData?.color || 'white');
  const template = sharp(coloredTemplateBuffer);
  const { width: tplW, height: tplH } = await template.metadata();
  if (!tplW || !tplH) throw new Error('Не удалось определить размеры шаблона');

  // Получаем пользовательское изображение (data URL) -> Buffer
  if (!orderData?.image?.startsWith('data:image')) throw new Error('Нет пользовательского изображения');
  const designBlob = dataURLtoBlob(orderData.image);
  const designArrayBuffer = await designBlob.arrayBuffer();
  const designBuffer = Buffer.from(designArrayBuffer);

  // Вычисляем позицию и размеры
  const pos = orderData?.imagePosition || { x: 50, y: 50, scale: 1, rotation: 0 };
  const rotation = typeof pos.rotation === 'number' ? pos.rotation : 0;
  // Регион передней/задней части
  const side = orderData?.imageSide === 'back' ? 'back' : 'front';
  const isBack = side === 'back';
  const regionLeft = isBack ? Math.round(tplW / 2) : 0; // зад справа, перед слева
  const regionTop = 0;
  const regionWidth = Math.round(tplW / 2);
  const regionHeight = tplH;

  // Соответствие размеров превью и шаблона
  // Превью shirtRef: w-60 = 240px; базовый принт = 80px * scale
  const previewShirtWidth = 240;
  const previewBasePrint = 80 * (pos.scale || 1);
  const widthRatio = previewBasePrint / previewShirtWidth; // доля ширины рубашки под принт
  const printWidth = Math.max(8, Math.round(regionWidth * widthRatio));
  const printHeight = printWidth; // квадрат, как в превью

  // Ресайзим и поворачиваем принт
  let processedDesign = sharp(designBuffer).resize({ width: printWidth, height: printHeight, fit: 'contain' });
  if (rotation) {
    processedDesign = processedDesign.rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  const processedBuffer = await processedDesign.toBuffer();
  const processedMeta = await sharp(processedBuffer).metadata();

  // Переводим проценты позиции в пиксели относительно шаблона
  // Берем проценты относительно активной области (перед/зад)
  const centerX = regionLeft + Math.round((pos.x || 50) / 100 * regionWidth);
  const centerY = regionTop + Math.round((pos.y || 50) / 100 * regionHeight);
  const left = Math.round(centerX - (processedMeta.width || printWidth) / 2);
  const top = Math.round(centerY - (processedMeta.height || printHeight) / 2);

  // Композитим
  const composed = await sharp(coloredTemplateBuffer)
    .composite([
      { input: processedBuffer, left, top }
    ])
    // Заливаем фон белым, чтобы в JPEG не было черного фона
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 85 })
    .toBuffer();

  return composed;
}

async function getColoredTemplateBuffer(templatePath, colorName) {
  // Базовое PNG с альфой (вне футболки прозрачность)
  let img = sharp(templatePath).png();

  switch (colorName) {
    case 'black':
      // Затемняем только сам шаблон, прозрачность сохраняется
      img = img.modulate({ brightness: 0.25, saturation: 1 });
      break;
    case 'gray':
      img = img.modulate({ brightness: 0.65, saturation: 0.8 });
      break;
    case 'navy':
      // Легкое тонирование в синий + понижаем яркость
      img = img.tint({ r: 0, g: 0, b: 254 }).modulate({ brightness: 0.8, saturation: 1.2 });
      break;
    case 'white':
    default:
      // Без изменений — остаётся белой
      break;
  }

  return await img.toBuffer();
}

async function dataURLtoBufferAndExt(dataUrl) {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  let extension = 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg';
  else if (mime.includes('png')) extension = 'png';
  else if (mime.includes('webp')) extension = 'webp';
  else if (mime.includes('svg')) extension = 'svg';
  const buffer = Buffer.from(base64, 'base64');
  return { buffer, extension, mime };
}

export async function GET() {
  // В реальном приложении здесь будет получение списка заказов
  return NextResponse.json({
    message: 'API для заказов работает'
  });
} 
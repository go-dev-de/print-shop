# 🚨 КРИТИЧЕСКИЕ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

## Проблема
**База данных и загрузка файлов НЕ РАБОТАЮТ** потому что нет файла `.env.local`!

## Решение
Создай файл `.env.local` в корне проекта:

```bash
# YDB Configuration
YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135
YDB_DATABASE=/ru-central1/b1gg229m54tpdno56431/etn4bo731i5c82gkkppa
YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=./.secrets/ydb-sa.json

# Yandex Cloud Storage (S3)
YC_STORAGE_ACCESS_KEY=YOUR_ACCESS_KEY_HERE
YC_STORAGE_SECRET_KEY=YOUR_SECRET_KEY_HERE  
YC_STORAGE_BUCKET=print-shop-images

# Session Secret
SESSION_SECRET=super-secret-session-key-change-in-production

# Development mode
NODE_ENV=development
```

## Что нужно заполнить:
1. **YC_STORAGE_ACCESS_KEY** - ключ доступа к Yandex Cloud Storage
2. **YC_STORAGE_SECRET_KEY** - секретный ключ для Storage
3. **SESSION_SECRET** - любая длинная строка для сессий

## Симптомы проблем:
- ❌ Товары пустые
- ❌ Разделы не создаются/удаляются  
- ❌ Аватарки не загружаются
- ❌ Скидки не сохраняются

## После создания .env.local:
```bash
pnpm run dev
```
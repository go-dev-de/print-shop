# 🚀 Настройка переменных окружения на Vercel

## Проблема
Товары создаются в админке, но не сохраняются между перезагрузками, потому что на продакшене нет подключения к YDB.

## ✅ Решение: Настроить переменные окружения

### 1. Зайти в Vercel Dashboard
- Открыть https://vercel.com/dashboard
- Найти проект `print-shop`  
- Settings → Environment Variables

### 2. Добавить переменные YDB

**YDB_ENDPOINT**
```
grpcs://ydb.serverless.yandexcloud.net:2135
```

**YDB_DATABASE** 
```
/ru-central1/b1gg229m54tpdno56431/etn4bo731i5c82gkkppa
```

**YDB_SA_KEY_JSON**
```json
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```
> ⚠️ Вставить полное содержимое файла `.secrets/ydb-sa.json` как одну строку

### 3. Деплой после настройки
- В Vercel: Deployments → Redeploy (принудительный передеплой)
- Или git push с любым изменением

### 4. Проверка
После деплоя:
- `/api/debug/products` должен показать подключение к YDB
- Товары должны сохраняться между перезагрузками
- Разделы должны работать корректно

## 🔍 Диагностика

**Если YDB не работает:**
- Проверить логи Vercel (Functions tab)
- Проверить правильность ключа сервисного аккаунта
- Убедиться что YDB база доступна

**Признаки что YDB работает:**
- `/api/debug/products` показывает данные в разделе `ydb`
- Товары остаются после F5
- Админ панель показывает товары после перезагрузки
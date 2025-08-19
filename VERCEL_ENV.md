# 🚀 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ ДЛЯ VERCEL

## В Vercel Dashboard нужно добавить:

### YDB:
- `YDB_ENDPOINT` = `grpcs://ydb.serverless.yandexcloud.net:2135`
- `YDB_DATABASE` = `/ru-central1/b1gg229m54tpdno56431/etn4bo731i5c82gkkppa`
- `YDB_SA_KEY_JSON` = `{содержимое файла .secrets/ydb-sa.json}`

### Yandex Cloud Storage:
- `YC_STORAGE_ACCESS_KEY` = `твой ключ доступа`
- `YC_STORAGE_SECRET_KEY` = `твой секретный ключ`
- `YC_STORAGE_BUCKET` = `print-shop-images`

### Session:
- `SESSION_SECRET` = `super-secret-production-key-12345`

### Environment:
- `NODE_ENV` = `production`

## Как добавить в Vercel:
1. Открой проект в Vercel Dashboard
2. Перейди в Settings → Environment Variables
3. Добавь все переменные выше
4. Redeploy проект
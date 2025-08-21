-- ===== ОПТИМИЗИРОВАННАЯ СХЕМА YDB С ИНДЕКСАМИ =====
-- Эта схема содержит индексы для ускорения запросов

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id Utf8,
  email Utf8,
  name Utf8,
  password_hash Utf8,
  role Utf8,
  avatar Utf8,
  created_at Uint64,
  PRIMARY KEY (id)
);

-- Индекс для быстрого поиска по email (авторизация)
CREATE INDEX IF NOT EXISTS users_email ON users (email);
-- Индекс для поиска по роли (админ панель)
CREATE INDEX IF NOT EXISTS users_role ON users (role);

-- 2. Таблица корзин
CREATE TABLE IF NOT EXISTS carts (
  id Utf8,
  user_id Utf8,
  items Json,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- Индекс для быстрого поиска корзин пользователя
CREATE INDEX IF NOT EXISTS carts_user_id ON carts (user_id);

-- 3. Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id Utf8,
  user_id Utf8,
  status Utf8,
  payload Json,
  total_price Int64,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- Индекс для поиска заказов пользователя
CREATE INDEX IF NOT EXISTS orders_user_id ON orders (user_id);
-- Индекс для поиска по статусу заказа
CREATE INDEX IF NOT EXISTS orders_status ON orders (status);
-- Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS orders_created_at ON orders (created_at);

-- 4. Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id Utf8,
  user_id Utf8,
  author_name Utf8,
  author_email Utf8,
  rating Int32,
  title Utf8,
  content Utf8,
  media_urls Json,
  status Utf8,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- Индекс для поиска отзывов пользователя
CREATE INDEX IF NOT EXISTS reviews_user_id ON reviews (user_id);
-- Индекс для поиска по статусу (одобренные/на модерации)
CREATE INDEX IF NOT EXISTS reviews_status ON reviews (status);
-- Индекс для сортировки по рейтингу
CREATE INDEX IF NOT EXISTS reviews_rating ON reviews (rating);
-- Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS reviews_created_at ON reviews (created_at);

-- 5. Таблица разделов товаров
CREATE TABLE IF NOT EXISTS sections (
  id Utf8,
  name Utf8,
  description Utf8,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- Индекс для поиска по названию раздела
CREATE INDEX IF NOT EXISTS sections_name ON sections (name);
-- Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS sections_created_at ON sections (created_at);

-- 6. Таблица товаров (ОСНОВНАЯ ТАБЛИЦА ДЛЯ ОПТИМИЗАЦИИ)
CREATE TABLE IF NOT EXISTS products (
  id Utf8,
  name Utf8,
  base_price Double,
  description Utf8,
  section Utf8,
  section_id Utf8, -- Добавляем поле для связи с разделами
  images Json,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- КРИТИЧЕСКИ ВАЖНЫЕ ИНДЕКСЫ для ускорения загрузки страницы товаров:
-- Индекс для фильтрации по разделу (самый важный!)
CREATE INDEX IF NOT EXISTS products_section ON products (section);
CREATE INDEX IF NOT EXISTS products_section_id ON products (section_id);
-- Индекс для сортировки по дате создания (для ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS products_created_at ON products (created_at);
-- Индекс для поиска по названию (для поиска товаров)
CREATE INDEX IF NOT EXISTS products_name ON products (name);
-- Индекс для фильтрации по цене (для фильтров по цене)
CREATE INDEX IF NOT EXISTS products_base_price ON products (base_price);

-- 7. Таблица скидок
CREATE TABLE IF NOT EXISTS discounts (
  id Utf8,
  name Utf8,
  percentage Double,
  sections Json,
  products Json,
  is_active Bool,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- Индекс для поиска активных скидок
CREATE INDEX IF NOT EXISTS discounts_is_active ON discounts (is_active);
-- Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS discounts_created_at ON discounts (created_at);

-- ===== ДОПОЛНИТЕЛЬНЫЕ ИНДЕКСЫ ДЛЯ КОМПОЗИТНЫХ ЗАПРОСОВ =====

-- Составной индекс для товаров: раздел + дата создания (для фильтрации + сортировки)
CREATE INDEX IF NOT EXISTS products_section_created_at ON products (section, created_at);
CREATE INDEX IF NOT EXISTS products_section_id_created_at ON products (section_id, created_at);

-- Составной индекс для заказов: пользователь + статус + дата (для истории заказов)
CREATE INDEX IF NOT EXISTS orders_user_status_created ON orders (user_id, status, created_at);

-- Составной индекс для отзывов: статус + рейтинг + дата (для отображения лучших отзывов)
CREATE INDEX IF NOT EXISTS reviews_status_rating_created ON reviews (status, rating, created_at); 
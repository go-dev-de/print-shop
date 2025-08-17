-- ===== СОЗДАНИЕ ВСЕХ ТАБЛИЦ YDB =====
-- Скопируйте и вставьте эти запросы в консоль YDB по одному

-- 1. Таблица пользователей
CREATE TABLE users (
  id Utf8,
  email Utf8,
  name Utf8,
  password_hash Utf8,
  role Utf8,
  created_at Uint64,
  PRIMARY KEY (id)
);

-- 2. Таблица корзин
CREATE TABLE carts (
  id Utf8,
  user_id Utf8,
  items Json,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- 3. Таблица заказов
CREATE TABLE orders (
  id Utf8,
  user_id Utf8,
  status Utf8,
  payload Json,
  total_price Int64,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- 4. Таблица отзывов
CREATE TABLE reviews (
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

-- 5. Таблица разделов товаров
CREATE TABLE sections (
  id Utf8,
  name Utf8,
  description Utf8,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- 6. Таблица товаров
CREATE TABLE products (
  id Utf8,
  name Utf8,
  base_price Double,
  description Utf8,
  section Utf8,
  images Json,
  created_at Uint64,
  updated_at Uint64,
  PRIMARY KEY (id)
);

-- 7. Таблица скидок
CREATE TABLE discounts (
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
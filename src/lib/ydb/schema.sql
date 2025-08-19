-- Users table
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

CREATE INDEX IF NOT EXISTS users_email ON users (email);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id Utf8,
  user_id Utf8,
  items Json,
  updated_at Uint64,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS carts_user_id ON carts (user_id);

-- Orders table
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

CREATE INDEX IF NOT EXISTS orders_user_id ON orders (user_id);


-- ===== ВСТАВКА ТЕСТОВЫХ ДАННЫХ =====
-- Выполните после создания таблиц

-- Добавляем тестовые разделы
INSERT INTO sections (id, name, description, created_at, updated_at) 
VALUES 
  ("tshirts", "Футболки", "Качественные футболки с принтами", 1704067200000, 1704067200000),
  ("hoodies", "Худи", "Теплые худи с индивидуальными принтами", 1704067200000, 1704067200000),
  ("accessories", "Аксессуары", "Кружки, чехлы и другие аксессуары", 1704067200000, 1704067200000);

-- Добавляем тестовые товары
INSERT INTO products (id, name, base_price, description, section, images, created_at, updated_at) 
VALUES 
  ("basic-tshirt", "Футболка базовая", 1500.0, "Качественная хлопковая футболка, идеальная для печати", "tshirts", JSON('["/futbolka-muzhskaya-basic.png"]'), 1704067200000, 1704067200000),
  ("premium-tshirt", "Футболка премиум", 2200.0, "Премиальная футболка из органического хлопка", "tshirts", JSON('["/futbolka-muzhskaya-basic.png"]'), 1704067200000, 1704067200000),
  ("basic-hoodie", "Худи классик", 3500.0, "Теплое худи для прохладной погоды", "hoodies", JSON('["/futbolka-muzhskaya-basic.png"]'), 1704067200000, 1704067200000);

-- Добавляем тестовые скидки
INSERT INTO discounts (id, name, percentage, sections, products, is_active, created_at, updated_at) 
VALUES 
  ("summer-sale", "Летняя распродажа", 15.0, JSON('["tshirts"]'), JSON('[]'), true, 1704067200000, 1704067200000),
  ("new-customer", "Скидка новым клиентам", 10.0, JSON('[]'), JSON('[]'), true, 1704067200000, 1704067200000);
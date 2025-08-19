// Simple in-memory user store for demo purposes only
// Do NOT use in production

import crypto from 'node:crypto';

function getGlobalStore() {
  if (!globalThis.__PRINT_SHOP_USER_STORE__) {
    globalThis.__PRINT_SHOP_USER_STORE__ = {
      usersByEmail: new Map(),
      createdAt: Date.now(),
    };
  }
  return globalThis.__PRINT_SHOP_USER_STORE__;
}

export function hashPassword(plain) {
  return crypto.createHash('sha256').update(String(plain)).digest('hex');
}

export function addUser({ email, password, name, role = 'user' }) {
  const store = getGlobalStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.usersByEmail.has(normalizedEmail)) {
    throw new Error('User already exists');
  }
  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: name || normalizedEmail.split('@')[0],
    passwordHash: hashPassword(password),
    role,
    createdAt: Date.now(),
  };
  store.usersByEmail.set(normalizedEmail, user);
  return { ...user, passwordHash: undefined };
}

export function findUserByEmail(email) {
  const store = getGlobalStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = store.usersByEmail.get(normalizedEmail);
  if (!user) return null;
  return user;
}

export function validateCredentials(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const isValid = user.passwordHash === hashPassword(password);
  if (!isValid) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function listUsers() {
  const store = getGlobalStore();
  return Array.from(store.usersByEmail.values()).map((u) => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
}

export function updateUserRole(userId, role) {
  const store = getGlobalStore();
  for (const [email, user] of store.usersByEmail.entries()) {
    if (user.id === userId) {
      const updated = { ...user, role };
      store.usersByEmail.set(email, updated);
      const { passwordHash, ...safe } = updated;
      return safe;
    }
  }
  return null;
}

export function updateUser(userId, { name, email, avatar }) {
  const store = getGlobalStore();
  for (const [userEmail, user] of store.usersByEmail.entries()) {
    if (user.id === userId) {
      // Обновляем пользователя
      const updated = { 
        ...user, 
        name: name || user.name,
        avatar: avatar || user.avatar || ''
      };
      
      // Если email изменился, нужно обновить ключ в Map
      if (email && email !== user.email) {
        const normalizedNewEmail = String(email).trim().toLowerCase();
        store.usersByEmail.delete(userEmail);
        updated.email = normalizedNewEmail;
        store.usersByEmail.set(normalizedNewEmail, updated);
      } else {
        store.usersByEmail.set(userEmail, updated);
      }
      
      const { passwordHash, ...safe } = updated;
      return safe;
    }
  }
  return null;
}

export function deleteUser(userId) {
  const store = getGlobalStore();
  for (const [email, user] of store.usersByEmail.entries()) {
    if (user.id === userId) {
      // Защита от удаления админов
      if (user.role === 'admin') {
        throw new Error('Cannot delete admin user');
      }
      store.usersByEmail.delete(email);
      const { passwordHash, ...safe } = user;
      return safe;
    }
  }
  return null;
}


import { addUser, findUserByEmail } from '@/lib/userStore';

export function ensureDefaultAdmin() {
  const email = 'admin@local';
  if (findUserByEmail(email)) return;
  try {
    addUser({ email, password: 'admin123', name: 'Admin', role: 'admin' });
  } catch {
    // ignore if exists or any race
  }
}


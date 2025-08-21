'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);
  
  // Форма редактирования профиля
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUser = async () => {
      try {

        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const userData = responseData.user;
          setUser(userData);
          setProfileForm({
            name: userData?.name || '',
            email: userData?.email || ''
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Проверяем флаг выхода ПЕРЕД загрузкой пользователя
    const loggedOut = sessionStorage.getItem('user_logged_out');
    if (loggedOut === 'true') {
      console.log('🚪 User already logged out, skipping auth check');
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Проверяем URL параметр logout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      console.log('🚪 Logout parameter detected, clearing user state');
      setUser(null);
      setLoading(false);
      return;
    }

    fetchUser();
    
    // Слушаем событие выхода
    const handleLogoutEvent = () => {
      console.log('🚪 Logout event received');
      setUser(null);
    };
    
    window.addEventListener('user-logged-out', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('user-logged-out', handleLogoutEvent);
    };
  }, []);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрытие модалки при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, что клик не по кнопке профиля и не внутри модалки
      const profileButton = event.target.closest('[data-profile-button]');
      if (!profileButton && modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
        setIsEditing(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setIsEditing(false);
      }
    };

    if (isModalOpen) {
      // Добавляем небольшую задержку, чтобы клик по кнопке профиля не сразу закрывал модалку
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);



  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        alert('Профиль успешно обновлен!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update failed:', response.status, errorData);
        alert(`Ошибка при обновлении профиля: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Ошибка при обновлении профиля');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Функция для получения URL аватара
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    
    // Если это уже полный URL
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    
    // Пока S3 не настроен, возвращаем null
    return null;
  };

  if (loading) {
    return (
      <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  // Если пользователь не залогинен
  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <a
          href="/login"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
        >
          Вход
        </a>
        <a
          href="/register"
          className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
        >
          Регистрация
        </a>
      </div>
    );
  }

  // Если пользователь залогинен
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar/Profile Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-50 transition-colors group"
        data-profile-button
      >
        <div className="relative">
          {getAvatarUrl(user.avatar) ? (
            <Image
              src={getAvatarUrl(user.avatar)}
              alt={user.name}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold border-2 border-gray-200 group-hover:border-gray-300 transition-colors">
              {getInitials(user.name)}
            </div>
          )}
          
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-700 rounded-xl shadow-xl border border-gray-600 py-2 z-50 animate-fade-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-600">
            <div className="flex items-center space-x-3">
              {getAvatarUrl(user.avatar) ? (
                <Image
                  src={getAvatarUrl(user.avatar)}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.role === 'admin' ? 'Администратор' : (user.name || 'Пользователь')}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center space-x-3 transition-colors"
              data-profile-button
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Настройки профиля</span>
            </button>

            {user.role === 'admin' && (
              <a
                href="/admin"
                className="w-full px-4 py-2 text-sm text-blue-400 hover:bg-gray-600 hover:text-blue-300 flex items-center space-x-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Панель администратора</span>
              </a>
            )}

            <div className="border-t border-gray-600 my-1"></div>

            <Link
              href="/?logout=true"
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 flex items-center space-x-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Выйти</span>
            </Link>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {isModalOpen && (
        <div className="absolute right-0 top-12 z-50">
          <div ref={modalRef} className="bg-gray-700 rounded-xl w-80 max-h-[60vh] overflow-y-auto shadow-xl border border-gray-600 animate-modal-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? 'Редактировать профиль' : 'Мой профиль'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                }}
                className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors text-gray-300 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {!isEditing ? (
                // View Mode
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex justify-center">
                    {getAvatarUrl(user.avatar) ? (
                      <Image
                        src={getAvatarUrl(user.avatar)}
                        alt={user.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-3 border-gray-500"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-xl font-bold border-3 border-gray-500">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Имя</label>
                      <p className="text-white">{user.name || 'Не указано'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <p className="text-white">{user.email}</p>
                    </div>

                    {user.role === 'admin' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Роль</label>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-200 border border-blue-600">
                          Администратор
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Редактировать профиль
                  </button>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {/* Avatar Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Аватар</label>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold border-2 border-gray-500">
                        {getInitials(user.name)}
                      </div>
                      <div className="text-sm text-gray-400">
                        <p>Загрузка аватара</p>
                        <p className="text-xs">будет доступна позже</p>
                      </div>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Имя</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 text-white bg-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                      placeholder="Введите ваше имя"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 text-white bg-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                      placeholder="Введите ваш email"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                      {updating ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-600 text-white py-2.5 rounded-lg hover:bg-gray-500 font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
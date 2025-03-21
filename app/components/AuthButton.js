'use client';

// components/AuthButton.js
import Link from 'next/link';
import { useState } from 'react';
import { FiUser, FiLogOut, FiLogIn, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';

export default function AuthButton() {
  const { user, login, logout, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        data-testid="auth-button"
        className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
      >
        <FiLogIn className="mr-2" />
        <span>로그인</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center focus:outline-none"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User'}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <FiUser />
          </div>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 border-b">
            <div className="font-medium text-base">{user.displayName}</div>
            <div className="text-gray-500 dark:text-gray-400 truncate mt-1">{user.email}</div>
          </div>
          <Link 
            href="/planner"
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiMapPin className="mr-2 text-blue-600" />
            <span>내 여행 계획</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-t"
          >
            <FiLogOut className="mr-2 text-red-500" />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
}
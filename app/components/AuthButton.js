'use client';

// components/AuthButton.js
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut, FiLogIn, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from './../hooks/useAnalytics'; // Analytics 훅 추가
import Image from 'next/image';

export default function AuthButton() {
  const { user, login, logout, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [loginInProgress, setLoginInProgress] = useState(false);
  
  // Analytics 훅 사용
  const { trackEvent } = useAnalytics();

  // 로그인 중복 클릭 방지 및 디바운싱
  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (loginInProgress) return; // 이미 로그인 진행 중이면 추가 클릭 무시
    
    try {
      setLoginInProgress(true); // 로그인 시작 표시
      console.log('Login attempt started'); // 디버깅용
      
      // 로그인 시도 이벤트 추적
      trackEvent('login_attempt', 'user_auth', '로그인 시도');
      
      await login();
      console.log('Login successful'); // 디버깅용
      
      // 로그인 성공 이벤트 추적
      trackEvent('login_success', 'user_auth', '로그인 성공', {
        method: 'google' // 로그인 방법 추가
      });
    } catch (error) {
      console.error('Login failed:', error);
      
      // 로그인 실패 이벤트 추적
      trackEvent('login_error', 'user_auth', `로그인 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      // 잠시 후 상태 초기화
      setTimeout(() => {
        setLoginInProgress(false);
      }, 1000);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    
    try {
      // 로그아웃 시도 이벤트 추적
      trackEvent('logout_attempt', 'user_auth', '로그아웃 시도');
      
      await logout();
      setIsDropdownOpen(false);
      
      // 로그아웃 성공 이벤트 추적
      trackEvent('logout_success', 'user_auth', '로그아웃 성공');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // 로그아웃 실패 이벤트 추적
      trackEvent('logout_error', 'user_auth', `로그아웃 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 드롭다운 열기/닫기 이벤트 추적
  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    
    // 드롭다운 토글 이벤트 추적
    trackEvent(
      newState ? 'open_user_menu' : 'close_user_menu', 
      'navigation', 
      newState ? '사용자 메뉴 열기' : '사용자 메뉴 닫기'
    );
  };

  // 내 여행 계획 메뉴 클릭 이벤트 핸들러
  const handleMyTripsClick = () => {
    // 내 여행 계획 클릭 이벤트 추적
    trackEvent('click_my_trips', 'navigation', '내 여행 계획 페이지 이동');
    setIsDropdownOpen(false);
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
        
        // 외부 클릭으로 드롭다운 닫기 이벤트 추적
        trackEvent('close_user_menu_outside_click', 'navigation', '외부 클릭으로 사용자 메뉴 닫기');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, trackEvent]);

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <button
        ref={buttonRef}
        onClick={handleLogin}
        data-testid="auth-button"
        disabled={loginInProgress}
        className={`flex items-center px-4 py-2 rounded-md text-white dark:text-gray-900 font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          loginInProgress 
            ? 'bg-blue-400 dark:bg-yellow-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-500'
        }`}
        style={{ position: 'relative', zIndex: 20 }}
      >
        <FiLogIn className="mr-2" />
        <span>{loginInProgress ? 'Logging in...' : 'Login'}</span>
      </button>
    );
  }

  return (
    <div className="relative" style={{ zIndex: 30 }}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
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
        <div 
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700"
          style={{ zIndex: 40 }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
            <div className="font-medium text-base">{user.displayName}</div>
            <div className="text-gray-500 dark:text-gray-400 truncate mt-1">{user.email}</div>
          </div>
          <Link 
            href="/planner"
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleMyTripsClick}
            role="menuitem"
          >
            <FiMapPin className="mr-2 text-blue-600" />
            <span>내 여행 계획</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-t dark:border-gray-700"
            role="menuitem"
          >
            <FiLogOut className="mr-2 text-red-500" />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
}
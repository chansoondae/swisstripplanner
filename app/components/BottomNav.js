'use client';

import Link from 'next/link';
import { FiHome, FiInfo, FiMap, FiVideo } from 'react-icons/fi';

export default function BottomNav() {
  return (
    <div className="flex justify-around max-w-md mx-auto">
      <Link 
        href="/" 
        className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
      >
        <FiHome className="h-6 w-6 mb-1" />
        <span className="text-xs">홈</span>
      </Link>
      <Link 
        href="/info" 
        className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
      >
        <FiInfo className="h-6 w-6 mb-1" />
        <span className="text-xs">정보</span>
      </Link>
      <Link 
        href="/planner" 
        className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
      >
        <FiMap className="h-6 w-6 mb-1" />
        <span className="text-xs">일정</span>
      </Link>
      <Link 
        href="/webcam" 
        className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
      >
        <FiVideo className="h-6 w-6 mb-1" />
        <span className="text-xs">웹캠</span>
      </Link>
    </div>
  );
}
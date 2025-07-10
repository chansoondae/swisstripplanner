'use client';

import Link from 'next/link';
import { FiHome, FiInfo, FiMap, FiVideo, FiDollarSign, FiCloud } from 'react-icons/fi';

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-md py-2 px-4">
      <div className="flex justify-around max-w-md mx-auto">
        <Link 
          href="/" 
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
        >
          <FiHome className="h-6 w-6 mb-1" />
          <span className="text-xs">Home</span>
        </Link>

        <Link 
          href="/cost" 
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
        >
          <FiDollarSign className="h-6 w-6 mb-1" />
          <span className="text-xs">Cost</span>
        </Link>
        <Link 
          href="/info" 
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
        >
          <FiInfo className="h-6 w-6 mb-1" />
          <span className="text-xs">Info</span>
        </Link>
        <Link 
          href="/webcam" 
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
        >
          <FiVideo className="h-6 w-6 mb-1" />
          <span className="text-xs">Webcam</span>
        </Link>
        <Link 
          href="/weather" 
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
        >
          <FiCloud className="h-6 w-6 mb-1" />
          <span className="text-xs">Weather</span>
        </Link>
        <Link 
          href="/planner" 
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-300 transition-colors"
        >
          <FiMap className="h-6 w-6 mb-1" />
          <span className="text-xs">Plan</span>
        </Link>
      </div>
    </div>
  );
}
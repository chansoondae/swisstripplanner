// app/planner/[id]/not-found.js
'use client';

import Link from 'next/link';
import { FiAlertTriangle, FiHome, FiPlus } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-6 text-amber-500 dark:text-amber-400">
          <FiAlertTriangle size={60} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          여행 계획을 찾을 수 없습니다
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
          요청하신 여행 계획이 존재하지 않거나 삭제되었을 수 있습니다.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/planner" className="btn btn-secondary py-3 px-6 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center">
            <FiHome className="mr-2" /> 계획 목록으로 돌아가기
          </Link>
          
          <Link href="/" className="btn btn-primary py-3 px-6 bg-blue-600 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 dark:hover:bg-yellow-500 flex items-center justify-center">
            <FiPlus className="mr-2" /> 새 여행 계획 만들기
          </Link>
        </div>
      </div>
    </div>
  );
}
// app/planner/[id]/LoadingFallback.js
'use client';

import { FiLoader } from 'react-icons/fi';

// Loading component for Suspense fallback
export default function LoadingFallback({ message = '로딩 중...' }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin text-blue-600 dark:text-yellow-400 mb-4">
          <FiLoader size={40} />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">{message}</p>
      </div>
    </div>
  );
}
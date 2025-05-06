// app/planner/[id]/error.js
'use client';

import { useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Error boundary component for the travel plan page
export default function ErrorBoundary({ error, reset }) {
  const router = useRouter();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Travel Plan Error:', error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error?.message || '여행 계획을 불러오는 중 오류가 발생했습니다.'}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => reset()}
            className="btn btn-secondary py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            다시 시도하기
          </button>
          
          <button
            onClick={() => router.push('/planner')}
            className="btn btn-primary py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <FiArrowLeft className="mr-2" /> 여행 계획 목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
// app/not-found.js
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold text-blue-600 dark:text-yellow-400">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">페이지를 찾을 수 없습니다</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="px-6 py-3 mt-8 text-white bg-blue-600 dark:bg-yellow-400 dark:text-gray-900 rounded-lg hover:bg-blue-700 dark:hover:bg-yellow-500 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
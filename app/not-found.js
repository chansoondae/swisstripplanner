import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 삭제되었거나, 이름이 변경되었거나, 일시적으로 사용이 불가능합니다.
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white font-medium px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            홈으로 돌아가기
          </Link>
          <div>
            <Link
              href="/info"
              className="inline-block text-blue-600 font-medium hover:underline"
            >
              여행 정보 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
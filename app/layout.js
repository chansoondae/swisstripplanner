//app/layout.js
import './globals.css';
import Link from 'next/link';
import { FiMapPin } from 'react-icons/fi';
import { AuthProvider } from '../context/AuthContext';
import AuthButton from './components/AuthButton';
import BottomNav from './components/BottomNav';
import ChatButtonWrapper from './components/ChatButtonWrapper';

// 전역 스타일 추가
const globalStyles = `
  body {
    /* 채팅 버튼을 위한 여백 확보 */
    padding-bottom: 5rem !important;
    position: relative;
  }

  /* 채팅 버튼 위치 고정 */
  .fixed-chat-button-container {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 5rem;
    height: 5rem;
    z-index: 50;
    pointer-events: none; /* 버튼 자체만 클릭 가능하도록 */
  }
  
  .fixed-chat-button-container > button {
    pointer-events: auto; /* 버튼은 클릭 이벤트 허용 */
  }
`;

export const metadata = {
  title: 'Swiss Travel Planner',
  description: 'Plan your perfect Swiss adventure with AI-generated itineraries',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{globalStyles}</style>
      </head>
      <body className="pb-16">
        <AuthProvider>
          <header className="bg-white dark:bg-gray-900 shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex flex-1">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="text-blue-600 dark:text-yellow-300 font-bold text-lg flex items-center">
                      <FiMapPin className="mr-2" />
                      Swiss Travel Planner
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link 
                      href="/" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      홈
                    </Link>
                    <Link 
                      href="/info" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      스위스 정보
                    </Link>
                    <Link 
                      href="/planner" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      여행 일정
                    </Link>
                    <Link 
                      href="/webcam" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-yellow-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      라이브 웹캠
                    </Link>
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <AuthButton />
                </div>
              </div>
            </nav>
          </header>

          {/* 페이지 콘텐츠를 감싸는 컨테이너 추가 - 레이아웃 시프트 방지 */}
          <main className="page-container relative min-h-screen">
            {children}
          </main>
          
          {/* Bottom Navigation Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 shadow-lg">
            <BottomNav />
          </div>
          
          {/* 채팅 버튼 영역 고정 */}
          <div className="fixed-chat-button-container">
            <ChatButtonWrapper />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
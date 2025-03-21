import './globals.css';
import Link from 'next/link';
import { FiMapPin } from 'react-icons/fi';
import { AuthProvider } from '../context/AuthContext';
import AuthButton from './components/AuthButton';
import BottomNav from './components/BottomNav';

export const metadata = {
  title: 'Swiss Travel Planner',
  description: 'Plan your perfect Swiss adventure with AI-generated itineraries',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="pb-16">
        <AuthProvider>
          <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex flex-1">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="text-blue-600 font-bold text-lg flex items-center">
                      <FiMapPin className="mr-2" />
                      Swiss Travel Planner
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link 
                      href="/" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      홈
                    </Link>
                    <Link 
                      href="/info" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      스위스 정보
                    </Link>
                    <Link 
                      href="/planner" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      여행 일정
                    </Link>
                    <Link 
                      href="/webcam" 
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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

          <main>{children}</main>
          
          {/* Bottom Navigation Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
// app/layout.js
import './globals.css';
import Link from 'next/link';
import { FiMapPin, FiHome, FiMap, FiVideo, FiInfo } from 'react-icons/fi';

export const metadata = {
  title: 'Swiss Travel Planner',
  description: 'Plan your perfect Swiss adventure with AI-generated itineraries',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="pb-16"> {/* 하단 네비게이션을 위한 패딩 추가 */}
        <header className="bg-white shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
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
                    Home
                  </Link>
                  <Link 
                    href="/info" 
                    className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    About Switzerland
                  </Link>
                  <Link 
                    href="/planner" 
                    className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Itinerary
                  </Link>
                  <Link 
                    href="/webcam" 
                    className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Webcam
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </header>

        <main>{children}</main>
        
        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
          <div className="flex justify-around max-w-md mx-auto">
            <Link 
              href="/" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FiHome className="h-6 w-6 mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link 
              href="/planner" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FiMap className="h-6 w-6 mb-1" />
              <span className="text-xs">Planner</span>
            </Link>
            <Link 
              href="/info" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FiInfo className="h-6 w-6 mb-1" />
              <span className="text-xs">info</span>
            </Link>
            <Link 
              href="/webcam" 
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FiVideo className="h-6 w-6 mb-1" />
              <span className="text-xs">Webcam</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
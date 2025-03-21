'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAnalytics } from './../hooks/useAnalytics';

// 클라이언트 사이드 웹캠 컴포넌트
export default function WebcamClient({ webcams }) {
  const { trackPageView, trackEvent } = useAnalytics();
  
  // 페이지 로드 시 분석 이벤트 발생
  useEffect(() => {
    trackPageView('스위스 실시간 웹캠');
    
    // 웹캠 목록 조회 이벤트 추적
    trackEvent(
      'view_item_list', 
      'content', 
      '웹캠 목록',
      webcams.length
    );
  }, [trackPageView, trackEvent, webcams.length]);
  
  // 웹캠 클릭 이벤트 핸들러
  const handleWebcamClick = (webcam) => {
    trackEvent(
      'select_content',
      'engagement',
      `웹캠: ${webcam.nameKo}`,
      webcam.id
    );
  };
  
  return (
    <div className="custom-container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">스위스 실시간 웹캠</h1>
      
      {webcams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">웹캠 데이터를 불러올 수 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {webcams.map((webcam) => (
            <Link 
              href={webcam.href} 
              target="_blank"
              rel="noopener noreferrer"
              key={webcam.id}
              className="block group"
              onClick={() => handleWebcamClick(webcam)}
            >
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48">
                  <Image 
                    src={webcam.img} 
                    alt={webcam.nameKo} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                  />
                </div>
                
                <div className="p-5">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors duration-200">
                    {webcam.nameKo}
                  </h2>
                  
                  <div className="text-sm text-gray-500 mb-3 flex items-center">
                    <span>{webcam.nameEn}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
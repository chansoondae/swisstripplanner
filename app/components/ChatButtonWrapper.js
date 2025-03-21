'use client';

// app/components/ChatButtonWrapper.js
import { useEffect, useState, useRef } from 'react';
import ChatButtonPortal from './ChatButtonPortal';

export default function ChatButtonWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef(null);
  
  useEffect(() => {
    setIsMounted(true);
    
    // 콘텐츠 높이 변화에 따른 레이아웃 시프트 방지를 위한 스타일 설정
    const preventLayoutShift = () => {
      // 채팅 버튼의 높이만큼 여백 추가
      const body = document.body;
      // 레이아웃 이동 방지를 위한 패딩 설정
      body.style.paddingBottom = "5rem"; // 버튼 영역보다 넉넉하게 설정
    };
    
    preventLayoutShift();
    
    return () => {
      setIsMounted(false);
      // 컴포넌트 언마운트 시 스타일 제거 (필요한 경우)
      // document.body.style.paddingBottom = "";
    };
  }, []);
  
  // 서버 사이드 렌더링 중에는 아무것도 렌더링하지 않음
  if (!isMounted) return null;
  
  return (
    <div ref={buttonRef} style={{ position: 'fixed', zIndex: 9999 }}>
      <ChatButtonPortal 
        className="bg-blue-600 dark:bg-yellow-400" 
        iconClassName="text-white dark:text-gray-900"
      />
    </div>
  );
}
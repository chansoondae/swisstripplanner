// app/components/ChatButtonPortal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiMessageCircle, FiX, FiSend, FiTrash2 } from 'react-icons/fi';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 로컬스토리지 키 상수
const STORAGE_KEYS = {
  MESSAGES: 'swiss-travel-chat-messages',
  THREAD_ID: 'swiss-travel-thread-id',
  LAST_UPDATED: 'swiss-travel-last-updated'
};

// 저장 제한 설정
const STORAGE_LIMITS = {
  MAX_MESSAGES: 50,     // 저장할 최대 메시지 수
  MAX_AGE_DAYS: 7,      // 대화 보관 최대 일수
};

// Marked 설정 - 더 안전한 옵션으로 변경
marked.setOptions({
  breaks: true,         // 줄바꿈 허용
  gfm: true,            // GitHub Flavored Markdown 활성화
  headerIds: false,     // 헤더에 자동 ID 생성 비활성화 (보안상 이유)
  mangle: false,        // 헤더 ID 변환 비활성화
  sanitize: true,       // HTML 태그 제한 (DOMPurify와 함께 사용)
  smartLists: true,     // 더 똑똑한 리스트 생성
  smartypants: true,    // 따옴표, 대시 등 변환
  xhtml: false          // XHTML 태그 닫기 비활성화
});

// DOMPurify 설정 - React에서 안전하게 사용하기 위한 설정
if (typeof window !== 'undefined') {
  DOMPurify.setConfig({
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onkeyup', 'onkeydown', 'onkeypress']
  });

  // Custom 이벤트 핸들러 제거
  DOMPurify.addHook('afterSanitizeAttributes', function(node) {
    if (node.hasAttribute('href')) {
      // 외부 링크에 noopener noreferrer 추가
      node.setAttribute('rel', 'noopener noreferrer');
      
      // 자바스크립트 링크 방지
      const href = node.getAttribute('href') || '';
      if (href.toLowerCase().startsWith('javascript:')) {
        node.setAttribute('href', '#');
      }
    }
    
    // 모든 on* 속성 제거 - 수정된 부분
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      if (attr.name.startsWith('on')) {
        node.removeAttribute(attr.name);
      }
    }
  });
}

const ThinkingIndicator = () => {
  // 전체 텍스트를 상태로 관리 (애니메이션 누락 방지)
  const [text, setText] = useState("생각중...");
  
  useEffect(() => {
    // 완전한 텍스트 배열 정의
    const texts = ["생각중", "생각중.", "생각중..", "생각중...", "생각중....", "생각중....."];
    let index = 0;
    
    // 정해진 간격으로 텍스트 변경
    const interval = setInterval(() => {
      setText(texts[index]);
      index = (index + 1) % texts.length;
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // 단순히 현재 텍스트 상태를 반환
  return <div>{text}</div>;
};

const ChatButtonPortal = ({ className, iconClassName }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threadId, setThreadId] = useState(null);
  
  // 메시지 영역 스크롤 관리
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 클라이언트 사이드에서만 렌더링되도록
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // 다크 모드 감지
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 버튼 위치 고정
  const buttonStyle = {
    position: 'fixed',
    bottom: '3.5rem',
    right: '1.5rem',
    zIndex: 50,
    width: '3.5rem', // 크기 고정
    height: '3.5rem', // 크기 고정
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem', 
    borderRadius: '9999px', 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  };
  
  useEffect(() => {
    if (mounted) {
      // 초기 다크 모드 설정 감지
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
      
      // 다크 모드 변경 감지 리스너
      const handleChange = (e) => {
        setIsDarkMode(e.matches);
      };
      
      darkModeMediaQuery.addEventListener('change', handleChange);
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }
  }, [mounted]);

  // 오래된 대화 정리 함수
  const cleanupOldConversations = () => {
    try {
      const lastUpdated = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      if (!lastUpdated) return;
      
      const lastDate = new Date(lastUpdated);
      const currentDate = new Date();
      const daysSinceUpdate = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
      
      // 설정된 일수보다 오래된 경우 대화 초기화
      if (daysSinceUpdate > STORAGE_LIMITS.MAX_AGE_DAYS) {
        const initialMessage = { 
          role: 'assistant', 
          content: '스위스 여행 관련 질문 있으세요?' 
        };
        
        try {
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([initialMessage]));
          localStorage.removeItem(STORAGE_KEYS.THREAD_ID);
          localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
        } catch (err) {
          console.error('로컬스토리지 저장 오류:', err);
        }
        
        return [initialMessage];
      }
      
      return null; // 초기화 필요 없음
    } catch (error) {
      console.error('오래된 대화 정리 중 오류:', error);
      return null;
    }
  };

  // 메시지 수 제한 함수
  const limitStoredMessages = (messagesToStore) => {
    try {
      if (!messagesToStore || messagesToStore.length === 0) return messagesToStore;
      
      // 메시지가 최대 개수를 초과하면 가장 오래된 메시지 제거
      if (messagesToStore.length > STORAGE_LIMITS.MAX_MESSAGES) {
        // 첫 번째 인사 메시지는 유지하고 나머지 중 가장 오래된 것부터 삭제
        const firstMessage = messagesToStore[0];
        const trimmedMessages = [
          firstMessage,
          ...messagesToStore.slice(messagesToStore.length - STORAGE_LIMITS.MAX_MESSAGES + 1)
        ];
        return trimmedMessages;
      }
      
      return messagesToStore;
    } catch (error) {
      console.error('메시지 제한 설정 중 오류:', error);
      return messagesToStore;
    }
  };

  // 안전하게 로컬스토리지 데이터 파싱
  const safelyParseJSON = (jsonString, defaultValue) => {
    try {
      if (!jsonString) return defaultValue;
      const parsed = JSON.parse(jsonString);
      return parsed || defaultValue;
    } catch (error) {
      console.error('JSON 파싱 오류:', error);
      return defaultValue;
    }
  };

  // 안전하게 로컬스토리지에 저장
  const safelyStoreData = (key, data) => {
    try {
      if (typeof data === 'object') {
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        localStorage.setItem(key, String(data));
      }
      return true;
    } catch (error) {
      console.error(`로컬스토리지 저장 오류 (${key}):`, error);
      return false;
    }
  };

  // 초기화 - 로컬스토리지에서 데이터 로드
  useEffect(() => {
    if (mounted) {
      try {
        // 오래된 대화 확인 및 정리
        const cleanedMessages = cleanupOldConversations();
        if (cleanedMessages) {
          setMessages(cleanedMessages);
          return;
        }
        
        // 메시지 로드
        const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        if (savedMessages) {
          const parsedMessages = safelyParseJSON(savedMessages, []);
          setMessages(parsedMessages);
        } else {
          // 저장된 메시지가 없으면 기본 인사말 설정
          const initialMessage = { 
            role: 'assistant', 
            content: '스위스 여행 관련 질문 있으세요?'  
          };
          setMessages([initialMessage]);
          safelyStoreData(STORAGE_KEYS.MESSAGES, [initialMessage]);
          safelyStoreData(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
        }
        
        // 스레드 ID 로드
        const savedThreadId = localStorage.getItem(STORAGE_KEYS.THREAD_ID);
        if (savedThreadId) {
          setThreadId(savedThreadId);
        }
      } catch (err) {
        console.error('로컬스토리지 데이터 로드 오류:', err);
        // 오류 시 기본값 설정
        const initialMessage = { 
          role: 'assistant', 
          content: '스위스 여행 관련 질문 있으세요?' 
        };
        setMessages([initialMessage]);
      }
    }
  }, [mounted]);

  // 메시지 변경 시 로컬스토리지 업데이트 및 제한 적용
  useEffect(() => {
    if (mounted && messages.length > 0) {
      try {
        // 메시지 수 제한 적용
        const limitedMessages = limitStoredMessages([...messages]);
        
        // 제한된 메시지가 현재 메시지와 다르면 상태 업데이트
        if (limitedMessages.length !== messages.length) {
          setMessages(limitedMessages);
        }
        
        // 로컬스토리지에 저장
        safelyStoreData(STORAGE_KEYS.MESSAGES, limitedMessages);
        safelyStoreData(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      } catch (err) {
        console.error('메시지 저장 오류:', err);
      }
    }
  }, [messages, mounted]);

  // 스레드 ID 변경 시 로컬스토리지 업데이트
  useEffect(() => {
    if (mounted && threadId) {
      try {
        safelyStoreData(STORAGE_KEYS.THREAD_ID, threadId);
      } catch (err) {
        console.error('스레드 ID 저장 오류:', err);
      }
    }
  }, [threadId, mounted]);

  // 새 메시지가 추가될 때마다 스크롤
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // 메시지가 변경될 때마다 스크롤
  useEffect(() => {
    if (mounted) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, mounted]);

  // 채팅창이 열릴 때 상태 초기화와 스크롤
  useEffect(() => {
    if (mounted && isChatOpen) {
      setError(null);
      setTimeout(scrollToBottom, 200);
    }
  }, [isChatOpen, mounted]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  // 마크다운 변환 함수 - DOMPurify로 보안 강화
  const renderMarkdown = (content) => {
    try {
      // 1. 콘텐츠가 undefined인 경우 처리
      if (!content) return <div>내용이 없습니다.</div>;
      
      // 2. 위험한 패턴 사전 제거 (이중 보안)
      const preCleanedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 태그 제거
        .replace(/javascript:/gi, 'blocked:') // javascript: URL 프로토콜 차단
        .replace(/data:/gi, 'blocked:') // data: URL 프로토콜 차단
        .replace(/on\w+\s*=/gi, 'blocked='); // 인라인 이벤트 핸들러 차단
      
      // 3. 마크다운을 HTML로 변환
      const html = marked(preCleanedContent);
      
      // 4. DOMPurify로 HTML 정화 (추가 보안 레이어)
      const sanitizedHtml = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout']
      });
      
      // 5. 정화된 HTML 렌더링
      return <div 
        className="markdown-content" 
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
      />;
    } catch (err) {
      console.error('마크다운 변환 오류:', err);
      return <div>{String(content)}</div>; // 기본 문자열로 안전하게 렌더링
    }
  };

  // 입력값 변경 시 위험한 코드 패턴 필터링
  const handleInputChange = (e) => {
    // HTML 태그 및 위험한 패턴 필터링
    const value = e.target.value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 태그 제거
      .replace(/javascript:/gi, '') // javascript: URL 프로토콜 제거
      .replace(/on\w+\s*=/gi, ''); // 인라인 이벤트 핸들러 제거
    
    setInputValue(value);
  };
  
  const handleSendMessage = async () => {
    // 입력값 유효성 검사
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    // 입력값 최대 길이 제한 (3000자)
    if (trimmedInput.length > 3000) {
      setError("메시지가 너무 깁니다. 3000자 이내로 작성해주세요.");
      return;
    }

    // 에러 상태 초기화
    setError(null);
    
    // 사용자 메시지 추가 (XSS 방지를 위해 입력값 이스케이프)
    const sanitizedInput = trimmedInput
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const userMessage = { role: 'user', content: sanitizedInput };
    setMessages((prev) => [...prev, userMessage]);
    const userInput = sanitizedInput;
    setInputValue('');
    setIsLoading(true);

    try {
      // 개발 모드에서 임시 응답 사용 (API 연결 전 테스트용)
      const isDevelopment = false; // process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // 개발 환경에서는 임시 응답 사용
        await new Promise(resolve => setTimeout(resolve, 1000));
        const aiResponse = { 
          role: 'assistant', 
          content: `[개발 모드] "${userInput}"에 대한 답변입니다. 실제 API 연결 시 이 메시지는 AI가 생성한 응답으로 대체됩니다.` 
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        // 프로덕션 환경에서는 실제 API 호출
        const requestBody = { 
          message: userInput
        };
        
        // 스레드 ID가 있으면 API 요청에 포함
        if (threadId) {
          requestBody.threadId = threadId;
        }
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        // 응답이 없는 경우 처리
        if (!response) {
          throw new Error('서버 응답이 없습니다.');
        }
        
        // 응답 데이터 가져오기 (한 번만 호출)
        let data;
        try {
          data = await response.json();
        } catch (err) {
          throw new Error('서버 응답을 처리할 수 없습니다.');
        }
        
        // 상태 코드 확인
        if (!response.ok) {
          throw new Error(data.error || `서버 오류가 발생했습니다 (${response.status})`);
        }
        
        // 스레드 ID 저장 (있는 경우)
        if (data.threadId) {
          setThreadId(data.threadId);
        }
        
        // 응답 메시지 추가 - 데이터 검증 및 정화
        if (!data.response) {
          throw new Error('서버 응답이 비었습니다.');
        }
        
        // 참조 마커([[#1]] 등)가 있으면 제거하고 XSS 방지를 위한 정화
        const cleanedResponse = DOMPurify.sanitize(
          data.response.replace(/\[\[#\d+\]\]/g, '')
        );
        
        setMessages((prev) => [...prev, { role: 'assistant', content: cleanedResponse }]);
      }
    } catch (error) {
      console.error('채팅 메시지 전송 오류:', error);
      setError(error.message || '메시지 처리 중 오류가 발생했습니다');
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: `죄송합니다. 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` 
      }]);
    } finally {
      setIsLoading(false);
      // 메시지 처리 완료 후 스크롤
      setTimeout(scrollToBottom, 200);
    }
  };

  // 대화 내용 초기화
  const clearConversation = () => {
    if (window.confirm('대화 내용을 모두 삭제하시겠습니까?')) {
      // 초기 인사말만 남기고 모든 메시지 삭제
      const initialMessage = { 
        role: 'assistant', 
        content: '스위스 여행 관련 질문 있으세요?'
      };
      setMessages([initialMessage]);
      
      // 스레드 ID 초기화
      setThreadId(null);
      try {
        localStorage.removeItem(STORAGE_KEYS.THREAD_ID);
        
        // 로컬스토리지 업데이트
        safelyStoreData(STORAGE_KEYS.MESSAGES, [initialMessage]);
        safelyStoreData(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      } catch (err) {
        console.error('대화 초기화 중 오류:', err);
      }
    }
  };

  const handleKeyPress = (e) => {
    // Enter 키와 shift 키를 함께 누르지 않은 경우에만 메시지 전송
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 서버 사이드 렌더링 중에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  // CSS 스타일 설정
  const customScrollbarCSS = `
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background-color: ${isDarkMode ? '#4b5563' : '#e5e7eb'};
      border-radius: 20px;
    }
    
    /* 마크다운 스타일 */
    .markdown-content {
      font-size: 1rem;
      line-height: 1.5;
      color: ${isDarkMode ? '#f3f4f6' : 'inherit'};
    }
    
    .markdown-content p {
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .markdown-content code {
      background-color: ${isDarkMode ? '#374151' : '#f3f4f6'};
      padding: 0.1rem 0.3rem;
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.9em;
      color: ${isDarkMode ? '#e5e7eb' : 'inherit'};
    }
    
    .markdown-content pre {
      background-color: ${isDarkMode ? '#1f2937' : '#f3f4f6'};
      padding: 0.75rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      border: ${isDarkMode ? '1px solid #374151' : 'none'};
    }
    
    .markdown-content pre code {
      background-color: transparent;
      padding: 0;
    }
    
    .markdown-content h1 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .markdown-content h2 {
      font-size: 1.25rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .markdown-content h3 {
      font-size: 1.125rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .markdown-content ul {
      padding-left: 1.5rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      list-style-type: disc;
    }
    
    .markdown-content ol {
      padding-left: 1.5rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      list-style-type: decimal;
    }
    
    .markdown-content a {
      color: ${isDarkMode ? '#93c5fd' : '#4f46e5'};
      text-decoration: underline;
    }
    
    .markdown-content blockquote {
      border-left: 4px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'};
      padding-left: 1rem;
      margin-left: 0;
      color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
    }
    
    .markdown-content hr {
      margin-top: 1rem;
      margin-bottom: 1rem;
      border: 0;
      border-top: 1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'};
    }
    
    .markdown-content table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .markdown-content th {
      border-bottom: 1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'};
      padding: 0.5rem;
      text-align: left;
    }
    
    .markdown-content td {
      border-bottom: 1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'};
      padding: 0.5rem;
    }
    
    .markdown-content img {
      max-width: 100%;
      height: auto;
    }
  `;

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(
    <>
      <style>{customScrollbarCSS}</style>
      
      {/* 채팅 버튼 */}
      <button
        onClick={toggleChat}
        className={`transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-yellow-500 ${className || 'bg-blue-600 dark:bg-yellow-400'}`}
        style={buttonStyle}
        aria-label="Swiss Travel Chat"
      >
        <FiMessageCircle 
          className={`text-2xl ${iconClassName || 'text-white dark:text-gray-900'}`} 
          style={{ fontSize: '1.5rem' }} 
        />
      </button>

      {/* 채팅 모달 */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            right: 0, 
            bottom: 0, 
            left: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 100, // 더 높은 z-index
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={toggleChat}
        >
          <div 
            className="relative max-w-md w-full m-4" 
            style={{ 
              position: 'relative', 
              maxWidth: '28rem', 
              width: '100%', 
              margin: '1rem',
              display: 'flex', 
              flexDirection: 'column',
              maxHeight: '80vh',
              height: '80vh',
              backgroundColor: isDarkMode ? '#1f2937' : 'white',
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              boxShadow: isDarkMode 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' 
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 채팅 헤더 */}
            <div 
              className="bg-blue-600 dark:bg-yellow-400 text-white dark:text-gray-900 p-4 flex justify-between items-center z-10"
              style={{ 
                position: 'sticky', 
                top: 0, 
                backgroundColor: isDarkMode ? '#fbbf24' : 'var(--color-primary, #4f46e5)', 
                color: isDarkMode ? '#1f2937' : 'white', 
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              <h3 className="font-semibold">Swiss Travel Bot</h3>
              <div className="flex items-center space-x-3">
                {/* 대화 초기화 버튼 */}
                {messages.length > 1 && (
                  <button
                    onClick={clearConversation}
                    className="text-white dark:text-gray-900 hover:text-gray-200"
                    title="대화 내용 초기화"
                    style={{ cursor: 'pointer' }}
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
                
                {/* 닫기 버튼 */}
                <button 
                  onClick={toggleChat} 
                  className="text-white dark:text-gray-900 hover:text-gray-200"
                  style={{ cursor: 'pointer' }}
                >
                  <FiX size={24} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* 에러 표시 영역 */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 text-sm" style={{ position: 'sticky', top: '4rem', zIndex: 10 }}>
                <p>⚠️ {error}</p>
              </div>
            )}

            {/* 저장 제한 안내 - 선택적으로 표시 가능 */}
            {messages.length > STORAGE_LIMITS.MAX_MESSAGES - 10 && (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 text-xs" style={{ position: 'sticky', top: error ? '7rem' : '4rem', zIndex: 10 }}>
                <p>💬 최대 {STORAGE_LIMITS.MAX_MESSAGES}개의 메시지만 저장됩니다. {STORAGE_LIMITS.MAX_AGE_DAYS}일 이상 지난 대화는 자동으로 삭제됩니다.</p>
              </div>
            )}

            {/* 채팅 메시지 영역 */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-4"
              style={{ 
                flex: 1,
                padding: '1rem', 
                overflowY: 'auto',
                backgroundColor: isDarkMode ? '#1f2937' : 'white',
                scrollbarWidth: 'thin',
                scrollbarColor: isDarkMode ? '#4b5563 transparent' : '#e5e7eb transparent'
              }}
            >
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? isDarkMode ? 'bg-blue-800 text-gray-100' : 'bg-blue-100 text-gray-800'
                        : isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.role === 'assistant' 
                      ? renderMarkdown(message.content)
                      : <div>{message.content}</div>
                    }
                  </div>
                </div>
              ))}
              
              {/* 로딩 표시기 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <ThinkingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div 
              className="border-t p-3"
              style={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
                borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                padding: '0.75rem',
                width: '100%',
                zIndex: 10
              }}
            >
              <div className="flex items-center w-full">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="스위스 여행에 대해 물어보세요..."
                  className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{ 
                    width: 'calc(100% - 52px)', 
                    minHeight: '50px',
                    maxHeight: '150px',
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    color: isDarkMode ? '#f3f4f6' : 'inherit',
                    borderColor: isDarkMode ? '#4b5563' : '#e5e7eb'
                  }}
                  rows="2"
                  disabled={isLoading}
                  maxLength={3000} // 최대 입력 길이 제한
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`ml-2 p-2 rounded-full flex-shrink-0 ${
                    !inputValue.trim() || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 dark:bg-yellow-400 text-white dark:text-gray-900 hover:bg-blue-700 dark:hover:bg-yellow-500 cursor-pointer'
                  }`}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    flexShrink: 0,
                    marginLeft: '0.5rem',
                    cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FiSend size={20} style={{ margin: 'auto' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default ChatButtonPortal;
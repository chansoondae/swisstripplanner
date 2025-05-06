'use client';

import { FiLoader, FiArrowLeft, FiMapPin, FiClock, FiUsers, FiDollarSign, FiCalendar } from 'react-icons/fi';

// Loading component
export const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin text-black mb-4">
      <FiLoader size={40} />
    </div>
    <p className="text-black text-lg" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>{message}</p>
  </div>
);

// Error component
export const ErrorState = ({ error }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>오류가 발생했습니다</h1>
    <p className="text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>{error}</p>
    <a href="/consulting" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800">
      여행 상담 페이지로 돌아가기
    </a>
  </div>
);

// Not found component
export const NotFoundState = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>여행 계획을 찾을 수 없습니다</h1>
    <p className="text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>요청하신 여행 계획이 존재하지 않거나 만료되었습니다.</p>
    <a href="/" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800">
      새 여행 계획 만들기
    </a>
  </div>
);

// Processing state component
export const ProcessingState = ({ plan, isMobile, router, formatRelativeTime, trackEvent }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin text-black mb-4">
        <FiLoader size={40} />
      </div>
      <h2 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>여행 상담 내용 생성 중...</h2>
      <p className="text-black text-center mb-6" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>
        AI가 맞춤형 스위스 여행 상담 내용을 작성하고 있습니다.<br />
        최대 2분 정도 소요될 수 있습니다.
      </p>
      
      {/* Plan request preview */}
      {plan?.options && (
        <div className="w-full max-w-md bg-white p-4 rounded-lg border border-gray-200 mt-4">
          <h3 className="font-semibold text-black mb-2" style={{ fontFamily: 'Nanum Gothic', fontSize: '20px', fontWeight: 'bold' }}>요청하신 여행 정보</h3>
          <div className="grid grid-cols-2 gap-2">
            {plan.options.startingCity && (
              <div className="flex items-center">
                <FiMapPin className="mr-1 text-black" /> 
                <span style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>출발: {plan.options.startingCity}</span>
              </div>
            )} 
            {plan.options.duration && (
              <div className="flex items-center">
                <FiClock className="mr-1 text-black" /> 
                <span style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>기간: {plan.options.duration}일</span>
              </div>
            )}
            {plan.options.groupType && (    
              <div className="flex items-center">
                <FiUsers className="mr-1 text-black" /> 
                <span style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>여행자: {plan.options.groupType}</span>
              </div>
            )}
            {plan.options.budget && (    
              <div className="flex items-center">
                <FiDollarSign className="mr-1 text-black" /> 
                <span style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>예산: {plan.options.budget}</span>
              </div>
            )}
            {plan.createdAt && (
              <div className="flex items-center">
                <FiCalendar className="mr-1 text-black" /> 
                <span style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}> 
                  생성: {formatRelativeTime(plan.createdAt)}
                </span>
              </div>
            )}
          </div>
          
          {plan.options.prompt && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-black font-medium mb-1" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>여행 요청:</p>
              <p className="text-black italic" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>"{plan.options.prompt}"</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => {
                trackEvent('button_click', 'navigation', '상담 목록으로 돌아가기');
                router.push('/consulting');
              }}
              className="btn btn-primary mb-4 flex items-center bg-black hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg"
              style={{ fontFamily: 'Nanum Gothic' }}
            >
              <FiArrowLeft className="mr-1" /> 상담 목록으로 돌아가기
            </button>
          </div>
        </div>
      )}
      
      <p className="text-gray-500 text-sm mt-6" style={{ fontFamily: 'Nanum Gothic' }}>
        이 페이지를 떠나도 여행 상담 내용은 계속 생성됩니다. 나중에 다시 확인해보세요.
      </p>
    </div>
  </div>
);
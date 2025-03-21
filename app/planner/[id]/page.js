// app/planner/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TravelItinerary from './../../components/TravelItinerary';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from './../../../lib/firebase';
import { useAnalytics } from './../../hooks/useAnalytics'; // 추가된 Analytics 훅
import { FiLoader, FiArrowLeft, FiClock, FiMapPin, FiUsers, FiCalendar, FiDollarSign, FiCopy, FiSave, FiEdit } from 'react-icons/fi';
import ChatButtonPortal from './../../components/ChatButtonPortal';
import { useAuth } from '../../../context/AuthContext';

// Loading component
const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin text-blue-600 dark:text-yellow-400 mb-4">
      <FiLoader size={40} />
    </div>
    <p className="text-gray-600 dark:text-gray-300 text-lg">{message}</p>
  </div>
);

// Error component
const ErrorState = ({ error }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
    <p className="text-gray-600 dark:text-gray-300">{error}</p>
    <a href="/planner" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      여행 계획 페이지로 돌아가기
    </a>
  </div>
);

// Not found component
const NotFoundState = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">여행 계획을 찾을 수 없습니다</h1>
    <p className="text-gray-600 dark:text-gray-300">요청하신 여행 계획이 존재하지 않거나 만료되었습니다.</p>
    <a href="/" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      새 여행 계획 만들기
    </a>
  </div>
);

// Processing state component
const ProcessingState = ({ plan, isMobile, router, formatRelativeTime, trackEvent }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin text-blue-600 dark:text-yellow-300 mb-4">
        <FiLoader size={40} />
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark_text-gray-100 mb-2">여행 계획 생성 중...</h2>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
        AI가 맞춤형 스위스 여행 일정을 작성하고 있습니다.<br />
        최대 2분 정도 소요될 수 있습니다.
      </p>
      
      {/* Plan request preview */}
      {plan?.options && (
        <div className="w-full max-w-md bg-blue-50 dark:bg-amber-900 p-4 rounded-lg border border-blue-200 mt-4">
          <h3 className="font-semibold text-blue-800 dark:text-yellow-200 mb-2">요청하신 여행 정보</h3>
          <div className="grid grid-cols-2 gap-2">
            {plan.options.startingCity && (
              <div className="flex items-center">
                <FiMapPin className="mr-1 text-blue-600 dark:text-yellow-400" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>출발: {plan.options.startingCity}</span>
              </div>
            )} 
            {plan.options.duration && (
              <div className="flex items-center">
                <FiClock className="mr-1 text-blue-600 dark:text-yellow-400" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>기간: {plan.options.duration}일</span>
              </div>
            )}
            {plan.options.groupType && (    
              <div className="flex items-center">
                <FiUsers className="mr-1 text-blue-600 dark:text-yellow-400" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>여행자: {plan.options.groupType}</span>
              </div>
            )}
            {plan.options.budget && (    
              <div className="flex items-center">
                <FiDollarSign className="mr-1 text-blue-600 dark:text-yellow-400" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>예산: {plan.options.budget}</span>
              </div>
            )}
            {plan.createdAt && (
              <div className="flex items-center">
                <FiCalendar className="mr-1 text-blue-600 dark:text-yellow-400" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}> 
                  생성: {formatRelativeTime(plan.createdAt)}
                </span>
              </div>
            )}
          </div>
          
          {plan.options.prompt && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-yellow-700">
              <p className="text-sm text-blue-800 dark:text-yellow-400 font-medium mb-1">여행 요청:</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 italic">"{plan.options.prompt}"</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => {
                trackEvent('button_click', 'navigation', '계획 목록으로 돌아가기');
                router.push('/planner');
              }}
              className={`btn btn-primary mb-4 flex items-center ${isMobile ? 'text-sm' : ''} bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg`}
            >
              <FiArrowLeft className="mr-1" /> 계획 목록으로 돌아가기
            </button>
          </div>
        </div>
      )}
      
      <p className="text-gray-500 text-sm mt-6">
        이 페이지를 떠나도 여행 계획은 계속 생성됩니다. 나중에 다시 확인해보세요.
      </p>
    </div>
  </div>
);

// Format relative time function
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  // Handle Firestore timestamp object
  const date = timestamp.seconds 
    ? new Date(timestamp.seconds * 1000) 
    : new Date(timestamp);
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

export default function TravelPlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id;
  const { user } = useAuth();
  const { trackPageView, trackEvent } = useAnalytics(); // Analytics 훅 사용
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localTravelPlan, setLocalTravelPlan] = useState(null);
  
  // 페이지 로드 시 분석 이벤트 발생
  useEffect(() => {
    if (planId) {
      trackPageView(`여행 계획 상세: ${planId}`);
    }
  }, [trackPageView, planId]);
  
  // Mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android/.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Check travel plan status
  const checkPlanStatus = (planData) => {
    if (!planData) return 'loading';
    
    // Check status field if it exists
    if (planData.status) {
      return planData.status;
    }
    
    // 새 프롬프트 구조에 맞게 확인 로직 변경
    // days 배열이 비어있거나 없는 경우
    if (!planData.days || !Array.isArray(planData.days) || planData.days.length === 0) {
      return 'processing';
    }
    
    // title과 description이 없는 경우
    if (!planData.title || !planData.description) {
      return 'processing';
    }
    
    return 'completed';
  };
  
  // 변경 사항 저장 핸들러 (통합된 저장 기능)
  const handleSaveChanges = async () => {
    if (!isOwner) {
      alert("이 여행 계획의 소유자만 수정할 수 있습니다. '내 여행으로 저장' 기능을 이용해주세요.");
      return;
    }
    
    if (!hasUnsavedChanges || !localTravelPlan) return;
    
    setIsSaving(true);
    
    try {
      // Firebase 업데이트
      const travelPlanRef = doc(db, 'travelPlans', planId);
      await updateDoc(travelPlanRef, {
        days: localTravelPlan.days,
        transportationDetails: localTravelPlan.transportationDetails,
        budgetBreakdown: localTravelPlan.budgetBreakdown,
        updatedAt: new Date()
      });
      
      // 저장 완료 표시
      setSaveSuccess(true);
      
      // 저장 완료 후 상태 초기화
      setHasUnsavedChanges(false);
      
      // 이벤트 추적: 여행 계획 저장
      trackEvent('save_content', 'engagement', `여행 계획 저장: ${planId}`);
      
      // 성공 메시지 3초 후 사라짐
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      trackEvent('error', 'system', `여행 계획 저장 오류: ${error.message}`);
      alert("변경사항 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fetch travel plan data
  const fetchTravelPlan = async (isRefreshing = false) => {
    if (!planId) {
      setError('유효하지 않은 여행 계획 ID입니다.');
      setLoading(false);
      return;
    }
    
    try {
      // Only show loading state when first loading (not refreshing)
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Fetch travel plan data from Firestore
      const planDoc = await getDoc(doc(db, 'travelPlans', planId));
      
      if (planDoc.exists()) {
        const planData = planDoc.data();
        setPlan(planData);
        setLocalTravelPlan(planData);
        
        // 계획의 소유자 확인
        setIsOwner(user && planData.userId === user.uid);
        
        // 계획 상태 확인
        const status = checkPlanStatus(planData);
        
        // 이벤트 추적: 여행 계획 조회 완료
        trackEvent(
          'view_content', 
          'content', 
          `여행 계획 조회: ${planId}`, 
          {
            owner: (user && planData.userId === user.uid),
            status: status,
            title: planData.title || '제목 없음'
          }
        );
        
        // If plan is processing, check again in 5 seconds
        if (status === 'processing') {
          // 이벤트 추적: 생성 중인 여행 계획 조회
          trackEvent('view_processing_content', 'content', `생성 중인 여행 계획 조회: ${planId}`);
          setTimeout(() => fetchTravelPlan(true), 5000);
        }
      } else {
        setError('여행 계획을 찾을 수 없습니다.');
        trackEvent('error', 'content', `존재하지 않는 여행 계획: ${planId}`);
      }
    } catch (err) {
      console.error('여행 계획 불러오기 오류:', err);
      setError('여행 계획을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      trackEvent('error', 'system', `여행 계획 불러오기 오류: ${err.message}`);
    } finally {
      // Only update loading state when first loading (not refreshing)
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };
  
  // 내 여행으로 저장하기 기능
  const saveAsMine = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    if (!plan) return;
    
    setIsSaving(true);
    try {
      // 기존 계획 복사하여 새 문서 생성
      const newPlanData = {
        ...plan,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        copiedFrom: planId // 원본 계획 ID도 저장
      };
      
      // 새 문서 추가
      const docRef = await addDoc(collection(db, 'travelPlans'), newPlanData);
      
      // 이벤트 추적: 내 여행으로 저장
      trackEvent('copy_to_own', 'conversion', `내 여행으로 저장: ${planId} -> ${docRef.id}`);
      
      // 저장 성공 표시
      setSaveSuccess(true);
      
      // 3초 후 새 계획 페이지로 이동
      setTimeout(() => {
        router.push(`/planner/${docRef.id}`);
      }, 1500);
      
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
      trackEvent('error', 'system', `내 여행으로 저장 오류: ${error.message}`);
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // TravelItinerary에서 변경사항 있을 때 호출되는 함수
  const handleTravelPlanUpdate = (updatedPlan, hasChanges) => {
    setLocalTravelPlan(updatedPlan);
    setHasUnsavedChanges(hasChanges);
    
    // 변경사항 발생 이벤트 추적
    if (hasChanges && !hasUnsavedChanges) {
      trackEvent('edit_content', 'engagement', `여행 계획 편집: ${planId}`);
    }
  };
  
  // Fetch data when component mounts or planId or user changes
  useEffect(() => {
    fetchTravelPlan();
  }, [planId, user]);
  
  // Check plan status
  const planStatus = plan ? checkPlanStatus(plan) : 'loading';
  const isProcessing = planStatus === 'processing';
  
  // Loading state
  if (loading) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <LoadingState message="여행 계획을 불러오는 중..." />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <ErrorState error={error} />
      </div>
    );
  }
  
  // Not found state
  if (!plan) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <NotFoundState />
      </div>
    );
  }
  
  // Processing state
  if (isProcessing) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>        
        <ProcessingState 
          plan={plan}
          isMobile={isMobile} 
          router={router}
          formatRelativeTime={formatRelativeTime}
          trackEvent={trackEvent}
        />
      </div>
    );
  }
  
  // Completed plan display
  return (
    <div className={`max-w-5xl mx-auto ${isMobile ? 'p-0' : 'px-4 py-2'}`}>
      {/* 소유권 정보 및 저장 버튼 */}
      <div className="bg-white dark:bg-gray-900 p-4 mb-4 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{plan.title || '여행 계획'}</h1>
          <p className="text-sm text-gray-500">
            {plan.createdAt && `작성일: ${formatRelativeTime(plan.createdAt)}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 변경사항 알림 표시 */}
          {hasUnsavedChanges && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center">
              <FiEdit className="mr-1" /> 변경사항 있음
            </div>
          )}
          
          {/* 버튼 영역 */}
          {saveSuccess ? (
            <div className="text-green-600 font-medium flex items-center">
              <FiSave className="mr-2" />
              {isOwner ? '저장되었습니다!' : '내 여행으로 저장되었습니다!'}
            </div>
          ) : (
            isOwner ? (
              // 내 여행인 경우: 변경사항 저장 버튼 표시
              <button
                className={`px-4 py-2 rounded-md flex items-center ${
                  hasUnsavedChanges 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } transition-colors`}
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    변경사항 저장하기
                  </>
                )}
              </button>
            ) : (
              // 다른 사람의 여행인 경우: 내 여행으로 저장 버튼 표시
              <button
                className="px-4 py-2 bg-blue-600 dark:bg-yellow-400 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                onClick={saveAsMine}
                disabled={isSaving || !user}
                onMouseOver={() => {
                  if (!user) {
                    trackEvent('login_prompt', 'engagement', '내 여행으로 저장 로그인 필요');
                  }
                }}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <FiCopy className="mr-2" />
                    {user ? '내 여행으로 저장' : '로그인 필요'}
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* Itinerary section */}
      <section className={isMobile ? "mb-4" : "mb-8"}>
        <div className={isMobile ? "" : "bg-white dark:bg-gray-900 rounded-lg shadow-lg"}>
          <TravelItinerary 
            travelPlan={plan} 
            travelPlanId={planId} 
            isOwner={isOwner} // 소유자 여부 전달
            onUpdatePlan={handleTravelPlanUpdate} // 변경된 콜백 함수
          />
        </div>
      </section>
      
      {/* Optional chat button for follow-up questions */}
      {process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' && <ChatButtonPortal />}
    </div>
  );
}
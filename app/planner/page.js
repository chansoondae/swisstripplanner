'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from './../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from './../hooks/useAnalytics'; // 추가된 Analytics 훅
import { FiMapPin, FiClock, FiCalendar, FiPlus, FiLoader, FiAlertCircle, FiHeart, FiUsers } from 'react-icons/fi';
import { GiMountainRoad, GiCastle } from "react-icons/gi";
import { TbTrain, TbMountain } from "react-icons/tb";
import { MdOutlineNature } from "react-icons/md";
import { BiRestaurant } from "react-icons/bi";

// 내부 로딩 컴포넌트 생성
const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin text-blue-500 dark:text-yellow-400 mb-4">
      <FiLoader size={40} />
    </div>
    <p className="text-gray-600 dark:text-gray-300 text-lg">{message}</p>
  </div>
);

export default function PlannerPage() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  // 필터 상태 추가
  const [filter, setFilter] = useState('all'); // 'all' 또는 'mine'
  
  const observerRef = useRef();
  const router = useRouter();
  const { user } = useAuth(); // 인증 정보 사용
  const { trackPageView, trackEvent } = useAnalytics(); // Analytics 훅 사용
  
  const ITEMS_PER_PAGE = 5; // 한 번에 가져올 여행 계획 수

  // 페이지 로드 시 분석 이벤트 발생
  useEffect(() => {
    trackPageView('여행 계획 목록');
  }, [trackPageView]);

  // 모바일 감지
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

  // 필터 변경시 데이터 다시 로드
  useEffect(() => {
    setItineraries([]);
    setLastDoc(null);
    setHasMore(true);
    fetchInitialItineraries();
    
    // 필터 변경 이벤트 추적
    trackEvent('filter_change', 'engagement', `여행 계획 필터: ${filter}`);
  }, [filter, user, trackEvent]);

  // 초기 데이터 로드
  const fetchInitialItineraries = async () => {
    try {
      setLoading(true);
      
      let q;
      
      // 필터에 따른 쿼리 생성
      if (filter === 'mine' && user) {
        // 내 여행 필터링 (로그인한 경우만)
        q = query(
          collection(db, 'travelPlans'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // 전체 여행 표시
        q = query(
          collection(db, 'travelPlans'), 
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No travel plans found in database");
        setHasMore(false);
        setItineraries([]);
        return;
      }
      
      const itinerariesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      // 마지막 문서 저장
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      
      setItineraries(itinerariesData);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      
      // 데이터 로드 완료 이벤트 추적
      trackEvent(
        'view_item_list', 
        'content', 
        `여행 계획 목록 (${filter})`, 
        itinerariesData.length
      );
    } catch (error) {
      console.error('Error fetching initial travel plans:', error);
      // 오류 이벤트 추적
      trackEvent('error', 'system', `여행 계획 목록 조회 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 추가 데이터 로드
  const fetchMoreItineraries = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    
    try {
      setLoadingMore(true);
      
      let q;
      
      // 필터에 따른 쿼리 생성
      if (filter === 'mine' && user) {
        // 내 여행 필터링 (로그인한 경우만)
        q = query(
          collection(db, 'travelPlans'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // 전체 여행 표시
        q = query(
          collection(db, 'travelPlans'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        return;
      }
      
      const newItinerariesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      // 마지막 문서 업데이트
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      
      setItineraries(prev => [...prev, ...newItinerariesData]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      
      // 추가 데이터 로드 이벤트 추적
      trackEvent(
        'load_more', 
        'engagement', 
        '여행 계획 더 불러오기', 
        newItinerariesData.length
      );
    } catch (error) {
      console.error('Error fetching more travel plans:', error);
      // 오류 이벤트 추적
      trackEvent('error', 'system', `여행 계획 추가 로드 오류: ${error.message}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // 스크롤 감지를 위한 Intersection Observer 설정
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreItineraries();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const handleItineraryClick = (id) => {
    // 여행 계획 클릭 이벤트 추적
    trackEvent('select_content', 'engagement', `여행 계획 선택: ${id}`);
    router.push(`/planner/${id}`);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // 새 계획 만들기 클릭 핸들러
  const handleCreateNewPlan = () => {
    trackEvent('button_click', 'conversion', '새 여행 계획 만들기');
  };

  // 날짜와 시간 포맷 함수
  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 장소 유형별 개수 계산 함수
  const countPlaceTypes = (destinations) => {
    if (!destinations || !Array.isArray(destinations)) return {};
    
    return destinations.reduce((counts, destination) => {
      const type = destination.type || 'attraction'; // 기본값으로 attraction 설정
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
  };

  // Travel Style 텍스트 변환 함수
  const getTravelStyleText = (style) => {
    switch(style) {
      case 'nature':
        return '자연 경관 위주';
      case 'activity':
        return '하이킹과 액티비티';
      case 'balanced':
        return '자연+도시 조화';
      default:
        return style;
    }
  };

  // Group Type 텍스트 변환 함수
  const getGroupTypeText = (groupType) => {
    switch(groupType) {
      case 'solo':
        return '나홀로';
      case 'couple':
        return '커플';
      case 'family':
        return '가족';
      case 'friends':
        return '친구';
      case 'seniors':
        return '시니어';
      default:
        return groupType;
    }
  };

  // 여행 계획 상태 확인 함수
  const getItineraryStatus = (itinerary) => {
    // status 필드가 있는 경우
    if (itinerary.status) {
      return itinerary.status;
    }
    
    // destinations 배열이 없거나 빈 배열인 경우
    if (!itinerary.destinations || !Array.isArray(itinerary.destinations) || itinerary.destinations.length === 0) {
      return 'processing';
    }
    
    // title이나 description이 없는 경우
    if (!itinerary.title || !itinerary.description) {
      return 'processing';
    }
    
    return 'completed';
  };

  return (
    <div className={`${isMobile ? 'w-full p-0' : 'container max-w-5xl px-4 py-4'} mx-auto`}>
      <div className={`flex justify-between items-center ${isMobile ? 'mb-2 px-4 py-4' : 'mb-6'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} text-gray-800 dark:text-gray-100 font-bold`}>스위스 여행 계획</h1>
        <a 
          href="/" 
          className={`flex items-center justify-center bg-blue-600 dark:bg-yellow-300 hover:bg-blue-700 dark:hover:bg-yellow-700 text-white dark:text-gray-900 font-medium ${isMobile ? 'px-2 py-1 text-sm' : 'px-4 py-2'} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-yellow-500 transition-colors duration-200`}
          onClick={handleCreateNewPlan}
        >
          <FiPlus className="mr-1" /> 새 계획 만들기
        </a>
      </div>

      {/* 필터 라디오 버튼 */}
      <div className={`mb-4 ${isMobile ? 'px-4' : ''}`}>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center justify-start">
          {/* <span className="mr-4 text-gray-700 font-medium">필터:</span> */}
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="filter"
                value="all"
                checked={filter === 'all'}
                onChange={() => handleFilterChange('all')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-200">전체</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="filter"
                value="mine"
                checked={filter === 'mine'}
                onChange={() => handleFilterChange('mine')}
                disabled={!user}
              />
              <span className={`ml-2 ${user ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>내 여행</span>
            </label>
          </div>
          {/* {!user && filter === 'all' && (
            <span className="ml-2 text-xs text-gray-500">
              (로그인하면 내 여행만 볼 수 있어요)
            </span>
          )} */}
        </div>
      </div>

      {loading ? (
        // 초기 로딩 상태를 스피너로 표시
        <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <LoadingState message="여행 계획 목록을 불러오는 중입니다..." />
        </div>
      ) : (
        // 여행 계획 목록
        <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          {itineraries.length === 0 ? (
            // 여행 계획이 없을 때
            <div className="text-center p-8 border border-dashed rounded-lg">
              {filter === 'mine' ? (
                <p className="text-gray-500">저장된 내 여행 계획이 없습니다.</p>
              ) : (
                <p className="text-gray-500">저장된 여행 계획이 없습니다.</p>
              )}
              <a 
                href="/" 
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={handleCreateNewPlan}
              >
                <FiPlus className="mr-2" /> 새 여행 계획 만들기
              </a>
            </div>
          ) : (
            // 여행 계획 목록 표시
            <div className={`space-y-${isMobile ? '3' : '4'}`}>
              <style jsx>{`
                .itinerary-item {
                  border: 1px solid #e5e7eb;
                  border-radius: 0.5rem;
                  padding: ${isMobile ? '0.75rem' : '1rem'};
                  transition: all 0.2s ease-in-out;
                  cursor: pointer;
                }
                .itinerary-item:hover {
                  background-color: #f0f9ff;
                  border-color: #93c5fd;
                  transform: translateY(-2px);
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .processing-badge {
                  display: inline-flex;
                  align-items: center;
                  background-color: #FEF3C7;
                  color: #D97706;
                  padding: 0.25rem 0.75rem;
                  border-radius: 9999px;
                  font-weight: 500;
                  margin-left: 0.5rem;
                  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .owner-badge {
                  display: inline-flex;
                  align-items: center;
                  background-color: #E0F2FE;
                  color: #0369A1;
                  padding: 0.25rem 0.75rem;
                  border-radius: 9999px;
                  font-weight: 500;
                  margin-left: 0.5rem;
                  font-size: 0.75rem;
                }
                .trip-info-badge {
                  display: inline-flex;
                  align-items: center;
                  padding: 0.25rem 0.75rem;
                  border-radius: 9999px;
                  font-weight: 500;
                  margin-right: 0.5rem;
                  font-size: ${isMobile ? '0.7rem' : '0.8rem'};
                }
                .starting-city {
                  background-color: #E0F2FE;
                  color: #0369A1;
                }
                .ending-city {
                  background-color: #DCFCE7;
                  color: #15803D;
                }
                .duration {
                  background-color: #F3E8FF;
                  color: #6B21A8;
                }
                .travel-style {
                  background-color: #FFE4E6;
                  color: #BE123C;
                }
                .group-type {
                  background-color: #FEF3C7;
                  color: #B45309;
                }
                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.7;
                  }
                }
              `}</style>
              
              {itineraries.map((itinerary, index) => {
                const placeTypeCounts = countPlaceTypes(itinerary.destinations);
                const itineraryStatus = getItineraryStatus(itinerary);
                const isProcessing = itineraryStatus === 'processing';
                // 내 여행인지 확인
                const isMyItinerary = user && itinerary.userId === user.uid;
                
                // Get travel options from the itinerary or its options property
                const options = itinerary.options || {};
                const startingCity = itinerary.startingCity || options.startingCity || '-';
                const endingCity = itinerary.endingCity || options.endingCity || '-';
                const duration = itinerary.totalDuration || itinerary.duration || options.duration || '-';
                const travelStyle = itinerary.travelStyle || options.travelStyle || '-';
                const groupType = itinerary.groupType || options.groupType || '-';
                
                // 마지막 요소에 ref 추가
                const isLastItem = index === itineraries.length - 1;
                
                return (
                  <div
                    key={itinerary.id}
                    ref={isLastItem ? lastElementRef : null}
                    className="itinerary-item"
                    onClick={() => handleItineraryClick(itinerary.id)}
                  >
                    <div className="flex items-center">
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                        {itinerary.title || '제목 없는 여행 계획'}
                      </h3>
                      
                      {/* 처리 중 상태 표시 */}
                      {isProcessing && (
                        <span className="processing-badge">
                          <FiLoader className="mr-1 animate-spin" /> 생성 중...
                        </span>
                      )}
                      
                      {/* 내 여행 배지 표시 */}
                      {filter === 'all' && isMyItinerary && (
                        <span className="owner-badge">
                          내 여행
                        </span>
                      )}
                    </div>
                    
                    {/* 여행 정보 뱃지 - 시작 도시, 종료 도시, 기간 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="trip-info-badge starting-city">
                        <FiMapPin className="mr-1" /> {startingCity}
                      </span>
                      <span className="trip-info-badge ending-city">
                        <FiMapPin className="mr-1" /> {endingCity}
                      </span>
                      <span className="trip-info-badge duration">
                        <FiClock className="mr-1" /> {duration}일
                      </span>
                      <span className="trip-info-badge travel-style">
                        <FiHeart className="mr-1" /> {getTravelStyleText(travelStyle)}
                      </span>
                      <span className="trip-info-badge group-type">
                        <FiUsers className="mr-1" /> {getGroupTypeText(groupType)}
                      </span>
                    </div>
                    
                    <div className={`flex flex-wrap gap-${isMobile ? '2' : '4'} mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`} 
                         style={{ color: '#4B5563' }}>
                      <span className="flex items-center">
                        <FiCalendar className="mr-1" /> {formatDateTime(itinerary.createdAt)}
                      </span>
                    </div>
                    
                    {/* 처리 중인 경우와 완료된 경우에 따라 다른 내용 표시 */}
                    {isProcessing ? (
                      <div className="mt-2 bg-yellow-50 p-2 rounded flex items-start">
                        <FiAlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <p className={`text-yellow-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          AI가 여행 계획을 생성하고 있습니다. 생성이 완료되면 자세한 내용을 확인할 수 있습니다.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className={`mt-2 text-gray-600 line-clamp-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {itinerary.description || '설명 없음'}
                        </p>
                        
                        {/* 장소 유형별 뱃지 */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {placeTypeCounts.mountain && (
                            <span className={`bg-blue-100 text-blue-700 px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                              <TbMountain className="mr-1" /> 산 {placeTypeCounts.mountain}곳
                            </span>
                          )}
                          {placeTypeCounts.city && (
                            <span className={`bg-gray-100 text-gray-700 px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                              <GiCastle className="mr-1" /> 도시 {placeTypeCounts.city}곳
                            </span>
                          )}
                          {placeTypeCounts.train && (
                            <span className={`bg-red-100 text-red-700 px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                              <TbTrain className="mr-1" /> 기차 {placeTypeCounts.train}개
                            </span>
                          )}
                          {placeTypeCounts.scenicRoute && (
                            <span className={`bg-green-100 text-green-700 px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                              <GiMountainRoad className="mr-1" /> 경치 {placeTypeCounts.scenicRoute}곳
                            </span>
                          )}
                          {placeTypeCounts.nature && (
                            <span className={`bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                              <MdOutlineNature className="mr-1" /> 자연 {placeTypeCounts.nature}곳
                            </span>
                          )}
                          {placeTypeCounts.restaurant && (
                            <span className={`bg-orange-100 text-orange-700 px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} flex items-center`}>
                              <BiRestaurant className="mr-1" /> 식당 {placeTypeCounts.restaurant}곳
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* 추가 로딩 인디케이터 */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin mr-2">
                    <FiLoader size={20} />
                  </div>
                  <span>더 불러오는 중...</span>
                </div>
              )}
              
              {/* 더 이상 데이터가 없음을 표시 */}
              {!hasMore && itineraries.length > 0 && (
                <div className="text-center text-gray-500 py-4">
                  모든 여행 계획을 불러왔습니다.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
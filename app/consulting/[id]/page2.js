'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from './../../../lib/firebase';
import { useAnalytics } from './../../hooks/useAnalytics';
import { FiLoader, FiArrowLeft, FiClock, FiMapPin, FiUsers, FiCalendar, FiDollarSign, FiCopy, FiSave, FiEdit, FiChevronDown, FiChevronUp, FiInfo, FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { FaShip, FaMountain, FaTram, FaTrain } from 'react-icons/fa';
import ChatButtonPortal from './../../components/ChatButtonPortal';
import { useAuth } from '../../../context/AuthContext';
import SwissMap from './../../components/SwissMap';
import TransportationCost from './../../components/TransportationCost';
import ActivityModal from './../../components/ActivityModal';
import AccommodationEdit from './../../components/AccommodationEdit';
import { calculateTravelPlan } from './../../../utils/calculateTravelPlan';
import { cityToStation } from './../../../utils/cityToStation';
import locationData from './../../../utils/locationData';
import './../../../styles/consulting.css';

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
    <a href="/consulting" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      여행 상담 페이지로 돌아가기
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
      <h2 className="text-xl font-bold text-gray-800 dark_text-gray-100 mb-2">여행 상담 내용 생성 중...</h2>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
        AI가 맞춤형 스위스 여행 상담 내용을 작성하고 있습니다.<br />
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
                trackEvent('button_click', 'navigation', '상담 목록으로 돌아가기');
                router.push('/consulting');
              }}
              className={`btn btn-primary mb-4 flex items-center ${isMobile ? 'text-sm' : ''} bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg`}
            >
              <FiArrowLeft className="mr-1" /> 상담 목록으로 돌아가기
            </button>
          </div>
        </div>
      )}
      
      <p className="text-gray-500 text-sm mt-6">
        이 페이지를 떠나도 여행 상담 내용은 계속 생성됩니다. 나중에 다시 확인해보세요.
      </p>
    </div>
  </div>
);

const EditableTitleDescription = ({ 
  title, 
  description, 
  isEditing, 
  onStartEdit, 
  onSave, 
  onCancel,
  setTitle,
  setDescription 
}) => {
  // 내부 상태로 관리
  const [editTitleValue, setEditTitleValue] = useState(title);
  const [editDescriptionValue, setEditDescriptionValue] = useState(description);
  

  // 편집 시작할 때 현재 값으로 상태 초기화
  useEffect(() => {
    if (isEditing) {
      setEditTitleValue(title);
      setEditDescriptionValue(description);
    }
  }, [isEditing, title, description]);

  // 실제 저장 처리 핸들러
  const handleSave = () => {
      // 부모 컴포넌트의 상태 업데이트 함수를 직접 호출
      setTitle(editTitleValue);
      setDescription(editDescriptionValue);
      
      // 부모 컴포넌트에 onSave 호출 시 최신 값을 직접 전달
      onSave(editTitleValue, editDescriptionValue);
    };

  // 보기 모드
  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-yellow-300 mb-2">{title}</h1>
          {onStartEdit && (
            <button
              onClick={onStartEdit}
              className="ml-2 p-1 text-blue-600 dark:text-yellow-400 hover:bg-blue-100 dark:hover:bg-yellow-900 rounded-full transition-colors"
              title="수정하기"
            >
              <FiEdit size={16} />
            </button>
          )}
        </div>
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
    );
  }

  // 편집 모드 - 모달 형태로 구현
  return (
    <>
      {/* 원래 내용은 그대로 표시 (배경) */}
      <div>
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-yellow-300 mb-2">{title}</h1>
        </div>
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>

      {/* 모달 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4" 
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">제목 및 설명 수정</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제목
            </label>
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              className="w-full px-3 py-2 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              설명
            </label>
            <textarea
              value={editDescriptionValue}
              onChange={(e) => setEditDescriptionValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              rows="4"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <FiSave className="mr-2" /> 저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// DaySection 컴포넌트 (일별 여행 일정 수정 가능 버전)
const DaySection = ({ 
    day, 
    mapLocations, 
    generateLocationsFromActivities, 
    activeDay, 
    onAddActivity, 
    onDeleteActivity, 
    isOwner, 
    localTravelPlan, 
    onUpdateAccommodation, 
    isMobile, 
    trackEvent,
    onUpdateDay
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingDay, setIsEditingDay] = useState(false);
    const [editTitle, setEditTitle] = useState(day.title || '');
    const [editDescription, setEditDescription] = useState(day.description || '');
    
    // 활동 수정 관련 상태
    const [isEditingActivity, setIsEditingActivity] = useState(null); // null 또는 활동 인덱스 또는 'recommendations'
    const [editActivityData, setEditActivityData] = useState({});
    
    const toggleExpand = () => {
      if (!isEditingDay && isEditingActivity === null) {
        setIsExpanded(!isExpanded);
        
        // 확장/축소 이벤트 추적
        trackEvent(
          isExpanded ? 'collapse_day' : 'expand_day', 
          'engagement', 
          `Day ${day.day} ${isExpanded ? '접기' : '펼치기'}`
        );
      }
    };
    
    // 모달 닫기 핸들러
    const handleCloseModal = () => {
      setIsModalOpen(false);
      
      // 모달 닫기 이벤트 추적
      trackEvent('close_modal', 'engagement', '활동 추가 모달 닫기');
    };
    
    // 활동 추가 버튼 클릭 핸들러
    const handleAddActivity = () => {
      setIsModalOpen(true);
      
      // 활동 추가 모달 열기 이벤트 추적
      trackEvent('open_modal', 'engagement', `활동 추가 모달 열기 (Day ${day.day})`);
    };
    
    // 현재 위치 정보 가져오기
    const getCurrentLocations = () => {
      const baseLocation = cityToStation(day.In) || "";
      const endLocation = cityToStation(day.Out) || "";
      
      return { baseLocation, endLocation };
    };
    
    // 일자 수정 시작
    const handleStartEditDay = (e) => {
      e.stopPropagation(); // 클릭 이벤트가 부모 요소로 전파되는 것을 방지
      setIsEditingDay(true);
      setEditTitle(day.title || '');
      setEditDescription(day.description || '');
      
      // 일자 수정 시작 이벤트 추적
      trackEvent('start_edit_day', 'engagement', `일자 수정 시작 (Day ${day.day})`);
    };
    
    // 일자 수정 취소
    const handleCancelEditDay = (e) => {
      if (e) e.stopPropagation();
      setIsEditingDay(false);
      
      // 일자 수정 취소 이벤트 추적
      trackEvent('cancel_edit_day', 'engagement', `일자 수정 취소 (Day ${day.day})`);
    };
    
    // 일자 수정 저장
    const handleSaveDay = (e) => {
      if (e) e.stopPropagation();
      
      // 변경 사항이 없으면 저장하지 않음
      if (editTitle === day.title && editDescription === day.description) {
        setIsEditingDay(false);
        return;
      }
      
      // 일자 정보 업데이트
      onUpdateDay(day.day, {
        title: editTitle,
        description: editDescription
      });
      
      setIsEditingDay(false);
      
      // 일자 수정 저장 이벤트 추적
      trackEvent('save_edit_day', 'content_update', `일자 수정 저장 (Day ${day.day})`);
    };
    
    // 활동 수정 시작
    const handleStartEditActivity = (index) => {
      const activity = day.activities[index];
      setIsEditingActivity(index);
      setEditActivityData({
        title: activity.title || '',
        location: activity.location || '',
        price: activity.price || '',
        transportation: activity.transportation || '',
        description: activity.description || '',
        duration: activity.duration || '',
        url: activity.url || ''
      });
      
      // 활동 수정 시작 이벤트 추적
      trackEvent('start_edit_activity', 'engagement', `활동 수정 시작 (Day ${day.day}, Activity ${index + 1})`);
    };
    
    // 활동 수정 취소
    const handleCancelEditActivity = () => {
      setIsEditingActivity(null);
      setEditActivityData({});
      
      // 활동 수정 취소 이벤트 추적
      trackEvent('cancel_edit_activity', 'engagement', `활동 수정 취소 (Day ${day.day})`);
    };
    
    // 활동 수정 저장
    const handleSaveActivity = (index) => {
      // 변경된 활동 데이터
      const updatedActivity = {
        ...day.activities[index],
        title: editActivityData.title,
        location: editActivityData.location,
        price: editActivityData.price !== '' ? parseFloat(editActivityData.price) : '',
        transportation: editActivityData.transportation,
        description: editActivityData.description,
        duration: editActivityData.duration,
        url: editActivityData.url
      };
      
      // 수정된 활동 업데이트
      const updatedActivities = [...day.activities];
      updatedActivities[index] = updatedActivity;
      
      // 상위 컴포넌트에 변경 사항 알림
      onUpdateDay(day.day, {
        activities: updatedActivities
      });
      
      // 수정 모드 종료
      setIsEditingActivity(null);
      setEditActivityData({});
      
      // 활동 수정 저장 이벤트 추적
      trackEvent('save_edit_activity', 'content_update', `활동 수정 저장 (Day ${day.day}, Activity ${index + 1})`);
    };
    
    // 여행 팁 수정 시작
    const handleStartEditRecommendations = (e) => {
      if (e) e.stopPropagation();
      setIsEditingActivity('recommendations');
      setEditActivityData({
        recommendations: day.recommendations || ''
      });
      
      // 여행 팁 수정 시작 이벤트 추적
      trackEvent('start_edit_recommendations', 'engagement', `여행 팁 수정 시작 (Day ${day.day})`);
    };
    
    // 여행 팁 수정 취소
    const handleCancelEditRecommendations = () => {
      setIsEditingActivity(null);
      setEditActivityData({});
      
      // 여행 팁 수정 취소 이벤트 추적
      trackEvent('cancel_edit_recommendations', 'engagement', `여행 팁 수정 취소 (Day ${day.day})`);
    };
    
    // 여행 팁 수정 저장
    const handleSaveRecommendations = () => {
      // 변경 사항이 없으면 저장하지 않음
      if (editActivityData.recommendations === day.recommendations) {
        setIsEditingActivity(null);
        setEditActivityData({});
        return;
      }
      
      // 상위 컴포넌트에 변경 사항 알림
      onUpdateDay(day.day, {
        recommendations: editActivityData.recommendations
      });
      
      // 수정 모드 종료
      setIsEditingActivity(null);
      setEditActivityData({});
      
      // 여행 팁 수정 저장 이벤트 추적
      trackEvent('save_edit_recommendations', 'content_update', `여행 팁 수정 저장 (Day ${day.day})`);
    };
    
    const { baseLocation, endLocation } = getCurrentLocations();
  
    return (
      <div className="mb-8 border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all day-card">
        {/* Day header - always visible */}
        <div 
          className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 border-b flex justify-between items-center cursor-pointer"
          onClick={toggleExpand}
        >
          {isEditingDay ? (
            <div className="flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-700 text-white rounded-full w-8 h-8 mr-2">
                  {day.day}
                </span>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-2 py-1 text-xl font-semibold border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-blue-800 dark:text-blue-200"
                />
              </div>
              <div className="pl-10">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  rows="2"
                ></textarea>
              </div>
              <div className="pl-10 mt-2 flex space-x-2">
                <button
                  onClick={handleSaveDay}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <FiSave className="mr-1" /> 저장
                </button>
                <button
                  onClick={handleCancelEditDay}
                  className="px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
                  <span className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-700 text-white rounded-full w-8 h-8 mr-2">
                    {day.day}
                  </span>
                  {day.title}
                </h2>
                {isOwner && (
                  <button
                    onClick={handleStartEditDay}
                    className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
                    title="일자 수정"
                  >
                    <FiEdit size={14} />
                  </button>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-1 pl-10">{day.description}</p>
            </div>
          )}
          {!isEditingDay && (
            <button className="text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 p-2 rounded-full">
              {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </button>
          )}
        </div>
  
        {/* Expandable content */}
        {isExpanded && (
          <div>
            {/* Map section for this day */}
            <div className="p-4 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-3">일정 지도</h3>
              <SwissMap 
                locations={generateLocationsFromActivities([day])} 
              />
            </div>
  
            {/* Activities list */}
            <div className="divide-y">
              {day.activities.map((activity, index) => (
                <div key={index} className="p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  {isEditingActivity === index ? (
                    // 활동 수정 폼
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white w-8 h-8 mr-3 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editActivityData.title}
                            onChange={(e) => setEditActivityData({...editActivityData, title: e.target.value})}
                            placeholder="활동 제목"
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <FiMapPin className="mr-1" size={14} />
                              <input
                                type="text"
                                value={editActivityData.location}
                                onChange={(e) => setEditActivityData({...editActivityData, location: e.target.value})}
                                placeholder="위치"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                              />
                            </div>
                            
                            <div className="flex items-center">
                              <FiDollarSign className="mr-1" size={14} />
                              <input
                                type="text"
                                value={editActivityData.price}
                                onChange={(e) => {
                                  // 숫자와 소수점만 허용
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  setEditActivityData({...editActivityData, price: value});
                                }}
                                placeholder="가격 (CHF)"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                              />
                            </div>
                            
                            <div className="flex items-center">
                              <select
                                value={editActivityData.transportation}
                                onChange={(e) => setEditActivityData({...editActivityData, transportation: e.target.value})}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                              >
                                <option value="">교통 수단 선택</option>
                                <option value="Train">Train</option>
                                <option value="CableCar">CableCar</option>
                                <option value="Funicular">Funicular</option>
                                <option value="Ferry">Ferry</option>
                                <option value="Bus">Bus</option>
                                <option value="Walk">Walk</option>
                              </select>
                            </div>
                            
                            <div className="flex items-center">
                              <FiClock className="mr-1" size={14} />
                              <input
                                type="text"
                                value={editActivityData.duration}
                                onChange={(e) => setEditActivityData({...editActivityData, duration: e.target.value})}
                                placeholder="소요 시간 (예: 2시간)"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                              />
                            </div>
                          </div>
                          
                          <textarea
                            value={editActivityData.description}
                            onChange={(e) => setEditActivityData({...editActivityData, description: e.target.value})}
                            placeholder="활동 설명"
                            rows="3"
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                          ></textarea>
                          
                          <input
                            type="text"
                            value={editActivityData.url}
                            onChange={(e) => setEditActivityData({...editActivityData, url: e.target.value})}
                            placeholder="관련 URL (선택사항)"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                          />
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveActivity(index)}
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                            >
                              <FiSave className="mr-1" /> 저장
                            </button>
                            <button
                              onClick={handleCancelEditActivity}
                              className="px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 활동 정보 표시
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white w-8 h-8 mr-3 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium text-lg text-gray-900 dark:text-white">{activity.title}</h3>
                              {isOwner && (
                                <button
                                  onClick={() => handleStartEditActivity(index)}
                                  className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
                                  title="활동 수정"
                                >
                                  <FiEdit size={14} />
                                </button>
                              )}
                            </div>
                            
                            {activity.location && (
                              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                                <FiMapPin className="mr-1" size={14} />
                                {activity.location}
                              </div>
                            )}
                            
                            {/* Price information */}
                            {activity.price && (
                              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                                <FiDollarSign className="mr-1 text-gray-600 dark:text-gray-300" />
                                <span>CHF {activity.price}</span>
                              </div>
                            )}
                            
                            {/* Transportation information */}
                            {activity.transportation && (
                              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                                {activity.transportation === 'Train' && <FaTrain className="mr-1 text-blue-600 dark:text-blue-400" />}
                                {activity.transportation === 'CableCar' && <FaTram className="mr-1 text-blue-600 dark:text-blue-400" />}
                                {activity.transportation === 'Funicular' && <FaMountain className="mr-1 text-blue-600 dark:text-blue-400" />}
                                {activity.transportation === 'Ferry' && <FaShip className="mr-1 text-blue-600 dark:text-blue-400" />}
                                {activity.transportation}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap mr-3">
                            {activity.duration}
                          </div>
                          
                          {/* Delete button - only show if owner */}
                          {isOwner && (
                            <button 
                              onClick={() => onDeleteActivity(day.day, index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete activity"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
  
                      <div className="mt-3 text-gray-600 dark:text-gray-300 pl-11">
                        {activity.description}
                      </div>
                      
                      {/* Optional URL link */}
                      {activity.url && (
                        <div className="mt-2 pl-11">
                          <a 
                            href={activity.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center w-fit"
                          >
                            자세히 보기
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add activity button - only if owner */}
              {isOwner && (
                <div className="p-4 bg-white dark:bg-gray-900">
                  <button 
                    onClick={handleAddActivity}
                    className="w-full py-3 flex items-center justify-center text-blue-600 dark:text-blue-300 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    일정 추가하기
                  </button>
                </div>
              )}
            </div>
            
            {/* Accommodation information */}
            {day.accommodation && (
              isOwner ? (
                <AccommodationEdit 
                  day={day}
                  activeDay={day.day}
                  travelPlan={localTravelPlan}
                  onUpdatePlan={onUpdateAccommodation}
                  travelPlanId={null} // Firebase 업데이트 중지
                  locationData={locationData}
                  setMapLocations={() => {}}
                  generateLocationsFromActivities={generateLocationsFromActivities}
                />
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border-t border-yellow-100 dark:border-yellow-700">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-300 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-yellow-800 dark:text-yellow-200">숙소 정보</h3>
                      <p className="text-yellow-700 dark:text-yellow-100">{day.accommodation}</p>
                      {day.accommodationDetail && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">{day.accommodationDetail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
            
            {/* Travel tips for the day */}
            {day.recommendations && (
              isOwner && isEditingActivity === 'recommendations' ? (
                // 여행 팁 수정 모드
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border-t border-amber-100 dark:border-amber-900" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-amber-500 dark:text-amber-300 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-amber-800 dark:text-amber-200">여행 팁 및 추천</h3>
                      </div>
                      <textarea
                        value={editActivityData.recommendations}
                        onChange={(e) => setEditActivityData({...editActivityData, recommendations: e.target.value})}
                        className="w-full px-2 py-1 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300"
                        rows="6"
                        placeholder="여행 팁이나 추천 정보를 입력하세요."
                      ></textarea>
                      <div className="flex justify-end mt-2 space-x-2">
                        <button
                          onClick={handleSaveRecommendations}
                          className="px-3 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex items-center text-sm"
                        >
                          <FiSave className="mr-1" /> 저장
                        </button>
                        <button
                          onClick={handleCancelEditRecommendations}
                          className="px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // 여행 팁 보기 모드
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border-t border-amber-100 dark:border-amber-900">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-amber-500 dark:text-amber-300 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-amber-800 dark:text-amber-200">여행 팁 및 추천</h3>
                        {isOwner && (
                          <button
                            onClick={handleStartEditRecommendations}
                            className="ml-2 p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-full transition-colors"
                            title="여행 팁 수정"
                          >
                            <FiEdit size={14} />
                          </button>
                        )}
                      </div>
                      {day.recommendations.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-amber-700 dark:text-amber-300 mt-1">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
            
            {/* Activity add modal */}
            <ActivityModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onAddActivity={(newActivity) => onAddActivity(day.day, newActivity)}
              currentDay={day.day}
              baseLocation={baseLocation}
              endLocation={endLocation}
            />
          </div>
        )}
      </div>
    );
  };
  

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

// Generate locations from activities
const generateLocationsFromActivities = (days) => {
  if (!days || !Array.isArray(days)) return [];
  
  const locations = [];
  
  days.forEach((day, dayIndex) => {
    // Add accommodation info if available
    if (day.accommodation) {
      const coords = locationData.cityCoordinates[day.accommodation];
      if (coords) {
        locations.push({
          id: `accommodation-${dayIndex}`,
          name: `${day.accommodation} (숙박)`,
          description: `Day ${day.day} 숙박`,
          type: 'hotel',
          lat: coords.lat,
          lng: coords.lng
        });
      }
    }
    
    // Add activity info
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity, actIndex) => {
        // Check if activity has direct lat, lng values
        if (activity.lat && activity.lng) {
          locations.push({
            id: `activity-${dayIndex}-${actIndex}`,
            name: `${actIndex + 1}. ${activity.title}`,
            description: activity.description,
            type: 'attraction',
            duration: activity.duration,
            lat: activity.lat,
            lng: activity.lng
          });
        }
        // If no direct coordinates but location name exists
        else if (activity.location) {
          // Look up coordinates from city data
          const coords = locationData.cityCoordinates[activity.location];
          
          if (coords) {
            locations.push({
              id: `activity-${dayIndex}-${actIndex}`,
              name: `${actIndex + 1}. ${activity.title}`,
              description: activity.description,
              type: 'attraction',
              duration: activity.duration,
              // Slightly randomize position for activities in the same location
              lat: coords.lat + (Math.random() * 0.01 - 0.005),
              lng: coords.lng + (Math.random() * 0.01 - 0.005)
            });
          }
        }
      });
    }
  });
  
  return locations;
};

// Travel style mapping
const travelStyleMap = {
  'nature': '자연 경관 위주',
  'activity': '하이킹과 액티비티',
  'balanced': '자연+도시 조화'
};

// Group type mapping
const groupTypeMap = {
  'solo': '나홀로',
  'couple': '커플',
  'family': '가족',
  'friends': '친구',
  'seniors': '시니어'
};

// 이제 전체 ConsultingPage 컴포넌트를 수정하여 편집 기능 구현

export default function ConsultingPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.id;
    const { user } = useAuth();
    const { trackPageView, trackEvent } = useAnalytics();
    
    const [plan, setPlan] = useState(null);
    const [localTravelPlan, setLocalTravelPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // 메인 계획 편집 상태
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    
    // 페이지 로드 시 분석 이벤트 발생
    useEffect(() => {
      if (planId) {
        trackPageView(`여행 상담 상세: ${planId}`);
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
    
    // Props에서 travelPlan이 변경되면 localTravelPlan 업데이트
    useEffect(() => {
      if (plan) {
        setLocalTravelPlan(plan);
        setEditTitle(plan.title || '');
        setEditDescription(plan.description || '');
      }
    }, [plan]);
    
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
    
    // 메인 제목 및 설명 수정 시작
    const handleStartEditPlan = () => {
      setIsEditingPlan(true);
      
      // 이벤트 추적: 여행 계획 제목/설명 수정 시작
      trackEvent('start_edit_plan', 'engagement', '여행 계획 제목/설명 수정 시작');
    };
    
    // 메인 제목 및 설명 수정 취소
    const handleCancelEditPlan = () => {
      setIsEditingPlan(false);
      setEditTitle(localTravelPlan.title || '');
      setEditDescription(localTravelPlan.description || '');
      
      // 이벤트 추적: 여행 계획 제목/설명 수정 취소
      trackEvent('cancel_edit_plan', 'engagement', '여행 계획 제목/설명 수정 취소');
    };
    
// 메인 제목 및 설명 수정 저장
const handleSavePlan = (newTitle, newDescription) => {
  // 파라미터에서 직접 받은 값이 있으면 사용하고, 없으면 상태 값을 사용
  const titleToSave = newTitle !== undefined ? newTitle : editTitle;
  const descriptionToSave = newDescription !== undefined ? newDescription : editDescription;
  
  // 변경 사항이 없으면 저장하지 않음
  if (titleToSave === localTravelPlan.title && descriptionToSave === localTravelPlan.description) {
    setIsEditingPlan(false);
    return;
  }
  
  // 로컬 상태 업데이트
  const updatedPlan = {
    ...localTravelPlan,
    title: titleToSave,
    description: descriptionToSave
  };
  
  setLocalTravelPlan(updatedPlan);
  
  // 편집 상태 종료
  setIsEditingPlan(false);
  
  // 변경 사항 추적 설정
  setHasUnsavedChanges(true);
  
  // 이벤트 추적: 여행 계획 제목/설명 수정 저장
  trackEvent('save_edit_plan', 'content_update', '여행 계획 제목/설명 수정 저장');
};
    
    // 일자 정보 업데이트 핸들러
    const handleUpdateDay = (dayNumber, updates) => {
      if (!isOwner) return;
      
      // 로컬 상태 복사
      const updatedPlan = { ...localTravelPlan };
      
      // 해당 일자 찾기
      const dayIndex = updatedPlan.days.findIndex(d => d.day === dayNumber);
      
      if (dayIndex !== -1) {
        // 일자 정보 업데이트
        updatedPlan.days[dayIndex] = {
          ...updatedPlan.days[dayIndex],
          ...updates
        };
        
        // 여행 계획 재계산이 필요한 경우 (활동 변경 등)
        const recalculatedPlan = updates.activities 
          ? calculateTravelPlan(updatedPlan) 
          : updatedPlan;
        
        // 로컬 상태 업데이트
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
        
        // 이벤트 추적: 일자 정보 업데이트
        trackEvent(
          'update_day_info', 
          'content_update',
          `일자 정보 업데이트 (Day ${dayNumber})`
        );
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
    
    // 변경 사항 저장 핸들러
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
          title: localTravelPlan.title,
          description: localTravelPlan.description,
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
    
    // Delete icon click handler
    const handleDeleteClick = useCallback((day, activityIndex) => {
      // 활동이 있는지 확인
      const dayIndex = localTravelPlan.days.findIndex(d => d.day === day);
      const activityToRemove = localTravelPlan.days[dayIndex]?.activities[activityIndex];
      
      setActivityToDelete({ day, activityIndex });
      setDeleteConfirmOpen(true);
  
       // 삭제 확인 모달 열기 이벤트 추적
       if (activityToRemove) {
        trackEvent(
          'open_delete_modal', 
          'engagement', 
          `활동 삭제 모달 열기: ${activityToRemove.title}`,
          {
            day: day,
            activity_title: activityToRemove.title,
            activity_location: activityToRemove.location
          }
        );
      }
    }, [localTravelPlan, trackEvent]);
  
    // Delete cancel handler
    const handleCancelDelete = useCallback(() => {
      setDeleteConfirmOpen(false);
      setActivityToDelete(null);
  
      // 삭제 취소 이벤트 추적
      trackEvent('cancel_delete', 'engagement', '활동 삭제 취소');
    }, [trackEvent]);
    
    // Delete confirmation handler
    const handleConfirmDelete = useCallback(() => {
      if (!activityToDelete) return;
  
      // Set loading state
      setIsDeleting(true);
  
      try {
        // Create a copy of current data
        const updatedPlan = { ...localTravelPlan };
        const { day, activityIndex } = activityToDelete;
        const dayIndex = updatedPlan.days.findIndex(d => d.day === day);
        
        // Get reference to the activity being deleted before removing it
        const activityBeingDeleted = updatedPlan.days[dayIndex].activities[activityIndex];
  
        // Delete the activity
        updatedPlan.days[dayIndex].activities.splice(activityIndex, 1);
  
        // Recalculate the entire travel plan to update transportation details
        const recalculatedPlan = calculateTravelPlan(updatedPlan);
  
        // 로컬 상태 업데이트
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
  
        // 활동 삭제 이벤트 추적
        if (activityBeingDeleted) {
          trackEvent(
            'delete_activity', 
            'content_update',
            `활동 삭제: ${activityBeingDeleted.title}`,
            {
              day: day,
              activity_title: activityBeingDeleted.title,
              activity_location: activityBeingDeleted.location
            }
          );
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
        // 오류 이벤트 추적
        trackEvent('error', 'system', `활동 삭제 오류: ${error.message}`);
      } finally {
        // Close modal and reset state
        setDeleteConfirmOpen(false);
        setActivityToDelete(null);
        setIsDeleting(false);
      }
    }, [activityToDelete, localTravelPlan, trackEvent]);
    
    // Add activity handler
    const handleAddActivity = useCallback((day, newActivity) => {
      // 소유자가 아니면 활동 추가 불가
      if (!isOwner) return;
  
      // Create a copy of current data
      const updatedPlan = { ...localTravelPlan };
      
      // Find the day to add activity to
      const dayIndex = updatedPlan.days.findIndex(d => d.day === day);
      
      if (dayIndex !== -1) {
        // Add new activity to the list
        updatedPlan.days[dayIndex].activities.push(newActivity);
  
        // Recalculate the entire travel plan to update transportation details
        const recalculatedPlan = calculateTravelPlan(updatedPlan);
        
        // 로컬 상태 업데이트
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
        
        // 활동 추가 이벤트 추적
        trackEvent(
          'add_activity', 
          'content_update',
          `활동 추가: ${newActivity.title}`,
          {
            day: day,
            activity_title: newActivity.title,
            activity_location: newActivity.location,
            activity_price: newActivity.price || 0
          }
        );
      }
    }, [localTravelPlan, isOwner, trackEvent]);
    
    // 숙소 정보 업데이트 핸들러
    const updateAccommodation = useCallback((updatedPlan) => {
      if (!isOwner) return;
      
      setLocalTravelPlan(updatedPlan);
      setHasUnsavedChanges(true);
  
      // 숙소 변경 이벤트 추적
      trackEvent(
        'update_accommodation', 
        'content_update',
        `숙소 정보 업데이트`
      );
    }, [isOwner, trackEvent]);
    
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
            `여행 상담 조회: ${planId}`, 
            {
              owner: (user && planData.userId === user.uid),
              status: status,
              title: planData.title || '제목 없음'
            }
          );
          
          // If plan is processing, check again in 5 seconds
          if (status === 'processing') {
            // 이벤트 추적: 생성 중인 여행 계획 조회
            trackEvent('view_processing_content', 'content', `생성 중인 여행 상담 조회: ${planId}`);
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
          <LoadingState message="여행 상담 내용을 불러오는 중..." />
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
        {/* 상단 정보 및 여행 개요 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-4">
              <EditableTitleDescription
                title={localTravelPlan.title}
                description={localTravelPlan.description}
                isEditing={isEditingPlan}
                onStartEdit={isOwner ? handleStartEditPlan : null}
                onSave={handleSavePlan}
                onCancel={handleCancelEditPlan}
                setTitle={setEditTitle}
                setDescription={setEditDescription}
              />
              
              <div className="flex flex-wrap gap-2 text-sm mb-2">
                {plan.options && plan.options.startingCity && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <FiMapPin className="mr-1" /> 출발: {plan.options.startingCity}
                  </span>
                )}
                {plan.options && plan.options.duration && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <FiClock className="mr-1" /> {plan.options.duration}일
                  </span>
                )}
                {plan.options && plan.options.travelStyle && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <FiUsers className="mr-1" /> {travelStyleMap[plan.options.travelStyle] || plan.options.travelStyle}
                  </span>
                )}
                {plan.options && plan.options.groupType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <FiUsers className="mr-1" /> {groupTypeMap[plan.options.groupType] || plan.options.groupType}
                  </span>
                )}
                {plan.options && plan.options.budget && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <FiDollarSign className="mr-1" /> {plan.options.budget}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500">
                {plan.createdAt && `작성일: ${formatRelativeTime(plan.createdAt)}`}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              {/* 변경사항 알림 표시 */}
              {hasUnsavedChanges && isOwner && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center mb-2">
                  <FiEdit className="mr-1" /> 변경사항 있음
                </div>
              )}
  
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
                    className="px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    onClick={saveAsMine}
                    disabled={isSaving || !user}
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
        </div>
        
        {/* 전체 여행 개요 지도 */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-blue-800 dark:text-yellow-400 mb-4">전체 여행 경로</h2>
            <SwissMap locations={generateLocationsFromActivities(localTravelPlan.days)} />
          </div>
        </div>
        
        {/* 여행 계획 스크롤 섹션 */}
        <div className="my-6">
          <h2 className="text-2xl font-bold text-blue-800 dark:text-yellow-300 mb-4">일별 여행 일정</h2>
          
          {/* Day sections - 타임라인 디자인 제거, 깔끔한 카드 레이아웃으로 변경 */}
          <div className="space-y-6">
            {localTravelPlan.days.sort((a, b) => a.day - b.day).map((day) => (
              <DaySection 
                key={day.day} 
                day={day}
                generateLocationsFromActivities={generateLocationsFromActivities}
                activeDay={day.day}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteClick}
                isOwner={isOwner}
                localTravelPlan={localTravelPlan}
                onUpdateAccommodation={updateAccommodation}
                onUpdateDay={handleUpdateDay}
                isMobile={isMobile}
                trackEvent={trackEvent}
              />
            ))}
          </div>
        </div>
        
        {/* Transportation cost information component */}
        {localTravelPlan.transportationDetails && localTravelPlan.budgetBreakdown && (
          <TransportationCost 
            transportationDetails={localTravelPlan.transportationDetails} 
            budgetBreakdown={localTravelPlan.budgetBreakdown} 
          />
        )}
        
        {/* Optional chat button for follow-up questions */}
        {process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' && <ChatButtonPortal />}
        
        {/* Back to list button */}
        <div className="my-8 flex justify-center">
          <button 
            onClick={() => {
              trackEvent('button_click', 'navigation', '상담 목록으로 돌아가기');
              router.push('/consulting');
            }}
            className="btn flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded-md transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <FiArrowLeft className="mr-2" /> 상담 목록으로 돌아가기
          </button>
        </div>
        
        {/* Delete confirmation dialog */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-auto">
              <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
                <FiAlertCircle size={24} className="mr-2" />
                <h3 className="text-lg font-semibold">활동 삭제 확인</h3>
              </div>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                이 활동을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 bg-red-600 text-white rounded-md transition-colors ${
                    isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                  }`}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
                  
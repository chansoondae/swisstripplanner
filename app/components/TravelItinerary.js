'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiClock, FiMapPin, FiSun, FiDollarSign, FiInfo, FiHome, FiUsers, FiPlus, FiRefreshCw, FiTrash2, FiAlertCircle, FiSave, FiExternalLink } from 'react-icons/fi';
import { FaShip, FaMountain, FaTram, FaTrain } from 'react-icons/fa';
import SwissMap from './SwissMap';
import TransportationCost from './TransportationCost';
import ActivityModal from './ActivityModal';
import { cityToStation } from '../../utils/cityToStation';
import locationData from '../../utils/locationData';
import './../../styles/travelItinerary.css';
import { calculateTravelPlan } from './../../utils/calculateTravelPlan';
import AccommodationEdit from './AccommodationEdit';
import { useAnalytics } from './../hooks/useAnalytics'; // Analytics 훅 추가


// Firebase related imports
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';



// Transportation icon component
const TransportIcon = ({ type }) => {
  switch (type) {
    case 'Train':
      return <FaTrain className="mr-1 text-blue-600 dark:text-yellow-400" />;
    case 'CableCar':
      return <FaTram className="mr-1 text-blue-600 dark:text-yellow-400" />;
    case 'Funicular':
      return <FaMountain className="mr-1 text-blue-600 dark:text-yellow-400" />;
    case 'Ferry':
      return <FaShip className="mr-1 text-blue-600 dark:text-yellow-400" />;
    default:
      return null;
  }
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

export default function TravelItinerary({ travelPlan, onUpdatePlan, travelPlanId }) {
  const [activeDay, setActiveDay] = useState(1);
  const [mapLocations, setMapLocations] = useState([]);
  
  // 로컬 상태로 여행 계획 관리
  const [localTravelPlan, setLocalTravelPlan] = useState(travelPlan);
  
  // 변경 사항 추적
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  // Activity modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); 

  // Analytics 훅 사용
  const { trackEvent } = useAnalytics();

  // 컴포넌트 마운트 시 또는 여행 계획이 변경되었을 때 이벤트 추적
  useEffect(() => {
    if (travelPlan && travelPlan.title) {
      // 여행 일정 조회 이벤트 추적
      trackEvent(
        'view_itinerary', 
        'content', 
        `여행 일정 조회: ${travelPlan.title}`,
        {
          id: travelPlanId,
          days: travelPlan.days?.length || 0,
          activities: travelPlan.days?.reduce((total, day) => total + (day.activities?.length || 0), 0) || 0
        }
      );
    }
  }, [travelPlan, travelPlanId, trackEvent]);

  // Props에서 travelPlan이 변경되면 localTravelPlan 업데이트
  useEffect(() => {
    setLocalTravelPlan(travelPlan);
  }, [travelPlan]);
  
  // Current day data (memoized to avoid recalculation)
  const currentDay = useMemo(() => 
    localTravelPlan.days.find(day => day.day === activeDay) || localTravelPlan.days[0], 
    [localTravelPlan.days, activeDay]
  );
  
  // Update map locations when active day changes
  useEffect(() => {
    if (localTravelPlan.days) {
      const filteredDays = localTravelPlan.days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(filteredDays);
      setMapLocations(locations);
    }
  }, [activeDay, localTravelPlan.days]);

  // Handle adding new activity
  const handleAddActivity = () => {
    setIsModalOpen(true);

    // 활동 추가 모달 열기 이벤트 추적
    trackEvent('open_modal', 'engagement', `활동 추가 모달 열기 (Day ${activeDay})`);
 
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    
    // 모달 닫기 이벤트 추적
    trackEvent('close_modal', 'engagement', '활동 추가 모달 닫기');
  };
  
  // Get current locations for modal (memoized)
  const getCurrentLocations = useCallback(() => {
    const baseLocation = cityToStation(currentDay.In) || "";
    const endLocation = cityToStation(currentDay.Out) || "";
    
    return { baseLocation, endLocation };
  }, [currentDay]);

  // Delete icon click handler
  const handleDeleteClick = useCallback((dayIndex, activityIndex) => {
    // 활동이 있는지 확인
    const activityToRemove = localTravelPlan.days[dayIndex]?.activities[activityIndex];
    
    setActivityToDelete({ dayIndex, activityIndex });
    setDeleteConfirmOpen(true);

     // 삭제 확인 모달 열기 이벤트 추적
     if (activityToRemove) {
      trackEvent(
        'open_delete_modal', 
        'engagement', 
        `활동 삭제 모달 열기: ${activityToRemove.title}`,
        {
          day: localTravelPlan.days[dayIndex].day,
          activity_title: activityToRemove.title,
          activity_location: activityToRemove.location
        }
      );
    }
  }, [localTravelPlan.days, trackEvent]);

  // Delete cancel handler
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setActivityToDelete(null);

    // 삭제 취소 이벤트 추적
    trackEvent('cancel_delete', 'engagement', '활동 삭제 취소');
  }, [trackEvent]);

  // Add new activity to the travel plan (로컬 상태만 업데이트)
  const addActivityToDay = useCallback((newActivity) => {

    // 소유자가 아니면 활동 추가 불가 - 이미 handleAddActivity에서 체크하므로 중복 체크는 생략
    

    // Create a copy of current data
    const updatedPlan = { ...localTravelPlan };
    
    // Find the day to add activity to
    const dayIndex = updatedPlan.days.findIndex(day => day.day === activeDay);
    
    if (dayIndex !== -1) {
      // Add new activity to the list
      updatedPlan.days[dayIndex].activities.push(newActivity);

      // Recalculate the entire travel plan to update transportation details
      const recalculatedPlan = calculateTravelPlan(updatedPlan);
      
      // 로컬 상태 업데이트
      setLocalTravelPlan(recalculatedPlan);
      setHasUnsavedChanges(true);
      
      // Update map data
      const updatedDay = recalculatedPlan.days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(updatedDay);
      setMapLocations(locations);

      // 활동 추가 이벤트 추적
      trackEvent(
        'add_activity', 
        'content_update',
        `활동 추가: ${newActivity.title}`,
        {
          day: activeDay,
          activity_title: newActivity.title,
          activity_location: newActivity.location,
          activity_price: newActivity.price || 0
        }
      );

      // 상위 컴포넌트에 변경 사항 알림
      if (onUpdatePlan) {
        onUpdatePlan(recalculatedPlan, true);
      }

    }
  }, [localTravelPlan, activeDay, onUpdatePlan, trackEvent]);

  // Delete confirmation handler (로컬 상태만 업데이트)
  const handleConfirmDelete = useCallback(() => {
    if (!activityToDelete) return;

    // Set loading state
    setIsDeleting(true);

    try {
      // Create a copy of current data
      const updatedPlan = { ...localTravelPlan };
      const { dayIndex, activityIndex } = activityToDelete;

      // Get reference to the activity being deleted before removing it
      const activityBeingDeleted = updatedPlan.days[dayIndex].activities[activityIndex];


      // Delete the activity
      updatedPlan.days[dayIndex].activities.splice(activityIndex, 1);

      // Recalculate the entire travel plan to update transportation details
      const recalculatedPlan = calculateTravelPlan(updatedPlan);

      // 로컬 상태 업데이트
      setLocalTravelPlan(recalculatedPlan);
      setHasUnsavedChanges(true);

      // Update map data
      const updatedDay = recalculatedPlan.days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(updatedDay);
      setMapLocations(locations);

      // 활동 삭제 이벤트 추적
      if (activityBeingDeleted) {
        trackEvent(
          'delete_activity', 
          'content_update',
          `활동 삭제: ${activityBeingDeleted.title}`,
          {
            day: updatedPlan.days[dayIndex].day,
            activity_title: activityBeingDeleted.title,
            activity_location: activityBeingDeleted.location
          }
        );
      }


      // 상위 컴포넌트에 변경 사항 알림
      if (onUpdatePlan) {
        onUpdatePlan(recalculatedPlan, true);
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
  }, [activityToDelete, localTravelPlan, activeDay, onUpdatePlan, trackEvent]);

  // 변경 사항 저장 핸들러
  const handleSaveChanges = async () => {

    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    try {
      // Firebase 업데이트
      if (travelPlanId) {
        const travelPlanRef = doc(db, 'travelPlans', travelPlanId);
        await updateDoc(travelPlanRef, {
          days: localTravelPlan.days,
          transportationDetails: localTravelPlan.transportationDetails,
          budgetBreakdown: localTravelPlan.budgetBreakdown,
          updatedAt: new Date()
        });

        // 저장 성공 이벤트 추적
        trackEvent(
          'save_itinerary', 
          'conversion',
          `여행 일정 저장: ${localTravelPlan.title}`,
          { id: travelPlanId }
        );
      }
      
      // 부모 컴포넌트 업데이트
      if (onUpdatePlan) {
        onUpdatePlan(localTravelPlan);
      }
      
      // 저장 완료 후 상태 초기화
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      // 오류 이벤트 추적
      trackEvent('error', 'system', `여행 일정 저장 오류: ${error.message}`);
    
      // 에러 처리 (필요시 알림 표시)
    } finally {
      setIsSaving(false);
    }
  };

  // 숙소 정보 업데이트 핸들러 (로컬 상태만 업데이트)
  const updateAccommodation = useCallback((updatedPlan) => {

    setLocalTravelPlan(updatedPlan);
    setHasUnsavedChanges(true);
    
    // Update map data
    const updatedDay = updatedPlan.days.filter(day => day.day === activeDay);
    const locations = generateLocationsFromActivities(updatedDay);
    setMapLocations(locations);

    // 숙소 변경 이벤트 추적
    if (previousAccommodation !== newAccommodation) {
      trackEvent(
        'update_accommodation', 
        'content_update',
        `숙소 정보 업데이트 (Day ${activeDay})`,
        {
          day: activeDay,
          previous: previousAccommodation || 'none',
          new: newAccommodation || 'none'
        }
      );
    }

    // 상위 컴포넌트에 변경 사항 알림
    if (onUpdatePlan) {
      onUpdatePlan(updatedPlan, true);
    }

  }, [activeDay, onUpdatePlan, trackEvent]);

  // 일자 변경 핸들러
  const handleDayChange = (day) => {
    setActiveDay(day);
    
    // 일자 변경 이벤트 추적
    trackEvent(
      'switch_day', 
      'navigation',
      `Day ${day} 조회`,
      { previous_day: activeDay, selected_day: day }
    );
  };

  // 외부 링크 클릭 추적
  const handleExternalLinkClick = (e, activity) => {
    e.stopPropagation(); // 이벤트 전파 방지
    
    // 외부 링크 클릭 이벤트 추적
    trackEvent(
      'click_external_link',
      'engagement',
      `외부 링크 클릭: ${activity.title}`,
      {
        url: activity.url,
        location: activity.location,
        day: activeDay
      }
    );
  };

  const { baseLocation, endLocation } = getCurrentLocations();

  return (
    <div className="p-4 md:p-6">
      {/* Trip title and summary */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-yellow-300 mb-2">{localTravelPlan.title}</h1>
        <p className="text-gray-600 mb-4">{localTravelPlan.description}</p>
        
        <div className="flex flex-wrap gap-2 text-sm mb-2">
          {localTravelPlan.options && localTravelPlan.options.startingCity && (
            <span className="trip-info-badge starting-city">
              <FiMapPin className="mr-1" /> In: {localTravelPlan.options.startingCity}
            </span>
          )}
          {localTravelPlan.options && localTravelPlan.options.endingCity && (
            <span className="trip-info-badge ending-city">
              <FiMapPin className="mr-1" /> Out: {localTravelPlan.options.endingCity}
            </span>
          )}
          {localTravelPlan.options && localTravelPlan.options.duration && (
            <span className="trip-info-badge duration">
              <FiClock className="mr-1" /> {localTravelPlan.options.duration}일
            </span>
          )}
          {localTravelPlan.options && localTravelPlan.options.travelStyle && (
            <span className="trip-info-badge travel-style">
              <FiSun className="mr-1" /> {travelStyleMap[localTravelPlan.options.travelStyle] || localTravelPlan.options.travelStyle}
            </span>
          )}
          {localTravelPlan.options && localTravelPlan.options.groupType && (
            <span className="trip-info-badge group-type">
              <FiUsers className="mr-1" /> {groupTypeMap[localTravelPlan.options.groupType] || localTravelPlan.options.groupType}
            </span>
          )}
        </div>
      </div>

      {/* Map section */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-yellow-400 mb-4">Day {activeDay} Map</h2>
          <SwissMap locations={mapLocations} />
        </div>
      </div>

      {/* Daily trip plan tabs */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {localTravelPlan.days.map((day) => (
            <button
              key={day.day}
              onClick={() => handleDayChange(day.day)}
              className={`px-3 py-2 text-sm md:text-base rounded-t-lg transition-colors ${
                activeDay === day.day
                  ? 'bg-blue-600 dark:bg-yellow-600 text-white dark:text-gray-900 font-medium'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Selected day's trip plan */}
      {localTravelPlan.days.map((day) => {
        if (day.day !== activeDay) return null;

        return (
          <div key={day.day} >
            <div className="border rounded-lg overflow-hidden mb-6">
              {/* Day title */}
              <div className="bg-blue-50 dark:bg-amber-800 p-4 border-b">
                <h2 className="text-xl font-semibold text-blue-800 dark:text-amber-200">{day.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{day.description}</p>
              </div>

              {/* Activity list */}
              <div className="divide-y">
                {day.activities.map((activity, index) => (
                  <div key={index} className="p-4 bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="activity-number">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{activity.title}</h3>
                          
                          {/* URL Link Badge - Only show if URL exists */}
                          {activity.url && (
                            <div className="mt-1 mb-1">
                              <a 
                                href={activity.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium inline-flex items-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                onClick={(e) => handleExternalLinkClick(e, activity)}
                              >
                                <span>{activity.location} 자세히 보기</span>
                                <FiExternalLink className="ml-1" size={12} />
                              </a>
                            </div>
                          )}
                          
                          {activity.location && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                              <FiMapPin className="mr-1" size={12} />
                              {activity.base && activity.base !== activity.location ? (
                                <>
                                  {activity.base}
                                  <FiRefreshCw className="mx-1" size={12} />
                                  {activity.location}
                                </>
                              ) : (
                                activity.location
                              )}
                            </div>
                          )}
                          {/* Price information */}
                          {activity.price && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                              <FiDollarSign className="mr-2 text-gray-600 dark:text-gray-300" />
                              <span>CHF {activity.price}</span>
                            </div>
                          )}
                          {/* Transportation information */}
                          {activity.transportation && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                              <TransportIcon type={activity.transportation} />
                              {activity.transportation}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap mr-3">
                          {activity.duration}
                        </div>
                        {/* Delete button */}
                        <button 
                          onClick={() => handleDeleteClick(localTravelPlan.days.findIndex(d => d.day === activeDay), index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete activity"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-gray-600 dark:text-gray-300 text-sm pl-20">
                      {activity.description}
                    </div>
                  </div>
                ))}
                
                {/* Add activity button */}
                <div className="p-4 bg-white dark:bg-gray-900">
                  <button 
                    onClick={handleAddActivity}
                    className="w-full py-3 flex items-center justify-center text-blue-600 dark:text-yellow-300 border border-dashed border-blue-300 dark:border-yellow-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    일정 추가하기
                  </button>
                </div>
              </div>
              
              {/* Accommodation information */}
              {day.accommodation && (
                <AccommodationEdit 
                  day={day}
                  activeDay={activeDay}
                  travelPlan={localTravelPlan}
                  onUpdatePlan={updateAccommodation}
                  travelPlanId={null} // Firebase 업데이트 중지
                  locationData={locationData}
                  setMapLocations={setMapLocations}
                  generateLocationsFromActivities={generateLocationsFromActivities}
                />
              )}
            </div>
            
            {/* Travel tips for the day */}
            {day.recommendations && (
              <div className="mt-4 mb-6">
                <div className="rounded-lg overflow-hidden border border-amber-200 dark:border-amber-700">
                  <div className="w-full flex items-center bg-amber-50 dark:bg-amber-950 dark:bg-am p-4 text-amber-800 dark:text-amber-100 font-medium border-b border-amber-200 dark:border-amber-700">
                    <FiInfo className="mr-2" />
                    여행 팁 및 추천
                  </div>
                  
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 text-gray-700 dark:text-gray-200">
                    {day.recommendations.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Activity add modal */}
      <ActivityModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddActivity={addActivityToDay}
        currentDay={activeDay}
        baseLocation={baseLocation}
        endLocation={endLocation}
      />

      {/* Delete confirmation dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
            <div className="flex items-center text-red-600 mb-4">
              <FiAlertCircle size={24} className="mr-2" />
              <h3 className="text-lg font-semibold">활동 삭제 확인</h3>
            </div>
            <p className="mb-6 text-gray-700">
              이 활동을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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

      {/* Transportation cost information component */}
      {localTravelPlan.transportationDetails && localTravelPlan.budgetBreakdown && (
        <TransportationCost 
          transportationDetails={localTravelPlan.transportationDetails} 
          budgetBreakdown={localTravelPlan.budgetBreakdown} 
        />
      )}
      
      {/* Save changes button (only show if unsaved changes exist) */}
      {/* {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 z-10">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`flex items-center px-4 py-2 bg-blue-600 dark:bg-yellow-600 text-white dark:text-gray-900 rounded-md shadow-lg hover:bg-blue-700 dark:hover:bg-yellow-700 transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiSave className="mr-2" />
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      )} */}
    </div>
  );
}
'use client';

import { useState, useMemo, useCallback } from 'react';
import { FiHome } from 'react-icons/fi';
import { calculateTravelPlan } from './../../utils/calculateTravelPlan';
import { useAnalytics } from './../hooks/useAnalytics'; // Analytics 훅 추가

const AccommodationEdit = ({ 
  day, 
  activeDay, 
  travelPlan, 
  onUpdatePlan, 
  travelPlanId, // 이제 사용하지 않음
  locationData,
  setMapLocations,
  generateLocationsFromActivities
}) => {
  const [isEditingAccommodation, setIsEditingAccommodation] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState("");
  
  // Analytics 훅 사용
  const { trackEvent } = useAnalytics();

  // Get available cities from locationData
  const availableCities = useMemo(() => 
    Object.keys(locationData.cityCoordinates || {}), 
    [locationData]
  );

  // Handle edit button click
  const handleEditAccommodation = useCallback(() => {
    const currentAccommodation = day.accommodation || "";
    setSelectedAccommodation(currentAccommodation);
    setIsEditingAccommodation(true);
    
    // 숙소 편집 시작 이벤트 추적
    trackEvent(
      'start_accommodation_edit', 
      'engagement',
      `숙소 편집 시작 (Day ${activeDay})`,
      {
        day: activeDay,
        current_accommodation: currentAccommodation
      }
    );
  }, [day, activeDay, trackEvent]);

  // Handle accommodation change
  const handleAccommodationChange = useCallback((newAccommodation) => {
    try {
      const previousAccommodation = day.accommodation || "";
      
      // Create a copy of current data
      const updatedPlan = { ...travelPlan };
      
      // Find the day to update
      const dayIndex = updatedPlan.days.findIndex(d => d.day === activeDay);
      
      if (dayIndex !== -1) {
        // Update accommodation
        updatedPlan.days[dayIndex].accommodation = newAccommodation;

        // Recalculate the travel plan to update details
        const recalculatedPlan = calculateTravelPlan(updatedPlan);
        
        // Firebase 업데이트 제거 - 부모 컴포넌트에서 처리
        
        // Update parent component
        if (onUpdatePlan) {
          onUpdatePlan(recalculatedPlan);
        }
        
        // Update map data
        const updatedDay = recalculatedPlan.days.filter(d => d.day === activeDay);
        const locations = generateLocationsFromActivities(updatedDay);
        setMapLocations(locations);
        
        // 숙소 변경 이벤트 추적 (변경 사항이 있는 경우에만)
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
      }
    } catch (error) {
      console.error('Error updating accommodation:', error);
      
      // 숙소 업데이트 오류 이벤트 추적
      trackEvent(
        'error', 
        'system',
        `숙소 업데이트 오류: ${error.message}`
      );
    } finally {
      // Exit edit mode
      setIsEditingAccommodation(false);
      
      // 숙소 편집 종료 이벤트 추적
      trackEvent(
        'end_accommodation_edit', 
        'engagement',
        `숙소 편집 완료 (Day ${activeDay})`
      );
    }
  }, [travelPlan, day, activeDay, onUpdatePlan, generateLocationsFromActivities, setMapLocations, trackEvent]);

  // Cancel edit without saving
  const handleCancelAccommodationEdit = useCallback(() => {
    setIsEditingAccommodation(false);
    
    // 숙소 편집 취소 이벤트 추적
    trackEvent(
      'cancel_accommodation_edit', 
      'engagement',
      `숙소 편집 취소 (Day ${activeDay})`,
      {
        day: activeDay
      }
    );
  }, [activeDay, trackEvent]);

  return (
    <div className="bg-blue-50 dark:bg-amber-800 p-4 border-t relative">
      {isEditingAccommodation && day.day === activeDay ? (
        <div className="flex items-center">
          <FiHome className="mr-2 text-blue-700 dark:text-amber-100" />
          <span className="font-medium text-blue-800 dark:text-amber-100 ">숙박:</span>
          <div className="ml-2 flex-1">
            <select
              value={selectedAccommodation}
              onChange={(e) => {
                setSelectedAccommodation(e.target.value);
                
                // 숙소 선택 변경 이벤트 추적
                trackEvent(
                  'select_accommodation', 
                  'engagement',
                  `숙소 선택 변경 (Day ${activeDay})`,
                  {
                    day: activeDay,
                    selected: e.target.value
                  }
                );
              }}
              className="p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-blue-300 rounded-md w-full max-w-xs"
            >
              <option value="">선택하세요</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleAccommodationChange(selectedAccommodation)}
                className="px-3 py-1 bg-blue-600 dark:bg-amber-600 text-white dark:text-gray-800 text-sm rounded-md hover:bg-blue-700 dark:hover:bg-amber-700 transition-colors"
              >
                적용
              </button>
              <button
                onClick={handleCancelAccommodationEdit}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <FiHome className="mr-2 text-blue-700 dark:text-amber-100" />
          <span className="font-medium text-blue-800 dark:text-amber-100">숙박:</span>
          <button 
            onClick={handleEditAccommodation}
            className="ml-2 text-blue-700 dark:text-amber-100 hover:text-blue-900 dark:hover:text-amber-300 hover:underline flex items-center transition-colors"
          >
            {day.accommodation}
            {/* <span className="ml-2 text-xs text-blue-500">(클릭하여 수정)</span> */}
          </button>
        </div>
      )}
    </div>
  );
};

export default AccommodationEdit;
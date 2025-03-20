'use client';

import { useState, useMemo, useCallback } from 'react';
import { FiHome } from 'react-icons/fi';
import { calculateTravelPlan } from './../../utils/calculateTravelPlan';

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
  }, [day]);

  // Handle accommodation change
  const handleAccommodationChange = useCallback((newAccommodation) => {
    try {
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
      }
    } catch (error) {
      console.error('Error updating accommodation:', error);
    } finally {
      // Exit edit mode
      setIsEditingAccommodation(false);
    }
  }, [travelPlan, activeDay, onUpdatePlan, generateLocationsFromActivities, setMapLocations]);

  // Cancel edit without saving
  const handleCancelAccommodationEdit = useCallback(() => {
    setIsEditingAccommodation(false);
  }, []);

  return (
    <div className="bg-blue-50 p-4 border-t relative">
      {isEditingAccommodation && day.day === activeDay ? (
        <div className="flex items-center">
          <FiHome className="mr-2 text-blue-700" />
          <span className="font-medium text-blue-800">숙박:</span>
          <div className="ml-2 flex-1">
            <select
              value={selectedAccommodation}
              onChange={(e) => setSelectedAccommodation(e.target.value)}
              className="p-2 border border-blue-300 rounded-md w-full max-w-xs"
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
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                적용
              </button>
              <button
                onClick={handleCancelAccommodationEdit}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <FiHome className="mr-2 text-blue-700" />
          <span className="font-medium text-blue-800">숙박:</span>
          <button 
            onClick={handleEditAccommodation}
            className="ml-2 text-blue-700 hover:text-blue-900 hover:underline flex items-center transition-colors"
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
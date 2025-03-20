'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiClock, FiMapPin, FiSun, FiDollarSign, FiInfo, FiHome, FiUsers, FiPlus, FiRefreshCw, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { FaShip, FaMountain, FaTram, FaTrain } from 'react-icons/fa';
import SwissMap from './SwissMap';
import TransportationCost from './TransportationCost';
import ActivityModal from './ActivityModal';
import { cityToStation } from '../../utils/cityToStation';
import locationData from '../../utils/locationData';
import './../../styles/travelItinerary.css';
import { calculateTravelPlan } from './../../utils/calculateTravelPlan';

// Firebase related imports
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Transportation icon component
const TransportIcon = ({ type }) => {
  switch (type) {
    case 'Train':
      return <FaTrain className="mr-1 text-blue-600" />;
    case 'CableCar':
      return <FaTram className="mr-1 text-blue-600" />;
    case 'Funicular':
      return <FaMountain className="mr-1 text-blue-600" />;
    case 'Ferry':
      return <FaShip className="mr-1 text-blue-600" />;
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
      const coords = locationData[day.accommodation];
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
          const coords = locationData[activity.location];
          
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

  // Activity modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); 

  const {
    title,
    description,
    days,
    recommendations,
    options,
    budgetBreakdown,
    transportationDetails
  } = travelPlan;
  
  // Current day data (memoized to avoid recalculation)
  const currentDay = useMemo(() => 
    days.find(day => day.day === activeDay) || days[0], 
    [days, activeDay]
  );
  
  // Update map locations when active day changes
  useEffect(() => {
    if (days) {
      const filteredDays = days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(filteredDays);
      setMapLocations(locations);
    }
  }, [activeDay, days]);

  // Handle adding new activity
  const handleAddActivity = () => {
    setIsModalOpen(true);
  };
  
  // Get current locations for modal (memoized)
  const getCurrentLocations = useCallback(() => {
    const baseLocation = cityToStation(currentDay.In) || "";
    const endLocation = cityToStation(currentDay.Out) || "";
    
    return { baseLocation, endLocation };
  }, [currentDay]);

  // Delete icon click handler
  const handleDeleteClick = useCallback((dayIndex, activityIndex) => {
    setActivityToDelete({ dayIndex, activityIndex });
    setDeleteConfirmOpen(true);
  }, []);

  // Delete cancel handler
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setActivityToDelete(null);
  }, []);

  // Add new activity to the travel plan
  const addActivityToDay = useCallback(async (newActivity) => {
    try {
      // Create a copy of current data
      const updatedPlan = { ...travelPlan };
      
      // Find the day to add activity to
      const dayIndex = updatedPlan.days.findIndex(day => day.day === activeDay);
      
      if (dayIndex !== -1) {
        // Add new activity to the list
        updatedPlan.days[dayIndex].activities.push(newActivity);

        // Recalculate the entire travel plan to update transportation details
        const recalculatedPlan = calculateTravelPlan(updatedPlan);
        
        // Update Firebase
        if (travelPlanId) {
          const travelPlanRef = doc(db, 'travelPlans', travelPlanId);
          await updateDoc(travelPlanRef, {
            days: recalculatedPlan.days,
            transportationDetails: recalculatedPlan.transportationDetails
          });
          console.log('Firebase update successful');
        }
        
        // Update parent component
        if (onUpdatePlan) {
          onUpdatePlan(recalculatedPlan);
        }
        
        // Update map data
        const updatedDay = recalculatedPlan.days.filter(day => day.day === activeDay);
        const locations = generateLocationsFromActivities(updatedDay);
        setMapLocations(locations);
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }, [travelPlan, activeDay, travelPlanId, onUpdatePlan]);

  // Delete confirmation handler
  const handleConfirmDelete = useCallback(async () => {
    if (!activityToDelete) return;

    // Set loading state
    setIsDeleting(true);

    try {
      // Create a copy of current data
      const updatedPlan = { ...travelPlan };
      const { dayIndex, activityIndex } = activityToDelete;

      // Delete the activity
      updatedPlan.days[dayIndex].activities.splice(activityIndex, 1);

      // Recalculate the entire travel plan to update transportation details
      const recalculatedPlan = calculateTravelPlan(updatedPlan);

      // Update Firebase
      if (travelPlanId) {
        const travelPlanRef = doc(db, 'travelPlans', travelPlanId);
        await updateDoc(travelPlanRef, {
          days: recalculatedPlan.days,
          transportationDetails: recalculatedPlan.transportationDetails,
          budgetBreakdown: recalculatedPlan.budgetBreakdown
        });
        console.log('Activity deleted and Firebase updated successfully');
      }

      // Update parent component
      if (onUpdatePlan) {
        onUpdatePlan(recalculatedPlan);
      }

      // Update map data
      const updatedDay = recalculatedPlan.days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(updatedDay);
      setMapLocations(locations);

    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      // Close modal and reset state
      setDeleteConfirmOpen(false);
      setActivityToDelete(null);
      setIsDeleting(false);
    }
  }, [activityToDelete, travelPlan, travelPlanId, activeDay, onUpdatePlan]);

  const { baseLocation, endLocation } = getCurrentLocations();

  return (
    <div className="p-4 md:p-6">
      {/* Trip title and summary */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="flex flex-wrap gap-2 text-sm">
          {options && options.startingCity && (
            <span className="trip-info-badge starting-city">
              <FiMapPin className="mr-1" /> In: {options.startingCity}
            </span>
          )}
          {options && options.endingCity && (
            <span className="trip-info-badge ending-city">
              <FiMapPin className="mr-1" /> Out: {options.endingCity}
            </span>
          )}
          {options && options.duration && (
            <span className="trip-info-badge duration">
              <FiClock className="mr-1" /> {options.duration}일
            </span>
          )}
          {options && options.travelStyle && (
            <span className="trip-info-badge travel-style">
              <FiSun className="mr-1" /> {travelStyleMap[options.travelStyle] || options.travelStyle}
            </span>
          )}
          {options && options.groupType && (
            <span className="trip-info-badge group-type">
              <FiUsers className="mr-1" /> {groupTypeMap[options.groupType] || options.groupType}
            </span>
          )}
        </div>
      </div>

      {/* Map section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Day {activeDay} Map</h2>
          <SwissMap locations={mapLocations} />
        </div>
      </div>

      {/* Daily trip plan tabs */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {days.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-3 py-2 text-sm md:text-base rounded-t-lg transition-colors ${
                activeDay === day.day
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Selected day's trip plan */}
      {days.map((day) => {
        if (day.day !== activeDay) return null;

        return (
          <div key={day.day} >
            <div className="border rounded-lg overflow-hidden mb-6">
              {/* Day title */}
              <div className="bg-blue-50 p-4 border-b">
                <h2 className="text-xl font-semibold text-blue-800">{day.title}</h2>
                <p className="text-gray-600 mt-1">{day.description}</p>
              </div>

              {/* Activity list */}
              <div className="divide-y">
                {day.activities.map((activity, index) => (
                  <div key={index} className="p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="activity-number">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          {activity.location && (
                            <div className="text-sm text-gray-600 flex items-center mt-1">
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
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <FiDollarSign className="mr-2 text-gray-600" />
                              <span>CHF {activity.price}</span>
                            </div>
                          )}
                          {/* Transportation information */}
                          {activity.transportation && (
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <TransportIcon type={activity.transportation} />
                              {activity.transportation}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-gray-500 text-sm whitespace-nowrap mr-3">
                          {activity.duration}
                        </div>
                        {/* Delete button */}
                        <button 
                          onClick={() => handleDeleteClick(days.findIndex(d => d.day === activeDay), index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete activity"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-gray-600 text-sm pl-20">
                      {activity.description}
                    </div>
                  </div>
                ))}
                
                {/* Add activity button */}
                <div className="p-4 bg-white">
                  <button 
                    onClick={handleAddActivity}
                    className="w-full py-3 flex items-center justify-center text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    일정 추가하기
                  </button>
                </div>
              </div>
              
              {/* Accommodation information */}
              {day.accommodation && (
                <div className="bg-blue-50 p-4 border-t flex items-center relative">
                  <FiHome className="mr-2 text-blue-700" />
                  <span className="font-medium text-blue-800">숙박:</span>
                  <span className="ml-2 text-blue-700 flex items-center accommodation-edit-btn">
                    {day.accommodation}
                  </span>
                </div>
              )}
            </div>
            
            {/* Travel tips for the day */}
            {day.recommendations && (
              <div className="mt-4 mb-6">
                <div className="rounded-lg overflow-hidden border border-amber-200">
                  <div className="w-full flex items-center bg-amber-50 p-4 text-amber-800 font-medium border-b border-amber-200">
                    <FiInfo className="mr-2" />
                    여행 팁 및 추천
                  </div>
                  
                  <div className="p-4 bg-amber-50 text-gray-700">
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
        onClose={() => setIsModalOpen(false)}
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
      {transportationDetails && budgetBreakdown && (
        <TransportationCost 
          transportationDetails={transportationDetails} 
          budgetBreakdown={budgetBreakdown} 
        />
      )}
    </div>
  );
}
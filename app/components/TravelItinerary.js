// app/components/TravelItinerary.js
'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiMapPin, FiExternalLink, FiInfo, FiChevronDown, 
         FiChevronUp, FiCoffee, FiStar, FiShare2, FiCalendar, 
         FiDollarSign, FiHome, FiBriefcase } from 'react-icons/fi';
import { GiKnifeFork, GiMountainRoad } from "react-icons/gi";
import { FaTrain } from "react-icons/fa";

const TravelItinerary = ({ travelPlan = {} }) => {
  const [expandedDays, setExpandedDays] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Default data in case travelPlan is not provided
  const {
    title = 'Swiss Adventure',
    description = 'Discover the beautiful landscapes and culture of Switzerland.',
    totalDuration = '7',
    startingCity = 'Zurich',
    travelStyle = 'balanced',
    budget = 'medium',
    days = [],
    locations = [],
    recommendations = '',
    budgetBreakdown = {},
    transportationDetails = {},
  } = travelPlan;
  
  // Toggle expanded state for days
  const toggleDayExpanded = (dayIndex) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIndex]: !prev[dayIndex]
    }));
  };
  
  // Toggle expanded state for activities
  const toggleActivityExpanded = (dayIndex, activityIndex) => {
    const key = `${dayIndex}-${activityIndex}`;
    setExpandedActivities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Expand all days
  const expandAllDays = () => {
    const allExpanded = {};
    days.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedDays(allExpanded);
  };
  
  // Collapse all days
  const collapseAllDays = () => {
    setExpandedDays({});
  };
  
  // Handle share button click
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `${title} - ${description}`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      setShowShareModal(true);
    }
  };
  
  // Get icon for meal type
  const getMealIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <FiCoffee className="text-orange-500" />;
      case 'lunch':
      case 'dinner':
        return <GiKnifeFork className="text-red-500" />;
      default:
        return <GiKnifeFork className="text-gray-500" />;
    }
  };
  
  // Get icon for transportation type
  const getTransportIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'train':
        return <FaTrain className="text-red-600" />;
      case 'bus':
        return <FiBriefcase className="text-blue-600" />;
      case 'cable car':
        return <GiMountainRoad className="text-orange-600" />;
      default:
        return <FiMapPin className="text-gray-600" />;
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${isMobile ? 'p-3' : 'p-6'}`}>
      {/* Itinerary Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <FiMapPin className="mr-1" /> {startingCity}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <FiCalendar className="mr-1" /> {totalDuration} days
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <FiClock className="mr-1" /> {travelStyle}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <FiDollarSign className="mr-1" /> {budget} budget
          </span>
        </div>
        
        <div className="mt-4 text-gray-600">{description}</div>
      </div>
      
      {/* Day-by-Day Itinerary */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold">Day-by-Day Itinerary</h3>
          <div className="flex gap-2">
            <button 
              onClick={expandAllDays} 
              className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 hover:underline`}
            >
              Expand All
            </button>
            <span style={{ color: '#D1D5DB' }}>|</span>
            <button 
              onClick={collapseAllDays} 
              className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 hover:underline`}
            >
              Collapse All
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {days.map((day, dayIndex) => {
            const isDayExpanded = expandedDays[dayIndex] || false;
            
            return (
              <div 
                key={dayIndex} 
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Day header - always visible */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleDayExpanded(dayIndex)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                      {day.day}
                    </div>
                    <div>
                      <h4 className="font-semibold">{day.title}</h4>
                      {day.accommodation && (
                        <div className="text-sm text-gray-600 flex items-center">
                          <FiHome className="mr-1" /> 
                          Stay: {day.accommodation}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isDayExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>
                
                {/* Day details - visible when expanded */}
                {isDayExpanded && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm mb-4">{day.description}</p>
                    
                    {/* Activities */}
                    {day.activities && day.activities.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 text-gray-700">Activities</h5>
                        <div className="space-y-3">
                          {day.activities.map((activity, activityIndex) => {
                            const activityKey = `${dayIndex}-${activityIndex}`;
                            const isActivityExpanded = expandedActivities[activityKey] || false;
                            
                            return (
                              <div 
                                key={activityIndex} 
                                className="bg-white p-3 rounded border border-gray-200"
                              >
                                <div 
                                  className="flex justify-between items-start cursor-pointer"
                                  onClick={() => toggleActivityExpanded(dayIndex, activityIndex)}
                                >
                                  <div>
                                    <div className="font-medium">{activity.time} - {activity.title}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      Duration: {activity.duration} min
                                    </div>
                                  </div>
                                  <div>
                                    {isActivityExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                  </div>
                                </div>
                                
                                {isActivityExpanded && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                    {activity.location && (
                                      <div className="text-sm text-gray-600 mt-2 flex items-center">
                                        <FiMapPin className="mr-1" /> {activity.location}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Meals */}
                    {day.meals && day.meals.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 text-gray-700">Meals</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {day.meals.map((meal, mealIndex) => (
                            <div 
                              key={mealIndex} 
                              className="bg-white p-3 rounded border border-gray-200"
                            >
                              <div className="flex items-center font-medium mb-1">
                                {getMealIcon(meal.type)}
                                <span className="ml-1 capitalize">{meal.type}</span>
                              </div>
                              <p className="text-sm text-gray-600">{meal.suggestion}</p>
                              {meal.location && (
                                <div className="text-sm text-gray-600 mt-1 flex items-center">
                                  <FiMapPin className="mr-1" /> {meal.location}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Transportation */}
                    {day.transportation && day.transportation.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 text-gray-700">Transportation</h5>
                        <div className="space-y-2">
                          {day.transportation.map((transport, transportIndex) => (
                            <div 
                              key={transportIndex} 
                              className="bg-white p-3 rounded border border-gray-200 flex items-start"
                            >
                              <div className="mr-2 mt-1">
                                {getTransportIcon(transport.type)}
                              </div>
                              <div>
                                <div className="font-medium capitalize">
                                  {transport.type}: {transport.from} → {transport.to}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Duration: {transport.duration} min
                                </div>
                                {transport.details && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {transport.details}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Budget Breakdown */}
      {budgetBreakdown && Object.keys(budgetBreakdown).length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Budget Breakdown</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetBreakdown.accommodation && (
                <div className="flex items-start">
                  <FiHome className="text-blue-500 mr-2 mt-1" />
                  <div>
                    <div className="font-medium">Accommodation</div>
                    <div className="text-gray-600">{budgetBreakdown.accommodation}</div>
                  </div>
                </div>
              )}
              
              {budgetBreakdown.transportation && (
                <div>
                <div className="flex items-start">
                  <FaTrain className="text-blue-500 mr-2 mt-1" />
                  <div>
                    <div className="font-medium">Transportation</div>
                    <div className="text-gray-600">{budgetBreakdown.transportation}</div>
                  </div>
                </div>

                </div>
              )}

              
              
              {budgetBreakdown.food && (
                <div className="flex items-start">
                  <GiKnifeFork className="text-blue-500 mr-2 mt-1" />
                  <div>
                    <div className="font-medium">Food</div>
                    <div className="text-gray-600">{budgetBreakdown.food}</div>
                  </div>
                </div>
              )}
              
              {budgetBreakdown.activities && (
                <div className="flex items-start">
                  <FiStar className="text-blue-500 mr-2 mt-1" />
                  <div>
                    <div className="font-medium">Activities</div>
                    <div className="text-gray-600">{budgetBreakdown.activities}</div>
                  </div>
                </div>
              )}
            </div>
            
            {budgetBreakdown.total && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-start">
                <FiDollarSign className="text-green-600 mr-2 mt-1" />
                <div>
                  <div className="font-medium">Total Estimated Budget</div>
                  <div className="text-gray-600">{budgetBreakdown.total}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Recommendations section */}
      {recommendations && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Travel Tips & Recommendations</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start">
              <FiStar className="text-yellow-500 mr-2 mt-1" />
              <p className="text-gray-600">{recommendations}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <a href="/" className="btn btn-outline text-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50">
            Plan a New Trip
        </a>
        <button
            onClick={() => window.print()}
            className="btn btn-secondary text-center py-2 px-4 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
        >
            Print Itinerary
        </button>
        <button
            onClick={handleShare}
            className="btn btn-primary text-center flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
            <FiShare2 className="mr-2" /> Share
        </button>
      </div>

      {/* Share modal (fallback for browsers without navigator.share) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Share Your Travel Plan</h3>
            <p className="mb-4">Copy the link below to share your itinerary:</p>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 p-2 border border-gray-300 rounded-l"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-r"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelItinerary;
'use client';

import { useState } from 'react';
import { FiSave, FiEdit, FiTrash2, FiClock } from 'react-icons/fi';
import ActivityModal from './ActivityModal';

// DaySection component (daily travel schedule with editing capabilities)
const DaySection = ({ 
  day, 
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
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [editTitle, setEditTitle] = useState(day.title || '');
  const [editDescription, setEditDescription] = useState(day.description || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Activity editing states
  const [isEditingActivity, setIsEditingActivity] = useState(null); // null or activity index or 'recommendations'
  const [editActivityData, setEditActivityData] = useState({});
  
  // Start editing day
  const handleStartEditDay = (e) => {
    e.stopPropagation(); // Prevent click event from propagating to parent elements
    setIsEditingDay(true);
    setEditTitle(day.title || '');
    setEditDescription(day.description || '');
    
    // Track day edit start event
    trackEvent('start_edit_day', 'engagement', `일자 수정 시작 (Day ${day.day})`);
  };
  
  // Cancel day editing
  const handleCancelEditDay = (e) => {
    if (e) e.stopPropagation();
    setIsEditingDay(false);
    
    // Track day edit cancel event
    trackEvent('cancel_edit_day', 'engagement', `일자 수정 취소 (Day ${day.day})`);
  };
  
  // Save day edits
  const handleSaveDay = (e) => {
    if (e) e.stopPropagation();
    
    // Don't save if there are no changes
    if (editTitle === day.title && editDescription === day.description) {
      setIsEditingDay(false);
      return;
    }
    
    // Update day information
    onUpdateDay(day.day, {
      title: editTitle,
      description: editDescription
    });
    
    setIsEditingDay(false);
    
    // Track day edit save event
    trackEvent('save_edit_day', 'content_update', `일자 수정 저장 (Day ${day.day})`);
  };
  
  // Start activity editing
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
    
    // Track activity edit start event
    trackEvent('start_edit_activity', 'engagement', `활동 수정 시작 (Day ${day.day}, Activity ${index + 1})`);
  };
  
  // Cancel activity editing
  const handleCancelEditActivity = () => {
    setIsEditingActivity(null);
    setEditActivityData({});
    
    // Track activity edit cancel event
    trackEvent('cancel_edit_activity', 'engagement', `활동 수정 취소 (Day ${day.day})`);
  };
  
  // Save activity edits
  const handleSaveActivity = (index) => {
    // Updated activity data
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
    
    // Update activities array
    const updatedActivities = [...day.activities];
    updatedActivities[index] = updatedActivity;
    
    // Notify parent component of changes
    onUpdateDay(day.day, {
      activities: updatedActivities
    });
    
    // Exit edit mode
    setIsEditingActivity(null);
    setEditActivityData({});
    
    // Track activity edit save event
    trackEvent('save_edit_activity', 'content_update', `활동 수정 저장 (Day ${day.day}, Activity ${index + 1})`);
  };
  
  // Start travel tips editing
  const handleStartEditRecommendations = (e) => {
    if (e) e.stopPropagation();
    setIsEditingActivity('recommendations');
    setEditActivityData({
      recommendations: day.recommendations || ''
    });
    
    // Track recommendations edit start event
    trackEvent('start_edit_recommendations', 'engagement', `여행 팁 수정 시작 (Day ${day.day})`);
  };
  
  // Cancel travel tips editing
  const handleCancelEditRecommendations = () => {
    setIsEditingActivity(null);
    setEditActivityData({});
    
    // Track recommendations edit cancel event
    trackEvent('cancel_edit_recommendations', 'engagement', `여행 팁 수정 취소 (Day ${day.day})`);
  };
  
  // Save travel tips edits
  const handleSaveRecommendations = () => {
    // Don't save if there are no changes
    if (editActivityData.recommendations === day.recommendations) {
      setIsEditingActivity(null);
      setEditActivityData({});
      return;
    }
    
    // Notify parent component of changes
    onUpdateDay(day.day, {
      recommendations: editActivityData.recommendations
    });
    
    // Exit edit mode
    setIsEditingActivity(null);
    setEditActivityData({});
    
    // Track recommendations edit save event
    trackEvent('save_edit_recommendations', 'content_update', `여행 팁 수정 저장 (Day ${day.day})`);
  };
  
  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    
    // Track modal close event
    trackEvent('close_modal', 'engagement', '활동 추가 모달 닫기');
  };
  
  // Add activity button click handler
  const handleAddActivity = () => {
    setIsModalOpen(true);
    
    // Track add activity modal open event
    trackEvent('open_modal', 'engagement', `활동 추가 모달 열기 (Day ${day.day})`);
  };
  
  // Get current location information
  const getCurrentLocations = () => {
    const baseLocation = day.In ? day.In : "";
    const endLocation = day.Out ? day.Out : "";
    
    return { baseLocation, endLocation };
  };
  
  const { baseLocation, endLocation } = getCurrentLocations();

  return (
    <div className="mb-8">
      {/* Day header - always visible */}
      <div className="bg-white p-4 flex justify-between items-center">
        {isEditingDay ? (
          <div className="flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-2">
              <span className="inline-flex items-center justify-center bg-black text-white rounded-full w-8 h-8 mr-2">
                {day.day}
              </span>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 px-2 py-1 text-xl font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                style={{ fontFamily: 'Nanum Gothic' }}
              />
            </div>
            <div className="pl-10">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                style={{ fontFamily: 'Nanum Gothic' }}
                rows="2"
              ></textarea>
            </div>
            <div className="pl-10 mt-2 flex space-x-2">
              <button
                onClick={handleSaveDay}
                className="px-3 py-1 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center text-sm"
                style={{ fontFamily: 'Nanum Gothic' }}
              >
                <FiSave className="mr-1" /> 저장
              </button>
              <button
                onClick={handleCancelEditDay}
                className="px-3 py-1 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-colors flex items-center text-sm"
                style={{ fontFamily: 'Nanum Gothic' }}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center">
                <br></br>
                <br></br>
              <h2 className="text-xl font-semibold text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>
                <span className="text-blue-500 font-bold mr-2" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px' }}>
                  {day.day} 일차 &gt;
                </span>
                {day.title}
              </h2>
              {isOwner && (
                <button
                  onClick={handleStartEditDay}
                  className="ml-2 p-1 text-black hover:bg-gray-100 rounded-full transition-colors"
                  title="일자 수정"
                >
                  <FiEdit size={14} />
                </button>
              )}
            </div>
            <p className="text-black mt-1 pl-10" style={{ fontFamily: 'Nanum Gothic', fontSize: '16px', fontWeight: 'normal' }}>{day.description}</p>
            <br></br>
          </div>
        )}
      </div>

      {/* Content - always visible */}
      <div>
        {/* Activities list */}
        <div >
          {day.activities.map((activity, index) => (
            <div key={index} className="p-5">
              {isEditingActivity === index ? (
                // Activity edit form
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="flex items-center justify-center rounded-full bg-black text-white w-8 h-8 mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editActivityData.title}
                        onChange={(e) => setEditActivityData({...editActivityData, title: e.target.value})}
                        placeholder="활동 제목"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        style={{ fontFamily: 'Nanum Gothic' }}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={editActivityData.location}
                            onChange={(e) => setEditActivityData({...editActivityData, location: e.target.value})}
                            placeholder="위치"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                            style={{ fontFamily: 'Nanum Gothic' }}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={editActivityData.price}
                            onChange={(e) => {
                              // Only allow numbers and decimal point
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              setEditActivityData({...editActivityData, price: value});
                            }}
                            placeholder="가격 (CHF)"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                            style={{ fontFamily: 'Nanum Gothic' }}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <select
                            value={editActivityData.transportation}
                            onChange={(e) => setEditActivityData({...editActivityData, transportation: e.target.value})}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                            style={{ fontFamily: 'Nanum Gothic' }}
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
                          <input
                            type="text"
                            value={editActivityData.duration}
                            onChange={(e) => setEditActivityData({...editActivityData, duration: e.target.value})}
                            placeholder="소요 시간 (예: 2시간)"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                            style={{ fontFamily: 'Nanum Gothic' }}
                          />
                        </div>
                      </div>
                      
                      <textarea
                        value={editActivityData.description}
                        onChange={(e) => setEditActivityData({...editActivityData, description: e.target.value})}
                        placeholder="활동 설명"
                        rows="3"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        style={{ fontFamily: 'Nanum Gothic' }}
                      ></textarea>
                      
                      <input
                        type="text"
                        value={editActivityData.url}
                        onChange={(e) => setEditActivityData({...editActivityData, url: e.target.value})}
                        placeholder="관련 URL (선택사항)"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        style={{ fontFamily: 'Nanum Gothic' }}
                      />
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveActivity(index)}
                          className="px-3 py-1 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center text-sm"
                          style={{ fontFamily: 'Nanum Gothic' }}
                        >
                          <FiSave className="mr-1" /> 저장
                        </button>
                        <button
                          onClick={handleCancelEditActivity}
                          className="px-3 py-1 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-colors flex items-center text-sm"
                          style={{ fontFamily: 'Nanum Gothic' }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Activity information display
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-lg text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '22px', fontWeight: 'bold' }}>
                          <span className="text-red-500 font-bold mr-3 flex-shrink-0" style={{ fontFamily: 'Nanum Gothic' }}>
                            {index + 1}.
                        </span>
                            {activity.title}
                            </h3>
                          
                          {isOwner && (
                            <button
                              onClick={() => handleStartEditActivity(index)}
                              className="ml-2 p-1 text-black"
                              title="활동 수정"
                            >
                              <FiEdit size={14} />
                            </button>
                          )}
                        </div>
                        
                        {activity.location && (
                          <div className="text-sm text-black flex items-center mt-1" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>
                            📍&nbsp;
                            {activity.location}
                          </div>
                        )}
                        
                        {/* Price information */}
                        {activity.price && (
                          <div className="text-sm text-black flex items-center mt-1" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>
                            💶&nbsp;
                            <span>CHF {activity.price}</span>
                          </div>
                        )}
                        
                        {/* Transportation information */}
                        {activity.transportation && (
                          <div className="text-sm text-black flex items-center mt-1" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>
                            {activity.transportation === 'Train' && '🚅 '}
                            {activity.transportation === 'CableCar' && '🚠 '}
                            {activity.transportation === 'Funicular' && '🚞 '}
                            {activity.transportation === 'Ferry' && '🚢 '}
                            {activity.transportation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="text-black text-sm whitespace-nowrap mr-3" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>
                        ⏰ {activity.duration}
                      </div>
                      
                      {/* Delete button - only show if owner */}
                      {isOwner && (
                        <button 
                          onClick={() => onDeleteActivity(day.day, index)}
                          className="text-black hover:text-gray-700 transition-colors"
                          title="Delete activity"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-black pl-11" style={{ fontFamily: 'Nanum Gothic', fontSize: '16px', fontWeight: 'normal' }}>
                    {activity.description}
                  </div>
                  
                  {/* Optional URL link */}
                  {activity.url && (
                    <div className="mt-2 pl-11">
                      <a 
                        href={activity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black text-sm hover:underline flex items-center w-fit"
                        style={{ fontFamily: 'Nanum Gothic' }}
                      >
                        {activity.url}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                  <br ></br>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Travel tips for the day */}
        {day.recommendations && (
          isOwner && isEditingActivity === 'recommendations' ? (
            // Travel tips edit mode
            <div className="p-4 bg-white border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start">
                <svg className="h-5 w-5 text-black mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '22px', fontWeight: 'bold' }}>여행 팁 및 추천</h3>
                  </div>
                  <textarea
                    value={editActivityData.recommendations}
                    onChange={(e) => setEditActivityData({...editActivityData, recommendations: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                    style={{ fontFamily: 'Nanum Gothic' }}
                    rows="6"
                    placeholder="여행 팁이나 추천 정보를 입력하세요."
                  ></textarea>
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={handleSaveRecommendations}
                      className="px-3 py-1 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center text-sm"
                      style={{ fontFamily: 'Nanum Gothic' }}
                    >
                      <FiSave className="mr-1" /> 저장
                    </button>
                    <button
                      onClick={handleCancelEditRecommendations}
                      className="px-3 py-1 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-colors flex items-center text-sm"
                      style={{ fontFamily: 'Nanum Gothic' }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Travel tips view mode
            <div className="p-4">
              <div className="flex items-start">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '22px', fontWeight: 'bold' }}>⭐️ 여행 팁 및 추천</h3>
                    {isOwner && (
                      <button
                        onClick={handleStartEditRecommendations}
                        className="ml-2 p-1 text-black hover:bg-gray-100 rounded-full transition-colors"
                        title="여행 팁 수정"
                      >
                        <FiEdit size={14} />
                      </button>
                    )}
                  </div>
                  {day.recommendations.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-black mt-1" style={{ fontFamily: 'Nanum Gothic', fontSize: '16px', fontWeight: 'normal' }}>
                      {paragraph}
                    </p>
                  ))}
                  <br ></br>
                </div>
              </div>
            </div>
          )
        )}
        
        {/* Accommodation information */}
        {day.accommodation && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-black mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <h3 className="font-medium text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '22px', fontWeight: 'bold' }}>숙소 정보</h3>
                <p className="text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>{day.accommodation}</p>
                {day.accommodationDetail && (
                  <p className="text-sm text-black mt-1" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>{day.accommodationDetail}</p>
                )}
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default DaySection;
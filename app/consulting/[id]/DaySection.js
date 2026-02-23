// DaySection.js
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FiEdit, FiSave, FiChevronUp, FiChevronDown, FiPlus, FiMapPin, FiDollarSign, FiClock, FiInfo, FiTrash2 } from 'react-icons/fi';
import { FaShip, FaMountain, FaTram, FaTrain } from 'react-icons/fa'; // For TransportationIcon

// External component props (placeholders, actual components passed as props)
// import SwissMap from './../../components/SwissMap'; // Actual import path would vary
// import ActivityModal from './../../components/ActivityModal'; // Actual import path would vary
// import AccommodationEdit from './../../components/AccommodationEdit'; // Actual import path would vary
// import { cityToStation } from './../../../utils/cityToStation'; // Actual import path would vary
// import locationData from './../../../utils/locationData'; // Actual import path would vary

// --- DaySection SUB-COMPONENTS ---

const DayHeaderEditable = ({ dayNumber, title, description, isOwner, onUpdateDayHeader, onToggleExpand, isExpanded, trackEvent, onEditingStatusChange, itemKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title || '');
  const [editDescription, setEditDescription] = useState(description || '');

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(title || '');
      setEditDescription(description || '');
    }
  }, [title, description, isEditing]);

  useEffect(() => {
    onEditingStatusChange(itemKey, isEditing);
    return () => onEditingStatusChange(itemKey, false); // Cleanup on unmount or key change
  }, [isEditing, itemKey, onEditingStatusChange]);


  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(title || '');
    setEditDescription(description || '');
    trackEvent('start_edit_day', 'engagement', `일자 수정 시작 (Day ${dayNumber})`);
  };

  const handleCancelEdit = (e) => {
    if (e) e.stopPropagation();
    setIsEditing(false);
    trackEvent('cancel_edit_day', 'engagement', `일자 수정 취소 (Day ${dayNumber})`);
  };

  const handleSave = (e) => {
    if (e) e.stopPropagation();
    if (editTitle === title && editDescription === description) {
      setIsEditing(false);
      return;
    }
    onUpdateDayHeader({ title: editTitle, description: editDescription });
    setIsEditing(false);
    trackEvent('save_edit_day', 'content_update', `일자 수정 저장 (Day ${dayNumber})`);
  };
  
  const handleHeaderClick = () => {
    if (!isEditing) {
      onToggleExpand();
    }
  };

  return (
    <div
      className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 border-b flex justify-between items-center cursor-pointer"
      onClick={handleHeaderClick}
    >
      {isEditing ? (
        <div className="flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center mb-2">
            <span className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-700 text-white rounded-full w-8 h-8 mr-2">
              {dayNumber}
            </span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 px-2 py-1 text-xl font-semibold border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-blue-800 dark:text-blue-200"
              autoFocus
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
            <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm">
              <FiSave className="mr-1" /> 저장
            </button>
            <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center text-sm">
              취소
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              <span className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-700 text-white rounded-full w-8 h-8 mr-2">
                {dayNumber}
              </span>
              {title}
            </h2>
            {isOwner && (
              <button onClick={handleStartEdit} className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors" title="일자 수정">
                <FiEdit size={14} />
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1 pl-10">{description}</p>
        </div>
      )}
      {!isEditing && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
          className="text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 p-2 rounded-full"
        >
          {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
        </button>
      )}
    </div>
  );
};

const TransportationIcon = ({ type }) => {
  const className = "mr-1 text-blue-600 dark:text-blue-400";
  if (type === 'Train') return <FaTrain className={className} />;
  if (type === 'CableCar') return <FaTram className={className} />; // Using FaTram as example, adjust if specific icon exists
  if (type === 'Funicular') return <FaMountain className={className} />;
  if (type === 'Ferry') return <FaShip className={className} />;
  // Add FaBus if you have it, or a generic icon
  return null; 
};

const ActivityForm = ({ activity, index, onSave, onCancel }) => {
  const [editData, setEditData] = useState({
    title: activity.title || '',
    location: activity.location || '',
    price: activity.price || '',
    transportation: activity.transportation || '',
    description: activity.description || '',
    duration: activity.duration || '',
    url: activity.url || ''
  });

  const handleChange = (field, value) => {
    let processedValue = value;
    if (field === 'price') {
      processedValue = value.replace(/[^0-9.]/g, ''); // Allow only numbers and dot
    }
    setEditData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleSaveClick = () => {
    const priceAsFloatOrString = editData.price !== '' 
      ? (isNaN(parseFloat(editData.price)) ? editData.price : parseFloat(editData.price))
      : '';
    onSave({ ...editData, price: priceAsFloatOrString });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start">
        <div className="flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white w-8 h-8 mr-3 flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 space-y-2">
          <input type="text" value={editData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="활동 제목" className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" autoFocus/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center">
              <FiMapPin className="mr-1" size={14} />
              <input type="text" value={editData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="위치" className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex items-center">
              <FiDollarSign className="mr-1" size={14} />
              <input type="text" value={editData.price} onChange={(e) => handleChange('price', e.target.value)} placeholder="가격 (CHF)" className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex items-center">
              <select value={editData.transportation} onChange={(e) => handleChange('transportation', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <option value="">교통 수단 선택</option> <option value="Train">Train</option> <option value="CableCar">CableCar</option> <option value="Funicular">Funicular</option> <option value="Ferry">Ferry</option> <option value="Bus">Bus</option> <option value="Walk">Walk</option>
              </select>
            </div>
            <div className="flex items-center">
              <FiClock className="mr-1" size={14} />
              <input type="text" value={editData.duration} onChange={(e) => handleChange('duration', e.target.value)} placeholder="소요 시간 (예: 2시간)" className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <textarea value={editData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="활동 설명" rows="3" className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"></textarea>
          <input type="text" value={editData.url} onChange={(e) => handleChange('url', e.target.value)} placeholder="관련 URL (선택사항)" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300" />
          <div className="flex space-x-2">
            <button onClick={handleSaveClick} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"><FiSave className="mr-1" /> 저장</button>
            <button onClick={onCancel} className="px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center text-sm">취소</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityView = ({ activity, index, onStartEdit, onDelete, isOwner }) => (
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
              <button onClick={onStartEdit} className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors" title="활동 수정">
                <FiEdit size={14} />
              </button>
            )}
          </div>
          {activity.location && <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1"><FiMapPin className="mr-1" size={14} />{activity.location}</div>}
          {activity.price && <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1"><FiDollarSign className="mr-1" />CHF {activity.price}</div>}
          {activity.transportation && <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1"><TransportationIcon type={activity.transportation} />{activity.transportation}</div>}
        </div>
      </div>
      <div className="flex items-start">
        <div className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap mr-3">{activity.duration}</div>
        {isOwner && <button onClick={onDelete} className="text-red-500 hover:text-red-700 transition-colors" title="Delete activity"><FiTrash2 size={16} /></button>}
      </div>
    </div>
    <div className="mt-3 text-gray-600 dark:text-gray-300 pl-11">{activity.description}</div>
    {activity.url && (
      <div className="mt-2 pl-11">
        <a href={activity.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center w-fit">
          자세히 보기 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>
    )}
  </div>
);

const ActivityItem = ({ activity, index, dayNumber, isOwner, onDeleteActivity, onUpdateActivity, trackEvent, onEditingStatusChange, itemKey }) => {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    onEditingStatusChange(itemKey, isEditing);
    return () => onEditingStatusChange(itemKey, false); // Cleanup
  }, [isEditing, itemKey, onEditingStatusChange]);

  const handleStartEdit = () => {
    setIsEditing(true);
    trackEvent('start_edit_activity', 'engagement', `활동 수정 시작 (Day ${dayNumber}, Activity ${index + 1})`);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    trackEvent('cancel_edit_activity', 'engagement', `활동 수정 취소 (Day ${dayNumber})`);
  };

  const handleSave = (updatedData) => {
    onUpdateActivity(index, updatedData);
    setIsEditing(false);
    trackEvent('save_edit_activity', 'content_update', `활동 수정 저장 (Day ${dayNumber}, Activity ${index + 1})`);
  };

  const handleDelete = () => onDeleteActivity(dayNumber, index);

  return (
    <div className="p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      {isEditing ? (
        <ActivityForm activity={activity} index={index} onSave={handleSave} onCancel={handleCancelEdit} />
      ) : (
        <ActivityView activity={activity} index={index} onStartEdit={handleStartEdit} onDelete={handleDelete} isOwner={isOwner} />
      )}
    </div>
  );
};

const RecommendationsEditable = ({ recommendations, isOwner, dayNumber, onUpdateRecommendations, trackEvent, onEditingStatusChange, itemKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(recommendations || '');

  useEffect(() => {
    if (!isEditing) setEditText(recommendations || '');
  }, [recommendations, isEditing]);

  useEffect(() => {
    onEditingStatusChange(itemKey, isEditing);
    return () => onEditingStatusChange(itemKey, false); // Cleanup
  }, [isEditing, itemKey, onEditingStatusChange]);

  const handleStartEdit = (e) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    trackEvent('start_edit_recommendations', 'engagement', `여행 팁 수정 시작 (Day ${dayNumber})`);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    trackEvent('cancel_edit_recommendations', 'engagement', `여행 팁 수정 취소 (Day ${dayNumber})`);
  };

  const handleSave = () => {
    if (editText === recommendations) {
      setIsEditing(false);
      return;
    }
    onUpdateRecommendations(editText);
    setIsEditing(false);
    trackEvent('save_edit_recommendations', 'content_update', `여행 팁 수정 저장 (Day ${dayNumber})`);
  };

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950 border-t border-amber-100 dark:border-amber-900" onClick={isEditing ? (e) => e.stopPropagation() : undefined}>
      <div className="flex items-start">
        <FiInfo className="h-5 w-5 text-amber-500 dark:text-amber-300 mr-2 mt-0.5 flex-shrink-0" />
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-amber-800 dark:text-amber-200">여행 팁 및 추천</h3>
            {isOwner && !isEditing && (
              <button onClick={handleStartEdit} className="ml-2 p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-full transition-colors" title="여행 팁 수정">
                <FiEdit size={14} />
              </button>
            )}
          </div>
          {isEditing ? (
            <>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full px-2 py-1 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300" rows="6" placeholder="여행 팁이나 추천 정보를 입력하세요."></textarea>
              <div className="flex justify-end mt-2 space-x-2">
                <button onClick={handleSave} className="px-3 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex items-center text-sm"><FiSave className="mr-1" /> 저장</button>
                <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center text-sm">취소</button>
              </div>
            </>
          ) : (
            (recommendations || '').split('\n').map((paragraph, idx) => (
              <p key={idx} className="text-amber-700 dark:text-amber-300 mt-1">{paragraph}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main DaySection COMPONENT ---
const DaySection = ({
    day,
    generateLocationsFromActivities,
    onAddActivity,
    onDeleteActivity,
    isOwner,
    localTravelPlan, // For AccommodationEdit context
    onUpdateAccommodation, // For AccommodationEdit
    onUpdateDay, // Callback to ConsultingPage to update the specific day's data
    trackEvent,
    onDeleteDay, // 새로운 prop 추가
    // Props for external components/utils that DaySection uses internally or passes down
    SwissMapComponent, // e.g. SwissMap
    ActivityModalComponent, // e.g. ActivityModal
    AccommodationEditComponent, // e.g. AccommodationEdit
    cityToStationUtil, // e.g. cityToStation
    locationDataUtil, // e.g. locationData
    isHighlighted = false,
    onDayClick,
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItemKeys, setEditingItemKeys] = useState(new Set());
    const dayRef = useRef(null);

    // Auto-scroll into view when highlighted
    useEffect(() => {
      if (isHighlighted && dayRef.current) {
        dayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, [isHighlighted]);

    const handleItemEditingStatusChange = useCallback((itemKey, isEditing) => {
      setEditingItemKeys(prev => {
        const newSet = new Set(prev);
        if (isEditing) newSet.add(itemKey);
        else newSet.delete(itemKey);
        return newSet;
      });
    }, []);
    
    const isAnyChildEditing = useMemo(() => editingItemKeys.size > 0, [editingItemKeys]);

    const toggleExpand = useCallback(() => {
      if (isAnyChildEditing) { 
          trackEvent('attempt_toggle_while_editing', 'engagement', `Day ${day.day} 토글 시도 (편집 중)`);
          return; 
      }
      setIsExpanded(prev => !prev);
      trackEvent(
        isExpanded ? 'collapse_day' : 'expand_day', 
        'engagement', 
        `Day ${day.day} ${isExpanded ? '접기' : '펼치기'}`
      );
    }, [isAnyChildEditing, isExpanded, day.day, trackEvent]);
    
    const handleCloseModal = useCallback(() => {
      setIsModalOpen(false);
      trackEvent('close_modal', 'engagement', '활동 추가 모달 닫기');
    }, [trackEvent]);
    
    const handleAddActivityClick = useCallback(() => {
      setIsModalOpen(true);
      trackEvent('open_modal', 'engagement', `활동 추가 모달 열기 (Day ${day.day})`);
    }, [day.day, trackEvent]);
    
    const { baseLocation, endLocation } = useMemo(() => ({
      baseLocation: cityToStationUtil ? cityToStationUtil(day.In) || "" : "",
      endLocation: cityToStationUtil ? cityToStationUtil(day.Out) || "" : ""
    }), [day.In, day.Out, cityToStationUtil]);

    const handleUpdateDayHeader = useCallback((headerUpdates) => {
        onUpdateDay(day.day, headerUpdates);
    }, [day.day, onUpdateDay]);

    const handleUpdateActivity = useCallback((activityIndex, updatedActivityData) => {
        const updatedActivities = [...day.activities];
        updatedActivities[activityIndex] = {
            ...day.activities[activityIndex], // Preserve existing fields not in form
            ...updatedActivityData
        };
        onUpdateDay(day.day, { activities: updatedActivities });
    }, [day.day, day.activities, onUpdateDay]);
    
    const handleUpdateRecommendations = useCallback((newRecommendations) => {
        onUpdateDay(day.day, { recommendations: newRecommendations });
    }, [day.day, onUpdateDay]);

    return (
      <div
        ref={dayRef}
        className={`mb-8 border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all day-card ${isHighlighted ? 'ring-2 ring-blue-500 border-blue-400 shadow-blue-200 dark:ring-yellow-400 dark:border-yellow-400 dark:shadow-yellow-900' : ''}`}
        onClick={() => onDayClick && onDayClick(day.day)}>
        <DayHeaderEditable
          dayNumber={day.day}
          title={day.title}
          description={day.description}
          isOwner={isOwner}
          onUpdateDayHeader={handleUpdateDayHeader}
          onToggleExpand={toggleExpand}
          isExpanded={isExpanded}
          trackEvent={trackEvent}
          onEditingStatusChange={handleItemEditingStatusChange}
          itemKey={`dayHeader-${day.day}`}
          onDeleteDay={onDeleteDay} // prop 전달
        />
  
        {isExpanded && (
          <div>
            {SwissMapComponent && (
              <div className="p-4 bg-white dark:bg-gray-900">
                <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-3">일정 지도</h3>
                <SwissMapComponent locations={generateLocationsFromActivities([day])} />
              </div>
            )}
  
            <div className="divide-y">
              {day.activities.map((activity, index) => (
                <ActivityItem
                  key={`activity-${day.day}-${index}-${activity.title}`} // More stable key
                  activity={activity}
                  index={index}
                  dayNumber={day.day}
                  isOwner={isOwner}
                  onDeleteActivity={onDeleteActivity}
                  onUpdateActivity={handleUpdateActivity}
                  trackEvent={trackEvent}
                  onEditingStatusChange={handleItemEditingStatusChange}
                  itemKey={`activity-${day.day}-${index}`}
                />
              ))}
              
              {isOwner && (
                <div className="p-4 bg-white dark:bg-gray-900">
                  <button 
                    onClick={handleAddActivityClick}
                    className="w-full py-3 flex items-center justify-center text-blue-600 dark:text-blue-300 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    일정 추가하기
                  </button>
                </div>
              )}
            </div>
            
            {day.accommodation && AccommodationEditComponent && locationDataUtil && (
              isOwner ? (
                <AccommodationEditComponent
                  day={day}
                  activeDay={day.day}
                  travelPlan={localTravelPlan}
                  onUpdatePlan={onUpdateAccommodation}
                  travelPlanId={null} 
                  locationData={locationDataUtil}
                  setMapLocations={() => {}} // Placeholder, adjust if needed
                  generateLocationsFromActivities={generateLocationsFromActivities}
                />
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border-t border-yellow-100 dark:border-yellow-700">
                  <div className="flex items-start">
                    <FiInfo className="h-5 w-5 text-yellow-500 dark:text-yellow-300 mr-2 mt-0.5 flex-shrink-0" />
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
            
            {day.recommendations && (
                <RecommendationsEditable
                    recommendations={day.recommendations}
                    isOwner={isOwner}
                    dayNumber={day.day}
                    onUpdateRecommendations={handleUpdateRecommendations}
                    trackEvent={trackEvent}
                    onEditingStatusChange={handleItemEditingStatusChange}
                    itemKey={`recommendations-${day.day}`}
                />
            )}
            
            {ActivityModalComponent && (
                <ActivityModalComponent 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onAddActivity={(newActivity) => onAddActivity(day.day, newActivity)}
                    currentDay={day.day}
                    baseLocation={baseLocation}
                    endLocation={endLocation}
                />
            )}
          </div>
        )}
      </div>
    );
  };

export default DaySection;
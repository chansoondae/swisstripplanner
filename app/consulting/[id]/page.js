'use client';

import { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
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
import DaySection from './DaySection';
import ActivityModal from './../../components/ActivityModal';
import AccommodationEdit from './../../components/AccommodationEdit';
import { calculateTravelPlan } from './../../../utils/calculateTravelPlan';
import { cityToStation } from './../../../utils/cityToStation';
import locationData from './../../../utils/locationData';
import './../../../styles/consulting.css';
import TravelOptionEdit from './TravelOptionEdit';

// --- Helper Components (LoadingState, ErrorState, NotFoundState, ProcessingState, EditableTitleDescription) remain the same ---
// ... (These components are omitted for brevity but are assumed to be present and unchanged from the original)
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

// Processing state component (remains the same)
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
            
            <div className="mt-4 flex justify-center space-x-4">
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

// EditableTitleDescription (for main plan title/description, remains the same)
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
    const [editTitleValue, setEditTitleValue] = useState(title);
    const [editDescriptionValue, setEditDescriptionValue] = useState(description);
  
    useEffect(() => {
      if (isEditing) {
        setEditTitleValue(title);
        setEditDescriptionValue(description);
      }
    }, [isEditing, title, description]);
  
    const handleSave = () => {
        setTitle(editTitleValue);
        setDescription(editDescriptionValue);
        onSave(editTitleValue, editDescriptionValue);
      };
  
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
  
    return (
      <>
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-yellow-300 mb-2">{title}</h1>
          </div>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          </div>
        </div>
  
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div 
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">제목 및 설명 수정</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</label>
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                className="w-full px-3 py-2 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
              <textarea
                value={editDescriptionValue}
                onChange={(e) => setEditDescriptionValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                rows="4"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">취소</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"><FiSave className="mr-2" /> 저장</button>
            </div>
          </div>
        </div>
      </>
    );
  };


// --- REFACTORED DaySection SUB-COMPONENTS ---

const DayHeaderEditable = ({ dayNumber, title, description, isOwner, onUpdateDayHeader, onToggleExpand, isExpanded, trackEvent, onEditingStatusChange, itemKey, onDeleteDay }) => {
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

  // 삭제 핸들러 추가
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteDay(dayNumber);
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
          <div className="flex items-center ml-2">
                <button onClick={handleStartEdit} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors mr-1" title="일자 수정">
                  <FiEdit size={14} />
                </button>
                {onDeleteDay && (
                  <button 
                    onClick={handleDeleteClick} 
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors" 
                    title="일자 삭제"
                  >
                    <FiTrash2 size={14} />
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
  if (type === 'CableCar') return <FaTram className={className} />; // Using FaTram for CableCar as example
  if (type === 'Funicular') return <FaMountain className={className} />;
  if (type === 'Ferry') return <FaShip className={className} />;
  // Add FaBus if you have it, or a generic icon
  return null; 
};




const ActivityForm = ({ activity, onSave, onCancel }) => {
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
          {/* Index can be passed if needed, or just a generic icon */}
          <FiEdit size={16}/>
        </div>
        <div className="flex-1 space-y-2">
          <input type="text" value={editData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="활동 제목" className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
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
        <ActivityForm activity={activity} onSave={handleSave} onCancel={handleCancelEdit} />
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

  
// --- Utility functions (formatRelativeTime, generateLocationsFromActivities) remain the same ---
// ... (Omitted for brevity)
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}일 전`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}개월 전`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

const generateLocationsFromActivities = (days) => {
  if (!days || !Array.isArray(days)) return [];
  const locations = [];
  days.forEach((day, dayIndex) => {
    if (day.accommodation) {
      const coords = locationData.cityCoordinates[day.accommodation];
      if (coords) {
        locations.push({ id: `accommodation-${dayIndex}`, name: `${day.accommodation} (숙박)`, description: `Day ${day.day} 숙박`, type: 'hotel', lat: coords.lat, lng: coords.lng });
      }
    }
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity, actIndex) => {
        if (activity.lat && activity.lng) {
          locations.push({ id: `activity-${dayIndex}-${actIndex}`, name: `${actIndex + 1}. ${activity.title}`, description: activity.description, type: 'attraction', duration: activity.duration, lat: activity.lat, lng: activity.lng });
        } else if (activity.location) {
          const coords = locationData.cityCoordinates[activity.location];
          if (coords) {
            locations.push({ id: `activity-${dayIndex}-${actIndex}`, name: `${actIndex + 1}. ${activity.title}`, description: activity.description, type: 'attraction', duration: activity.duration, lat: coords.lat + (Math.random() * 0.01 - 0.005), lng: coords.lng + (Math.random() * 0.01 - 0.005) });
          }
        }
      });
    }
  });
  return locations;
};


// --- Constants (travelStyleMap, groupTypeMap) remain the same ---
// ... (Omitted for brevity)
const travelStyleMap = { 'nature': '자연 경관 위주', 'activity': '하이킹과 액티비티', 'balanced': '자연+도시 조화' };
const groupTypeMap = { 'solo': '나홀로', 'couple': '커플', 'family': '가족', 'friends': '친구', 'seniors': '시니어', 'MomDaughter': '엄마딸' };


// --- ConsultingPage (main component) ---
// This component remains largely the same, but its `handleUpdateDay` callback
// is now consumed by the refactored DaySection.
// No structural changes to ConsultingPage itself are made in this refactoring pass,
// focusing only on DaySection as requested.

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
    
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    
    useEffect(() => {
      if (planId) trackPageView(`여행 상담 상세: ${planId}`);
    }, [trackPageView, planId]);
    
    useEffect(() => {
      const checkIfMobile = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsMobile(/iphone|ipad|ipod|android/.test(userAgent) || window.innerWidth < 768);
      };
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      return () => window.removeEventListener('resize', checkIfMobile);
    }, []);
    
    useEffect(() => {
      if (plan) {
        setLocalTravelPlan(plan);
        setEditTitle(plan.title || '');
        setEditDescription(plan.description || '');
      }
    }, [plan]);
    
    const checkPlanStatus = (planData) => {
      if (!planData) return 'loading';
      if (planData.status) return planData.status;
      if (!planData.days || !Array.isArray(planData.days) || planData.days.length === 0) return 'processing';
      if (!planData.title || !planData.description) return 'processing';
      return 'completed';
    };
    
    const handleStartEditPlan = () => {
      setIsEditingPlan(true);
      trackEvent('start_edit_plan', 'engagement', '여행 계획 제목/설명 수정 시작');
    };
    
    const handleCancelEditPlan = () => {
      setIsEditingPlan(false);
      setEditTitle(localTravelPlan.title || '');
      setEditDescription(localTravelPlan.description || '');
      trackEvent('cancel_edit_plan', 'engagement', '여행 계획 제목/설명 수정 취소');
    };
    
    const handleSavePlan = (newTitle, newDescription) => {
      const titleToSave = newTitle !== undefined ? newTitle : editTitle;
      const descriptionToSave = newDescription !== undefined ? newDescription : editDescription;
      if (titleToSave === localTravelPlan.title && descriptionToSave === localTravelPlan.description) {
        setIsEditingPlan(false);
        return;
      }
      const updatedPlan = { ...localTravelPlan, title: titleToSave, description: descriptionToSave };
      setLocalTravelPlan(updatedPlan);
      setIsEditingPlan(false);
      setHasUnsavedChanges(true);
      trackEvent('save_edit_plan', 'content_update', '여행 계획 제목/설명 수정 저장');
    };
        
    // 일자 정보 업데이트 핸들러 (This is the key callback for DaySection)
    const handleUpdateDay = useCallback((dayNumber, updates) => {
      if (!isOwner || !localTravelPlan) return;
      
      setLocalTravelPlan(prevPlan => {
        const updatedPlan = { ...prevPlan };
        const dayIndex = updatedPlan.days.findIndex(d => d.day === dayNumber);
        
        if (dayIndex !== -1) {
          updatedPlan.days[dayIndex] = {
            ...updatedPlan.days[dayIndex],
            ...updates
          };
          
          // If activities changed, recalculate. Otherwise, just update day info.
          const recalculatedPlan = updates.activities 
            ? calculateTravelPlan(updatedPlan) 
            : updatedPlan;
          
          setHasUnsavedChanges(true);
          trackEvent('update_day_info', 'content_update', `일자 정보 업데이트 (Day ${dayNumber})`, { updated_fields: Object.keys(updates).join(',') });
          return recalculatedPlan;
        }
        return prevPlan; // Should not happen if dayNumber is valid
      });
    }, [isOwner, localTravelPlan, trackEvent]); // Added localTravelPlan to dependencies

    const handleAddDay = useCallback(() => {
        if (!isOwner || !localTravelPlan) return;
        
        // 현재 존재하는 가장 큰 dayNumber 찾기
        const maxDayNumber = Math.max(...localTravelPlan.days.map(d => d.day));
        const newDayNumber = maxDayNumber + 1;
        
        // 새 날짜 객체 생성
        const newDay = {
          day: newDayNumber,
          title: `${newDayNumber}일차`,
          description: '새로운 일정입니다.',
          activities: [],
          recommendations: '',
          accommodation: localTravelPlan.days[localTravelPlan.days.length - 1]?.accommodation || ''
        };
        
        // 기존 여행 계획에 새 날짜 추가
        const updatedPlan = {
          ...localTravelPlan,
          days: [...localTravelPlan.days, newDay]
        };
        
        // 여행 계획 재계산 (필요 시)
        const recalculatedPlan = calculateTravelPlan(updatedPlan);
        
        // 상태 업데이트
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
        trackEvent('add_day', 'content_update', `일자 추가 (Day ${newDayNumber})`);
      }, [isOwner, localTravelPlan, trackEvent]);

    const handleDeleteDay = useCallback((dayNumber) => {
        if (!isOwner || !localTravelPlan) return;
        
        // 여행에 최소 1일은 유지해야 함
        if (localTravelPlan.days.length <= 1) {
          alert("여행에는 최소 1일의 일정이 있어야 합니다.");
          return;
        }
        
        // 확인 메시지
        if (!window.confirm(`${dayNumber}일차를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
          return;
        }
        
        // 날짜 삭제
        const updatedDays = localTravelPlan.days.filter(d => d.day !== dayNumber);
        
        // 여행 계획 업데이트
        const updatedPlan = {
          ...localTravelPlan,
          days: updatedDays
        };
        
        // 여행 계획 재계산
        const recalculatedPlan = calculateTravelPlan(updatedPlan);
        
        // 상태 업데이트
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
        trackEvent('delete_day', 'content_update', `일자 삭제 (Day ${dayNumber})`);
      }, [isOwner, localTravelPlan, trackEvent]);
    
    const handleAddDayBeforeLast = useCallback(() => {
        if (!isOwner || !localTravelPlan) return;
        
        // 정렬된 날짜 배열 가져오기
        const sortedDays = [...localTravelPlan.days].sort((a, b) => a.day - b.day);
        
        // 날짜가 1일 또는 2일 뿐이라면 기본 추가 로직 사용
        if (sortedDays.length <= 2) {
          handleAddDay();
          return;
        }
        
        // 끝에서 두 번째 날짜 찾기
        const secondLastDay = sortedDays[sortedDays.length - 2];
        const lastDay = sortedDays[sortedDays.length - 1];
        
        // 새 day number 결정 (중간값) - 소수점 있을 수 있음
        const newDayNumber = (secondLastDay.day + lastDay.day) / 2;
        
        // 소수점이 있는 경우, 모든 날짜를 재정렬해야 할 수 있으나
        // 일단 간단히 정수로 반올림하여 구현
        const roundedDayNumber = Math.round(newDayNumber);
        
        // 이미 해당 번호의 날짜가 있다면, 다른 방법으로 번호 생성
        const dayExists = localTravelPlan.days.some(d => d.day === roundedDayNumber);
        const finalDayNumber = dayExists ? lastDay.day : roundedDayNumber;
        
        // 만약 기존 번호와 충돌한다면, 마지막 날짜의 번호를 증가시키고 새 날짜 번호를 사용
        if (dayExists) {
          // 업데이트된 날짜 배열 생성
          const updatedDays = localTravelPlan.days.map(d => {
            if (d.day === lastDay.day) {
              return { ...d, day: lastDay.day + 1 };
            }
            return d;
          });
          
          // 새 날짜 객체 생성 (끝에서 두 번째 날짜와 동일한 내용)
          const newDay = {
            day: lastDay.day, // 이전 마지막 날짜의 번호 사용
            title: `${lastDay.day}일차`, // 번호는 바뀔 수 있으므로 변수 사용
            description: secondLastDay.description || '새로운 일정입니다.',
            activities: [...(secondLastDay.activities || [])].map(activity => ({...activity})), // 깊은 복사
            recommendations: secondLastDay.recommendations || '',
            accommodation: secondLastDay.accommodation || ''
          };
          
          // 기존 여행 계획에 새 날짜 추가
          const updatedPlan = {
            ...localTravelPlan,
            days: [...updatedDays, newDay]
          };
          
          // 여행 계획 재계산
          const recalculatedPlan = calculateTravelPlan(updatedPlan);
          
          // 상태 업데이트
          setLocalTravelPlan(recalculatedPlan);
          setHasUnsavedChanges(true);
          trackEvent('add_day_before_last', 'content_update', `끝에서 2번째에 일자 추가 (Day ${newDay.day})`);
        } else {
          // 새 날짜 객체 생성 (끝에서 두 번째 날짜와 동일한 내용)
          const newDay = {
            day: finalDayNumber,
            title: `${finalDayNumber}일차`,
            description: secondLastDay.description || '새로운 일정입니다.',
            activities: [...(secondLastDay.activities || [])].map(activity => ({...activity})), // 깊은 복사
            recommendations: secondLastDay.recommendations || '',
            accommodation: secondLastDay.accommodation || ''
          };
          
          // 기존 여행 계획에 새 날짜 추가
          const updatedPlan = {
            ...localTravelPlan,
            days: [...localTravelPlan.days, newDay]
          };
          
          // 여행 계획 재계산
          const recalculatedPlan = calculateTravelPlan(updatedPlan);
          
          // 상태 업데이트
          setLocalTravelPlan(recalculatedPlan);
          setHasUnsavedChanges(true);
          trackEvent('add_day_before_last', 'content_update', `끝에서 2번째에 일자 추가 (Day ${newDay.day})`);
        }
      }, [isOwner, localTravelPlan, trackEvent, handleAddDay]);

    // Add this function to your ConsultingPage component
    const handleUpdateTravelOptions = async (updatedOptions) => {
        if (!isOwner || !localTravelPlan) return;
        
        // Update the local travel plan with new options
        setLocalTravelPlan(prevPlan => {
        const updatedPlan = { 
            ...prevPlan,
            options: {
            ...prevPlan.options,
            ...updatedOptions
            }
        };
        
        setHasUnsavedChanges(true);
        trackEvent('update_travel_options', 'content_update', '여행 옵션 업데이트', { 
            updated_fields: Object.keys(updatedOptions).join(',') 
        });
        
        return updatedPlan;
        });
    };


    const saveAsMine = async () => {
      // ... (saveAsMine logic remains the same)
      if (!user) { alert("로그인이 필요합니다."); return; }
      if (!plan) return;
      setIsSaving(true);
      try {
        const newPlanData = { ...plan, userId: user.uid, createdAt: new Date(), updatedAt: new Date(), copiedFrom: planId };
        const docRef = await addDoc(collection(db, 'travelPlans'), newPlanData);
        trackEvent('copy_to_own', 'conversion', `내 여행으로 저장: ${planId} -> ${docRef.id}`);
        setSaveSuccess(true);
        setTimeout(() => router.push(`/planner/${docRef.id}`), 1500);
      } catch (error) {
        console.error("저장 중 오류 발생:", error);
        trackEvent('error', 'system', `내 여행으로 저장 오류: ${error.message}`);
        alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsSaving(false);
      }
    };
    
    const handleSaveChanges = async () => {
      // ... (handleSaveChanges logic remains the same)
      if (!isOwner) { alert("이 여행 계획의 소유자만 수정할 수 있습니다. '내 여행으로 저장' 기능을 이용해주세요."); return; }
      if (!hasUnsavedChanges || !localTravelPlan) return;
      setIsSaving(true);
      try {
        const travelPlanRef = doc(db, 'travelPlans', planId);
        await updateDoc(travelPlanRef, {
          title: localTravelPlan.title,
          description: localTravelPlan.description,
          days: localTravelPlan.days,
          transportationDetails: localTravelPlan.transportationDetails,
          budgetBreakdown: localTravelPlan.budgetBreakdown,
          options: localTravelPlan.options, // Add this line to update options
          updatedAt: new Date()
        });
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        trackEvent('save_content', 'engagement', `여행 계획 저장: ${planId}`);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error('Error saving changes:', error);
        trackEvent('error', 'system', `여행 계획 저장 오류: ${error.message}`);
        alert("변경사항 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsSaving(false);
      }
    };
    
    const handleDeleteClick = useCallback((day, activityIndex) => {
      // ... (handleDeleteClick logic remains the same)
      const dayData = localTravelPlan?.days.find(d => d.day === day);
      const activityToRemove = dayData?.activities[activityIndex];
      setActivityToDelete({ day, activityIndex });
      setDeleteConfirmOpen(true);
      if (activityToRemove) {
        trackEvent('open_delete_modal', 'engagement', `활동 삭제 모달 열기: ${activityToRemove.title}`, { day: day, activity_title: activityToRemove.title, activity_location: activityToRemove.location });
      }
    }, [localTravelPlan, trackEvent]);
  
    const handleCancelDelete = useCallback(() => {
      // ... (handleCancelDelete logic remains the same)
      setDeleteConfirmOpen(false);
      setActivityToDelete(null);
      trackEvent('cancel_delete', 'engagement', '활동 삭제 취소');
    }, [trackEvent]);
    
    const handleConfirmDelete = useCallback(() => {
      // ... (handleConfirmDelete logic remains the same)
      if (!activityToDelete || !localTravelPlan) return;
      setIsDeleting(true);
      try {
        const { day, activityIndex } = activityToDelete;
        const dayIndex = localTravelPlan.days.findIndex(d => d.day === day);
        if (dayIndex === -1) throw new Error("Day not found for deletion");

        const activityBeingDeleted = localTravelPlan.days[dayIndex].activities[activityIndex];
        
        const updatedDays = localTravelPlan.days.map((d, i) => {
            if (i === dayIndex) {
                const newActivities = [...d.activities];
                newActivities.splice(activityIndex, 1);
                return { ...d, activities: newActivities };
            }
            return d;
        });

        const recalculatedPlan = calculateTravelPlan({ ...localTravelPlan, days: updatedDays });
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
        if (activityBeingDeleted) {
          trackEvent('delete_activity', 'content_update', `활동 삭제: ${activityBeingDeleted.title}`, { day: day, activity_title: activityBeingDeleted.title, activity_location: activityBeingDeleted.location });
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
        trackEvent('error', 'system', `활동 삭제 오류: ${error.message}`);
      } finally {
        setDeleteConfirmOpen(false);
        setActivityToDelete(null);
        setIsDeleting(false);
      }
    }, [activityToDelete, localTravelPlan, trackEvent]);
    
    const handleAddActivity = useCallback((day, newActivity) => {
      // ... (handleAddActivity logic remains the same)
      if (!isOwner || !localTravelPlan) return;
      
      const dayIndex = localTravelPlan.days.findIndex(d => d.day === day);
      if (dayIndex !== -1) {
        const updatedDays = localTravelPlan.days.map((d, i) => {
            if (i === dayIndex) {
                return { ...d, activities: [...d.activities, newActivity] };
            }
            return d;
        });
        const recalculatedPlan = calculateTravelPlan({ ...localTravelPlan, days: updatedDays });
        setLocalTravelPlan(recalculatedPlan);
        setHasUnsavedChanges(true);
        trackEvent('add_activity', 'content_update', `활동 추가: ${newActivity.title}`, { day: day, activity_title: newActivity.title, activity_location: newActivity.location, activity_price: newActivity.price || 0 });
      }
    }, [localTravelPlan, isOwner, trackEvent]);
    
    const updateAccommodation = useCallback((updatedPlanFromAccommodationEdit) => {
      // ... (updateAccommodation logic remains the same)
      // Note: AccommodationEdit directly calls onUpdatePlan which is this function.
      // It passes the *entire* updated plan.
      if (!isOwner) return;
      setLocalTravelPlan(updatedPlanFromAccommodationEdit);
      setHasUnsavedChanges(true);
      trackEvent('update_accommodation', 'content_update', `숙소 정보 업데이트`);
    }, [isOwner, trackEvent]);
    
    const fetchTravelPlan = useCallback(async (isRefreshing = false) => {
      // ... (fetchTravelPlan logic, ensure useCallback dependencies are correct if needed)
      if (!planId) { setError('유효하지 않은 여행 계획 ID입니다.'); setLoading(false); return; }
      try {
        if (!isRefreshing) setLoading(true);
        const planDoc = await getDoc(doc(db, 'travelPlans', planId));
        if (planDoc.exists()) {
          const planData = planDoc.data();
          setPlan(planData);
          // setLocalTravelPlan(planData); // This is handled by useEffect [plan]
          setIsOwner(user && planData.userId === user.uid);
          const status = checkPlanStatus(planData);
          trackEvent('view_content', 'content', `여행 상담 조회: ${planId}`, { owner: (user && planData.userId === user.uid), status: status, title: planData.title || '제목 없음' });
          if (status === 'processing') {
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
        if (!isRefreshing) setLoading(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId, user, trackEvent]); // Removed checkPlanStatus from deps as it's stable

    
    
    useEffect(() => {
      fetchTravelPlan();
    }, [fetchTravelPlan]); // fetchTravelPlan is now memoized
    
    const planStatus = plan ? checkPlanStatus(plan) : 'loading';
    const isProcessing = planStatus === 'processing';
    
    if (loading) return <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}><LoadingState message="여행 상담 내용을 불러오는 중..." /></div>;
    if (error) return <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}><ErrorState error={error} /></div>;
    if (!plan) return <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}><NotFoundState /></div>;
    if (isProcessing) return <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}><ProcessingState plan={plan} isMobile={isMobile} router={router} formatRelativeTime={formatRelativeTime} trackEvent={trackEvent} /></div>;
    
    // localTravelPlan might be null initially if plan is still loading or just set
    if (!localTravelPlan) {
        return <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}><LoadingState message="여행 계획 준비 중..." /></div>;
    }

    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-0' : 'px-4 py-2'}`}>
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
                setTitle={setEditTitle} // These directly update ConsultingPage's state
                setDescription={setEditDescription} // for the main title/desc
              />
              {localTravelPlan.options && (
                <TravelOptionEdit 
                    travelOptions={localTravelPlan.options}
                    onSave={handleUpdateTravelOptions}
                    isOwner={isOwner}
                    trackEvent={trackEvent}
                />
                )}
              <p className="text-sm text-gray-500">{plan.createdAt && `작성일: ${formatRelativeTime(plan.createdAt)}`}</p>
            </div>
            <div className="flex flex-col items-end">
              {hasUnsavedChanges && isOwner && <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center mb-2"><FiEdit className="mr-1" /> 변경사항 있음</div>}
              {saveSuccess ? (
                <div className="text-green-600 font-medium flex items-center"><FiSave className="mr-2" />{isOwner ? '저장되었습니다!' : '내 여행으로 저장되었습니다!'}</div>
              ) : (
                isOwner ? (
                  <button className={`px-4 py-2 rounded-md flex items-center ${hasUnsavedChanges ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} transition-colors`} onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving}>
                    {isSaving ? <><div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>저장 중...</> : <><FiSave className="mr-2" />변경사항 저장하기</>}
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-blue-600 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 transition-colors flex items-center" onClick={saveAsMine} disabled={isSaving || !user}>
                    {isSaving ? <><div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>저장 중...</> : <><FiCopy className="mr-2" />{user ? '내 여행으로 저장' : '로그인 필요'}</>}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-blue-800 dark:text-yellow-400 mb-4">전체 여행 경로</h2>
            <SwissMap locations={generateLocationsFromActivities(localTravelPlan.days)} />
          </div>
        </div>
        
        <div className="my-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-800 dark:text-yellow-300">일별 여행 일정</h2>
                {isOwner && (
                <button 
                    onClick={handleAddDayBeforeLast}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <FiPlus className="mr-2" /> 날짜 추가하기
                </button>
                )}
            </div>
            <div className="space-y-6">
                {localTravelPlan.days.sort((a, b) => a.day - b.day).map((day) => (
                <DaySection 
                    key={day.day} 
                    day={day}
                    generateLocationsFromActivities={generateLocationsFromActivities}
                    onAddActivity={handleAddActivity}
                    onDeleteActivity={handleDeleteClick}
                    isOwner={isOwner}
                    localTravelPlan={localTravelPlan}
                    onUpdateAccommodation={updateAccommodation}
                    onUpdateDay={handleUpdateDay}
                    isMobile={isMobile}
                    trackEvent={trackEvent}
                    onDeleteDay={handleDeleteDay} // prop 전달
                    ActivityModalComponent={ActivityModal}
                    AccommodationEditComponent={AccommodationEdit} // Add this line
                    locationDataUtil={locationData} // Add this line
                />
                ))}
            </div>
            </div>
        
        {localTravelPlan.transportationDetails && localTravelPlan.budgetBreakdown && (
          <TransportationCost transportationDetails={localTravelPlan.transportationDetails} budgetBreakdown={localTravelPlan.budgetBreakdown} />
        )}
        
        {process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' && <ChatButtonPortal />}
        
        <div className="my-8 flex justify-center space-x-4">
          <button onClick={() => { trackEvent('button_click', 'navigation', '상담 목록으로 돌아가기'); router.push('/consulting'); }}
            className="btn flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded-md transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            <FiArrowLeft className="mr-2" /> 상담 목록으로 돌아가기
          </button>
          <button onClick={() => { trackEvent('button_click', 'navigation', '블로그 모드'); router.push(`/simpleblog/${planId}`); }}
            className="btn flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded-md transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            블로그 모드
          </button>
        </div>
        
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-auto">
              <div className="flex items-center text-red-600 dark:text-red-400 mb-4"><FiAlertCircle size={24} className="mr-2" /><h3 className="text-lg font-semibold">활동 삭제 확인</h3></div>
              <p className="mb-6 text-gray-700 dark:text-gray-300">이 활동을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={handleCancelDelete} disabled={isDeleting} className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">취소</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className={`px-4 py-2 bg-red-600 text-white rounded-md transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}>
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
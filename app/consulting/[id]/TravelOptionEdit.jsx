// TravelOptionEdit.jsx
import { useState, useEffect } from 'react';
import { FiSave, FiEdit, FiMapPin, FiClock, FiUsers, FiDollarSign } from 'react-icons/fi';

const TravelOptionEdit = ({ 
  travelOptions, 
  onSave, 
  isOwner, 
  trackEvent 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editOptions, setEditOptions] = useState({
    startingCity: '',
    endingCity: '',
    duration: '',
    travelStyle: '',
    groupType: '',
    budget: '',
    prompt: ''
  });

  useEffect(() => {
    if (travelOptions) {
      setEditOptions({
        startingCity: travelOptions.startingCity || '',
        endingCity: travelOptions.endingCity || '',
        duration: travelOptions.duration || '',
        travelStyle: travelOptions.travelStyle || '',
        groupType: travelOptions.groupType || '',
        budget: travelOptions.budget || '',
        prompt: travelOptions.prompt || ''
      });
    }
  }, [travelOptions]);

  const handleStartEdit = () => {
    setIsEditing(true);
    trackEvent('start_edit_options', 'engagement', '여행 옵션 수정 시작');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditOptions({
      startingCity: travelOptions.startingCity || '',
      endingCity: travelOptions.endingCity || '',
      duration: travelOptions.duration || '',
      travelStyle: travelOptions.travelStyle || '',
      groupType: travelOptions.groupType || '',
      budget: travelOptions.budget || '',
      prompt: travelOptions.prompt || ''
    });
    trackEvent('cancel_edit_options', 'engagement', '여행 옵션 수정 취소');
  };

  const handleSave = () => {
    // Validate inputs if needed
    if (editOptions.duration && isNaN(parseInt(editOptions.duration))) {
      alert('여행 기간은 숫자로 입력해주세요');
      return;
    }
    
    // Clean duration to be an integer if provided
    const cleanedOptions = {
      ...editOptions,
      duration: editOptions.duration ? parseInt(editOptions.duration) : ''
    };

    onSave(cleanedOptions);
    setIsEditing(false);
    trackEvent('save_edit_options', 'content_update', '여행 옵션 수정 저장');
  };

  const handleChange = (field, value) => {
    setEditOptions(prev => ({ ...prev, [field]: value }));
  };

  // Helper constants for dropdown options
  const travelStyleOptions = [
    { value: '', label: '스타일 선택' },
    { value: 'nature', label: '자연 경관 위주' },
    { value: 'activity', label: '하이킹과 액티비티' },
    { value: 'balanced', label: '자연+도시 조화' }
  ];

  const groupTypeOptions = [
    { value: '', label: '여행 유형 선택' },
    { value: 'solo', label: '나홀로' },
    { value: 'couple', label: '커플' },
    { value: 'family', label: '가족' },
    { value: 'friends', label: '친구' },
    { value: 'seniors', label: '시니어' },
    { value: 'MomDaughter', label: '엄마딸' }
  ];

  const budgetOptions = [
    { value: '', label: '절약 선택' },
    { value: '절약 여행', label: '절약 여행' },
    { value: '일반 여행', label: '일반 여행' },
    { value: '럭셔리 여행', label: '럭셔리 여행' }
  ];

  const cityOptions = [
    { value: '', label: '도시 선택' },
    { value: 'Zurich', label: '🇨🇭 취리히 (Zurich)' },
    { value: 'Geneva', label: '🇨🇭 제네바 (Geneva)' },
    { value: 'Basel', label: '🇨🇭 바젤 (Basel)' },
    { value: 'Paris', label: '🇫🇷 파리' },
    { value: 'Milano', label: '🇮🇹 밀라노' },
    { value: 'Frankfurt', label: '🇩🇪 프랑크푸르트' }
  ];

  if (!isEditing) {
    // Non-editing view - show current travel options
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-yellow-400 mb-3">여행 옵션</h2>
          {isOwner && (
            <button
              onClick={handleStartEdit}
              className="text-blue-600 dark:text-yellow-400 hover:bg-blue-100 dark:hover:bg-yellow-900 p-1 rounded-full transition-colors"
              title="여행 옵션 수정"
            >
              <FiEdit size={18} />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {travelOptions?.startingCity && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                <FiMapPin className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">출발 도시</p>
                <p className="font-medium">{travelOptions.startingCity}</p>
              </div>
            </div>
          )}

          {travelOptions?.endingCity && (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                  <FiMapPin className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">도착 도시</p>
                  <p className="font-medium">{travelOptions.endingCity}</p>
                </div>
              </div>
            )}
          
          {travelOptions?.duration && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-2">
                <FiClock className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">여행 기간</p>
                <p className="font-medium">{travelOptions.duration}일</p>
              </div>
            </div>
          )}
          
          {travelOptions?.groupType && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-2">
                <FiUsers className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">여행 유형</p>
                <p className="font-medium">
                  {groupTypeOptions.find(option => option.value === travelOptions.groupType)?.label || travelOptions.groupType}
                </p>
              </div>
            </div>
          )}
          
          {travelOptions?.travelStyle && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-2">
                <FiUsers className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">여행 스타일</p>
                <p className="font-medium">
                  {travelStyleOptions.find(option => option.value === travelOptions.travelStyle)?.label || travelOptions.travelStyle}
                </p>
              </div>
            </div>
          )}
          
          {travelOptions?.budget && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-2">
                <FiDollarSign className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">예산</p>
                <p className="font-medium">{travelOptions.budget}</p>
              </div>
            </div>
          )}
        </div>
        
        {travelOptions?.prompt && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">여행 요청:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{travelOptions.prompt}"</p>
          </div>
        )}
      </div>
    );
  }
  
  // Editing view with form controls
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 mb-6">
      <h2 className="text-xl font-semibold text-blue-800 dark:text-yellow-400 mb-4">여행 옵션 수정</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">출발 도시</label>
          <select
            value={editOptions.startingCity}
            onChange={(e) => handleChange('startingCity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {cityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">도착 도시</label>
          <select
            value={editOptions.endingCity}
            onChange={(e) => handleChange('endingCity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {cityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">여행 기간 (일)</label>
          <input
            type="number"
            min="1"
            max="30"
            value={editOptions.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="예: 7"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">여행 스타일</label>
          <select
            value={editOptions.travelStyle}
            onChange={(e) => handleChange('travelStyle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {travelStyleOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">여행 유형</label>
          <select
            value={editOptions.groupType}
            onChange={(e) => handleChange('groupType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {groupTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">예산</label>
          <select
            value={editOptions.budget}
            onChange={(e) => handleChange('budget', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {budgetOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">여행 요청 사항</label>
        <textarea
          value={editOptions.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          rows="3"
          placeholder="원하는 여행에 대한 특별한 요청사항이 있으시면 입력해주세요."
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button 
          onClick={handleCancelEdit} 
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
  );
};

export default TravelOptionEdit;
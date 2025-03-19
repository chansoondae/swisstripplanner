'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiMapPin, FiClock, FiDollarSign, FiTrain, FiRefreshCw } from 'react-icons/fi';
import { FaShip, FaMountain, FaTram, FaTrain } from 'react-icons/fa';
import swissAttractions from './../../data/swiss_attraction.json'; // JSON 파일 직접 import
import { formatDuration } from './../../utils/durationFormat';

// 교통 수단에 따른 아이콘 선택
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

const ActivityModal = ({ isOpen, onClose, onAddActivity, currentDay, baseLocation, endLocation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [filteredAttractions, setFilteredAttractions] = useState([]);

  // 각 관광지명에 대해 가장 적합한 옵션 찾기
  const findBestOption = (attractions, nameEng, base, end) => {
    // 1. Name_Eng값과 같은 것 필터링
    const matchedAttractions = attractions.filter(attr => 
      attr.Name_Eng && attr.Name_Eng.toLowerCase() === nameEng.toLowerCase()
    );
    
    if (matchedAttractions.length === 0) return null;

    // 2. Base값이 시작 위치와 같은 것 찾기
    const startLocationMatch = matchedAttractions.find(attr => attr.Base === base);
    if (startLocationMatch) return startLocationMatch;
    
    // 3. Base값이 종료 위치와 같은 것 찾기
    const endLocationMatch = matchedAttractions.find(attr => attr.Base === end);
    if (endLocationMatch) return endLocationMatch;
    
    // 4. 둘 다 없으면 소요시간 가장 짧은 것
    return matchedAttractions.sort((a, b) => {
      // 시간 문자열에서 숫자만 추출 (예: "5:00" -> 5.0)
      const getHours = (duration) => {
        if (!duration) return 999;
        const parts = duration.split(':');
        return parts.length === 2 ? parseFloat(parts[0]) + parseFloat(parts[1])/60 : parseFloat(parts[0]);
      };
      
      return getHours(a.Duration) - getHours(b.Duration);
    })[0];
  };

  // JSON 데이터 로드 및 중복 제거
  useEffect(() => {
    if (isOpen) {
      // console.log('Modal opened, loading and optimizing attractions');
      
      if (!swissAttractions || swissAttractions.length === 0) {
        console.log('No attractions data found');
        setAttractions([]);
        return;
      }
      
      // 1. 중복 없는 관광지 이름 목록 생성
      const uniqueNames = [...new Set(swissAttractions.map(item => item.Name_Eng))];
      // console.log(`Found ${uniqueNames.length} unique attraction names`);
      
      // 2. 각 이름에 대해 최적의 항목 찾기
      const optimizedAttractions = uniqueNames.map(name => 
        findBestOption(swissAttractions, name, baseLocation, endLocation)
      ).filter(Boolean); // null 항목 제거
      
      // console.log(`Optimized to ${optimizedAttractions.length} attractions`);
      setAttractions(optimizedAttractions);
    }
  }, [isOpen, baseLocation, endLocation]);

  // 검색어에 따라 필터링
  useEffect(() => {
    
    if (!attractions) return;
    const filtered = attractions.filter(attraction => 
      (attraction.Name_Eng?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (attraction.Name_Kor || '').includes(searchTerm)
    );
    
    setFilteredAttractions(filtered);
  }, [searchTerm, attractions]);

  // 가장 적합한 액티비티 정보 찾기
  const findBestActivity = (engName) => {

    // 1. Name_Eng값과 Eng 같은 것 필터링
    const matchedAttractions = attractions.filter(attr => 
      attr.Name_Eng.toLowerCase() === engName.toLowerCase()
    );
    
    if (matchedAttractions.length === 0) return null;

    // console.log('1. Name_Eng값과 Eng 같은 것 필터링: ', matchedAttractions);
    
    // 2. Base값이 시작 위치와 같은 것 찾기
    const startLocationMatch = matchedAttractions.find(attr => 
      attr.Base === baseLocation
    );

    // console.log('2. Base값이 시작 위치와 같은 것 찾기: ', startLocationMatch);
    
    if (startLocationMatch) return startLocationMatch;
    
    // 3. Base값이 종료 위치와 같은 것 찾기
    const endLocationMatch = matchedAttractions.find(attr => 
      attr.Base === endLocation
    );

    // console.log('3. Base값이 종료 위치와 같은 것 찾기: ', endLocationMatch);
    
    if (endLocationMatch) return endLocationMatch;
    
    // 4. 둘 다 없으면 소요시간 가장 짧은 것
    return matchedAttractions.sort((a, b) => {
      // 시간 문자열에서 숫자만 추출 (예: "5:00" -> 5.0)
      const getHours = (duration) => {
        const parts = duration.split(':');
        return parts.length === 2 ? parseFloat(parts[0]) + parseFloat(parts[1])/60 : parseFloat(parts[0]);
      };
      
      return getHours(a.Duration) - getHours(b.Duration);
    })[0];
  };

  const handleActivitySelect = (activity) => {
    // console.log('Selected activity:', activity);
    // ID가 있으므로 그대로 사용
    setSelectedActivity(activity);
  };

  const handleAddActivity = () => {
    if (!selectedActivity) return;
    
    const priceFormatted = `${selectedActivity["2nd Class Price"] ?? (selectedActivity.Price || "0")}`;

    
    // Create new activity object
    const newActivity = {
      title: `${selectedActivity.Name_Kor} (${selectedActivity.Name_Eng})`,
      location: selectedActivity.Name_Eng,
      base: selectedActivity.Base || baseLocation,
      duration: formatDuration(selectedActivity.Duration),
      description: selectedActivity.Comment || "스위스의 아름다운 명소",
      transportation: selectedActivity.Transportation,
      price: priceFormatted,
      isOneWay: false, // Default: round trip
      // Add coordinates if available
      lat: selectedActivity.lat,
      lng: selectedActivity.lng
    };
    
    // Pass to parent component
    onAddActivity(newActivity);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">일정 추가 - Day {currentDay}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* 검색창 */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="관광지 검색 (한글 또는 영문)"
              className="w-full p-2 pl-10 border rounded-lg"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        {/* 액티비티 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredAttractions.length > 0 ? (
            <div className="grid gap-2">
              {filteredAttractions.map((activity, index) => (
                <button
                  key={index}
                  onClick={() => handleActivitySelect(activity)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedActivity && selectedActivity.Name_Eng === activity.Name_Eng
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="font-medium">{activity.Name_Kor}</div>
                  <div className="text-sm text-gray-600">{activity.Name_Eng}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
        
        {/* 선택된 액티비티 정보 */}
        {selectedActivity && (
          <div className="border-t p-4 bg-gray-50">
            <h3 className="font-medium text-lg mb-2">
              {selectedActivity.Name_Kor} ({selectedActivity.Name_Eng})
            </h3>
            
            {selectedActivity ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-gray-600" />
                  <span>{selectedActivity.Base || "-"}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-2 text-gray-600" />
                  <span>{selectedActivity.Duration || "-"}</span>
                  <FiRefreshCw className="ml-2 text-blue-600" title="왕복 시간" />
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="mr-2 text-gray-600" />
                  <span>CHF {selectedActivity["2nd Class Price"]}</span>
                </div>
                <div className="flex items-center">
                  <TransportIcon type={selectedActivity.Transportation} />
                  <span>{selectedActivity.Transportation || "-"}</span>
                </div>
                <div className="mt-2 text-gray-700">
                  {selectedActivity.Comment || "정보가 없습니다."}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">자세한 정보를 불러올 수 없습니다.</div>
            )}
          </div>
        )}
        
        {/* 하단 버튼 */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
          >
            취소
          </button>
          <button
            onClick={handleAddActivity}
            disabled={!selectedActivity}
            className={`px-4 py-2 rounded-lg ${
              selectedActivity
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
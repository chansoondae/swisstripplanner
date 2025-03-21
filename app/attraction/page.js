'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiSearch, FiMapPin, FiInfo } from 'react-icons/fi';
import swissAttractions from './../../data/swiss_attraction.json';
import { FaTrain, FaTram, FaMountain, FaShip } from 'react-icons/fa';

// 교통 수단에 따른 아이콘 선택
const TransportIcon = ({ type }) => {
  switch (type) {
    case 'Train':
      return <FaTrain className="mr-1 text-blue-600 dark:text-yellow-300" />;
    case 'CableCar':
      return <FaTram className="mr-1 text-blue-600 dark:text-yellow-300" />;
    case 'Funicular':
      return <FaMountain className="mr-1 text-blue-600 dark:text-yellow-300" />;
    case 'Ferry':
      return <FaShip className="mr-1 text-blue-600 dark:text-yellow-300" />;
    default:
      return null;
  }
};

export default function AttractionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [attractionsList, setAttractionsList] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);

  // 모든 관광지 목록 로드
  useEffect(() => {
    // 모든 항목 이름 순으로 정렬
    const sortedList = [...swissAttractions].sort((a, b) => 
      a.Name_Eng?.localeCompare(b.Name_Eng || '')
    );
    
    setAttractionsList(sortedList);
    setFilteredAttractions(sortedList);
  }, []);

  // 검색어에 따라 필터링
  useEffect(() => {
    const filtered = attractionsList.filter(attraction => 
      (attraction.Name_Eng?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (attraction.Name_Kor || '').includes(searchTerm)
    );
    
    setFilteredAttractions(filtered);
  }, [searchTerm, attractionsList]);

  // 특정 관광지 선택 시 상세 정보 보기
  const handleAttractionSelect = (attraction) => {
    setSelectedAttraction({
      main: attraction,
      // 선택한 항목의 상세 정보만 표시
      options: []
    });
  };

  // 상세 정보 닫기
  const closeDetails = () => {
    setSelectedAttraction(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">스위스 관광지 목록</h1>
      
      {/* 검색창 */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="관광지 검색 (한글 또는 영문)"
            className="w-full p-3 pl-10 border rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          />
          <FiSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
        </div>
      </div>
      
      {/* 관광지 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttractions.map((attraction, index) => (
          <div 
            key={`${attraction.Name_Eng}-${attraction.Base || ''}-${attraction.id || index}`} 
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center"
            onClick={() => handleAttractionSelect(attraction)}
          >
            {/* 이미지 영역 */}
            <div className="mr-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  {attraction.id ? (
                    <Image
                      src={`/images/${attraction.id}.jpg`}
                      alt={attraction.Name_Eng || ''}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      unoptimized={true}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.innerHTML = `<div class="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                          <span class="text-sm font-medium">${attraction.Name_Eng?.substring(0, 2) || '?'}</span>
                        </div>`;
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                      <span className="text-sm font-medium">{attraction.Name_Eng?.substring(0, 2) || '?'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 정보 영역 */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{attraction.Name_Eng}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{attraction.Name_Kor}</p>
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <FiMapPin className="mr-1" />
                <span>{attraction.Base || '-'}</span>
                {attraction.Transportation && (
                  <span className="ml-2 flex items-center">
                    <TransportIcon type={attraction.Transportation} />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {attraction.id || '-'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 결과가 없을 때 */}
      {filteredAttractions.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          검색 결과가 없습니다
        </div>
      )}
      
      {/* 상세 정보 모달 */}
      {selectedAttraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {selectedAttraction.main.Name_Kor || ''} ({selectedAttraction.main.Name_Eng || ''})
              </h2>
              <button 
                onClick={closeDetails}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FiInfo size={24} />
              </button>
            </div>
            
            {/* 메인 정보 */}
            <div className="p-6 border-b">
              <div className="flex items-start">
                {/* 이미지 */}
                <div className="mr-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {selectedAttraction.main.id ? (
                        <Image
                          src={`/images/${selectedAttraction.main.id}.jpg`}
                          alt={selectedAttraction.main.Name_Eng || ''}
                          width={128}
                          height={128}
                          className="object-cover w-full h-full"
                          unoptimized={true}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = `<div class="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                              <span class="text-lg font-medium">${selectedAttraction.main.Name_Eng?.substring(0, 2) || '?'}</span>
                            </div>`;
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                          <span className="text-lg font-medium">{selectedAttraction.main.Name_Eng?.substring(0, 2) || '?'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 상세 정보 */}
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {selectedAttraction.main.Comment || "상세 정보가 없습니다."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">기본 위치:</span> {selectedAttraction.main.Base || "-"}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">교통 수단:</span> {selectedAttraction.main.Transportation || "-"}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">소요 시간:</span> {selectedAttraction.main.Duration || "-"}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">2등석 가격:</span> CHF {selectedAttraction.main["2nd Class Price"] || "-"}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Switzerland Travel Pass:</span> {selectedAttraction.main.SwissTravelPass === "0" ? "100% 할인" : `CHF ${selectedAttraction.main.SwissTravelPass}` || "-"}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Saver Day Pass:</span> {selectedAttraction.main.SaverDayPass || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 옵션 섹션 제거 - 모든 항목을 메인 목록에 표시 */}
          </div>
        </div>
      )}
    </div>
  );
}
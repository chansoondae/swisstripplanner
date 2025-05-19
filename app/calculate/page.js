'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import swissAttractions from './../../data/swiss_attraction2.json';

const passPricing = {
  3: { adult: 232, youth: 164 },
  4: { adult: 281, youth: 198 },
  6: { adult: 359, youth: 253 },
  8: { adult: 389, youth: 275 },
  15: { adult: 429, youth: 296 },
};

const jungfrauVIPPricing = {
  1: { swisstravelpass: 175, saverdaypass: 190 },
  2: { swisstravelpass: 200, saverdaypass: 215 },
};

// Helper function to determine Jungfrau VIP level
const getJungfrauVIPLevel = (selectedAttractions) => {
  const jungfrauMountains = ['JungGrin', 'FirsGrin', 'MannGrin', 'SchyInte', 'HardInte'];
  const selectedMountains = selectedAttractions.filter(id => jungfrauMountains.includes(id));
  
  // 융프라우(JungGrin)가 포함되어 있는지 확인
  if (!selectedMountains.includes('JungGrin')) {
    return 0;
  }

  // 선택된 산의 개수에 따라 VIP 레벨 결정
  if (selectedMountains.length === 2) {
    return 1; // 융프라우 + 다른 산 1개
  } else if (selectedMountains.length >= 3 && selectedMountains.length <= 5) {
    return 2; // 융프라우 + 다른 산 2~4개
  }
  
  return 0;
};

// Helper function to get VIP pass duration text
const getVIPPassDuration = (level) => {
  switch(level) {
    case 1:
      return "(1일)";
    case 2:
      return "(2일)";
    default:
      return "";
  }
};

// Helper function to manage localStorage
const STORAGE_KEY = 'swissTripSelectedAttractions';
const EXPIRY_DAYS = 3;

const saveToLocalStorage = (selectedAttractions) => {
  const data = {
    attractions: selectedAttractions,
    timestamp: new Date().getTime()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadFromLocalStorage = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) return null;

  try {
    const data = JSON.parse(storedData);
    const now = new Date().getTime();
    const expiryTime = data.timestamp + (EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // 만료되지 않은 경우에만 데이터 반환
    if (now < expiryTime) {
      return data.attractions;
    } else {
      // 만료된 데이터는 삭제
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

export default function CalculatePage() {
  const [selectedAttractions, setSelectedAttractions] = useState([]);
  const [swissTravelPassTotal, setSwissTravelPassTotal] = useState(0);
  const [saverDayPassTotal, setSaverDayPassTotal] = useState(0);
  const [jungfrauVIPSwissTotal, setJungfrauVIPSwissTotal] = useState(0);
  const [jungfrauVIPSaverTotal, setJungfrauVIPSaverTotal] = useState(0);
  const [attractionsList, setAttractionsList] = useState([]);
  const [travelDays, setTravelDays] = useState(null);
  const [travelPassPrices, setTravelPassPrices] = useState(null);
  const [currentVIPLevel, setCurrentVIPLevel] = useState(0);

  // Initialize attractions list and load saved selections on load
  useEffect(() => {
    setAttractionsList(swissAttractions);
    
    // Load saved selections from localStorage
    const savedAttractions = loadFromLocalStorage();
    if (savedAttractions) {
      setSelectedAttractions(savedAttractions);
    }
  }, []);

  // Save to localStorage whenever selections change
  useEffect(() => {
    if (selectedAttractions.length > 0) {
      saveToLocalStorage(selectedAttractions);
    } else {
      // 선택된 명소가 없으면 localStorage에서 삭제
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedAttractions]);

  // Calculate total costs whenever selected attractions change
  useEffect(() => {
    let swissTotal = 0;
    let saverTotal = 0;
    let jungfrauSwissTotal = 0;
    let jungfrauSaverTotal = 0;
    let currentVIPLevel = 0;
    
    // Get Jungfrau VIP level based on selected attractions
    currentVIPLevel = getJungfrauVIPLevel(selectedAttractions);
    const jungfrauMountains = ['JungGrin', 'FirsGrin', 'MannGrin', 'SchyInte', 'HardInte'];
    
    selectedAttractions.forEach(id => {
      const attraction = attractionsList.find(a => (a.id === id));
      if (attraction) {
        // VIP 패스가 활성화된 경우, 융프라우 산들의 가격은 제외
        if (currentVIPLevel > 0 && jungfrauMountains.includes(id)) {
          // 융프라우 산들의 가격은 총액에 포함하지 않음
          return;
        }
        // VIP 패스가 활성화되지 않은 경우 또는 융프라우 산이 아닌 경우, 일반 가격 적용
        swissTotal += parseFloat(attraction.SwissTravelPass || 0);
        saverTotal += parseFloat(attraction.SaverDayPass || 0);
      }
    });

    // VIP 패스가 활성화된 경우에만 VIP 가격 추가
    if (currentVIPLevel > 0) {
      jungfrauSwissTotal = jungfrauVIPPricing[currentVIPLevel].swisstravelpass;
      jungfrauSaverTotal = jungfrauVIPPricing[currentVIPLevel].saverdaypass;
    }
    
    setSwissTravelPassTotal(swissTotal);
    setSaverDayPassTotal(saverTotal);
    setJungfrauVIPSwissTotal(jungfrauSwissTotal);
    setJungfrauVIPSaverTotal(jungfrauSaverTotal);
    setCurrentVIPLevel(currentVIPLevel);
  }, [selectedAttractions, attractionsList]);

  useEffect(() => {
    if (travelDays && passPricing[travelDays]) {
      setTravelPassPrices(passPricing[travelDays]);
    }
  }, [travelDays]);

  // Toggle attraction selection
  const toggleAttraction = (id) => {
    setSelectedAttractions(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id];
      return newSelection;
    });
  };

  // Group attractions by base location
  const groupedAttractions = attractionsList.reduce((groups, attraction) => {
    const base = attraction.Base || 'Other';
    if (!groups[base]) {
      groups[base] = [];
    }
    groups[base].push(attraction);
    return groups;
  }, {});

  return (
    <div className="container mx-auto px-4 pb-4">
      <h1 className="text-3xl font-bold my-6 text-center">
        스위스 여행 <span className="text-red-600">추가 비용</span> 계산기
      </h1>
      
      {/* Sticky Total Cost Display */}
      <div className="sticky top-0 z-50 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 shadow-md mb-8">
        <div className="container mx-auto">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-gray-600">{selectedAttractions.length}개 선택됨</p>
                <p className="text-gray-600">추가되는 비용만 계산 합니다. </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm">
                <h3 className="text-base font-medium text-red-600">스위스트래블패스</h3>
                <div className="space-y-1">
                  <p className="text-sm">전체 비용: CHF {(swissTravelPassTotal + jungfrauVIPSwissTotal).toFixed(2)}</p>
                  {jungfrauVIPSwissTotal > 0 && (
                    <p className="text-xs text-gray-600">- 추가 비용: CHF {swissTravelPassTotal.toFixed(2)}</p>
                  )}
                  {jungfrauVIPSwissTotal > 0 && (
                    <p className="text-xs text-gray-600">- 융프VIP{getVIPPassDuration(currentVIPLevel)}: {jungfrauVIPSwissTotal.toFixed(2)}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm">
                <h3 className="text-base font-medium text-blue-600">세이버데이패스</h3>
                <div className="space-y-1">
                  <p className="text-sm">전체 비용: CHF {(saverDayPassTotal + jungfrauVIPSaverTotal).toFixed(2)}</p>
                  {jungfrauVIPSaverTotal > 0 && (
                    <p className="text-xs text-gray-600">- 추가 비용: CHF {saverDayPassTotal.toFixed(2)}</p>
                  )}
                  {jungfrauVIPSaverTotal > 0 && (
                    <p className="text-xs text-gray-600">- 융프VIP{getVIPPassDuration(currentVIPLevel)}: {jungfrauVIPSaverTotal.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attractions by Location */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {attractionsList.map((attraction) => (
          <div 
            key={attraction.id || `${attraction.Name_Eng}-${attraction.Base}`} 
            className="flex flex-col items-center"
            onClick={() => attraction.id && toggleAttraction(attraction.id)}
          >
            <div 
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 ${
                selectedAttractions.includes(attraction.id) 
                  ? 'border-red-600' 
                  : 'border-gray-300'
              } ${attraction.id ? 'cursor-pointer' : ''} relative`}
            >
              {attraction.id ? (
                <>
                  <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 absolute">
                    <span className="text-sm font-medium">{attraction.Name_Eng?.substring(0, 2) || '?'}</span>
                  </div>
                  <img
                    src={`/images/${attraction.id}.jpg`}
                    alt={attraction.Name_Eng || ''}
                    className="object-cover w-full h-full absolute inset-0 z-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  <span className="text-sm font-medium">{attraction.Name_Eng?.substring(0, 2) || '?'}</span>
                </div>
              )}
              
              {selectedAttractions.includes(attraction.id) && (
                <div className="absolute inset-0 bg-red-600 bg-opacity-30 flex items-center justify-center z-20">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-center font-medium truncate w-full">
              {attraction.Name_Kor || attraction.Name_Eng}
            </p>

            <div className="flex gap-2 text-xs">
              <span className="text-red-600">
                {(attraction.SwissTravelPass || 0) > 0 ? `S:${(attraction.SwissTravelPass || 0).toFixed(1)}` : 'S:0'}
              </span>
              <span className="text-blue-600">
                {(attraction.SaverDayPass || 0) > 0 ? `D:${(attraction.SaverDayPass || 0).toFixed(1)}` : 'D:0'}
              </span>
            </div>
          </div>
        ))}
      </div>

      
      {/* Selected Attractions Summary */}
      {selectedAttractions.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">선택한 명소</h2>
          <div className="space-y-2">
            {selectedAttractions.map(id => {
              const attraction = attractionsList.find(a => a.id === id);
              if (!attraction) return null;
              
              return (
                <div key={id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2 relative">
                      <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 absolute">
                        <span className="text-xs">{attraction.Name_Eng?.substring(0, 1) || '?'}</span>
                      </div>
                      <img
                        src={`/images/${attraction.id}.jpg`}
                        alt={attraction.Name_Eng || ''}
                        className="object-cover w-full h-full absolute inset-0 z-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{attraction.Name_Kor || attraction.Name_Eng}</p>
                      <p className="text-xs text-gray-600">{attraction.Base}</p>
                    </div>
                  </div>

                   {/* 가운데: 자세히 보기 링크 */}
                    {attraction.url && (
                      <div className="sm:flex-1 text-center">
                        <a
                          href={attraction.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline inline-flex items-center"
                        >
                          더보기
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}

                  <div className="text-right">
                    <div className="flex gap-2 text-sm">
                      <span className="text-red-600">S:{(attraction.SwissTravelPass || 0).toFixed(1)}</span>
                      <span className="text-blue-600">D:{(attraction.SaverDayPass || 0).toFixed(1)}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAttraction(id);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex flex-col gap-2 p-2 bg-white dark:bg-gray-900 rounded font-bold">
            <div className="flex justify-between items-center">
              <span>총 비용</span>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-red-600">S: CHF {(swissTravelPassTotal + jungfrauVIPSwissTotal).toFixed(2)}</p>
                  <p className="text-xs text-gray-600">기본: {swissTravelPassTotal.toFixed(2)}</p>
                  {jungfrauVIPSwissTotal > 0 && (
                    <p className="text-xs text-gray-600">VIP {getVIPPassDuration(currentVIPLevel)}: {jungfrauVIPSwissTotal.toFixed(2)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-blue-600">D: CHF {(saverDayPassTotal + jungfrauVIPSaverTotal).toFixed(2)}</p>
                  <p className="text-xs text-gray-600">기본: {saverDayPassTotal.toFixed(2)}</p>
                  {jungfrauVIPSaverTotal > 0 && (
                    <p className="text-xs text-gray-600">VIP {getVIPPassDuration(currentVIPLevel)}: {jungfrauVIPSaverTotal.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
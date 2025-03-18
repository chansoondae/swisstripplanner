'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiClock, FiChevronsRight, FiInfo } from 'react-icons/fi';
import { FaTrain } from 'react-icons/fa';


export default function TransportationCost({ transportationDetails, budgetBreakdown }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transportationDetails || !budgetBreakdown) return null;

  // 교통 요금 정보
  const { totalCost, segments, fareDetails, missingRoutes } = transportationDetails;
  
  // 시간 형식 변환 (HH:MM 형식을 시간과 분으로 변환)
  const formatDuration = (duration) => {
    if (!duration) return '';
    
    const parts = duration.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      return `${hours}시간`;
    } else {
      return `${minutes}분`;
    }
  };

  return (
    <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
      {/* 헤더 섹션 */}
      <div 
        className="bg-indigo-50 p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <FaTrain className="text-indigo-600 mr-2" size={20} />
          <h2 className="text-lg font-semibold text-indigo-800">교통비</h2>
        </div>
        <div className="flex items-center">
          <span className="text-indigo-700 font-medium mr-3">
            {budgetBreakdown.transportation}
          </span>
          {isExpanded ? (
            <FiChevronUp className="text-indigo-600" />
          ) : (
            <FiChevronDown className="text-indigo-600" />
          )}
        </div>
      </div>
      
      {/* 상세 정보 섹션 */}
      {isExpanded && (
        <div className="bg-white p-4">
          {/* 요약 정보 */}
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
            <div className="text-sm text-indigo-800">
              총 {segments}개 구간, CHF {totalCost} (2등석 기준)
            </div>
          </div>
          
          {/* 일별 교통 요금 정보 */}
          <div className="space-y-3">
            {fareDetails.map((fare, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                    <span className="font-medium">Day {fare.day}</span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <FaTrain className="mr-2 text-indigo-500" size={16} />
                        <div className="text-gray-700">{fare.from}</div>
                        <FiChevronsRight className="mx-2 text-gray-400" />
                        <div className="text-gray-700">{fare.to}</div>
                    </div>
                    <div className="text-indigo-600 font-medium">
                      CHF {fare.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <FiClock className="mr-1" />
                    <span>소요 시간: {formatDuration(fare.duration)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 경로 정보가 없는 경우 */}
          {missingRoutes && missingRoutes.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-start">
              <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">일부 구간의 교통 요금 정보를 찾을 수 없습니다:</p>
                <ul className="list-disc pl-5">
                  {missingRoutes.map((route, idx) => (
                    <li key={idx}>
                      Day {route.day}: {route.from} → {route.to}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
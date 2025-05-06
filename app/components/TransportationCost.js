'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiClock, FiChevronsRight, FiInfo, FiMapPin } from 'react-icons/fi';
import { FaTrain, FaTicketAlt, FaRegIdCard, FaIdCard, FaStar, FaShoppingCart } from 'react-icons/fa';
import SwissPassVendorModal from './SwissPassVendorModal';
import { useAnalytics } from './../hooks/useAnalytics'; // 경로가 맞는지 확인 필요

export default function TransportationCost({ transportationDetails, budgetBreakdown }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { trackEvent } = useAnalytics(); // Analytics 훅 사용

  // 컴포넌트 마운트 시 이벤트 발생
  useEffect(() => {
    if (transportationDetails && budgetBreakdown) {
      // 컴포넌트 로드 이벤트
      trackEvent(
        'view_transportation_costs', 
        'content', 
        '교통비 정보 조회', 
        {
          totalCost: transportationDetails.totalCost,
          hasSwissPassRecommendation: !!transportationDetails.swissTravelPassRecommendations?.bestOption
        }
      );
    }
  }, [transportationDetails, budgetBreakdown, trackEvent]);

  if (!transportationDetails || !budgetBreakdown) return null;

  // 교통 요금 정보
  const { totalCost, segments, fareDetails, missingRoutes, saverDayRecommendations, swissTravelPassRecommendations } = transportationDetails;
  
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

  // 요금 정보를 날짜별로 그룹화
  const groupedFares = fareDetails.reduce((groups, fare) => {
    const day = fare.day;
    
    if (!groups[day]) {
      groups[day] = [];
    }
    
    groups[day].push(fare);
    return groups;
  }, {});

  // 패스별 총 비용 계산
  const calculateTotalByPass = () => {
    let totalRegular = 0;
    let totalSwissTravelPass = 0;
    let totalSaverDayPass = 0;

    fareDetails.forEach(fare => {
      totalRegular += fare.price || 0;
      totalSwissTravelPass += fare.price_swisstravel || 0;
      totalSaverDayPass += fare.price_saverday || 0;
    });

    return {
      regular: totalRegular.toFixed(2),
      swissTravelPass: totalSwissTravelPass.toFixed(2),
      saverDayPass: totalSaverDayPass.toFixed(2)
    };
  };

  const passTotals = calculateTotalByPass();

  // 최적의 교통권 추천
  let bestTransportOption = {
    type: 'regular',
    recommendation: `구간권: 총 CHF ${passTotals.regular} (2등석 기준)`,
    savings: 0
  };
  
  // Swiss Travel Pass 추천이 있는 경우
  if (swissTravelPassRecommendations && swissTravelPassRecommendations.bestOption) {
    const bestOption = swissTravelPassRecommendations.bestOption;
    
    // Swiss Travel Pass가 더 저렴한 경우 (savings 값이 있으면 경제적인 옵션)
    if (bestOption.savings && parseFloat(bestOption.savings) > 0) {
      bestTransportOption = {
        type: 'swisspass',
        recommendation: `스위스트래블패스 ${bestOption.option} : 총 CHF ${bestOption.totalCost}`,
        savings: bestOption.savings
      };
    }
  }

  // 날짜별로 Saver Day Pass 추천 여부 확인하는 함수
  const isSaverDayRecommended = (day) => {
    if (!saverDayRecommendations) return null;
    return saverDayRecommendations.find(rec => rec.day === parseInt(day));
  };

  // 교통비와 활동 비용을 카테고리별로 그룹화하는 함수
  const categorizeExpenses = (details, bestOption) => {
    const result = {
      transportation: [],
      activities: []
    };
    
    if (!details || !Array.isArray(details)) return result;
    
    // 항목별로 구분하여 저장
    details.forEach(fare => {
      // 기본 정보 구성
      const item = {
        day: fare.day,
        description: fare.isActivity 
        ? `${fare.from || ''} ↔ ${fare.to || '명소 방문'}` // 왕복 표시(↔)로 변경 
          : `${fare.from} → ${fare.to}`,
        regularPrice: parseFloat(fare.price) || 0,
        swissTravelPrice: parseFloat(fare.price_swisstravel) || 0
      };
      
      // 활동인지 교통인지에 따라 분류
      if (fare.isActivity) {
        result.activities.push(item);
      } else {
        result.transportation.push(item);
      }
    });
    
    // 항목 정렬 (날짜 및 설명 기준)
    result.transportation.sort((a, b) => a.day - b.day || a.description.localeCompare(b.description));
    result.activities.sort((a, b) => a.day - b.day || a.description.localeCompare(b.description));
    
    return result;
  };

  // 금액 형식화 함수
  const formatCurrency = (amount) => {
    if (!amount) return 'CHF 0.00';
    return `CHF ${parseFloat(amount).toFixed(2)}`;
  };

  // 컴포넌트 확장/축소 이벤트 핸들러
  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // 확장/축소 이벤트 추적
    trackEvent(
      newExpandedState ? 'expand_section' : 'collapse_section',
      'engagement',
      '교통비 섹션 ' + (newExpandedState ? '확장' : '축소')
    );
  };

  // 모달 열기 이벤트 핸들러
  const handleOpenModal = (e) => {
    e.stopPropagation();
    setShowModal(true);
    
    // 모달 열기 이벤트 추적
    trackEvent(
      'open_modal',
      'engagement',
      '스위스트래블패스 구매 정보 모달 열기',
      {
        bestOption: swissTravelPassRecommendations?.bestOption?.option || '',
        savings: swissTravelPassRecommendations?.bestOption?.savings || 0
      }
    );
  };

  // 모달 닫기 이벤트 핸들러
  const handleCloseModal = () => {
    setShowModal(false);
    
    // 모달 닫기 이벤트 추적
    trackEvent('close_modal', 'engagement', '스위스트래블패스 구매 정보 모달 닫기');
  };

  return (
    <>
      <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
        {/* 헤더 섹션 */}
        <div 
          className="bg-indigo-50 dark:bg-indigo-950 p-4 flex justify-between items-center cursor-pointer"
          onClick={handleToggleExpand}
        >
          <div className="flex items-center">
            <FaTrain className="text-indigo-600 dark:text-indigo-300 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-indigo-800 dark:text-indigo-100">교통비</h2>
          </div>
          <div className="flex items-center">
            <span className="text-indigo-700 dark:text-indigo-300 font-medium mr-3">
              추천 교통권 : {bestTransportOption.recommendation}
              {bestTransportOption.type === 'swisspass' && bestTransportOption.savings > 0 && (
                <span className="text-green-600 ml-2">(CHF {parseFloat(bestTransportOption.savings).toFixed(2)} 절약)</span>
              )}
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
          <div className="bg-white dark:bg-gray-800 p-4">
            {/* 요약 정보 */}
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
              <div className="text-sm text-indigo-800 dark:text-indigo-100 mb-2 flex justify-between items-center">
                구간권: 총 CHF {passTotals.regular} (2등석 기준)
                {/* Swiss Travel Pass 추천 뱃지 */}
                {bestTransportOption.savings > 0 && (
                  <div className="flex items-center bg-green-200 dark:bg-gray-800 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                    <FaStar className="mr-1 text-green-600" size={12} />
                    Swiss Travel Pass 추천!
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-sm text-green-700 dark:text-green-200">
                  <FaIdCard className="mr-2" />
                  Swiss Travel Pass: CHF {passTotals.swissTravelPass}
                </div>
                <div className="flex items-center text-sm text-amber-700 dark:text-amber-200">
                  <FaRegIdCard className="mr-2" />
                  Saver Day Pass: CHF {passTotals.saverDayPass}
                </div>
              </div>


              {/* Swiss Travel Pass 추천 정보 요약 */}
              {swissTravelPassRecommendations && swissTravelPassRecommendations.bestOption && (
                <div className="mt-3 p-2 bg-green-100 dark:bg-green-800 rounded border border-green-200">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-green-800 dark:text-green-100 mb-1">
                      <span className="flex items-center">
                        <FaIdCard className="mr-2 text-green-700 dark:text-green-200" />
                        Swiss Travel Pass 계산: {swissTravelPassRecommendations.bestOption.option}
                      </span>
                    </p>
                    
                    {/* 스위스 트래블 패스 구매 버튼 */}
                    {bestTransportOption.type === 'swisspass' && bestTransportOption.savings > 0 && (
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
                        onClick={handleOpenModal}
                      >
                        <FaShoppingCart className="mr-1" size={14} />
                        스위스트래블패스 싸게 사는법
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-green-700 dark:text-green-200 mb-1">
                    {swissTravelPassRecommendations.bestOption.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <div className="text-gray-700  dark:text-gray-200">
                      패스 비용: {formatCurrency(swissTravelPassRecommendations.bestOption.passCost)}
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                      총 비용: {formatCurrency(swissTravelPassRecommendations.bestOption.totalCost)}
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                      일반 요금: {formatCurrency(swissTravelPassRecommendations.bestOption.regularCost)}
                    </div>
                    <div className="text-green-800 dark:text-gray-100 font-medium">
                      절약액: {formatCurrency(swissTravelPassRecommendations.bestOption.savings)}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs font-medium text-green-800 dark:text-green-100 mb-1">총 비용 상세 내역:</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      <div className="text-gray-700 dark:text-gray-200">Swiss Travel Pass 비용:</div>
                      <div className="text-gray-800 dark:text-gray-100 font-medium">{formatCurrency(swissTravelPassRecommendations.bestOption.passCost)}</div>
                      
                      <div className="text-gray-700 dark:text-gray-200 col-span-2 mt-1 font-medium">교통 비용 (패스 적용시):</div>
                      
                      {/* 교통 항목별 비용 */}
                      {categorizeExpenses(fareDetails, swissTravelPassRecommendations.bestOption).transportation.map((item, idx) => (
                        <React.Fragment key={`trans-item-${idx}`}>
                          <div className="text-gray-600 dark:text-gray-300 pl-2 text-xs">- {item.description}:</div>
                          <div className="text-gray-600 dark:text-gray-300 text-xs">
                            {formatCurrency(item.swissTravelPrice)}
                            {item.regularPrice > item.swissTravelPrice && 
                              <span className="text-green-600 dark:text-green-300 text-xs ml-1">
                                ({Math.round((1 - item.swissTravelPrice/item.regularPrice) * 100)}% 할인)
                              </span>
                            }
                          </div>
                        </React.Fragment>
                      ))}
                      
                      {/* 액티비티 헤더 */}
                      <div className="text-gray-700 dark:text-gray-200 col-span-2 mt-1 font-medium">액티비티 비용 (패스 적용시):</div>
                      
                      {/* 액티비티 항목별 비용 */}
                      {categorizeExpenses(fareDetails, swissTravelPassRecommendations.bestOption).activities.map((item, idx) => (
                        <React.Fragment key={`act-item-${idx}`}>
                          <div className="text-gray-600 dark:text-gray-300 pl-2 text-xs">- {item.description}:</div>
                          <div className="text-gray-600 dark:text-gray-300 text-xs">
                            {formatCurrency(item.swissTravelPrice)}
                            {item.regularPrice > item.swissTravelPrice && 
                              <span className="text-green-600 dark:text-green-300 text-xs ml-1">
                                ({Math.round((1 - item.swissTravelPrice/item.regularPrice) * 100)}% 할인)
                              </span>
                            }
                          </div>
                        </React.Fragment>
                      ))}
                      
                      {/* 합계 정보 */}
                      <div className="text-gray-700 dark:text-gray-200 font-medium border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">총 비용:</div>
                      <div className="text-gray-800 dark:text-gray-100 font-medium border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">{formatCurrency(swissTravelPassRecommendations.bestOption.totalCost)}</div>
                      
                      <div className="text-gray-700 dark:text-gray-200">패스 없을 때 총 비용:</div>
                      <div className="text-gray-800 dark:text-gray-100 font-medium">{formatCurrency(swissTravelPassRecommendations.bestOption.regularCost)}</div>
                      
                      <div className="text-green-700 dark:text-green-200">절약액:</div>
                      <div className="text-green-800 dark:text-green-100 font-medium">{formatCurrency(swissTravelPassRecommendations.bestOption.savings)}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Saver Day Pass 추천 정보 요약 */}
              {saverDayRecommendations && saverDayRecommendations.length > 0 && (
                <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900 rounded border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-100 mb-1">
                    <span className="flex items-center">
                      <FaRegIdCard className="mr-2" />
                      Saver Day Pass가 유리한 날짜: {saverDayRecommendations.map(rec => `Day ${rec.day}`).join(', ')}
                    </span>
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">
                    이 날짜들에 Saver Day Pass를 사용하면 구간권보다 총 CHF {saverDayRecommendations.reduce((total, rec) => total + parseFloat(rec.savings), 0).toFixed(2)}를 절약할 수 있습니다.
                  </p>
                </div>
              )}
              </div>
            
            {/* 일별 교통 요금 정보 */}
            <div className="space-y-4">
              {Object.keys(groupedFares).sort((a, b) => a - b).map((day) => {
                const saverDayRec = isSaverDayRecommended(day);
                
                return (
                  <div key={day} className="border rounded-lg overflow-hidden">
                    <div className={`px-4 py-2 border-b flex justify-between items-center ${saverDayRec ? 'bg-amber-50 dark:bg-amber-950' : 'bg-gray-50 dark:bg-gray-950'}`}>
                      <span className="font-medium">Day {day}</span>
                      
                      {/* Saver Day Pass 추천 뱃지 */}
                      {saverDayRec && (
                        <div className="flex items-center bg-amber-200 text-amber-800 px-2 py-1 rounded text-xs font-medium">
                          <FaStar className="mr-1 text-amber-600 dark:text-amber-300" size={12} />
                          Saver Day Pass 추천!
                        </div>
                      )}
                    </div>
                    
                    {/* Saver Day Pass 추천 정보 상세 */}
                    {saverDayRec && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950 border-b text-sm">
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                          <div className="flex items-center">
                            <span className="text-gray-700 dark:text-gray-200 font-medium mr-1">일반 요금:</span>
                            <span className="text-amber-800 dark:text-amber-100">CHF {saverDayRec.sum_price}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-700 dark:text-gray-200 font-medium mr-1">Saver Day Pass 사용 시:</span>
                            <span className="text-amber-800 dark:text-amber-100">CHF {saverDayRec.sum_price_saverday} + 패스 비용 CHF 52</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-700 dark:text-gray-200 font-medium mr-1">절약액:</span>
                            <span className="text-green-700 dark:text-green-200 font-medium">CHF {saverDayRec.savings}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 space-y-3">
                      {groupedFares[day].map((fare, index) => (
                        <div 
                          key={index} 
                          className={`p-3 ${index > 0 ? 'border-t pt-3' : ''} ${fare.isActivity ? 'bg-green-50 dark:bg-green-950' : 'bg-white dark:bg-gray-900'}`}
                          onClick={() => {
                            // 특정 교통/활동 항목 클릭 이벤트 추적
                            trackEvent(
                              'view_fare_detail',
                              'engagement',
                              `${fare.isActivity ? '활동' : '교통'} 항목 조회: ${fare.from} - ${fare.to}`,
                              {
                                day: fare.day,
                                price: fare.price,
                                isActivity: fare.isActivity
                              }
                            );
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {fare.isActivity ? (
                                <>
                                  <FaTicketAlt className="mr-2 text-green-600 dark:text-green-300" size={16} />
                                  <div className="text-gray-700 dark:text-gray-200 font-medium">{fare.to || '명소 방문'}</div>
                                </>
                              ) : (
                                <>
                                  <FaTrain className="mr-2 text-indigo-500 dark:text-indigo-400" size={16} />
                                  <div className="text-gray-700 dark:text-gray-200">{fare.from}</div>
                                  <FiChevronsRight className="mx-2 text-gray-400 dark:text-gray-500" />
                                  <div className="text-gray-700 dark:text-gray-200">{fare.to}</div>
                                </>
                              )}
                            </div>
                            <div className={`font-medium ${fare.isActivity ? 'text-green-600 dark:text-green-300' : 'text-indigo-600 dark:text-indigo-300'}`}>
                              CHF {fare.price.toFixed(2)}
                            </div>
                          </div>
                          
                          {/* 패스 정보 추가 */}
                          <div className="mt-2 flex flex-wrap gap-4 text-sm">
                            {(fare.price_swisstravel !== undefined && fare.price_swisstravel !== null) && (
                              <div className="flex items-center text-green-700 dark:text-green-200">
                                <FaIdCard className="mr-1" size={14} />
                                <span>Swiss Travel Pass: CHF {Number(fare.price_swisstravel).toFixed(2)}</span>
                              </div>
                            )}
                            {(fare.price_saverday !== undefined && fare.price_saverday !== null) && (
                              <div className="flex items-center text-amber-700 dark:text-amber-200">
                                <FaRegIdCard className="mr-1" size={14} />
                                <span>Saver Day Pass: CHF {Number(fare.price_saverday).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          
                          {fare.isActivity ? (
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <FiMapPin className="mr-1" />
                              <span>출발지: {fare.from}</span>
                            </div>
                          ) : (
                            fare.duration && (
                              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <FiClock className="mr-1" />
                                <span>소요 시간: {formatDuration(fare.duration)}</span>
                              </div>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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

      {/* 스위스 트래블 패스 판매처 모달 */}
      <SwissPassVendorModal isOpen={showModal} onClose={handleCloseModal} />
    </>
  );
}
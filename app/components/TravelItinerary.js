'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiMapPin, FiSun, FiDollarSign, FiInfo, FiHome, FiUsers, FiPlus } from 'react-icons/fi';
import { FaShip, FaMountain, FaTram, FaTrain } from 'react-icons/fa';
import SwissMap from './SwissMap';
import TransportationCost from './TransportationCost';
import ActivityModal from './ActivityModal'; // 새로 만든 모달 컴포넌트 import
import { cityToStation } from '../../utils/cityToStation';
import locationData from './../../utils/locationData';
import './../../styles/TravelItinerary.css';
import swissAttractions from './../../data/swiss_attraction.json';

// 교통 수단에 따른 아이콘 선택 (TravelItinerary에도 추가)
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

// 여행 스타일 한글 매핑
const travelStyleMap = {
  'nature': '자연 경관 위주',
  'activity': '하이킹과 액티비티',
  'balanced': '자연+도시 조화'
};

// 그룹 타입 한글 매핑
const groupTypeMap = {
  'solo': '나홀로',
  'couple': '커플',
  'family': '가족',
  'friends': '친구',
  'seniors': '시니어'
};

// 활동 위치를 기반으로 위도,경도 정보를 생성하는 함수
const generateLocationsFromActivities = (days) => {
  if (!days || !Array.isArray(days)) return [];
  
  let locationId = 1;
  const locations = [];
  
  days.forEach((day, dayIndex) => {
    // 숙박 정보가 있으면 추가
    if (day.accommodation) {
      const coords = locationData[day.accommodation];
      if (coords) {
        locations.push({
          id: `accommodation-${dayIndex}`,
          name: `${day.accommodation} (숙박)`,
          description: `Day ${day.day} 숙박`,
          type: 'hotel',
          lat: coords.lat,
          lng: coords.lng
        });
      }
    }
    
    // 활동 정보 추가
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity, actIndex) => {

        // if(activity.location === )
        // 활동에 직접 lat, lng 값이 있는지 확인
        if (activity.lat && activity.lng) {
          locations.push({
            id: `activity-${locationId++}`,
            name: `${actIndex + 1}. ${activity.title}`,
            description: activity.description,
            type: 'attraction',
            duration: activity.duration,
            lat: activity.lat,
            lng: activity.lng
          });
        }
        // 직접적인 좌표가 없지만 location 이름이 있는 경우
        else if (activity.location) {
          // 도시 좌표 데이터에서 찾기
          const coords = locationData[activity.location];
          
          if (coords) {
            locations.push({
              id: `activity-${locationId++}`,
              name: `${actIndex + 1}. ${activity.title}`,
              description: activity.description,
              type: 'attraction',
              duration: activity.duration,
              // 여러 활동이 같은 장소에 있을 경우 살짝 위치를 분산
              lat: coords.lat + (Math.random() * 0.01 - 0.005),
              lng: coords.lng + (Math.random() * 0.01 - 0.005)
            });
          }
        }
      });
    }
  });
  
  return locations;
};

// Swiss attraction 가격 정보를 활동에 추가하는 함수
const addAttractionPrices = (travelPlan) => {
  try {
    // 명소 이름으로 빠르게 검색하기 위한 맵 생성
    const attractionMap = {};
    swissAttractions.forEach(attraction => {
      attractionMap[attraction.Name_Eng] = attraction;
    });
    
    // 여행 계획 복사본 생성
    const updatedPlan = { ...travelPlan };
    
    // 각 일자의 활동 순회
    updatedPlan.days.forEach(day => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(activity => {
          if (activity.location) {
            // location과 일치하는 명소 찾기
            const matchedAttraction = attractionMap[activity.location];
            console.log("matchedAttraction: ",matchedAttraction);
            
            // 일치하는 명소가 있고 2nd Class Price가 있으면 price 속성 추가
            if (matchedAttraction && matchedAttraction['2nd Class Price']) {
              activity.price = matchedAttraction['2nd Class Price'];
            }
            // 일치하는 명소가 있고 교통수단 Transportation이 있으면 Transportation이 속성 추가
            if (matchedAttraction && matchedAttraction.Transportation) {
              activity.transportation = matchedAttraction.Transportation;
            }
          }
        });
      }
    });
    
    return updatedPlan;
  } catch (error) {
    console.error('스위스 명소 가격 추가 중 오류 발생:', error);
    return travelPlan; // 오류 발생 시 원본 여행 계획 반환
  }
};

export default function TravelItinerary({ travelPlan, onUpdatePlan }) {
  const [activeDay, setActiveDay] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [mapLocations, setMapLocations] = useState([]);

    // 액티비티 모달 상태 추가
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 여행 계획 데이터 상태 추가 (업데이트 가능하도록)
    const [planData, setPlanData] = useState(travelPlan);

  // 초기 데이터 로드와 가격 정보 업데이트
  useEffect(() => {
    if (travelPlan) {
      // 가격 정보가 추가된 업데이트된 여행 계획 받기
      const updatedPlan = addAttractionPrices(travelPlan);
      // 상태 업데이트
      setPlanData(updatedPlan);
      
      // 부모 컴포넌트에 변경 사항 전달 (필요한 경우)
      if (onUpdatePlan) {
        onUpdatePlan(updatedPlan);
      }
    }
  }, [travelPlan, onUpdatePlan]);

  if (!travelPlan) return null;

  const {
    title,
    description,
    travelStyle,
    days,
    recommendations,
    groupType,
    options,
    budgetBreakdown,
    transportationDetails
  } = travelPlan;
  
  // 현재 일자의 데이터
  const currentDay = days.find(day => day.day === activeDay) || days[0];
  
  // 지도에 표시할 위치 데이터 업데이트
  useEffect(() => {
    if (days) {
      const filteredDays = days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(filteredDays);
      setMapLocations(locations);
    }
  }, [activeDay, days]);

  // 새 일정 추가 핸들러
  const handleAddActivity = () => {
    setIsModalOpen(true);
  };

  // 새 액티비티를 여행 계획에 추가하는 함수
  const addActivityToDay = (newActivity) => {
    // 현재 데이터의 복사본 만들기
    const updatedPlanData = { ...planData };
    
    // 활동을 추가할 날짜 찾기
    const dayIndex = updatedPlanData.days.findIndex(day => day.day === activeDay);
    
    if (dayIndex !== -1) {
      // 해당 날짜의 활동 목록에 새 활동 추가
      updatedPlanData.days[dayIndex].activities.push(newActivity);
      
      // 상태 업데이트
      setPlanData(updatedPlanData);
      
      // 부모 컴포넌트에 변경 사항 전달 (필요한 경우)
      if (onUpdatePlan) {
        onUpdatePlan(updatedPlanData);
      }
      
      // 지도 데이터 다시 생성을 위해 현재 날짜 데이터 갱신
      const updatedDay = updatedPlanData.days.filter(day => day.day === activeDay);
      const locations = generateLocationsFromActivities(updatedDay);
      setMapLocations(locations);
    }
  };

  // 현재 위치와 기준점 찾기 (모달에 전달하기 위함)
  const getCurrentLocations = () => {
    // Day 객체에서 직접 in/out 값 가져오기
    const baseLocation = cityToStation(currentDay.In) || "";
    const endLocation = cityToStation(currentDay.Out) || "";
    
    return { baseLocation, endLocation };
  };

  const { baseLocation, endLocation } = getCurrentLocations();

  return (
    <div className="p-4 md:p-6">
      {/* 여행 제목 및 요약 */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="flex flex-wrap gap-2 text-sm">
          
          {options && options.startingCity && (
            <span className="trip-info-badge starting-city">
              <FiMapPin className="mr-1" /> In: {options.startingCity}
            </span>
          )}
          {options && options.endingCity && (
            <span className="trip-info-badge ending-city">
              <FiMapPin className="mr-1" /> Out: {options.endingCity}
            </span>
          )}
          {options && options.duration && (
            <span className="trip-info-badge duration">
              <FiClock className="mr-1" /> {options.duration}일
            </span>
          )}
          {options && options.travelStyle && (
            <span className="trip-info-badge travel-style">
              <FiSun className="mr-1" /> {travelStyleMap[options.travelStyle] || options.travelStyle}
            </span>
          )}
          {options && options.groupType && (
            <span className="trip-info-badge group-type">
              <FiUsers className="mr-1" /> {groupTypeMap[options.groupType] || options.groupType}
            </span>
          )}
        </div>
      </div>

      {/* 지도 섹션 */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Day {activeDay} 일정 지도</h2>
          <SwissMap locations={mapLocations} />
        </div>
      </div>

      {/* 일일 여행 계획 탭 */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {days.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-3 py-2 text-sm md:text-base rounded-t-lg transition-colors ${
                activeDay === day.day
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 일자의 여행 계획 */}
      {days.map((day) => {
        if (day.day !== activeDay) return null;

        return (
          <div key={day.day} >
            <div className="border rounded-lg overflow-hidden mb-6">
              {/* 일자 제목 */}
              <div className="bg-blue-50 p-4 border-b">
                <h2 className="text-xl font-semibold text-blue-800">{day.title}</h2>
                <p className="text-gray-600 mt-1">{day.description}</p>
              </div>

              {/* 활동 목록 */}
              <div className="divide-y">
                {day.activities.map((activity, index) => (
                  <div key={index} className="p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="activity-number" >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          {activity.location && (
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <FiMapPin className="mr-1" size={12} /> {activity.location}
                            </div>
                          )}
                          {/* 가격 정보 표시 - 별도 라인으로 분리 */}
                          {activity.price && (
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <FiDollarSign className="mr-2 text-gray-600" />
                              <span>CHF {activity.price}</span>
                            </div>
                          )}
                          {/* 교통 수단 정보 표시 (새로 추가) */}
                          {activity.transportation && (
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <TransportIcon type={activity.transportation} />
                              {activity.transportation} 
                              {/* {activity.price && `(${activity.price})`} */}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm whitespace-nowrap">
                        {activity.duration}
                      </div>
                    </div>

                    <div className="mt-2 text-gray-600 text-sm pl-20">
                      {activity.description}
                    </div>
                  </div>
                ))}
                
                {/* 일정 추가 버튼 */}
                <div className="p-4 bg-white">
                  <button 
                    onClick={handleAddActivity}
                    className="w-full py-3 flex items-center justify-center text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    일정 추가하기
                  </button>
                </div>
              </div>
              
              {/* 숙박 정보 - 일정 아래로 이동 */}
              {day.accommodation && (
                <div className="bg-blue-50 p-4 border-t flex items-center">
                  <FiHome className="mr-2 text-blue-700" />
                  <span className="font-medium text-blue-800">숙박:</span>
                  <span className="ml-2 text-blue-700">{day.accommodation}</span>
                </div>
              )}
            </div>
            
            {/* 해당 일자의 여행 팁 - 완전히 분리된 별도 컨테이너로 구현 */}
            {day.recommendations && (
              <div className="mt-4 mb-6">
                <div className="rounded-lg overflow-hidden border border-amber-200">
                  <div className="w-full flex items-center bg-amber-50 p-4 text-amber-800 font-medium border-b border-amber-200">
                    <FiInfo className="mr-2" />
                    여행 팁 및 추천
                  </div>
                  
                  <div className="p-4 bg-amber-50 text-gray-700">
                    {day.recommendations.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 액티비티 추가 모달 */}
      <ActivityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddActivity={addActivityToDay}
        currentDay={activeDay}
        baseLocation={baseLocation}
        endLocation={endLocation}
      />

      {/* 교통 비용 정보 컴포넌트 추가 */}
      {transportationDetails && budgetBreakdown && (
        <TransportationCost 
          transportationDetails={transportationDetails} 
          budgetBreakdown={budgetBreakdown} 
        />
      )}
    </div>
  );
}
// utils/calculateCost.js
import { cityToStation } from './cityToStation';
import transportationData from '../data/transportation';

/**
 * 두 역 사이의 교통 요금을 찾는 함수
 * @param {string} from 출발역
 * @param {string} to 도착역
 * @returns {Object|null} 요금 정보 또는 찾지 못한 경우 null
 */
function findTransportationFare(from, to) {
  const route = transportationData.find(r => 
    r.Departure === from && r.Arrival === to
  );
  
  if (route) {
    return {
      firstClassPrice: route['1st Class Price'],
      secondClassPrice: route['2nd Class Price'],
      duration: route.Duration,
      transferCounts: route['Transfer Counts'] || 0,
      via: route.Via || []
    };
  }
  
  return null;
}

/**
 * 총 여행 비용을 계산하는 함수
 * @param {Array} days 여행 일정 배열
 * @returns {Object} 계산된 비용 및 세부 정보
 */
export function calculateTotalTravelCost(days) {
  let totalCost = 0;
  let segments = 0;
  const fareDetails = [];
  const missingRoutes = [];

  if (!days || days.length === 0) {
    return { totalCost: 0, segments: 0, fareDetails: [], missingRoutes: [] };
  }

  // 각 날짜별로 In/Out이 다른 경우에만 요금 계산
  days.forEach(day => {
    if (day.In && day.Out && day.In !== day.Out) {
      // 도시를 역 이름으로 변환
      const fromStation = cityToStation(day.In);
      const toStation = cityToStation(day.Out);
      
      // 요금 정보 찾기
      const fareInfo = findTransportationFare(fromStation, toStation);
      
      if (fareInfo) {
        // 요금이 있는 경우 합산
        totalCost += fareInfo.secondClassPrice;
        segments++;
        
        // 개별 요금 정보 추가
        fareDetails.push({
          day: day.day,
          from: fromStation,
          to: toStation,
          price: fareInfo.secondClassPrice,
          duration: fareInfo.duration
        });
      } else {
        // 요금 정보가 없는 경우 기록
        missingRoutes.push({
          day: day.day,
          from: fromStation,
          to: toStation
        });
      }
    }
  });

  return {
    totalCost: totalCost.toFixed(2),
    segments,
    fareDetails,
    missingRoutes
  };
}

/**
 * 특정 일자의 활동에 대한 비용 계산 함수
 * @param {Array} activities 활동 배열
 * @returns {number} 활동 비용 합계
 */
export function calculateActivitiesCost(activities) {
  if (!activities || !Array.isArray(activities)) {
    return 0;
  }
  
  return activities.reduce((total, activity) => {
    // 가격이 있는 경우에만 합산 (숫자로 변환하여 계산)
    if (activity.price) {
      const price = parseFloat(activity.price);
      return isNaN(price) ? total : total + price;
    }
    return total;
  }, 0);
}

/**
 * 전체 여행 일정에 대한 총 비용 계산 함수 (교통비 + 활동비)
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} 비용 세부 내역
 */
export function calculateCompleteTravelCost(travelPlan) {
  if (!travelPlan || !travelPlan.days) {
    return {
      transportationCost: 0,
      activitiesCost: 0,
      totalCost: 0,
      details: {
        transportationDetails: [],
        missingRoutes: []
      }
    };
  }

  // 교통비 계산
  const transportationResult = calculateTotalTravelCost(travelPlan.days);
  
  // 활동비 계산
  let totalActivitiesCost = 0;
  travelPlan.days.forEach(day => {
    totalActivitiesCost += calculateActivitiesCost(day.activities);
  });
  
  // 총 비용 계산
  const totalCost = parseFloat(transportationResult.totalCost) + totalActivitiesCost;
  
  return {
    transportationCost: parseFloat(transportationResult.totalCost),
    activitiesCost: totalActivitiesCost,
    totalCost: totalCost.toFixed(2),
    details: {
      transportationDetails: transportationResult.fareDetails,
      missingRoutes: transportationResult.missingRoutes
    }
  };
}

export default {
  calculateTotalTravelCost,
  calculateActivitiesCost,
  calculateCompleteTravelCost
};
// utils/calculateTravelPlan.js
import { cityToStation } from './cityToStation';
import transportationData from '../data/transportation';
import swissAttractions from '../data/swiss_attraction';
import optimalSwissTravelPass from './optimalSwissTravelPass';

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
      swissTravelPass: 0,
      saverDayPass: 0,
      duration: route.Duration,
      transferCounts: route['Transfer Counts'] || 0,
      via: route.Via || []
    };
  }
  
  return null;
}

/**
 * 활동에 대한 비용 계산 함수
 * @param {Array} activities 활동 배열
 * @returns {number} 활동 비용 합계
 */
function calculateActivitiesCost(activities) {
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
 * 여행 계획에 In/Out 정보 추가하는 함수
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} In/Out 정보가 추가된 여행 계획
 */
export function addingInOutInDays(travelPlan) {
  if (!travelPlan || !travelPlan.days || travelPlan.days.length === 0) {
    return travelPlan;
  }

  // 첫째 날: In은 Starting City, Out은 첫날 숙소
  travelPlan.days[0].In = travelPlan.startingCity;
  travelPlan.days[0].Out = travelPlan.days[0].accommodation;
    
  // 중간 날짜들: In은 전날 숙소, Out은 당일 숙소
  for (let i = 1; i < travelPlan.days.length - 1; i++) {
    travelPlan.days[i].In = travelPlan.days[i-1].accommodation;
    travelPlan.days[i].Out = travelPlan.days[i].accommodation;
  }
    
  // 마지막 날: In은 전날 숙소, Out은 Ending City
  const lastIndex = travelPlan.days.length - 1;
  if (lastIndex > 0) {
    travelPlan.days[lastIndex].In = travelPlan.days[lastIndex-1].accommodation;
    travelPlan.days[lastIndex].Out = travelPlan.endingCity;
  }

  return travelPlan;
}

/**
 * 여행 계획의 모든 비용을 계산하고 travelPlan 객체에 업데이트하는 함수
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} 업데이트된 여행 계획
 */
export function calculateCost(travelPlan) {
  if (!travelPlan || !travelPlan.days || travelPlan.days.length === 0) {
    return travelPlan;
  }

  // 교통 비용 계산
  let totalTransportCost = 0;
  let segments = 0;
  const fareDetails = [];
  const missingRoutes = [];

  // 각 날짜별로 비용 계산
  travelPlan.days.forEach(day => {
    let dayTransportCost = 0;
    
    // 1. In과 첫 번째 활동 base 사이의 비용
    if (day.In && day.activities && day.activities.length > 0 && day.activities[0].base) {
      const fromStation = cityToStation(day.In);
      const toStation = cityToStation(day.activities[0].base);
      
      if (fromStation === toStation) {
        // 역 이름이 동일하면 비용 0으로 설정하고 fareDetails에 추가하지 않음
      } else {
        const fareInfo = findTransportationFare(fromStation, toStation);
        
        if (fareInfo) {
          dayTransportCost += fareInfo.secondClassPrice;
          segments++;
          
          fareDetails.push({
            day: day.day,
            from: fromStation,
            to: toStation,
            price: fareInfo.secondClassPrice,
            price_swisstravel: fareInfo.swissTravelPass || 0,
            price_saverday: fareInfo.saverDayPass || 0,
            duration: fareInfo.duration
          });
        } else {
          missingRoutes.push({
            day: day.day,
            from: fromStation,
            to: toStation
          });
        }
      }
    }
    
    // 2. 각 활동의 가격 및 활동 base 간의 이동 비용
    if (day.activities && Array.isArray(day.activities)) {
      // 각 활동의 가격을 fareDetails에 추가
      day.activities.forEach((activity, index) => {
        
        if (activity.price) {
          const price = parseFloat(activity.price);
          const price_swisstravel = parseFloat(activity.price_swisstravel);
          const price_saverday = parseFloat(activity.price_saverday);
          if (!isNaN(price) && price > 0) {
            fareDetails.push({
              day: day.day,
              from: activity.base || 'N/A',
              to: activity.location || 'N/A',
              price: price,
              price_swisstravel: price_swisstravel,
              price_saverday: price_saverday,
              duration: 0,
              isActivity: true,
              activityName: activity.name || `Activity ${index + 1}`
            });
          }
        }
      });
      
      // base 간 이동 비용 계산
      for (let i = 0; i < day.activities.length - 1; i++) {
        const currentActivity = day.activities[i];
        const nextActivity = day.activities[i + 1];
        
        if (currentActivity.base && nextActivity.base) {
          const fromStation = cityToStation(currentActivity.base);
          const toStation = cityToStation(nextActivity.base);
          
          if (fromStation === toStation) {
            // 역 이름이 동일하면 비용 0으로 설정하고 fareDetails에 추가하지 않음
          } else {
            const fareInfo = findTransportationFare(fromStation, toStation);
            
            if (fareInfo) {
              dayTransportCost += fareInfo.secondClassPrice;
              segments++;
              
              fareDetails.push({
                day: day.day,
                from: fromStation,
                to: toStation,
                price: fareInfo.secondClassPrice,
                price_swisstravel: fareInfo.swissTravelPass || 0,
                price_saverday: fareInfo.saverDayPass || 0,
                duration: fareInfo.duration
              });
            } else {
              missingRoutes.push({
                day: day.day,
                from: fromStation,
                to: toStation
              });
            }
          }
        }
      }
    }
    
    // 3. 마지막 활동 base와 Out 사이의 비용
    if (day.Out && day.activities && day.activities.length > 0) {
      const lastActivity = day.activities[day.activities.length - 1];
      
      if (lastActivity.base) {
        const fromStation = cityToStation(lastActivity.base);
        const toStation = cityToStation(day.Out);
        
        if (fromStation === toStation) {
          // 역 이름이 동일하면 비용 0으로 설정하고 fareDetails에 추가하지 않음
        } else {
          const fareInfo = findTransportationFare(fromStation, toStation);
          
          if (fareInfo) {
            dayTransportCost += fareInfo.secondClassPrice;
            segments++;
            
            fareDetails.push({
              day: day.day,
              from: fromStation,
              to: toStation,
              price: fareInfo.secondClassPrice,
              price_swisstravel: fareInfo.swissTravelPass || 0,
              price_saverday: fareInfo.saverDayPass || 0,
              duration: fareInfo.duration
            });
          } else {
            missingRoutes.push({
              day: day.day,
              from: fromStation,
              to: toStation
            });
          }
        }
      }
    }
    
    // 일별 교통 비용 기록 (옵션)
    day.transportCost = dayTransportCost.toFixed(2);
    
    // 총 교통 비용에 더하기
    totalTransportCost += dayTransportCost;
  });

  // 액티비티 비용은 이미 fareDetails에 포함됨
  // 총 액티비티 비용 계산 (fareDetails에서 isActivity가 true인 항목들의 합계)
  const totalActivitiesCost = fareDetails
    .filter(item => item.isActivity)
    .reduce((sum, item) => sum + item.price, 0);

  const sumCost = totalTransportCost+totalActivitiesCost;

  // 교통 비용 정보 생성
  const transportCostInfo = {
    totalCost: sumCost.toFixed(2),
    segments,
    fareDetails,
    missingRoutes
  };

  // 예산 정보가 없으면 새로 생성
  if (!travelPlan.budgetBreakdown) {
    travelPlan.budgetBreakdown = {};
  }
  
  // 교통 예산 정보 추가
  travelPlan.budgetBreakdown.transportation = 
    `약 CHF ${transportCostInfo.totalCost} (2등석 기준, ${transportCostInfo.segments}개 구간)`;
  
  // 활동 비용 추가 (없는 경우)
  if (!travelPlan.budgetBreakdown.activities) {
    travelPlan.budgetBreakdown.activities = `약 CHF ${totalActivitiesCost.toFixed(2)}`;
  }
  
  // 전체 예산 계산 및 추가
  if (travelPlan.budgetBreakdown.accommodation && 
      travelPlan.budgetBreakdown.food) {
    travelPlan.budgetBreakdown.total = "상세 항목의 합계를 참고하세요";
  }
  
  // 개별 교통 요금 정보 추가
  travelPlan.transportationDetails = transportCostInfo;
  
  return travelPlan;
}


/**
 * Saver Day Pass와 일반 요금을 비교하여 더 경제적인 옵션을 찾는 함수
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} Saver Day Pass 비교 정보가 추가된 여행 계획
 */
export function compareSaverDayPass(travelPlan) {
  if (!travelPlan || !travelPlan.transportationDetails || !travelPlan.transportationDetails.fareDetails) {
    return travelPlan;
  }

  const fareDetails = travelPlan.transportationDetails.fareDetails;
  const saverDayRecommendations = [];
  
  // 날짜별로 그룹화
  const dayGroups = {};
  
  // 1. 각 날짜별로 일반 요금(price)과 세이버데이패스 요금(price_saverday)을 합산
  fareDetails.forEach(fare => {
    const day = fare.day;
    
    if (!dayGroups[day]) {
      dayGroups[day] = {
        day,
        sum_price: 0,
        sum_price_saverday: 0,
        fares: []
      };
    }
    
    // 일반 요금 합산
    if (fare.price && !isNaN(parseFloat(fare.price))) {
      dayGroups[day].sum_price += parseFloat(fare.price);
    }
    
    // 세이버데이패스 요금 합산
    if (fare.price_saverday && !isNaN(parseFloat(fare.price_saverday))) {
      dayGroups[day].sum_price_saverday += parseFloat(fare.price_saverday);
    } else if (fare.isActivity) {
      // 활동인 경우 일반 요금을 세이버데이패스 요금에도 합산 (세이버데이패스로 할인이 없는 경우)
      dayGroups[day].sum_price_saverday += parseFloat(fare.price_saverday || 0);
    }
    
    // 운임 상세 정보 저장
    dayGroups[day].fares.push(fare);
  });
  
  // 2. 세이버데이패스 가격은 현재 52 CHF로 설정
  const SAVER_DAY_PASS_PRICE = 52;
  
  // 3. 일반 요금과 세이버데이패스 요금 차이가 52 CHF보다 큰 날짜 찾기
  for (const day in dayGroups) {
    const group = dayGroups[day];
    const priceDifference = group.sum_price - group.sum_price_saverday;
    
    // 일반 요금과 세이버데이패스를 사용한 요금 + 세이버데이패스 가격의 차이 계산
    const savings = group.sum_price - (group.sum_price_saverday + SAVER_DAY_PASS_PRICE);
    
    // 세이버데이패스가 더 경제적인 경우
    if (savings > 0) {
      saverDayRecommendations.push({
        day: parseInt(day),
        sum_price: group.sum_price.toFixed(2),
        sum_price_saverday: group.sum_price_saverday.toFixed(2),
        savings: savings.toFixed(2)
      });
    }
  }
  
  // 4. 결과를 transportationDetails에 저장
  if (!travelPlan.transportationDetails.saverDayRecommendations) {
    travelPlan.transportationDetails.saverDayRecommendations = saverDayRecommendations;
  } else {
    travelPlan.transportationDetails.saverDayRecommendations = saverDayRecommendations;
  }
  
  return travelPlan;
}

/**
 * Swiss attraction 가격 정보를 활동에 추가하는 함수
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} 업데이트된 여행 계획
 */
export function addAttractionPrices(travelPlan) {
  try {
    // 명소 이름별로 그룹화하여 저장
    const attractionGroups = {};
    swissAttractions.forEach(attraction => {
      if (!attraction.Name_Eng) return;
      
      const name = attraction.Name_Eng;
      if (!attractionGroups[name]) {
        attractionGroups[name] = [];
      }
      attractionGroups[name].push(attraction);
    });
    
    // 여행 계획 복사본 생성
    const updatedPlan = { ...travelPlan };
    
    // 각 일자의 활동 순회
    updatedPlan.days.forEach(day => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(activity => {
          if (!activity.location) return;
          
          // // 이미 가격이 있는 경우 건너뛰기
          // if (activity.price) return;
          
          // location과 일치하는 명소 그룹 찾기
          const matchedGroup = attractionGroups[activity.location];
          
          if (!matchedGroup || matchedGroup.length === 0) return;
          
          // 여러 매칭이 있는 경우, 최적의 명소 선택
          let bestAttraction;
          if (matchedGroup.length === 1) {
            // 하나만 있으면 그것을 사용
            bestAttraction = matchedGroup[0];
          } else {
            // 여러 개가 있으면 다음 우선순위로 선택:
            
            // 1. activity.base와 일치하는 Base 값을 가진 명소
            if (activity.base) {
              bestAttraction = matchedGroup.find(attr => 
                attr.base === activity.base || attr.Base === activity.base
              );
            }
            
            // 2. 1번이 없으면, day.In(출발지)과 일치하는 Base 값을 가진 명소
            if (!bestAttraction && day.In) {
              bestAttraction = matchedGroup.find(attr => 
                attr.base === day.In || attr.Base === day.In
              );
            }
            
            // 3. 2번도 없으면, day.Out(도착지)과 일치하는 Base 값을 가진 명소
            if (!bestAttraction && day.Out) {
              bestAttraction = matchedGroup.find(attr => 
                attr.base === day.Out || attr.Base === day.Out
              );
            }
            
            // 4. 3번도 없으면, 가장 짧은 소요시간(Duration)을 가진 명소
            if (!bestAttraction) {
              bestAttraction = matchedGroup.sort((a, b) => {
                // 시간 문자열에서 숫자만 추출 (예: "5:00" -> 5.0)
                const getHours = (duration) => {
                  if (!duration) return 999; // 시간 정보가 없으면 최하위 우선순위
                  const parts = duration.split(':');
                  return parts.length === 2 
                    ? parseFloat(parts[0]) + parseFloat(parts[1])/60 
                    : parseFloat(parts[0]);
                };
                return getHours(a.Duration) - getHours(b.Duration);
              })[0];
            }
          }
          
          // 최적의 명소를 찾았으면 정보 추가
          if (bestAttraction) {
              // 가격 정보 추가 - 패스 가격이 없는 경우에만 추가
              if (bestAttraction['2nd Class Price']) {
                // 기본 가격 설정 (가격이 없는 경우에만)
                if (!activity.price) {
                  activity.price = bestAttraction['2nd Class Price'];
                }

              // 패스 가격 설정 (기존 패스 가격이 없는 경우에도 항상 추가)
              activity.price_swisstravel = activity.price_swisstravel || bestAttraction['SwissTravelPass'] || 0;
              activity.price_saverday = activity.price_saverday || bestAttraction['SaverDayPass'] || 0;

            }
            
            // 교통수단 정보 추가
            if (bestAttraction.Transportation && !activity.transportation) {
              activity.transportation = bestAttraction.Transportation;
            }
            
            // 베이스 정보 추가
            if ((bestAttraction.base || bestAttraction.Base) && !activity.base) {
              activity.base = bestAttraction.base || bestAttraction.Base;
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
}

/**
 * 여행 계획에 In/Out 정보를 추가하고 비용을 계산하는 통합 함수
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} 업데이트된 여행 계획
 */
export function calculateTravelPlan(travelPlan) {
  // 1. 명소 가격 정보 추가
  travelPlan = addAttractionPrices(travelPlan);
  
  // 2. In/Out 정보 추가
  travelPlan = addingInOutInDays(travelPlan);
  
  // 3. 비용 계산 및 업데이트
  travelPlan = calculateCost(travelPlan);

  // 4. 세이버데이패스 Saver Day Pass 비교
  travelPlan = compareSaverDayPass(travelPlan);

  // 5. 스위스트래블패스 Swiss Travel Pass 찾기
  travelPlan = optimalSwissTravelPass(travelPlan);
  
  return travelPlan;
}

export default {
  calculateCost,
  calculateTravelPlan
};
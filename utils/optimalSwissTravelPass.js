/**
 * Swiss Travel Pass 최적화 함수
 * @param {Object} travelPlan 여행 계획 데이터
 * @returns {Object} Swiss Travel Pass 최적화 정보가 추가된 여행 계획
 */
export function optimalSwissTravelPass(travelPlan) {
    try {
      // 여행 계획이 유효한지 확인
      if (!travelPlan || !travelPlan.days || !travelPlan.transportationDetails || 
          !travelPlan.transportationDetails.fareDetails) {
        return travelPlan;
      }
  
      // 1. Swiss Travel Pass 데이터 로드 (예시 경로, 실제 환경에 맞게 조정 필요)
      const swissTravelPassData = require('../data/swisstravelpass.json');
      
      // "consecutive" 타입의 패스 찾기
      const consecutivePass = swissTravelPassData.find(pass => pass.type === "consecutive");
      
      if (!consecutivePass || !consecutivePass.prices) {
        console.error('Swiss Travel Pass 데이터를 찾을 수 없습니다.');
        return travelPlan;
      }
      
      // 2등석 성인 가격 추출 (요구사항에 맞게)
      const passPrices = {};
      consecutivePass.prices.forEach(price => {
        if (price.class === "2nd") {
          passPrices[price.duration] = price.adult;
        }
      });
      
      // 2. 일별 비용 계산 (일반 가격과 Swiss Travel Pass 적용 가격)
      const fareDetails = travelPlan.transportationDetails.fareDetails;
      const dayGroups = {};
      
      fareDetails.forEach(fare => {
        const day = fare.day;
        
        if (!dayGroups[day]) {
          dayGroups[day] = {
            day,
            sum_price: 0,
            sum_price_swisstravel: 0,
            fares: []
          };
        }
        
        // 일반 가격 합산
        if (fare.price && !isNaN(parseFloat(fare.price))) {
          dayGroups[day].sum_price += parseFloat(fare.price);
        }
        
        // Swiss Travel Pass 적용 가격 합산
        if (fare.price_swisstravel !== undefined && !isNaN(parseFloat(fare.price_swisstravel))) {
          dayGroups[day].sum_price_swisstravel += parseFloat(fare.price_swisstravel);
        } else if (fare.isActivity) {
          // 활동인 경우 일반 요금 적용 (Swiss Travel Pass로 할인이 없는 경우)
          dayGroups[day].sum_price_swisstravel += parseFloat(fare.price || 0);
        }
        
        // 운임 상세 정보 저장
        dayGroups[day].fares.push(fare);
      });
      
      // 일별 요약 정보 생성 (정렬된)
      const dailySummary = Object.values(dayGroups).sort((a, b) => a.day - b.day);
      
      // 3. 총 여행 일수 확인
      const totalDays = travelPlan.days.length;
      
      // 4. 다양한 Swiss Travel Pass 조합 평가
      const passOptions = [];
      
      // 케이스별 로직 구현
      if (totalDays <= 2) {
        // 1-2일: 패스 없음
        passOptions.push({
          option: "No Pass",
          type: null,
          description: "1-2일 여행에는 Swiss Travel Pass가 경제적이지 않습니다.",
          totalCost: calculateTotalRegularCost(dailySummary),
          savings: 0
        });
      } 
      else if (totalDays === 3) {
        // 3일: Swiss Travel Pass 3일권
        const pass3DayCost = passPrices[3];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings = regularCost - (swissTravelCost + pass3DayCost);
        
        passOptions.push({
          option: "3 Day Swiss Travel Pass",
          description: "3일 전체에 Swiss Travel Pass 3일권 사용",
          type: "3 Day",
          passCost: pass3DayCost,
          totalCost: swissTravelCost + pass3DayCost,
          regularCost: regularCost,
          savings: savings
        });
      } 
      else if (totalDays === 4) {
        // 4일: 여러 옵션 비교
        // 옵션 1: 4일 패스
        const pass4DayCost = passPrices[4];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass4DayCost);
        
        passOptions.push({
          option: "4 Day Swiss Travel Pass",
          description: "4일 전체에 Swiss Travel Pass 4일권 사용",
          type: "4 Day",
          passCost: pass4DayCost,
          totalCost: swissTravelCost + pass4DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
        // 옵션 2: 첫날 일반 요금 + 3일 패스
        const firstDayCost = dailySummary[0]?.sum_price || 0;
        const restDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [2, 3, 4]);
        const pass3DayCost = passPrices[3];
        const totalOption2 = firstDayCost + restDaysSwissTravelCost + pass3DayCost;
        const savings2 = regularCost - totalOption2;
        
        passOptions.push({
          option: "First Day Regular + 3 Day Pass",
          description: "첫날은 일반 요금, 나머지 3일은 Swiss Travel Pass 3일권 사용",
          type: "3 Day",
          passCost: pass3DayCost,
          totalCost: totalOption2,
          regularCost: regularCost,
          savings: savings2
        });
        
        // 옵션 3: 마지막날 일반 요금 + 3일 패스
        const lastDayCost = dailySummary[dailySummary.length - 1]?.sum_price || 0;
        const firstDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [1, 2, 3]);
        const totalOption3 = lastDayCost + firstDaysSwissTravelCost + pass3DayCost;
        const savings3 = regularCost - totalOption3;
        
        passOptions.push({
          option: "Last Day Regular + 3 Day Pass",
          description: "처음 3일은 Swiss Travel Pass 3일권 사용, 마지막날은 일반 요금",
          type: "3 Day",
          passCost: pass3DayCost,
          totalCost: totalOption3,
          regularCost: regularCost,
          savings: savings3
        });
      } 
      else if (totalDays === 5) {
        // 5일: 여러 옵션 비교
        // 옵션 1: 6일 패스
        const pass6DayCost = passPrices[6];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass6DayCost);
        
        passOptions.push({
          option: "6 Day Swiss Travel Pass",
          description: "5일 전체에 Swiss Travel Pass 6일권 사용 (1일 여유)",
          type: "6 Day",
          passCost: pass6DayCost,
          totalCost: swissTravelCost + pass6DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
        // 옵션 2: 첫날 일반 요금 + 4일 패스
        const firstDayCost = dailySummary[0]?.sum_price || 0;
        const restDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [2, 3, 4, 5]);
        const pass4DayCost = passPrices[4];
        const totalOption2 = firstDayCost + restDaysSwissTravelCost + pass4DayCost;
        const savings2 = regularCost - totalOption2;
        
        passOptions.push({
          option: "First Day Regular + 4 Day Pass",
          description: "첫날은 일반 요금, 나머지 4일은 Swiss Travel Pass 4일권 사용",
          type: "4 Day",
          passCost: pass4DayCost,
          totalCost: totalOption2,
          regularCost: regularCost,
          savings: savings2
        });
        
        // 옵션 3: 마지막날 일반 요금 + 4일 패스
        const lastDayCost = dailySummary[dailySummary.length - 1]?.sum_price || 0;
        const firstDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [1, 2, 3, 4]);
        const totalOption3 = lastDayCost + firstDaysSwissTravelCost + pass4DayCost;
        const savings3 = regularCost - totalOption3;
        
        passOptions.push({
          option: "Last Day Regular + 4 Day Pass",
          description: "처음 4일은 Swiss Travel Pass 4일권 사용, 마지막날은 일반 요금",
          type: "4 Day",
          passCost: pass4DayCost,
          totalCost: totalOption3,
          regularCost: regularCost,
          savings: savings3
        });
      } 
      else if (totalDays === 6) {
        // 6일: 여러 옵션 비교
        // 옵션 1: 6일 패스
        const pass6DayCost = passPrices[6];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass6DayCost);
        
        passOptions.push({
          option: "6 Day Swiss Travel Pass",
          description: "6일 전체에 Swiss Travel Pass 6일권 사용",
          type: "6 Day",
          passCost: pass6DayCost,
          totalCost: swissTravelCost + pass6DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
        // 옵션 2: 처음 2일 일반 요금 + 4일 패스
        const first2DaysCost = (dailySummary[0]?.sum_price || 0) + (dailySummary[1]?.sum_price || 0);
        const restDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [3, 4, 5, 6]);
        const pass4DayCost = passPrices[4];
        const totalOption2 = first2DaysCost + restDaysSwissTravelCost + pass4DayCost;
        const savings2 = regularCost - totalOption2;
        
        passOptions.push({
          option: "First 2 Days Regular + 4 Day Pass",
          description: "처음 2일은 일반 요금, 나머지 4일은 Swiss Travel Pass 4일권 사용",
          type: "4 Day",
          passCost: pass4DayCost,
          totalCost: totalOption2,
          regularCost: regularCost,
          savings: savings2
        });
        
        // 옵션 3: 마지막 2일 일반 요금 + 4일 패스
        const last2DaysCost = (dailySummary[dailySummary.length - 2]?.sum_price || 0) + 
                             (dailySummary[dailySummary.length - 1]?.sum_price || 0);
        const firstDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [1, 2, 3, 4]);
        const totalOption3 = last2DaysCost + firstDaysSwissTravelCost + pass4DayCost;
        const savings3 = regularCost - totalOption3;
        
        passOptions.push({
          option: "Last 2 Days Regular + 4 Day Pass",
          description: "처음 4일은 Swiss Travel Pass 4일권 사용, 마지막 2일은 일반 요금",
          type: "4 Day",
          passCost: pass4DayCost,
          totalCost: totalOption3,
          regularCost: regularCost,
          savings: savings3
        });
      } 
      else if (totalDays === 7) {
        // 7일: 여러 옵션 비교
        // 옵션 1: 8일 패스
        const pass8DayCost = passPrices[8];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass8DayCost);
        
        passOptions.push({
          option: "8 Day Swiss Travel Pass",
          description: "7일 전체에 Swiss Travel Pass 8일권 사용 (1일 여유)",
          type: "8 Day",
          passCost: pass8DayCost,
          totalCost: swissTravelCost + pass8DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
        // 옵션 2: 첫날 일반 요금 + 6일 패스
        const firstDayCost = dailySummary[0]?.sum_price || 0;
        const restDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [2, 3, 4, 5, 6, 7]);
        const pass6DayCost = passPrices[6];
        const totalOption2 = firstDayCost + restDaysSwissTravelCost + pass6DayCost;
        const savings2 = regularCost - totalOption2;
        
        passOptions.push({
          option: "First Day Regular + 6 Day Pass",
          description: "첫날은 일반 요금, 나머지 6일은 Swiss Travel Pass 6일권 사용",
          type: "6 Day",
          passCost: pass6DayCost,
          totalCost: totalOption2,
          regularCost: regularCost,
          savings: savings2
        });
        
        // 옵션 3: 마지막날 일반 요금 + 6일 패스
        const lastDayCost = dailySummary[dailySummary.length - 1]?.sum_price || 0;
        const firstDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [1, 2, 3, 4, 5, 6]);
        const totalOption3 = lastDayCost + firstDaysSwissTravelCost + pass6DayCost;
        const savings3 = regularCost - totalOption3;
        
        passOptions.push({
          option: "Last Day Regular + 6 Day Pass",
          description: "처음 6일은 Swiss Travel Pass 6일권 사용, 마지막날은 일반 요금",
          type: "6 Day",
          passCost: pass6DayCost,
          totalCost: totalOption3,
          regularCost: regularCost,
          savings: savings3
        });
      } 
      else if (totalDays === 8) {
        // 8일: 여러 옵션 비교
        // 옵션 1: 8일 패스
        const pass8DayCost = passPrices[8];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass8DayCost);
        
        passOptions.push({
          option: "8 Day Swiss Travel Pass",
          description: "8일 전체에 Swiss Travel Pass 8일권 사용",
          type: "8 Day",
          passCost: pass8DayCost,
          totalCost: swissTravelCost + pass8DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
        // 옵션 2: 처음 2일 일반 요금 + 6일 패스
        const first2DaysCost = (dailySummary[0]?.sum_price || 0) + (dailySummary[1]?.sum_price || 0);
        const restDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [3, 4, 5, 6, 7, 8]);
        const pass6DayCost = passPrices[6];
        const totalOption2 = first2DaysCost + restDaysSwissTravelCost + pass6DayCost;
        const savings2 = regularCost - totalOption2;
        
        passOptions.push({
          option: "First 2 Days Regular + 6 Day Pass",
          description: "처음 2일은 일반 요금, 나머지 6일은 Swiss Travel Pass 6일권 사용",
          type: "6 Day",
          passCost: pass6DayCost,
          totalCost: totalOption2,
          regularCost: regularCost,
          savings: savings2
        });
        
        // 옵션 3: 마지막 2일 일반 요금 + 6일 패스
        const last2DaysCost = (dailySummary[dailySummary.length - 2]?.sum_price || 0) + 
                             (dailySummary[dailySummary.length - 1]?.sum_price || 0);
        const firstDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [1, 2, 3, 4, 5, 6]);
        const totalOption3 = last2DaysCost + firstDaysSwissTravelCost + pass6DayCost;
        const savings3 = regularCost - totalOption3;
        
        passOptions.push({
          option: "Last 2 Days Regular + 6 Day Pass",
          description: "처음 6일은 Swiss Travel Pass 6일권 사용, 마지막 2일은 일반 요금",
          type: "6 Day",
          passCost: pass6DayCost,
          totalCost: totalOption3,
          regularCost: regularCost,
          savings: savings3
        });
      } 
      else if (totalDays === 9) {
        // 9일: 여러 옵션 비교
        // 옵션 1: 15일 패스 (과도하지만 고려)
        const pass15DayCost = passPrices[15];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass15DayCost);
        
        passOptions.push({
          option: "15 Day Swiss Travel Pass",
          description: "9일 전체에 Swiss Travel Pass 15일권 사용 (6일 여유)",
          type: "15 Day",
          passCost: pass15DayCost,
          totalCost: swissTravelCost + pass15DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
        // 옵션 2: 첫날 일반 요금 + 8일 패스
        const firstDayCost = dailySummary[0]?.sum_price || 0;
        const restDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [2, 3, 4, 5, 6, 7, 8, 9]);
        const pass8DayCost = passPrices[8];
        const totalOption2 = firstDayCost + restDaysSwissTravelCost + pass8DayCost;
        const savings2 = regularCost - totalOption2;
        
        passOptions.push({
          option: "First Day Regular + 8 Day Pass",
          description: "첫날은 일반 요금, 나머지 8일은 Swiss Travel Pass 8일권 사용",
          type: "8 Day",
          passCost: pass8DayCost,
          totalCost: totalOption2,
          regularCost: regularCost,
          savings: savings2
        });
        
        // 옵션 3: 마지막날 일반 요금 + 8일 패스
        const lastDayCost = dailySummary[dailySummary.length - 1]?.sum_price || 0;
        const firstDaysSwissTravelCost = calculateSwissTravelCostForDays(dailySummary, [1, 2, 3, 4, 5, 6, 7, 8]);
        const totalOption3 = lastDayCost + firstDaysSwissTravelCost + pass8DayCost;
        const savings3 = regularCost - totalOption3;
        
        passOptions.push({
          option: "Last Day Regular + 8 Day Pass",
          description: "처음 8일은 Swiss Travel Pass 8일권 사용, 마지막날은 일반 요금",
          type: "8 Day",
          passCost: pass8DayCost,
          totalCost: totalOption3,
          regularCost: regularCost,
          savings: savings3
        });
      } 
      else if (totalDays === 10) {
        // 10일: 여러 옵션 비교
        // 옵션 1: 15일 패스
        const pass15DayCost = passPrices[15];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings1 = regularCost - (swissTravelCost + pass15DayCost);
        
        passOptions.push({
          option: "15 Day Swiss Travel Pass",
          description: "10일 전체에 Swiss Travel Pass 15일권 사용 (5일 여유)",
          type: "15 Day",
          passCost: pass15DayCost,
          totalCost: swissTravelCost + pass15DayCost,
          regularCost: regularCost,
          savings: savings1
        });
        
      } 
      else {
        // 11일 이상: 15일 패스
        const pass15DayCost = passPrices[15];
        const regularCost = calculateTotalRegularCost(dailySummary);
        const swissTravelCost = calculateTotalSwissTravelCost(dailySummary);
        const savings = regularCost - (swissTravelCost + pass15DayCost);
        
        passOptions.push({
          option: "15 Day Swiss Travel Pass",
          description: `${totalDays}일 전체에 Swiss Travel Pass 15일권 사용 (${15-totalDays > 0 ? 15-totalDays : 0}일 여유)`,
          passCost: pass15DayCost,
          totalCost: swissTravelCost + pass15DayCost,
          regularCost: regularCost,
          savings: savings
        });
      }
      
      // 가장 저렴한 옵션 찾기 (저축액이 가장 큰 옵션)
      passOptions.sort((a, b) => b.savings - a.savings);
      const bestOption = passOptions[0];
      
      // 권장 사항 저장
      travelPlan.transportationDetails.swissTravelPassRecommendations = {
        bestOption: bestOption,
        allOptions: passOptions,
        dailySummary: dailySummary.map(day => ({
          day: day.day,
          regularCost: day.sum_price.toFixed(2),
          swissTravelCost: day.sum_price_swisstravel.toFixed(2)
        }))
      };
      
      return travelPlan;
    } catch (error) {
      console.error('Swiss Travel Pass 최적화 중 오류 발생:', error);
      return travelPlan; // 오류 발생 시 원본 여행 계획 반환
    }
  }
  
  /**
   * 일반 가격의 총액을 계산하는 헬퍼 함수
   * @param {Array} dailySummary 일별 요약 정보
   * @returns {number} 일반 가격 총액
   */
  function calculateTotalRegularCost(dailySummary) {
    return dailySummary.reduce((total, day) => total + day.sum_price, 0);
  }
  
  /**
   * Swiss Travel Pass 적용 가격의 총액을 계산하는 헬퍼 함수
   * @param {Array} dailySummary 일별 요약 정보
   * @returns {number} Swiss Travel Pass 적용 가격 총액
   */
  function calculateTotalSwissTravelCost(dailySummary) {
    return dailySummary.reduce((total, day) => total + day.sum_price_swisstravel, 0);
  }
  
  /**
   * 특정 날짜들의 Swiss Travel Pass 적용 가격을 계산하는 헬퍼 함수
   * @param {Array} dailySummary 일별 요약 정보
   * @param {Array} dayIndices 일자 인덱스 배열 (1부터 시작)
   * @returns {number} 지정된 날짜들의 Swiss Travel Pass 적용 가격 총액
   */
  function calculateSwissTravelCostForDays(dailySummary, dayIndices) {
    return dailySummary
      .filter(day => dayIndices.includes(day.day))
      .reduce((total, day) => total + day.sum_price_swisstravel, 0);
  }
  
  export default optimalSwissTravelPass;
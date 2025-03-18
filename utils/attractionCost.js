// 여행 계획의 활동에 스위스 명소 가격 정보를 추가하는 함수
const addAttractionPrices = async (travelPlan) => {
    try {
      // swiss_attraction.json 파일 읽기
      const response = await fetch('./../data/swiss_attraction.json');
      const attractions = await response.json();
      
      // 명소 이름으로 빠르게 검색하기 위한 맵 생성
      const attractionMap = {};
      attractions.forEach(attraction => {
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
              
              // 일치하는 명소가 있고 2nd Class Price가 있으면 price 속성 추가
              if (matchedAttraction && matchedAttraction['2nd Class Price']) {
                activity.price = matchedAttraction['2nd Class Price'];
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
  
  // 사용 예시
  /*
  // 컴포넌트 내에서 사용 방법
  useEffect(() => {
    const updatePrices = async () => {
      if (travelPlan) {
        const updatedPlan = await addAttractionPrices(travelPlan);
        setPlanData(updatedPlan);
        
        // 필요한 경우 부모 컴포넌트에 변경 사항 전달
        if (onUpdatePlan) {
          onUpdatePlan(updatedPlan);
        }
      }
    };
    
    updatePrices();
  }, [travelPlan]);
  */
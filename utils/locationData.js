/**
  utils/locationData.js
 * 스위스 주요 도시 및 기차역의 좌표 정보
 * 지도 표시 및 위치 기반 기능에 사용
 */

// 도시 및 기차역 좌표 매핑
const cityCoordinates = {
    // 주요 도시
    'Zurich': { lat: 47.3769, lng: 8.5417 },
    'Lucerne': { lat: 47.0502, lng: 8.3093 },
    'Interlaken': { lat: 46.6863, lng: 7.8632 },
    'Zermatt': { lat: 46.0207, lng: 7.7491 },
    'Geneva': { lat: 46.2044, lng: 6.1432 },
    'Bern': { lat: 46.9480, lng: 7.4474 },
    'Basel': { lat: 47.5596, lng: 7.5886 },
    'Grindelwald': { lat: 46.6244, lng: 8.0344 },
    'Lauterbrunnen': { lat: 46.5936, lng: 7.9081 },
    'Wengen': { lat: 46.6086, lng: 7.9222 },
    'Lausanne': { lat: 46.5197, lng: 6.6323 },
    'Montreux': { lat: 46.4312, lng: 6.9108 },
    'St. Moritz': { lat: 46.4908, lng: 9.8355 },
    'Lugano': { lat: 46.0037, lng: 8.9511 },
    'Murren': { lat: 46.5591, lng: 7.8922 },
    'Spiez': { lat: 46.6845, lng: 7.6830 },
    'Vevey': { lat: 46.4628, lng: 6.8419 },
    'Chur': { lat: 46.8508, lng: 9.5320 },
    'Adelboden': { lat: 46.4950, lng: 7.5567 },
    'Milano': { lat: 45.4840, lng: 9.2061 },
    'Venezia': { lat: 45.4404, lng: 12.3160 },
    'Firenze': { lat: 43.7700, lng: 11.2577 },
    'Roma': { lat: 41.8967, lng: 12.4822 },
    'Positano': { lat: 40.6295, lng: 14.4823 },
    'Dolomiti': { lat: 46.5754, lng: 11.6702 },
    'Paris': { lat: 48.8575, lng: 2.3514 },
    
    // 기차역 좌표
    'Zurich HB': { lat: 47.3783, lng: 8.5402 },
    'Bern': { lat: 46.9490, lng: 7.4400 },
    'Luzern': { lat: 47.0502, lng: 8.3093 },
    'Interlaken Ost': { lat: 46.6910, lng: 7.8696 },
    'Basel SBB': { lat: 47.5476, lng: 7.5905 },
    'Lausanne': { lat: 46.5175, lng: 6.6337 },
    'Zurich Flughafen': { lat: 47.4505, lng: 8.5619 },
    'Geneva Aeroport': { lat: 46.2307, lng: 6.1092 }
  };
  
  /**
   * 도시나 위치 이름으로 좌표 정보 조회
   * @param {string} locationName - 찾으려는 위치 이름
   * @returns {Object|null} - {lat, lng} 좌표 객체 또는 찾지 못한 경우 null
   */
  function getCoordinates(locationName) {
    return cityCoordinates[locationName] || null;
  }
  
  /**
   * 두 위치 사이의 거리를 계산 (km)
   * @param {string|Object} location1 - 첫 번째 위치 (좌표 객체 또는 위치 이름)
   * @param {string|Object} location2 - 두 번째 위치 (좌표 객체 또는 위치 이름)
   * @returns {number} - 두 위치 사이의 거리 (km)
   */
  function calculateDistance(location1, location2) {
    // 위치 이름이 문자열로 전달된 경우 좌표로 변환
    const coord1 = typeof location1 === 'string' ? getCoordinates(location1) : location1;
    const coord2 = typeof location2 === 'string' ? getCoordinates(location2) : location2;
    
    if (!coord1 || !coord2) return null;
    
    // 위도/경도를 라디안으로 변환
    const lat1 = coord1.lat * Math.PI / 180;
    const lng1 = coord1.lng * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const lng2 = coord2.lng * Math.PI / 180;
    
    // Haversine 공식을 사용한 거리 계산
    const R = 6371; // 지구 반경 (km)
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1) * Math.cos(lat2) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }
  
  // 필요한 함수 및 데이터 내보내기
  export default {
    cityCoordinates,
    getCoordinates,
    calculateDistance
  };
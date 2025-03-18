/**
 * 도시 이름을 기차역 이름으로 변환하는 함수
 * @param {string} city - 변환할 도시 이름
 * @returns {string} - 변환된 기차역 이름 또는 원래 도시 이름
 */
export function cityToStation(city) {
    switch(city) {
      case 'Zurich':
        return 'Zurich Flughafen';
      case 'Zürich':
        return 'Zurich Flughafen';
      case 'Interlaken':
        return 'Interlaken Ost';
      case 'Geneva':
        return 'Geneva Aeroport';
      case 'Frankfurt':
        return 'Basel SBB';
      case 'Basel':
        return 'Basel SBB';
      case 'Paris':
        return 'Basel SBB';
      default:
        return city; // 변환 규칙이 없는 경우 원래 이름 사용
    }
  }
  
  /**
   * 역 정보에서 도시 이름 추출하는 함수
   * @param {string} station - 역 이름
   * @returns {string} - 도시 이름
   */
  export function stationToCity(station) {
    if (station.includes('Zurich')) return 'Zurich';
    if (station.includes('Interlaken')) return 'Interlaken';
    if (station.includes('Geneva')) return 'Geneva';
    if (station.includes('Basel')) return 'Basel';
    if (station.includes('Luzern') || station.includes('Lucerne')) return 'Lucerne';
    if (station.includes('Bern')) return 'Bern';
    
    return station; // 매칭되는 도시 없을 경우 원래 이름 반환
  }
/**
 * 시간 문자열을 분으로 변환 (HH:MM 형식에서 분으로)
 * @param {string} durationStr - 변환할 시간 문자열 (HH:MM 형식)
 * @returns {number} - 변환된 분 값
 */
export function durationToMinutes(durationStr) {
    if (!durationStr) return 0;
    
    const parts = durationStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    return (hours * 60) + minutes;
  }
  
  /**
   * 분을 HH:MM 형식의 시간 문자열로 변환
   * @param {number} minutes - 변환할 분 값
   * @returns {string} - 변환된 시간 문자열 (HH:MM 형식)
   */
  export function minutesToDuration(minutes) {
    if (!minutes && minutes !== 0) return '00:00';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  
  /**
   * 시간 문자열 형식 변환 함수 (5:00 -> 5h 0m)
   * @param {string} duration - 변환할 시간 문자열 (HH:MM 형식)
   * @returns {string} - 변환된 시간 문자열 (Xh Ym 형식)
   */
  export function formatDuration(duration) {
    if (!duration) return "-";
    
    const parts = duration.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts.length > 1 ? parseInt(parts[1]) : 0;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return "0h";
    }
  }
  
  /**
   * 두 시간 문자열 사이의 차이를 분으로 계산 (HH:MM 형식)
   * @param {string} startTime - 시작 시간 (HH:MM 형식)
   * @param {string} endTime - 종료 시간 (HH:MM 형식)
   * @returns {number} - 두 시간의 차이 (분)
   */
  export function getTimeDifference(startTime, endTime) {
    const startMinutes = durationToMinutes(startTime);
    const endMinutes = durationToMinutes(endTime);
    
    return endMinutes - startMinutes;
  }
  
  // 모든 함수를 객체로 묶어서 default export도 함께 제공
  const timeUtils = {
    durationToMinutes,
    minutesToDuration,
    formatDuration,
    getTimeDifference
  };
  
  export default timeUtils;
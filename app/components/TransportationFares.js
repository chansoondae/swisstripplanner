'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiExternalLink, FiSearch, FiInfo, FiDollarSign, FiRepeat, FiChevronRight } from 'react-icons/fi';
import { FaTrain, FaBus, FaExchangeAlt } from 'react-icons/fa';
import { GiMountainRoad } from 'react-icons/gi';

const TransportationFares = () => {
  const [transportData, setTransportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departure, setDeparture] = useState('Interlaken Ost');
  const [arrival, setArrival] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [availableDepartures, setAvailableDepartures] = useState([]);
  const [availableArrivals, setAvailableArrivals] = useState([]);
  const [selectedClass, setSelectedClass] = useState('2nd');
  
  // 모바일 감지
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android/.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/transportation');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        setTransportData(data);
        
        // 출발지와 도착지 목록 추출
        const departures = [...new Set(data.map(route => route.Departure))].sort();
        setAvailableDepartures(departures);
        
        // 선택된 출발지에 맞는 도착지 필터링
        const arrivals = [...new Set(data
          .filter(route => route.Departure === departure)
          .map(route => route.Arrival))].sort();
        setAvailableArrivals(arrivals);
        
        if (arrivals.length > 0 && !arrival) {
          setArrival(arrivals[0]);
        }
        
      } catch (err) {
        console.error('Error fetching transportation data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 출발지가 변경될 때 도착지 목록 업데이트
  useEffect(() => {
    if (transportData.length > 0) {
      const arrivals = [...new Set(transportData
        .filter(route => route.Departure === departure)
        .map(route => route.Arrival))].sort();
      
      setAvailableArrivals(arrivals);
      
      // 현재 선택된 도착지가 새 목록에 없으면 첫 번째 항목으로 설정
      if (arrivals.length > 0 && !arrivals.includes(arrival)) {
        setArrival(arrivals[0]);
      }
    }
  }, [departure, transportData]);

  // 경로 필터링
  useEffect(() => {
    if (transportData.length > 0 && departure && arrival) {
      const routes = transportData.filter(route => 
        route.Departure === departure && route.Arrival === arrival
      );
      setFilteredRoutes(routes);
    } else {
      setFilteredRoutes([]);
    }
  }, [departure, arrival, transportData]);

  // 시간 문자열 형식화 (HH:MM 형식으로 변환)
  const formatDuration = (durationStr) => {
    const parts = durationStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (hours === 0) {
      return `${minutes}분`;
    } else if (minutes === 0) {
      return `${hours}시간`;
    } else {
      return `${hours}시간 ${minutes}분`;
    }
  };

  // 가격 형식화
  const formatPrice = (price) => {
    return `CHF ${price.toFixed(2)}`;
  };

  // 환승 정보 렌더링
  const renderTransfers = (route) => {
    if (route.Transfer_Counts === 0) {
      return <span className="text-green-600 text-sm font-medium">직통</span>;
    }
    
    const transferText = route.Transfer_Counts === 1 
      ? "1회 환승" 
      : `${route.Transfer_Counts}회 환승`;
    
    if (route.Via && route.Via.length > 0) {
      return (
        <div>
          <span className="text-amber-600 text-sm font-medium">{transferText}</span>
          <span className="text-gray-500 text-xs ml-1">
            {route.Via.join(' → ')}
          </span>
        </div>
      );
    }
    
    return <span className="text-amber-600 text-sm font-medium">{transferText}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">스위스 철도 요금 검색</h2>
        <p className="text-gray-600">출발지와 도착지를 선택하여 요금과 소요시간을 확인하세요.</p>
      </div>

      {/* 검색 폼 */}
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6 ${isMobile ? 'flex flex-col gap-3' : 'flex gap-4 items-end'}`}>
        <div className={`${isMobile ? 'w-full' : 'w-1/3'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">출발지</label>
          <select
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            {availableDepartures.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        <div className={`${isMobile ? 'w-full' : 'w-1/3'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">도착지</label>
          <select
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            {availableArrivals.map(arr => (
              <option key={arr} value={arr}>{arr}</option>
            ))}
          </select>
        </div>

        <div className={`${isMobile ? 'w-full' : 'w-1/3'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">좌석 등급</label>
          <div className="flex">
            <button
              className={`flex-1 p-2 border ${selectedClass === '1st' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} rounded-l hover:bg-gray-50`}
              onClick={() => setSelectedClass('1st')}
            >
              1등석
            </button>
            <button
              className={`flex-1 p-2 border ${selectedClass === '2nd' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} rounded-r hover:bg-gray-50`}
              onClick={() => setSelectedClass('2nd')}
            >
              2등석
            </button>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      {filteredRoutes.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold">요금 및 소요시간</h3>
            <span className="text-gray-500 text-sm">
              {departure} → {arrival}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <div className={`p-4 border-b border-gray-200 ${isMobile ? 'grid grid-cols-1 gap-2' : 'flex'}`}>
              <div className={`${isMobile ? 'mb-2' : 'flex-1'}`}>
                <div className="flex items-center">
                  <FaTrain className="text-red-600 mr-2" />
                  <h4 className="font-semibold">{departure} → {arrival}</h4>
                </div>
                <div className="mt-1 text-gray-600 text-sm">
                  {formatDuration(filteredRoutes[0].Duration)} 소요
                </div>
              </div>

              <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex gap-4'}`}>
                <div className="flex flex-col items-center justify-center bg-white p-3 border border-gray-200 rounded-lg">
                  <span className="text-xs font-medium text-gray-500">1등석</span>
                  <span className={`text-lg font-bold ${selectedClass === '1st' ? 'text-blue-600' : 'text-gray-700'}`}>
                    {formatPrice(filteredRoutes[0]['1st Class Price'])}
                  </span>
                </div>
                
                <div className="flex flex-col items-center justify-center bg-white p-3 border border-gray-200 rounded-lg">
                  <span className="text-xs font-medium text-gray-500">2등석</span>
                  <span className={`text-lg font-bold ${selectedClass === '2nd' ? 'text-blue-600' : 'text-gray-700'}`}>
                    {formatPrice(filteredRoutes[0]['2nd Class Price'])}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiClock className="text-gray-500" />
                  <span className="text-gray-700">소요시간: {formatDuration(filteredRoutes[0].Duration)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <FiRepeat className="text-gray-500" />
                  <div>
                    {renderTransfers(filteredRoutes[0])}
                  </div>
                </div>

                {filteredRoutes[0].Via && filteredRoutes[0].Via.length > 0 && (
                  <div className="flex items-baseline gap-2 mt-1">
                    <FaExchangeAlt className="text-gray-500 text-sm" />
                    <div className="text-gray-700 text-sm">
                      <p className="font-medium">환승역:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filteredRoutes[0].Via.map((station, idx) => (
                          <div key={idx} className="bg-gray-100 px-2 py-1 rounded-full text-xs flex items-center">
                            {station}
                            {idx < filteredRoutes[0].Via.length - 1 && (
                              <FiChevronRight className="text-gray-400 ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start">
              <FiInfo className="text-blue-500 mr-2 mt-1" />
              <div className="text-sm text-gray-700">
                <p>
                  <span className="font-semibold">스위스 트래블 패스:</span> 여러 번 이동할 계획이 있다면, 스위스 트래블 패스를 구매하는 것이 경제적일 수 있습니다.
                </p>
                <p className="mt-1">
                  <span className="font-semibold">반값 카드:</span> 스위스 하프 페어 카드를 구매하면 모든 철도 요금의 50%를 할인받을 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
          {departure && arrival ? 
            '해당 구간의 정보가 없습니다.' : 
            '출발지와 도착지를 선택하세요.'}
        </div>
      )}
    </div>
  );
};

export default TransportationFares;
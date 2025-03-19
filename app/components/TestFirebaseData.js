// components/TestFirebaseData.js
import { useState, useEffect } from 'react';
import { fetchSwissAttractions, fetchTransportationData } from '../utils/firebaseData';

const TestFirebaseData = () => {
  const [attractions, setAttractions] = useState([]);
  const [transportation, setTransportation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 병렬로 두 데이터 세트 가져오기
        const [attractionsData, transportationData] = await Promise.all([
          fetchSwissAttractions(),
          fetchTransportationData()
        ]);
        
        setAttractions(attractionsData);
        setTransportation(transportationData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return <div className="p-4">데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Firebase 데이터 테스트</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">스위스 명소 ({attractions.length}개)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Base</th>
                <th className="py-2 px-4 border">Price (2nd Class)</th>
                <th className="py-2 px-4 border">Transportation</th>
              </tr>
            </thead>
            <tbody>
              {attractions.slice(0, 5).map((attraction, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border">{attraction.Name_Eng}</td>
                  <td className="py-2 px-4 border">{attraction.Base}</td>
                  <td className="py-2 px-4 border">{attraction['2nd Class Price']}</td>
                  <td className="py-2 px-4 border">{attraction.Transportation}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm text-gray-600">* 처음 5개 항목만 표시됩니다.</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">교통 데이터 ({transportation.length}개)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Departure</th>
                <th className="py-2 px-4 border">Arrival</th>
                <th className="py-2 px-4 border">2nd Class Price</th>
                <th className="py-2 px-4 border">Duration</th>
              </tr>
            </thead>
            <tbody>
              {transportation.slice(0, 5).map((route, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border">{route.Departure}</td>
                  <td className="py-2 px-4 border">{route.Arrival}</td>
                  <td className="py-2 px-4 border">{route['2nd Class Price']}</td>
                  <td className="py-2 px-4 border">{route.Duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm text-gray-600">* 처음 5개 항목만 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default TestFirebaseData;
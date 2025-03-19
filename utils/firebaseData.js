// utils/firebaseData.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * 파이어베이스에서 Swiss Attraction 데이터를 조회하는 함수
 * @returns {Promise<Array>} 스위스 명소 데이터 배열
 */
export async function fetchSwissAttractions() {
  try {
    const attractionsCollection = collection(db, 'swiss_attractions');
    const snapshot = await getDocs(attractionsCollection);
    
    const attractions = [];
    snapshot.forEach((doc) => {
      attractions.push({ id: doc.id, ...doc.data() });
    });
    
    return attractions;
  } catch (error) {
    console.error('Error fetching Swiss attractions:', error);
    throw error;
  }
}

/**
 * 파이어베이스에서 Transportation 데이터를 조회하는 함수
 * @returns {Promise<Array>} 교통 요금 데이터 배열
 */
export async function fetchTransportationData() {
  try {
    const transportationCollection = collection(db, 'transportation');
    const snapshot = await getDocs(transportationCollection);
    
    const transportationData = [];
    snapshot.forEach((doc) => {
      transportationData.push({ id: doc.id, ...doc.data() });
    });
    
    return transportationData;
  } catch (error) {
    console.error('Error fetching transportation data:', error);
    throw error;
  }
}
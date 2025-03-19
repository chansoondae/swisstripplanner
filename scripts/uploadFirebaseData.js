// cleanAndUpload.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

// Firebase 구성
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore에 저장 가능한 형태로 데이터 정제
function sanitizeFirestoreData(data) {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data !== 'object') {
    // 기본 타입 (문자열, 숫자, 불리언)은 그대로 반환
    return data;
  }

  if (data instanceof Date) {
    return data; // Firestore는 Date 객체 지원
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item));
  }

  // 객체인 경우
  const sanitizedData = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // null과 undefined 값 처리
      if (data[key] === undefined) {
        sanitizedData[key] = null;
      } else {
        sanitizedData[key] = sanitizeFirestoreData(data[key]);
      }
    }
  }
  return sanitizedData;
}

// 스위스 명소 데이터 업로드
async function uploadSwissAttractions() {
  try {
    console.log('스위스 명소 데이터 업로드 시작...');
    
    // JSON 파일 읽기
    const dataPath = path.join(process.cwd(), 'data', 'swiss_attraction.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const attractions = JSON.parse(rawData);
    
    // 각 항목을 데이터베이스에 추가
    for (let i = 0; i < attractions.length; i++) {
      // 데이터 정제
      const cleanData = sanitizeFirestoreData(attractions[i]);
      
      try {
        // 개별 문서 추가 (배치 대신 개별 추가로 변경)
        const docRef = await addDoc(collection(db, 'swiss_attractions'), cleanData);
        console.log(`문서 #${i+1} 추가 완료: ${docRef.id}`);
      } catch (error) {
        console.error(`문서 #${i+1} 추가 실패:`, error);
        console.error('문제가 된 데이터:', JSON.stringify(cleanData, null, 2));
      }
    }
    
    console.log(`${attractions.length}개의 스위스 명소 데이터 업로드 완료`);
  } catch (error) {
    console.error('스위스 명소 데이터 업로드 중 오류:', error);
  }
}

// 교통 데이터 업로드
async function uploadTransportationData() {
  try {
    console.log('교통 데이터 업로드 시작...');
    
    // JSON 파일 읽기
    const dataPath = path.join(process.cwd(), 'data', 'transportation.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const transportationData = JSON.parse(rawData);
    
    // 각 항목을 데이터베이스에 추가
    for (let i = 0; i < transportationData.length; i++) {
      // 데이터 정제
      const cleanData = sanitizeFirestoreData(transportationData[i]);
      
      try {
        // 개별 문서 추가
        const docRef = await addDoc(collection(db, 'transportation'), cleanData);
        console.log(`문서 #${i+1} 추가 완료: ${docRef.id}`);
      } catch (error) {
        console.error(`문서 #${i+1} 추가 실패:`, error);
        console.error('문제가 된 데이터:', JSON.stringify(cleanData, null, 2));
      }
    }
    
    console.log(`${transportationData.length}개의 교통 데이터 업로드 완료`);
  } catch (error) {
    console.error('교통 데이터 업로드 중 오류:', error);
  }
}

// 메인 함수
async function uploadAllData() {
  try {
    // 환경 변수 확인
    console.log('Firebase 구성:', {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '설정됨' : '설정되지 않음'
    });
    
    // 테스트 문서 먼저 추가하여 연결 확인
    try {
      const testRef = await addDoc(collection(db, 'test_collection'), {
        name: 'Connection Test',
        timestamp: new Date()
      });
      console.log('Firebase 연결 테스트 성공. 테스트 문서 ID:', testRef.id);
    } catch (error) {
      console.error('Firebase 연결 테스트 실패:', error);
      return;
    }
    
    // 데이터 업로드 실행
    await uploadSwissAttractions();
    await uploadTransportationData();
    
    console.log('모든 데이터 업로드가 완료되었습니다!');
  } catch (error) {
    console.error('업로드 프로세스 중 오류:', error);
  }
}

// 스크립트 실행
uploadAllData();
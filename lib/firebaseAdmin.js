// lib/firebaseAdmin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK 초기화
let adminDb;

// 필수 환경 변수 확인
const checkRequiredEnvVars = () => {
  const requiredVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`다음 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`);
  }
};

// 서비스 계정 정보 가져오기
const getServiceAccount = () => {
  // 환경 변수가 있는지 확인
  checkRequiredEnvVars();
  
  // Firebase Admin SDK 인증 정보
  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    // \n을 실제 줄바꿈으로 변환
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
};

// Firebase Admin SDK 초기화 함수
const initializeFirebaseAdmin = () => {
  try {
    // 이미 초기화된 앱이 있는지 확인
    if (getApps().length === 0) {
      // 서비스 계정 정보 가져오기
      const serviceAccount = getServiceAccount();
      
      // Firebase Admin 앱 초기화
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      
      // Firestore 초기화
      adminDb = getFirestore(app);
      console.log('Firebase Admin SDK 초기화 성공');
    } else {
      // 이미 초기화된 앱이 있으면 Firestore 가져오기
      adminDb = getFirestore();
    }
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 오류:', error);
    // 개발 모드에서는 오류 세부 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('오류 세부 정보:', error.message);
      
      // 환경 변수 디버깅 (비밀 키는 로깅하지 않음)
      console.log('프로젝트 ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
      console.log('클라이언트 이메일:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
      console.log('프라이빗 키 설정 여부:', !!process.env.FIREBASE_ADMIN_PRIVATE_KEY);
    }
    
    throw new Error('Firebase Admin 초기화에 실패했습니다');
  }
  
  return adminDb;
};

// 초기화 실행 및 adminDb 내보내기
if (!adminDb) {
  initializeFirebaseAdmin();
}

/**
 * 초기 여행 계획 엔트리 생성 함수 - Admin SDK 사용
 * @param {Object} options - 여행 계획 옵션 데이터
 * @param {string} requestId - SQS 메시지 ID (선택 사항)
 * @returns {Promise<string>} - 생성된 여행 계획 ID
 */
export const createInitialPlanEntry = async (options, requestId = null) => {
  try {
    // Firebase Admin이 초기화되었는지 확인
    if (!adminDb) {
      initializeFirebaseAdmin();
      
      if (!adminDb) {
        throw new Error('Firebase Admin DB가 초기화되지 않았습니다');
      }
    }
    
    // 초기 데이터 생성
    const initialData = {
      title: '여행 계획 생성 중...',
      description: '요청하신 스위스 여행 계획을 생성하고 있습니다.',
      status: 'processing',
      options: {
        prompt: options.prompt,
        duration: options.duration,
        travelStyle: options.travelStyle,
        startingCity: options.startingCity,
        endingCity: options.endingCity,
        travelDate: options.travelDate,
        groupType: options.groupType,
      },
      createdAt: new Date(),
      source: 'web'
    };
    
    // requestId가 있는 경우에만 messageId 필드 추가
    if (requestId) {
      initialData.messageId = requestId;
    }
    
    // 새 문서 추가
    const plansCollection = adminDb.collection('travelPlans');
    const docRef = await plansCollection.add(initialData);
    return docRef.id;
  } catch (error) {
    console.error('초기 여행 계획 엔트리 생성 오류:', error);
    throw error;
  }
};

// 편의를 위해 adminDb와 함수 내보내기
export { adminDb };
// lib/firebaseAdmin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK 초기화
let adminDb;

if (!getApps().length) {
  try {
    
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
    
    adminDb = getFirestore(app);
    console.log('Firebase Admin SDK 초기화 성공');
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 오류:', error);

    throw new Error('Firebase Admin 초기화에 실패했습니다');
  }
} else {
  adminDb = getFirestore();
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
      throw new Error('Firebase Admin DB가 초기화되지 않았습니다');
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

export { adminDb };
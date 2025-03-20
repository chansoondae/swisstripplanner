// app/api/generate-tour/route.js
import { NextResponse } from 'next/server';
import { sendToQueue } from '@/lib/sqs';
import { createInitialTourEntry } from '@/lib/firebaseAdmin';


// IMPORTANT: App Router에서는 HTTP 메서드별로 함수를 export 합니다
export async function POST(request) {
  try {
    console.log('API 요청 받음');
    
    // 요청 본문 파싱
    const options = await request.json();
    console.log('요청 데이터:', options);
    
    // 필수 필드 검증
    if (!options || !options.duration) {
      console.error('필수 필드 누락:', options);
      return NextResponse.json(
        { error: '소요 시간은 필수 항목입니다.' }, 
        { status: 400 }
      );
    }

    // 1. Firestore에 초기 문서 생성 (processing 상태)
    console.log('Firestore 초기 문서 생성 중...');
    let tourId;
    try {
      tourId = await createInitialTourEntry(options);
      console.log('Firestore 문서 생성 완료:', tourId);
    } catch (dbError) {
      console.error('Firestore 문서 생성 오류:', dbError);
      return NextResponse.json(
        { error: '데이터베이스 오류가 발생했습니다.', details: dbError.message }, 
        { status: 500 }
      );
    }

    // 2. SQS에 메시지 전송
    console.log('SQS 메시지 전송 중...');
    const messageData = {
      type: 'GENERATE_TOUR',
      tourId, // 생성된 문서 ID를 함께 전송
      options,
      galleries: [],
      cafes: [],
      restaurants: [],
      timestamp: new Date().toISOString()
    };

    // SQS에 전송
    let messageId;
    try {
      messageId = await sendToQueue(messageData);
      console.log('SQS 메시지 전송 완료:', messageId);
    } catch (sqsError) {
      console.error('SQS 메시지 전송 오류:', sqsError);
      // SQS 오류가 발생해도 tourId는 반환 (처리는 실패할 수 있음)
      return NextResponse.json(
        {
          tourId,
          status: 'error',
          message: 'SQS 메시지 전송 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'
        }, 
        { status: 202 }
      );
    }

    // 3. 클라이언트에 즉시 tourId 반환
    console.log('API 응답 전송:', { tourId, requestId: messageId });
    return NextResponse.json({
      tourId,
      requestId: messageId,
      status: 'processing',
      message: '투어 생성 요청이 처리 중입니다.'
    });
  } catch (error) {
    console.error('투어 생성 요청 처리 중 예상치 못한 오류:', error);
    return NextResponse.json(
      { 
        error: '투어 생성 요청 처리 중 오류가 발생했습니다.',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}
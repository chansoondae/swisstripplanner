// app/api/generate-plan/route.js
import { NextResponse } from 'next/server';
import { sendToQueue } from './../../../lib/sqs';
import { createInitialPlanEntry } from './../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    // console.log('여행 계획 API 요청 받음');
    
    // 요청 본문 파싱
    const options = await request.json();
    // console.log('요청 데이터:', options);
    
    // 필수 필드 검증
    if (!options || !options.duration || !options.startingCity || !options.endingCity) {
      // console.error('필수 필드 누락:', options);
      return NextResponse.json(
        { error: 'require Duration, Starting, Ending' }, 
        { status: 400 }
      );
    }

    // userId가 제공되었는지 확인 (옵셔널 - 익명 사용도 허용)
    const userId = options.userId || null;
    // console.log('사용자 ID:', userId);

    // 1. Firestore에 초기 문서 생성 (processing 상태)
    // console.log('Firestore 초기 문서 생성 중...');
    let planId;
    try {
        // userId를 포함한 옵션 전달
      const planOptions = {
        ...options,
        userId: userId
      };

      planId = await createInitialPlanEntry(options);
      // console.log('Firestore 문서 생성 완료:', planId);
    } catch (dbError) {
      // console.error('Firestore 문서 생성 오류:', dbError);
      return NextResponse.json(
        { error: 'A database error has occurred.', details: dbError.message }, 
        { status: 500 }
      );
    }

    // 2. SQS에 메시지 전송
    // console.log('SQS 메시지 전송 중...');
    const messageData = {
      type: 'GENERATE_TRAVEL_PLAN',
      planId, // 생성된 문서 ID를 함께 전송
      userId, // 사용자 ID 추가
      options: {
        prompt: options.prompt,
        duration: options.duration,
        travelStyle: options.travelStyle,
        startingCity: options.startingCity,
        endingCity: options.endingCity,
        travelDate: options.travelDate,
        groupType: options.groupType,
      },
      timestamp: new Date().toISOString()
    };

    // SQS에 전송
    let messageId;
    try {
      messageId = await sendToQueue(messageData);
      // console.log('SQS 메시지 전송 완료:', messageId);
    } catch (sqsError) {
      // console.error('SQS 메시지 전송 오류:', sqsError);
      // SQS 오류가 발생해도 planId는 반환 (처리는 실패할 수 있음)
      return NextResponse.json(
        {
          planId,
          status: 'error',
          message: 'An error occurred while sending SQS message. Please try again later.'
        }, 
        { status: 202 }
      );
    }

    // 3. 클라이언트에 즉시 planId 반환
    // console.log('API 응답 전송:', { planId, requestId: messageId });
    return NextResponse.json({
      planId,
      requestId: messageId,
      status: 'processing',
      message: 'Your travel plan creation request is being processed.'
    });
  } catch (error) {
    console.error('Unexpected error occurred while processing travel plan creation request.', error);
    return NextResponse.json(
      { 
        error: 'Unexpected error occurred.',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}
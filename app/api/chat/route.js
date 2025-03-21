// app/api/chat/route.js
import axios from 'axios';

export async function POST(request) {
  try {
    const requestData = await request.json();
    const { message, threadId } = requestData;
    
    if (!message || typeof message !== 'string') {
      console.error('유효하지 않은 메시지 형식:', message);
      return Response.json(
        { error: '유효한 메시지를 입력해주세요.' },
        { status: 400 }
      );
    }
    
    // API 키 확인
    const apiKey = process.env.STORM_API_KEY;
    if (!apiKey) {
      console.error('STORM_API_KEY 환경 변수가 설정되지 않았습니다.');
      return Response.json(
        { error: 'API 키가 구성되지 않았습니다. 서버 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    // console.log('요청 보내는 중:', message);
    // console.log('스레드 ID:', threadId || '신규 대화');
    
    // Storm AI API 요청 데이터 준비
    const requestBody = {
      question: message
      // bucketIds 제거
    };
    
    // 이전 대화의 threadId가 있으면 추가
    if (threadId) {
      requestBody.threadId = threadId;
      // console.log('기존 대화에 연결:', threadId);
    }
    
    // 요청 데이터 로깅
    // console.log('Storm API 요청 데이터:', JSON.stringify(requestBody));
    
    // Storm AI API 호출
    try {
      const response = await axios.post(
        'https://live-stargate.sionic.im/api/v2/answer',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'storm-api-key': apiKey
          },
          timeout: 15000 // 타임아웃 설정 (15초)
        }
      );
      
      // console.log('응답 상태:', response.status);
      
      // 응답 구조 확인
      if (response.data && response.data.status === 'success' && 
          response.data.data && response.data.data.chat && 
          response.data.data.chat.answer) {
        
        // 응답에서 필요한 데이터 추출
        const aiResponse = response.data.data.chat.answer;
        const responseThreadId = response.data.data.chat.threadId;
        const chatId = response.data.data.chat.id;
        
        // 컨텍스트 정보 추출 (있는 경우)
        const contexts = response.data.data.contexts || [];
        
        // 참조 마커 정보 정리 (예: [[#1]], [[#2]] 등)
        const references = contexts.map(context => ({
          refId: context.referenceIdx,
          source: context.fileName || context.bucketName || '알 수 없는 출처',
          context: context.context
        }));
        
        // console.log(`AI 응답 (${aiResponse.length}자)가 성공적으로 생성되었습니다.`);
        // console.log(`응답 스레드 ID: ${responseThreadId}`);
        
        return Response.json({ 
          response: aiResponse,
          threadId: responseThreadId,
          chatId: chatId,
          references: references
        });
      } else {
        console.error('응답에 예상된 데이터가 없습니다:', JSON.stringify(response.data, null, 2));
        return Response.json(
          { error: 'AI 응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 
          { status: 502 }
        );
      }
    } catch (apiError) {
      console.error('Storm API 호출 오류:', apiError.message);
      console.error('오류 상세 정보:', apiError.response?.data || '상세 정보 없음');
      
      let errorStatus = 500;
      let errorMessage = '메시지 처리 중 오류가 발생했습니다.';
      
      if (apiError.response) {
        errorStatus = apiError.response.status;
        if (apiError.response.data && apiError.response.data.error) {
          errorMessage = `Storm API 오류: ${apiError.response.data.error}`;
        } else {
          errorMessage = `Storm API가 ${errorStatus} 오류를 반환했습니다.`;
        }
      } else if (apiError.code === 'ECONNABORTED') {
        errorMessage = 'API 요청 시간이 초과되었습니다. 나중에 다시 시도해 주세요.';
      }
      
      return Response.json({ error: errorMessage }, { status: errorStatus });
    }
    
  } catch (error) {
    console.error('서버 처리 오류:', error.message);
    
    return Response.json(
      { error: `요청 처리 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
// lib/sqs.js
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// SQS 클라이언트 초기화
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * SQS 큐에 메시지 전송
 * @param {Object} messageData - 전송할 메시지 데이터
 * @returns {Promise<string>} - 전송된 메시지 ID
 */
export const sendToQueue = async (messageData) => {
  try {
    const queueUrl = process.env.AWS_SQS_QUEUE_URL;
    
    if (!queueUrl) {
      throw new Error('SQS 큐 URL이 설정되지 않았습니다.');
    }
    
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageData),
      // 선택적으로 메시지 그룹 ID와 중복 제거 ID 설정 (FIFO 큐인 경우)
      ...(queueUrl.endsWith('.fifo') && {
        MessageGroupId: 'tour-generation',
        MessageDeduplicationId: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      })
    };
    
    const command = new SendMessageCommand(params);
    const response = await sqsClient.send(command);
    
    console.log('SQS 메시지 전송 성공:', response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error('SQS 메시지 전송 오류:', error);
    throw error;
  }
};

/**
 * 투어 데이터 상태 확인
 * @param {string} requestId - 요청 ID(메시지 ID)
 * @returns {Promise<Object>} - 투어 생성 상태 정보
 */
export const checkTourStatus = async (requestId) => {
  // 이 부분은 Firestore에서 해당 requestId로 생성된 투어를 조회하는 로직으로 구현 필요
  // Vercel 서버리스 함수에서 구현
  return {
    status: 'pending', // 'pending', 'completed', 'failed' 중 하나
    message: '처리 중입니다.'
  };
};
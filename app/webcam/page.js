//app/webcam/page.js

import { webcamData } from './webcamData';
import WebcamClient from './WebcamClient';
import './webcam.css';

export const metadata = {
  title: '스위스 실시간 웹캠',
  description: '스위스 전역의 실시간 웹캠 영상을 제공합니다.',
};

export default function WebcamPage() {
  // 웹캠 데이터 정렬 (nameKo 기준)
  const sortedWebcams = [...webcamData].sort((a, b) => 
    a.nameKo.localeCompare(b.nameKo)
  );
  
  // 클라이언트 컴포넌트로 데이터 전달
  return <WebcamClient webcams={sortedWebcams} />;
}
import Image from 'next/image';
import Link from 'next/link';
import { webcamData } from './../../lib/webcam';

// 스타일 불러오기
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
  
  return (
    <div className="custom-container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">스위스 실시간 웹캠</h1>
      
      {sortedWebcams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">웹캠 데이터를 불러올 수 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {sortedWebcams.map((webcam) => (
          <Link 
            href={webcam.href} 
            target="_blank"
            rel="noopener noreferrer"
            key={webcam.id}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48">
                <Image 
                  src={webcam.img} 
                  alt={webcam.nameKo} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={false}
                />
              </div>
              
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-200">
                  {webcam.nameKo}
                </h2>
                
                <div className="text-sm text-gray-500 mb-3 flex items-center">
                  <span>{webcam.nameEn}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        </div>
      )}
    </div>
  );
}
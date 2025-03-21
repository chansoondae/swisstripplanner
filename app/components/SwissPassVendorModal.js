'use client';

import React from 'react';
import { FiX, FiExternalLink, FiInfo } from 'react-icons/fi';
import { FaIdCard } from 'react-icons/fa';

// 스위스 트래블 패스 판매처 데이터
const swissPassVendors = [
  {
    name: '마이리얼트립',
    url: 'https://myrealt.rip/6fOF33',
    description: '한국어 지원, 다양한 결제수단'
  },
  {
    name: '클룩',
    url: 'https://bit.ly/klookswisspass',
    description: '간편한 모바일 발권, 프로모션 이벤트'
  },
  {
    name: '스위스트래블센터',
    url: 'https://www.swissrailways.com/ko/buy-swiss-travel-pass?affiliateID=370&currency=CHF',
    description: '공식 판매처, 패스 전문 상담'
  }
];

const SwissPassVendorModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // 외부 링크 열기 함수
  const openExternalLink = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="bg-green-600 p-4 text-white flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <FaIdCard className="mr-2" />
            스위스트래블패스 구매처
          </h3>
          <button 
            className="text-white hover:text-gray-200 transition-colors"
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* 모달 컨텐츠 */}
        <div className="p-5">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            스위스트래블패스를 더 저렴하게 구매할 수 있는 판매처를 확인해보세요. 가격 비교 후 구매하시는 것을 권장합니다.
          </p>
          
          <div className="space-y-4">
            {swissPassVendors.map((vendor, index) => (
              <div 
                key={index}
                className="border rounded-lg p-4 hover:bg-green-50 dark:hover:bg-green-900 transition-colors cursor-pointer"
                onClick={() => openExternalLink(vendor.url)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{vendor.name}</h4>
                  <FiExternalLink className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{vendor.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p className="flex items-start">
              <FiInfo className="mr-1 mt-0.5 flex-shrink-0" />
              구매 전 스위스트래블패스 유효기간과 여행 일정을 확인하세요. 일반적으로 구매 후 6개월 이내에 사용해야 합니다.
            </p>
          </div>
        </div>
        
        {/* 모달 푸터 */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 flex justify-end">
          <button
            className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwissPassVendorModal;
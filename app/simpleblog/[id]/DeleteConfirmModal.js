'use client';

import { FiAlertCircle } from 'react-icons/fi';

const DeleteConfirmModal = ({ 
  isOpen, 
  onCancel, 
  onConfirm, 
  isDeleting 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
        <div className="flex items-center text-black mb-4">
          <FiAlertCircle size={24} className="mr-2" />
          <h3 className="text-lg font-semibold" style={{ fontFamily: 'Nanum Gothic', fontSize: '22px', fontWeight: 'bold' }}>활동 삭제 확인</h3>
        </div>
        <p className="mb-6 text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>
          이 활동을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'Nanum Gothic' }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 bg-black text-white rounded-md transition-colors ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
            }`}
            style={{ fontFamily: 'Nanum Gothic' }}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
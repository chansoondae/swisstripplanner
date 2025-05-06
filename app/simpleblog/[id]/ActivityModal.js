'use client';

import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const ActivityModal = ({ 
  isOpen, 
  onClose, 
  onAddActivity, 
  currentDay, 
  baseLocation, 
  endLocation 
}) => {
  const [newActivity, setNewActivity] = useState({
    title: '',
    location: '',
    price: '',
    transportation: '',
    description: '',
    duration: '',
    url: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newActivity.title) {
      alert('활동 제목을 입력해주세요.');
      return;
    }
    
    // Create activity object
    const activityToAdd = {
      ...newActivity,
      price: newActivity.price !== '' ? parseFloat(newActivity.price) : '',
    };
    
    // Add activity
    onAddActivity(activityToAdd);
    
    // Reset form
    setNewActivity({
      title: '',
      location: '',
      price: '',
      transportation: '',
      description: '',
      duration: '',
      url: ''
    });
    
    // Close modal
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '22px', fontWeight: 'bold' }}>
            {currentDay}일차 활동 추가
          </h3>
          <button 
            onClick={onClose} 
            className="text-black hover:bg-gray-100 rounded-full p-1"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
              활동 제목 *
            </label>
            <input
              type="text"
              value={newActivity.title}
              onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
              style={{ fontFamily: 'Nanum Gothic' }}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
                위치
              </label>
              <input
                type="text"
                value={newActivity.location}
                onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                style={{ fontFamily: 'Nanum Gothic' }}
                placeholder={baseLocation ? `출발지: ${baseLocation}` : ''}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
                가격 (CHF)
              </label>
              <input
                type="text"
                value={newActivity.price}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setNewActivity({...newActivity, price: value});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                style={{ fontFamily: 'Nanum Gothic' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
                교통 수단
              </label>
              <select
                value={newActivity.transportation}
                onChange={(e) => setNewActivity({...newActivity, transportation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                style={{ fontFamily: 'Nanum Gothic' }}
              >
                <option value="">선택하세요</option>
                <option value="Train">Train</option>
                <option value="CableCar">CableCar</option>
                <option value="Funicular">Funicular</option>
                <option value="Ferry">Ferry</option>
                <option value="Bus">Bus</option>
                <option value="Walk">Walk</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
                소요 시간
              </label>
              <input
                type="text"
                value={newActivity.duration}
                onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                style={{ fontFamily: 'Nanum Gothic' }}
                placeholder="예: 2시간"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
              활동 설명
            </label>
            <textarea
              value={newActivity.description}
              onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
              style={{ fontFamily: 'Nanum Gothic' }}
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
              관련 URL (선택사항)
            </label>
            <input
              type="text"
              value={newActivity.url}
              onChange={(e) => setNewActivity({...newActivity, url: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
              style={{ fontFamily: 'Nanum Gothic' }}
              placeholder="https://..."
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-100 transition-colors mr-3"
              style={{ fontFamily: 'Nanum Gothic' }}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center"
              style={{ fontFamily: 'Nanum Gothic' }}
            >
              <FiPlus className="mr-1" /> 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;
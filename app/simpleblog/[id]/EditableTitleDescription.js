'use client';

import { useState, useEffect } from 'react';
import { FiEdit, FiSave } from 'react-icons/fi';

const EditableTitleDescription = ({ 
  title, 
  description, 
  isEditing, 
  onStartEdit, 
  onSave, 
  onCancel,
  setTitle,
  setDescription 
}) => {
  // Manage state internally
  const [editTitleValue, setEditTitleValue] = useState(title);
  const [editDescriptionValue, setEditDescriptionValue] = useState(description);
  
  // Initialize edit values when editing begins
  useEffect(() => {
    if (isEditing) {
      setEditTitleValue(title);
      setEditDescriptionValue(description);
    }
  }, [isEditing, title, description]);

  // Handle save
  const handleSave = () => {
    // Update parent component state
    setTitle(editTitleValue);
    setDescription(editDescriptionValue);
    
    // Call parent save handler with latest values
    onSave(editTitleValue, editDescriptionValue);
  };

  // View mode
  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>{title}</h1>
          {onStartEdit && (
            <button
              onClick={onStartEdit}
              className="ml-2 p-1 text-black rounded-full transition-colors"
              title="수정하기"
            >
              <FiEdit size={16} />
            </button>
          )}
        </div>
        <div className="mb-4">
          <p className="text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>{description}</p>
        </div>
      </div>
    );
  }

  // Edit mode - modal implementation
  return (
    <>
      {/* Show original content in background */}
      <div>
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>{title}</h1>
        </div>
        <div className="mb-4">
          <p className="text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '19px' }}>{description}</p>
        </div>
      </div>

      {/* Modal overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div 
          className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4" 
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 text-black" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>제목 및 설명 수정</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
              제목
            </label>
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
              style={{ fontFamily: 'Nanum Gothic' }}
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Nanum Gothic' }}>
              설명
            </label>
            <textarea
              value={editDescriptionValue}
              onChange={(e) => setEditDescriptionValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
              style={{ fontFamily: 'Nanum Gothic' }}
              rows="4"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-100 transition-colors"
              style={{ fontFamily: 'Nanum Gothic' }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center"
              style={{ fontFamily: 'Nanum Gothic' }}
            >
              <FiSave className="mr-2" /> 저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditableTitleDescription;
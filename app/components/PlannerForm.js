// app/components/PlannerForm.js
'use client';

import { useState } from 'react';
import { FiClock, FiUsers, FiMapPin, FiCalendar, FiHeart, FiSend } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const PlannerForm = ({ onSubmit, isSubmitting }) => {
  const { user } = useAuth(); // 인증 정보 사용
  
  const [formData, setFormData] = useState({
    prompt: '',
    duration: '4',
    travelStyle: 'nature',
    startingCity: 'Zurich',
    endingCity: 'Zurich',
    travelDate: '',
    groupType: 'couple',
    interests: []
  });
  
  // Available interests for the checkbox group
  const interestOptions = [
    { id: 'nature', label: 'Nature & Outdoors' },
    { id: 'culture', label: 'Culture & History' },
    { id: 'food', label: 'Food & Cuisine' },
    { id: 'adventure', label: 'Adventure & Sports' },
    { id: 'relaxation', label: 'Relaxation & Wellness' },
    { id: 'photography', label: 'Photography' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'local', label: 'Local Experiences' }
  ];
  
  // City options with emoji for display, but plain city name for value
  const cityOptions = [
    { display: '🇨🇭 Zurich', value: 'Zurich' },
    { display: '🇨🇭 Geneva', value: 'Geneva' },
    { display: '🇨🇭 Basel', value: 'Basel' },
    { display: '🇫🇷 Paris', value: 'Paris' },
    { display: '🇮🇹 Milano', value: 'Milano' },
    { display: '🇩🇪 Frankfurt', value: 'Frankfurt' }
  ];
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle checkbox changes for interests
  const handleInterestChange = (interestId) => {
    setFormData(prevData => {
      const currentInterests = [...prevData.interests];
      
      if (currentInterests.includes(interestId)) {
        // Remove the interest if already selected
        return {
          ...prevData,
          interests: currentInterests.filter(id => id !== interestId)
        };
      } else {
        // Add the interest if not already selected
        return {
          ...prevData,
          interests: [...currentInterests, interestId]
        };
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // userId를 폼 데이터에 추가 (사용자가 로그인한 경우)
    const dataWithUserId = {
      ...formData,
      userId: user ? user.uid : null
    };
    
    onSubmit(dataWithUserId);
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
      <form onSubmit={handleSubmit}>
        {/* 로그인 정보 표시 (선택적) */}
        {/* {user ? (
          <div className="mb-4 bg-blue-50 dark:bg-gray-800 p-3 rounded-md text-blue-700 dark:text-yellow-400 text-sm">
            <p>
              {user.displayName || user.email}님으로 로그인됨. 여행 계획이 귀하의 계정과 연결됩니다.
            </p>
          </div>
        ) : (
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-600 dark:text-gray-300 text-sm">
            <p>
              로그인하지 않은 상태입니다. 로그인하면 여행 계획을 저장하고 나중에 접근할 수 있습니다.
            </p>
          </div>
        )} */}
        
        {/* Textarea for detailed prompt */}
        <div className="mb-6">
          <label htmlFor="prompt" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Describe your ideal Swiss trip
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows="4"
            className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us what you'd like to experience in Switzerland. For example: I want to visit the Swiss Alps, experience local cheese making, and visit historical sites in Lucerne..."
            value={formData.prompt}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Trip Duration */}
          <div>
            <label htmlFor="duration" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center">
              <FiClock className="mr-1" /> Trip Duration (days)
            </label>
            <select
              id="duration"
              name="duration"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="1">1 days</option>
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="6">6 days</option>
              <option value="7">7 days</option>
              <option value="8">8 days</option>
              <option value="9">9 days</option>
              <option value="10">10 days</option>
            </select>
          </div>
          
          {/* Travel Style */}
          <div>
            <label htmlFor="travelStyle" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center">
              <FiHeart className="mr-1" /> Travel Style
            </label>
            <select
              id="travelStyle"
              name="travelStyle"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.travelStyle}
              onChange={handleChange}
            >
              <option value="nature">🏔️ Nature Lover</option>
              <option value="activity">🥾 Hiking Mania</option>
              <option value="balanced">🏡 Nature + City</option>
            </select>
          </div>
          
          {/* Starting City */}
          <div>
            <label htmlFor="startingCity" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center">
              <FiMapPin className="mr-1" /> Starting City
            </label>
            <select
              id="startingCity"
              name="startingCity"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.startingCity}
              onChange={handleChange}
            >
              {cityOptions.map((city) => (
                <option key={`start-${city.value}`} value={city.value}>{city.display}</option>
              ))}
            </select>
          </div>

          {/* Ending City */}
          <div>
            <label htmlFor="endingCity" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center">
              <FiMapPin className="mr-1" /> Ending City
            </label>
            <select
              id="endingCity"
              name="endingCity"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.endingCity}
              onChange={handleChange}
            >
              {cityOptions.map((city) => (
                <option key={`end-${city.value}`} value={city.value}>{city.display}</option>
              ))}
            </select>
          </div>
          
          {/* Travel Date */}
          <div>
            <label htmlFor="travelDate" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center">
              <FiCalendar className="mr-1" /> Travel Date (optional)
            </label>
            <input
              type="date"
              id="travelDate"
              name="travelDate"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.travelDate}
              onChange={handleChange}
            />
          </div>
          
          {/* Group Type */}
          <div>
            <label htmlFor="groupType" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center">
              <FiUsers className="mr-1" /> Who's Traveling?
            </label>
            <select
              id="groupType"
              name="groupType"
              className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.groupType}
              onChange={handleChange}
            >
              <option value="solo">Solo Traveler</option>
              <option value="couple">Couple</option>
              <option value="family">Family with Kids</option>
              <option value="friends">Group of Friends</option>
              <option value="seniors">Senior Travelers</option>
            </select>
          </div>
        </div>
        
        {/* Interests - Currently commented out
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Interests (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interestOptions.map((interest) => (
              <div key={interest.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`interest-${interest.id}`}
                  checked={formData.interests.includes(interest.id)}
                  onChange={() => handleInterestChange(interest.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`interest-${interest.id}`} className="ml-2 text-sm text-gray-700">
                  {interest.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        */}
        
        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-yellow-400 hover:bg-blue-700 text-white dark:text-gray-900 font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Your Swiss Travel Plan...
              </>
            ) : (
              <>
                <FiSend className="mr-2" />
                스위스 여행 계획 생성
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlannerForm;
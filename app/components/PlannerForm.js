// app/components/PlannerForm.js
'use client';

import { useState } from 'react';
import { FiClock, FiUsers, FiMapPin, FiCalendar, FiHeart, FiSend } from 'react-icons/fi';

const PlannerForm = ({ onSubmit, isSubmitting }) => {
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
  
  // City options for both starting and ending cities
  const cityOptions = [
    '🇨🇭 Zurich',
    '🇨🇭 Geneva',
    '🇨🇭 Basel',
    '🇫🇷 Paris',
    '🇮🇹 Milano',
    '🇩🇪 Frankfurt'
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
    onSubmit(formData);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <form onSubmit={handleSubmit}>
        {/* Textarea for detailed prompt */}
        <div className="mb-6">
          <label htmlFor="prompt" className="text-sm font-medium text-gray-700 mb-1">
            Describe your ideal Swiss trip
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us what you'd like to experience in Switzerland. For example: I want to visit the Swiss Alps, experience local cheese making, and visit historical sites in Lucerne..."
            value={formData.prompt}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Trip Duration */}
          <div>
            <label htmlFor="duration" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiClock className="mr-1" /> Trip Duration (days)
            </label>
            <select
              id="duration"
              name="duration"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label htmlFor="travelStyle" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiHeart className="mr-1" /> Travel Style
            </label>
            <select
              id="travelStyle"
              name="travelStyle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.travelStyle}
              onChange={handleChange}
            >
              <option value="nature">자연 경관 집중</option>
              <option value="activity">액티비티 러버</option>
              <option value="balanced">자연+도시 콤비</option>
            </select>
          </div>
          
          {/* Starting City */}
          <div>
            <label htmlFor="startingCity" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiMapPin className="mr-1" /> Starting City
            </label>
            <select
              id="startingCity"
              name="startingCity"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.startingCity}
              onChange={handleChange}
            >
              {cityOptions.map((city) => (
                <option key={`start-${city}`} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Ending City */}
          <div>
            <label htmlFor="endingCity" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiMapPin className="mr-1" /> Ending City
            </label>
            <select
              id="endingCity"
              name="endingCity"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.endingCity}
              onChange={handleChange}
            >
              {cityOptions.map((city) => (
                <option key={`end-${city}`} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          {/* Travel Date */}
          <div>
            <label htmlFor="travelDate" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiCalendar className="mr-1" /> Travel Date (optional)
            </label>
            <input
              type="date"
              id="travelDate"
              name="travelDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.travelDate}
              onChange={handleChange}
            />
          </div>
          
          {/* Group Type */}
          <div>
            <label htmlFor="groupType" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiUsers className="mr-1" /> Who's Traveling?
            </label>
            <select
              id="groupType"
              name="groupType"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
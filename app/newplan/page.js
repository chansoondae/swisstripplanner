'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import locationData from '../../utils/locationData';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// City selection component
const CityButton = ({ city, onClick, isSelected }) => (
  <button
    onClick={() => onClick(city)}
    className={`m-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
      ${isSelected 
        ? 'bg-blue-500 text-white hover:bg-blue-600' 
        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}
  >
    {city}
  </button>
);

// Sortable item component for the selected cities list
const SortableItem = ({ id, city, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 mb-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center">
        <div
          {...attributes}
          {...listeners}
          className="mr-3 cursor-grab p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
        <span className="font-medium">{city}</span>
      </div>
      <button
        onClick={() => onRemove(city)}
        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default function NewPlanPage() {
  const router = useRouter();
  
  const SWISS_CITIES = [
    'Grindelwald', 'Interlaken Ost', 'Lauterbrunnen', 'Wengen', 'Luzern', 
    'Zermatt', 'Zurich', 'Basel SBB', 'Bern', 'Spiez', 'Murren', 
    'Lausanne', 'Geneva', 'Vevey', 'Montreux', 'Adelboden', 
    'St. Moritz', 'Chur', 'Lugano', 'Milano'
  ];
  
  // State for the selected cities (will be the itinerary)
  const [selectedCities, setSelectedCities] = useState([]);
  
  // Additional travel details
  const [travelDate, setTravelDate] = useState('');
  const [groupType, setGroupType] = useState('couple');
  const [travelStyle, setTravelStyle] = useState('balanced');
  
  // State for itinerary plan
  const [itineraryPlan, setItineraryPlan] = useState(null);

  // State to hold the planId after saving
  const [savedPlanId, setSavedPlanId] = useState(null);
  
  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle city selection
  const handleCityClick = (city) => {
    // Always add the city to the list when clicked
    setSelectedCities([...selectedCities, city]);
    // Reset itinerary when cities change
    setItineraryPlan(null);
  };

  // Handle removing a city from the list
  const handleRemoveCity = (index) => {
    const newCities = [...selectedCities];
    newCities.splice(index, 1);
    setSelectedCities(newCities);
    setItineraryPlan(null);
  };

  // Handle drag end (reordering the list)
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      // Extract the indices from the composite IDs (format: "city-index")
      const activeIdParts = active.id.split('-');
      const overIdParts = over.id.split('-');
      
      // Get the last part as the index (to handle cities with dashes in their names)
      const activeIndex = parseInt(activeIdParts[activeIdParts.length - 1]);
      const overIndex = parseInt(overIdParts[overIdParts.length - 1]);
      
      const newOrder = [...selectedCities];
      // Remove the item from its old position
      const [movedItem] = newOrder.splice(activeIndex, 1);
      // Insert it at the new position
      newOrder.splice(overIndex, 0, movedItem);
      
      setSelectedCities(newOrder);
      setItineraryPlan(null);
    }
  };

  // Function to handle creating a basic plan and saving to Firebase
const handleCreatePlan = async () => {
    if (selectedCities.length < 2) {
      alert('Please select at least 2 cities for your itinerary.');
      return;
    }
  
    const startingCity = selectedCities[0];
    const endingCity = selectedCities[selectedCities.length - 1];
    const duration = selectedCities.length;
  
    // Create activities for each city
    const createActivities = (city) => {
      // Get coordinates from the locationData utility
      const coords = locationData.getCoordinates(city) || { lat: 0, lng: 0 };
      
      // Map travel style to activity
      let activityByStyle = {
        'nature': `${city}의 자연 경관 탐험`,
        'activity': `${city} 주변 하이킹`,
        'balanced': `${city} 명소 및 문화 탐방`
      };
      
      const activityTitle = activityByStyle[travelStyle] || `${city} 탐험`;
      
      // Map travel group to activity description
      let descriptionByGroup = {
        'solo': `혼자 ${city}의 주요 명소를 방문합니다`,
        'couple': `커플로 ${city}의 로맨틱한 장소들을 둘러봅니다`,
        'family': `가족과 함께 ${city}의 가족 친화적인 명소를 방문합니다`,
        'friends': `친구들과 ${city}의 흥미로운 장소들을 탐험합니다`,
        'seniors': `시니어 여행 중 ${city}의 주요 명소를 느긋한 일정으로 방문합니다`,
        'MomDaughter': `엄마, 딸 여행 중 ${city}의 추억 가득 남길 명소를 방문합니다`
      };
      
      const activityDescription = descriptionByGroup[groupType] || `${city}의 주요 명소 방문`;
      
      return [
        {
          duration: "1h 0m",
          title: activityTitle,
          description: activityDescription,
          location: city,
          base: city,
          lat: coords.lat,
          lng: coords.lng
        }
      ];
    };
  
    // Create recommendation based on travel style and group
    const createRecommendation = (city) => {
      let recommendations = {
        'nature': {
          'solo': `${city}에서 혼자 즐기기 좋은 자연 경관 명소: 산책로와 전망대`,
          'couple': `${city}에서 커플이 즐길 수 있는 로맨틱한 자연 명소`,
          'family': `${city}에서 가족과 함께할 수 있는 자연 친화적 활동`,
          'friends': `${city}에서 친구들과 함께 즐길 수 있는 자연 명소`,
          'seniors': `${city}에서 시니어 여행에서 여유롭게 방문할 수 있는 자연 명소`,
          'MomDaughter': `${city}에서 엄마와 딸이 추억 남길 수 있는 자연 명소`,

        },
        'activity': {
          'solo': `${city} 주변의 솔로 하이커에게 추천하는 트레일`,
          'couple': `${city} 근처에서 커플이 함께할 수 있는 하이킹 코스`,
          'family': `${city} 주변의 가족 친화적인 하이킹 트레일`,
          'friends': `${city} 근처에서 친구들과 함께 도전할 수 있는 흥미로운 등산로`,
          'seniors': `${city} 주변에서 간단히 즐길 수 있는 짧은 하이킹 코스`,
          'MomDaughter': `${city} 엄마와 딸이 행복하게 즐길 수 있는 짧은 하이킹 코스`
        },
        'balanced': {
          'solo': `${city}의 문화 명소와 자연 경관을 모두 즐길 수 있는 솔로 여행자 코스`,
          'couple': `${city}에서 커플이 함께 도시와 자연을 균형있게 즐길 수 있는 여행 코스`,
          'family': `${city}에서 가족 모두가 즐길 수 있는 다양한 문화 및 자연 명소`,
          'friends': `${city}에서 친구들과 함께 즐길 수 있는 다양한 활동과 명소`,
          'seniors': `${city}에서 시니어 여행자가 효율적으로 문화와 자연을 경험할 수 있는 코스`,
          'MomDaughter': `${city}에서 엄마와 딸이 문화와 자연을 경험하며 추억할 수 있는 코스`
        }
      };
      
      return recommendations[travelStyle]?.[groupType] || 
        `${city}에서 ${travelStyle} 스타일로 ${groupType} 여행을 즐기기 위한 추천 장소와 팁`;
    };
  
    // Create days array based on selected cities
    const days = selectedCities.map((city, index) => ({
      day: index + 1,
      title: `${city} 방문`,
      description: `${groupType === 'solo' ? '혼자서' : 
                groupType === 'couple' ? '커플로' : 
                groupType === 'family' ? '가족과 함께' : 
                groupType === 'friends' ? '친구들과 함께' : 
                groupType === 'MomDaughter' ? '엄마와 딸이 함께' : 
                   '시니어 여행 중'} ${city}를 탐험합니다`,
      accommodation: index < selectedCities.length - 1 ? city : null,
      In: index === 0 ? "Zurich" : selectedCities[index - 1],
      Out: city, // 현재 city 값을 그대로 사용
      activities: createActivities(city),
      recommendations: createRecommendation(city)
    }));
  
    // Create the complete plan object
    const plan = {
      title: `${duration}일 ${startingCity}-${endingCity} 여행`,
      description: `스위스 ${startingCity}에서 ${endingCity}까지의 ${duration}일 여행 - ${
        travelStyle === 'nature' ? '자연 경관 중심' : 
        travelStyle === 'activity' ? '하이킹 중심' : 
        '균형 잡힌 여행'}`,
      startingCity,
      endingCity,
      days
    };
  
    // Set local state to show the plan preview
    setItineraryPlan(plan);

    

  
    try {
      // Generate a unique ID for the plan
      const planId = uuidv4();
      
      // Prepare the data for Firebase
      const travelPlanData = {
        ...plan,
        options: {
            duration,
            startingCity: "Zurich",
            endingCity,
            travelDate,
            groupType,
            travelStyle,
            
        },
        startingCity: "Zurich",
        endingCity,
        status: 'completed',
        createdAt: serverTimestamp(),
        userId: "pzo10X7uPDX4YH1gxSKnVaROXhw2",
      };
      
      // Save to Firebase
      await setDoc(doc(db, 'travelPlans', planId), travelPlanData);

      // Set the saved plan ID to state
      setSavedPlanId(planId);
      
      // Provide feedback to the user (optional)
      alert('여행 계획이 성공적으로 저장되었습니다!');
      
      // Optionally, navigate to the saved plan view
      // router.push(`/plans/${planId}`);
    } catch (error) {
      console.error('Error saving travel plan:', error);
      alert('여행 계획 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Create Your Swiss Travel Plan</h1>
      
      {/* City selection section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Cities to Visit</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Click on cities to add them to your itinerary. The order represents your travel sequence.
        </p>
        
        <div className="flex flex-wrap mb-6">
          {SWISS_CITIES.map(city => (
            <CityButton 
              key={city}
              city={city}
              onClick={handleCityClick}
              isSelected={selectedCities.includes(city)}
            />
          ))}
        </div>
      </section>
      
      {/* Selected cities - sortable list */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Your Itinerary 
          {selectedCities.length > 0 && (
            <span className="ml-2 text-blue-600 font-normal">
              (Day 1 - Day {selectedCities.length})
            </span>
          )}
        </h2>
        {selectedCities.length > 0 ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Drag to reorder cities. The first city is your starting point and the last city is your ending point.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={selectedCities}
                strategy={verticalListSortingStrategy}
              >
                <div className="max-w-xl mx-auto">
                  {selectedCities.map((city, index) => (
                    <SortableItem 
                      key={`${city}-${index}`} 
                      id={`${city}-${index}`} 
                      city={city}
                      index={index + 1}
                      onRemove={() => handleRemoveCity(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 border border-dashed rounded-lg">
            No cities selected. Click on cities above to build your itinerary.
          </p>
        )}
      </section>
      
      {/* Additional details section */}
      <section className="mb-8 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Travel Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Date</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Who's Traveling?</label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="solo">Solo Traveler</option>
              <option value="couple">Couple</option>
              <option value="family">Family with Kids</option>
              <option value="friends">Group of Friends</option>
              <option value="seniors">Senior Travelers</option>
              <option value="MomDaughter">Mom and Daughter</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Style</label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="nature">Nature Lover</option>
              <option value="activity">Hiking Mania</option>
              <option value="balanced">Balanced (Nature & Culture)</option>
            </select>
          </div>
        </div>
      </section>
      
      {/* Action buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={handleCreatePlan}
          disabled={selectedCities.length < 2}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Create Basic Plan
        </button>
      </div>
      
      {/* Preview of the plan */}
      {itineraryPlan && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">{itineraryPlan.title}</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{itineraryPlan.description}</p>
          
            {/* Plan saved notification with link */}
            {savedPlanId && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 mb-2">여행 계획이 성공적으로 저장되었습니다!</p>
                <a 
                href={`/consulting/${savedPlanId}`} 
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                저장된 여행 계획 보기
                </a>
            </div>
            )}

          <div className="space-y-6">
            {itineraryPlan.days.map((day) => (
              <div key={day.day} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 p-4">
                  <h3 className="font-bold">Day {day.day}: {day.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{day.description}</p>
                  {day.accommodation && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">숙박:</span> {day.accommodation}
                    </p>
                  )}
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium mb-2">활동</h4>
                  {day.activities.map((activity, idx) => (
                    <div key={idx} className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{activity.title}</span>
                        <span className="text-sm text-gray-500">{activity.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">위치: {activity.location}</p>
                    </div>
                  ))}
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-1">추천 정보</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{day.recommendations}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
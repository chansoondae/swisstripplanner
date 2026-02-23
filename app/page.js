'use client';

import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import locationData from '../utils/locationData';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { getRandomDescription, getRandomRecommendation } from '../lib/travelTexts';

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

// Get label and style for each item in the list
function getItemRole(index, totalCount) {
  if (index === 0) return { label: '출발', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
  if (index === totalCount - 1) return { label: '귀국', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' };
  return { label: `${index}박`, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
}

// Sortable item component
const SortableItem = ({ id, city, index, totalCount, onRemove }) => {
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

  const { label, color } = getItemRole(index, totalCount);

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
        <div>
          <span className="font-medium">{city}</span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${color}`}>
            {label}
          </span>
        </div>
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

export default function Home() {
  const router = useRouter();

  const SWISS_CITIES = [
    'Grindelwald', 'Interlaken Ost', 'Lauterbrunnen', 'Wengen', 'Luzern',
    'Zermatt', 'Zurich', 'Basel SBB', 'Bern', 'Spiez', 'Murren',
    'Lausanne', 'Geneva', 'Vevey', 'Montreux', 'Adelboden',
    'St. Moritz', 'Chur', 'Lugano', 'Milano'
  ];

  const [selectedCities, setSelectedCities] = useState([]);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Derived values
  const nights = selectedCities.length >= 2 ? selectedCities.length - 2 : 0;
  const tripDays = selectedCities.length >= 2 ? selectedCities.length - 1 : 0;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCityClick = (city) => {
    setSelectedCities([...selectedCities, city]);
    setSavedPlanId(null);
  };

  const handleRemoveCity = (index) => {
    const newCities = [...selectedCities];
    newCities.splice(index, 1);
    setSelectedCities(newCities);
    setSavedPlanId(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const activeIdParts = active.id.split('-');
      const overIdParts = over.id.split('-');
      const activeIndex = parseInt(activeIdParts[activeIdParts.length - 1]);
      const overIndex = parseInt(overIdParts[overIdParts.length - 1]);

      const newOrder = [...selectedCities];
      const [movedItem] = newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, movedItem);

      setSelectedCities(newOrder);
      setSavedPlanId(null);
    }
  };

  const handleCreatePlan = async () => {
    if (selectedCities.length < 3) {
      alert('출발지, 최소 1박 숙박 도시, 귀국지를 선택해주세요. (최소 3개)');
      return;
    }

    setIsSaving(true);

    const departureCity = selectedCities[0];
    const returnCity = selectedCities[selectedCities.length - 1];
    // Accommodation cities = everything between departure and return
    const accommodationCities = selectedCities.slice(1, -1);

    const createActivities = (city) => {
      const coords = locationData.getCoordinates(city) || { lat: 0, lng: 0 };
      return [{
        duration: "1h 0m",
        title: `${city} 명소 및 문화 탐방`,
        description: getRandomDescription(city),
        location: city,
        base: city,
        lat: coords.lat,
        lng: coords.lng
      }];
    };

    const days = [];

    for (let i = 0; i < tripDays; i++) {
      const visitCity = selectedCities[i + 1];
      const prevCity = selectedCities[i];
      const isLastDay = i === tripDays - 1;

      days.push({
        day: i + 1,
        title: `${visitCity} 방문`,
        description: `${visitCity}를 탐험합니다`,
        accommodation: isLastDay ? null : visitCity,
        In: prevCity,
        Out: visitCity,
        activities: createActivities(visitCity),
        recommendations: getRandomRecommendation(visitCity)
      });
    }

    const plan = {
      title: `${nights}박${tripDays}일 ${departureCity}-${returnCity} 여행`,
      description: `스위스 ${departureCity}에서 출발, ${returnCity}에서 귀국하는 ${nights}박${tripDays}일 여행`,
      startingCity: departureCity,
      endingCity: returnCity,
      days
    };

    try {
      const planId = uuidv4();
      const travelPlanData = {
        ...plan,
        options: {
          duration: tripDays,
          startingCity: departureCity,
          endingCity: returnCity,
        },
        startingCity: departureCity,
        endingCity: returnCity,
        status: 'completed',
        createdAt: serverTimestamp(),
        userId: "pzo10X7uPDX4YH1gxSKnVaROXhw2",
      };

      await setDoc(doc(db, 'travelPlans', planId), travelPlanData);
      setSavedPlanId(planId);
    } catch (error) {
      console.error('Error saving travel plan:', error);
      alert('여행 계획 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">스위스 여행 플래너</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          출발지, 숙박 도시, 귀국지를 순서대로 선택하세요
        </p>
      </div>

      {/* City selection */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">도시 선택</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          도시를 클릭하면 일정에 추가됩니다. 같은 도시를 연속으로 선택하면 연박이 됩니다.
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
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

      {/* Itinerary list */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">
            여행 일정
            {selectedCities.length >= 3 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-normal text-base">
                {nights}박{tripDays}일
              </span>
            )}
          </h2>
          {selectedCities.length > 0 && (
            <button
              onClick={() => { setSelectedCities([]); setSavedPlanId(null); }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              전체 삭제
            </button>
          )}
        </div>

        {selectedCities.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              드래그하여 순서를 변경할 수 있습니다. 첫 번째 = 출발지, 중간 = 숙박 도시, 마지막 = 귀국지.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={selectedCities.map((city, i) => `${city}-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="max-w-xl mx-auto">
                  {selectedCities.map((city, index) => (
                    <SortableItem
                      key={`${city}-${index}`}
                      id={`${city}-${index}`}
                      city={city}
                      index={index}
                      totalCount={selectedCities.length}
                      onRemove={() => handleRemoveCity(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-400 dark:text-gray-500 mb-1">아직 도시가 선택되지 않았습니다</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">위에서 도시를 클릭하여 일정을 만들어보세요</p>
          </div>
        )}
      </section>

      {/* Create button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleCreatePlan}
          disabled={selectedCities.length < 3 || isSaving}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {isSaving ? (
            <span className="flex items-center">
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              저장 중...
            </span>
          ) : '여행 계획 만들기'}
        </button>
      </div>

      {/* Saved plan link */}
      {savedPlanId && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <p className="text-green-700 dark:text-green-300 mb-3 font-medium">여행 계획이 저장되었습니다!</p>
          <a
            href={`/consulting/${savedPlanId}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            저장된 여행 계획 보기
          </a>
        </div>
      )}
    </div>
  );
}

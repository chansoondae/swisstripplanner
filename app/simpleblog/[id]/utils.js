'use client';

// Format relative time function
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  // Handle Firestore timestamp object
  const date = timestamp.seconds 
    ? new Date(timestamp.seconds * 1000) 
    : new Date(timestamp);
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

// Generate locations from activities
export const generateLocationsFromActivities = (days) => {
  if (!days || !Array.isArray(days)) return [];
  
  const locations = [];
  
  days.forEach((day, dayIndex) => {
    // Add accommodation info if available
    if (day.accommodation) {
      // If you have locationData with coordinates, use it here
      const coords = { lat: 0, lng: 0 }; // Placeholder - replace with actual coordinates lookup
      
      if (coords) {
        locations.push({
          id: `accommodation-${dayIndex}`,
          name: `${day.accommodation} (숙박)`,
          description: `Day ${day.day} 숙박`,
          type: 'hotel',
          lat: coords.lat,
          lng: coords.lng
        });
      }
    }
    
    // Add activity info
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity, actIndex) => {
        // Check if activity has direct lat, lng values
        if (activity.lat && activity.lng) {
          locations.push({
            id: `activity-${dayIndex}-${actIndex}`,
            name: `${actIndex + 1}. ${activity.title}`,
            description: activity.description,
            type: 'attraction',
            duration: activity.duration,
            lat: activity.lat,
            lng: activity.lng
          });
        }
        // If no direct coordinates but location name exists
        else if (activity.location) {
          // Look up coordinates from location data
          const coords = { 
            lat: 0 + (Math.random() * 0.01 - 0.005), 
            lng: 0 + (Math.random() * 0.01 - 0.005) 
          }; // Placeholder - replace with actual coordinates lookup
          
          if (coords) {
            locations.push({
              id: `activity-${dayIndex}-${actIndex}`,
              name: `${actIndex + 1}. ${activity.title}`,
              description: activity.description,
              type: 'attraction',
              duration: activity.duration,
              lat: coords.lat,
              lng: coords.lng
            });
          }
        }
      });
    }
  });
  
  return locations;
};

// Travel style mapping
export const travelStyleMap = {
  'nature': '자연 경관 위주',
  'activity': '하이킹과 액티비티',
  'balanced': '자연+도시 조화'
};

// Group type mapping
export const groupTypeMap = {
  'solo': '나홀로',
  'couple': '커플',
  'family': '가족',
  'friends': '친구',
  'seniors': '시니어',
  'MomDaughter': '엄마딸'
};
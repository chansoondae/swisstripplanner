// app/components/TravelRouteMap.js
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, LoadScriptNext, InfoWindow, Polyline } from '@react-google-maps/api';
import locationData from '../../utils/locationData';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const mobileMapContainerStyle = {
  width: '100%',
  height: '350px',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || '',
};

// Total number of days for gradient calculation
function getGradientColor(dayNumber, totalDays) {
  if (totalDays <= 1) return '#3B82F6';
  const ratio = (dayNumber - 1) / (totalDays - 1);
  const r = Math.round(59 + (239 - 59) * ratio);
  const g = Math.round(130 + (68 - 130) * ratio);
  const b = Math.round(246 + (68 - 246) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

// Group consecutive days with the same city
function groupDaysByCity(days) {
  if (!days || days.length === 0) return [];

  const sortedDays = [...days].sort((a, b) => a.day - b.day);
  const groups = [];

  // Add departure city (Day 1's In) as the first marker if it differs from Day 1's Out
  const firstDay = sortedDays[0];
  if (firstDay && firstDay.In) {
    const departureName = firstDay.In;
    const departureCoords = locationData.cityCoordinates[departureName];
    const firstDayCity = extractCityName(firstDay);
    if (departureCoords && departureName !== firstDayCity) {
      groups.push({
        cityName: departureName,
        dayNumbers: [0], // 0 = departure marker
        days: [],
        lat: departureCoords.lat,
        lng: departureCoords.lng,
        isDeparture: true,
      });
    }
  }

  for (const day of sortedDays) {
    const cityName = extractCityName(day);
    const coords = extractCoords(day);

    if (!coords) continue;

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.cityName === cityName && !lastGroup.isDeparture) {
      lastGroup.dayNumbers.push(day.day);
      lastGroup.days.push(day);
    } else {
      groups.push({
        cityName,
        dayNumbers: [day.day],
        days: [day],
        lat: coords.lat,
        lng: coords.lng,
      });
    }
  }

  // Mark the last group as arrival if the last day has no accommodation (= return day)
  const lastDay = sortedDays[sortedDays.length - 1];
  if (lastDay && !lastDay.accommodation && groups.length > 0) {
    const lastGroup = groups[groups.length - 1];
    lastGroup.isArrival = true;
  }

  return groups;
}

// Merge groups at the same location into "location nodes" for marker rendering
// Each node has one position but may contain multiple groups (e.g. Zurich Day1 + Zurich Day4)
function mergeGroupsByLocation(groups) {
  const nodeMap = {};
  const nodes = [];

  for (const group of groups) {
    const key = `${group.lat.toFixed(4)},${group.lng.toFixed(4)}`;
    if (!nodeMap[key]) {
      nodeMap[key] = { lat: group.lat, lng: group.lng, groups: [] };
      nodes.push(nodeMap[key]);
    }
    nodeMap[key].groups.push(group);
  }

  return nodes;
}

function extractCityName(day) {
  if (day.Out) return day.Out;
  if (day.title) {
    const match = day.title.replace(/\s*방문\s*$/, '').trim();
    if (match && locationData.cityCoordinates[match]) return match;
  }
  if (day.activities && day.activities.length > 0 && day.activities[0].location) {
    return day.activities[0].location;
  }
  if (day.In) return day.In;
  return day.title || `Day ${day.day}`;
}

function extractCoords(day) {
  if (day.Out) {
    const coords = locationData.cityCoordinates[day.Out];
    if (coords) return coords;
  }
  if (day.title) {
    const cityFromTitle = day.title.replace(/\s*방문\s*$/, '').trim();
    if (cityFromTitle) {
      const coords = locationData.cityCoordinates[cityFromTitle];
      if (coords) return coords;
    }
  }
  if (day.activities) {
    for (const activity of day.activities) {
      if (activity.lat && activity.lng) {
        return { lat: activity.lat, lng: activity.lng };
      }
      if (activity.location) {
        const coords = locationData.cityCoordinates[activity.location];
        if (coords) return coords;
      }
    }
  }
  if (day.In) {
    const coords = locationData.cityCoordinates[day.In];
    if (coords) return coords;
  }
  if (day.accommodation) {
    const coords = locationData.cityCoordinates[day.accommodation];
    if (coords) return coords;
  }
  return null;
}

const TravelRouteMap = ({ days = [], selectedDay = null, onMarkerClick }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [map, setMap] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [advancedMarkers, setAdvancedMarkers] = useState([]);
  const [activityMarkers, setActivityMarkers] = useState([]);
  const [activityPolylines, setActivityPolylines] = useState([]);

  const totalDays = days.length;
  const groups = useMemo(() => groupDaysByCity(days), [days]);
  const locationNodes = useMemo(() => mergeGroupsByLocation(groups), [groups]);

  // Build polyline path from groups (preserves travel order)
  const polylinePath = useMemo(() => {
    return groups.map(g => ({ lat: g.lat, lng: g.lng }));
  }, [groups]);

  const center = groups.length > 0
    ? { lat: groups[0].lat, lng: groups[0].lng }
    : { lat: 46.8182, lng: 8.2275 };

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android/.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      setGoogleMapsLoaded(true);
    }
  }, []);

  // Create advanced markers — one per location node
  useEffect(() => {
    if (!map || !googleMapsLoaded || locationNodes.length === 0) return;

    advancedMarkers.forEach(marker => marker.map = null);

    const newMarkers = locationNodes.map((node) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'travel-route-marker';
      markerElement.style.cursor = 'pointer';
      markerElement.style.display = 'flex';
      markerElement.style.gap = '4px';
      markerElement.style.alignItems = 'center';

      // Each group in this node gets its own circle
      node.groups.forEach((group) => {
        const isDeparture = group.isDeparture;
        const isArrival = group.isArrival;
        const isSpecial = isDeparture || isArrival;
        const dayLabel = isDeparture
          ? '출발'
          : isArrival
            ? '도착'
            : group.dayNumbers.length > 1
              ? `${group.dayNumbers[0]}-${group.dayNumbers[group.dayNumbers.length - 1]}`
              : `${group.dayNumbers[0]}`;

        const color = isDeparture ? '#10B981' : isArrival ? '#F59E0B' : getGradientColor(group.dayNumbers[0], totalDays);
        const isSelected = !isSpecial && selectedDay !== null && group.dayNumbers.includes(selectedDay);
        const size = isSelected ? 44 : 36;
        const fontSize = isSpecial ? 11 : (isSelected ? 15 : 13);

        const circle = document.createElement('div');
        circle.style.cssText = `
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${fontSize}px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: ${isSelected ? '3px solid white' : 'none'};
          transition: all 0.2s ease;
          flex-shrink: 0;
        `;
        circle.textContent = dayLabel;

        circle.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedGroup(group);
          if (!isSpecial && onMarkerClick) {
            onMarkerClick(group.dayNumbers[0]);
          }
        });

        markerElement.appendChild(circle);
      });

      const hasSelected = node.groups.some(g => selectedDay !== null && g.dayNumbers.includes(selectedDay));

      const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: node.lat, lng: node.lng },
        map: map,
        content: markerElement,
        zIndex: hasSelected ? 1000 : 1,
      });

      return advancedMarker;
    });

    setAdvancedMarkers(newMarkers);
  }, [map, locationNodes, googleMapsLoaded, selectedDay, totalDays]);

  // Create activity markers for all days (always visible)
  useEffect(() => {
    // Clear previous activity markers and polylines
    activityMarkers.forEach(m => m.map = null);
    activityPolylines.forEach(p => p.setMap(null));

    if (!map || !googleMapsLoaded || !days || days.length === 0) {
      setActivityMarkers([]);
      setActivityPolylines([]);
      return;
    }

    const newMarkers = [];
    const newPolylines = [];

    days.forEach((dayData) => {
      if (!dayData.activities || dayData.activities.length === 0) return;

      const cityCoords = extractCoords(dayData);
      if (!cityCoords) return;

      const isHighlightedDay = selectedDay !== null && dayData.day === selectedDay;
      const isDimmed = selectedDay !== null && dayData.day !== selectedDay;

      dayData.activities.forEach((activity, idx) => {
        let actCoords = null;
        if (activity.lat && activity.lng) {
          actCoords = { lat: activity.lat, lng: activity.lng };
        } else if (activity.location) {
          actCoords = locationData.cityCoordinates[activity.location];
        }

        if (!actCoords) return;

        // Skip if activity is at the same location as city center (within ~500m)
        const isSameLocation = Math.abs(actCoords.lat - cityCoords.lat) < 0.005 &&
                                Math.abs(actCoords.lng - cityCoords.lng) < 0.005;
        if (isSameLocation) return;

        const opacity = isDimmed ? 0.4 : 1;
        const size = isHighlightedDay ? 28 : 24;
        const fontSize = isHighlightedDay ? 12 : 10;
        const dayColor = getGradientColor(dayData.day, totalDays);

        // Create small activity marker (diamond shape with location initial)
        const actName = activity.title || activity.location || '';
        const letter = actName.charAt(0).toUpperCase() || '?';
        const markerEl = document.createElement('div');
        markerEl.style.cursor = 'pointer';
        markerEl.style.opacity = opacity;
        markerEl.style.transition = 'opacity 0.2s ease';
        markerEl.innerHTML = `
          <div style="
            background-color: ${dayColor};
            color: white;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize}px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
            transform: rotate(45deg);
            border-radius: 4px;
          "><span style="transform: rotate(-45deg);">${letter}</span></div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: actCoords,
          map: map,
          content: markerEl,
          zIndex: isHighlightedDay ? 600 : 500,
        });

        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedGroup({
            cityName: activity.title,
            dayNumbers: [dayData.day],
            days: [dayData],
            lat: actCoords.lat,
            lng: actCoords.lng,
            isActivity: true,
            activityDetail: activity,
          });
        });

        newMarkers.push(marker);

        // Draw thin line from city center to activity
        const polyline = new google.maps.Polyline({
          path: [cityCoords, actCoords],
          strokeColor: dayColor,
          strokeOpacity: isDimmed ? 0.2 : 0.5,
          strokeWeight: isHighlightedDay ? 2.5 : 1.5,
          geodesic: true,
          map: map,
        });

        newPolylines.push(polyline);
      });
    });

    setActivityMarkers(newMarkers);
    setActivityPolylines(newPolylines);
  }, [map, googleMapsLoaded, selectedDay, days, totalDays]);

  // Fit bounds
  const fitBounds = useCallback(() => {
    if (map && groups.length > 1 && googleMapsLoaded) {
      const bounds = new window.google.maps.LatLngBounds();
      groups.forEach(group => {
        bounds.extend(new window.google.maps.LatLng(group.lat, group.lng));
      });
      const padding = isMobile ? 50 : 100;
      map.fitBounds(bounds, padding);
    }
  }, [map, groups, googleMapsLoaded, isMobile]);

  const onLoad = useCallback((map) => {
    setMap(map);
    setGoogleMapsLoaded(true);
  }, []);

  useEffect(() => {
    if (map && groups.length > 0 && googleMapsLoaded) {
      fitBounds();
    }
  }, [map, groups, fitBounds, googleMapsLoaded]);

  if (days.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p>여행 일정 정보가 없습니다.</p>
      </div>
    );
  }

  const renderInfoContent = () => {
    if (!selectedGroup) return null;

    // Activity detail InfoWindow
    if (selectedGroup.isActivity && selectedGroup.activityDetail) {
      const act = selectedGroup.activityDetail;
      return (
        <div className="p-2 max-w-xs">
          <h3 className="font-bold text-base">{act.title}</h3>
          {act.location && <p className="text-xs text-gray-500 mt-1">{act.location}</p>}
          {act.duration && <p className="text-xs text-gray-500">{act.duration}</p>}
          {act.price && <p className="text-xs text-gray-500">CHF {act.price}</p>}
          {act.description && <p className="text-sm text-gray-700 mt-1">{act.description}</p>}
        </div>
      );
    }

    const dayLabel = selectedGroup.dayNumbers.length > 1
      ? `Day ${selectedGroup.dayNumbers[0]}-${selectedGroup.dayNumbers[selectedGroup.dayNumbers.length - 1]}`
      : `Day ${selectedGroup.dayNumbers[0]}`;

    return (
      <div className="p-2 max-w-xs">
        <h3 className="font-bold text-lg">{dayLabel}: {selectedGroup.cityName}</h3>
        {selectedGroup.days.map((day, i) => (
          <div key={day.day} className={i > 0 ? 'mt-2 pt-2 border-t border-gray-200' : 'mt-1'}>
            {selectedGroup.dayNumbers.length > 1 && (
              <p className="text-xs font-semibold text-gray-500">Day {day.day}</p>
            )}
            {day.activities && day.activities.slice(0, 3).map((act, j) => (
              <p key={j} className="text-sm text-gray-700">• {act.title}</p>
            ))}
            {day.activities && day.activities.length > 3 && (
              <p className="text-xs text-gray-400">...외 {day.activities.length - 3}개</p>
            )}
            {day.recommendations && (
              <p className="text-xs text-amber-600 mt-1 line-clamp-2">{day.recommendations}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const polylineOptions = {
    strokeColor: '#6366F1',
    strokeOpacity: 0,
    icons: [{
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 0.6,
        strokeWeight: 3,
        scale: 4,
      },
      offset: '0',
      repeat: '16px',
    }],
    geodesic: true,
  };

  const renderMap = () => {
    const currentMapStyle = isMobile ? mobileMapContainerStyle : mapContainerStyle;

    return (
      <>
        <GoogleMap
          mapContainerStyle={currentMapStyle}
          center={center}
          zoom={8}
          options={mapOptions}
          onLoad={onLoad}
        >
          {googleMapsLoaded && (
            <>
              {polylinePath.length > 1 && (
                <Polyline
                  path={polylinePath}
                  options={polylineOptions}
                />
              )}

              {selectedGroup && (
                <InfoWindow
                  position={{ lat: selectedGroup.lat, lng: selectedGroup.lng }}
                  onCloseClick={() => setSelectedGroup(null)}
                >
                  {renderInfoContent()}
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>

        {/* Legend */}
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow mt-2 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#10B981', fontSize: '8px' }}>출발</div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>출발</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#3B82F6' }}>1</div>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>→</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#EF4444' }}>N</div>
            </div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Day 순서</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#F59E0B', fontSize: '8px' }}>도착</div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>도착</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#7C3AED', fontSize: '9px', transform: 'rotate(45deg)', borderRadius: '2px' }}><span style={{ transform: 'rotate(-45deg)', display: 'block' }}>A</span></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>명소</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="32" height="8">
              <line x1="0" y1="4" x2="32" y2="4" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>이동 경로</span>
          </div>
        </div>
      </>
    );
  };

  if (scriptLoaded) {
    return renderMap();
  }

  return (
    <LoadScriptNext
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={['marker']}
      onLoad={() => setScriptLoaded(true)}
      onError={(error) => console.error('Google Maps script loading error:', error)}
      loadingElement={<div className="p-4 text-center">Loading map...</div>}
    >
      {renderMap()}
    </LoadScriptNext>
  );
};

export default TravelRouteMap;

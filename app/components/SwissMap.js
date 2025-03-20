// app/components/SwissMap.js
'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScriptNext, InfoWindow, Polyline } from '@react-google-maps/api';
import { FiMapPin, FiClock, FiExternalLink, FiInfo } from 'react-icons/fi';

// Responsive map container styles
const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

// Mobile map style
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
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || '', // Map ID 추가
};

// Icons for different place types
const iconColors = {
  city: '#4285F4', // blue
  attraction: '#EA4335', // red
  hotel: '#FBBC04', // yellow
  restaurant: '#34A853', // green
  transport: '#9C27B0', // purple
};

// Path styles for the route
const polylineOptions = {
  strokeColor: '#4F46E5',
  strokeOpacity: 0.8,
  strokeWeight: 3,
};

const SwissMap = ({ locations = [] }) => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [advancedMarkers, setAdvancedMarkers] = useState([]);
  
  // Calculate center based on first location or default to center of Switzerland
  const center = locations.length > 0
    ? { lat: locations[0].lat, lng: locations[0].lng }
    : { lat: 46.8182, lng: 8.2275 }; // Center of Switzerland
  
  // Set up path coordinates from locations
  const pathCoordinates = locations.map(loc => ({
    lat: loc.lat,
    lng: loc.lng,
  }));
  
  // Mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android/.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Check if Google Maps API is already loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      setGoogleMapsLoaded(true);
    }
  }, []);
  
  // Create advanced markers when map is loaded
  useEffect(() => {
    if (map && googleMapsLoaded && locations.length > 0) {
      // Clear any existing markers
      advancedMarkers.forEach(marker => marker.map = null);

      // 먼저 어트랙션 타입만 필터링하여 번호 매기기 위한 준비
      const attractionLocations = locations.filter(location => location.type === 'attraction');
      let attractionIndex = 0;
      
      // Create new advanced markers
      const newMarkers = locations.map((location, index) => {
        // Create marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'advanced-marker';
        markerElement.style.cursor = 'pointer';
        
        // Create marker content with number and background color
        const color = iconColors[location.type] || iconColors.attraction;
        // 호텔인 경우 홈 아이콘 사용, 그 외에는 번호 사용
        if (location.type === 'hotel') {
          markerElement.innerHTML = `
            <div style="
              background-color: ${color};
              color: white;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          `;
        } else {
          attractionIndex++;
          markerElement.innerHTML = `
            <div style="
              background-color: ${color};
              color: white;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            ">
              ${attractionIndex}
            </div>
          `;
        }
        
        
        // Create the advanced marker
        const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          content: markerElement
        });
        
        // Add click event to the marker
        markerElement.addEventListener('click', () => {
          setSelectedPlace(location);
        });
        
        return advancedMarker;
      });
      
      setAdvancedMarkers(newMarkers);
    }
  }, [map, locations, googleMapsLoaded]);
  
  // Fit bounds to contain all markers when map loads or locations change
  const fitBounds = useCallback(() => {
    if (map && locations.length > 1 && googleMapsLoaded) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
      });
      map.fitBounds(bounds);
      
      // Apply some padding to the bounds - only if map bounds are available
      const currentBounds = map.getBounds();
      if (currentBounds) {
        const padding = isMobile ? 50 : 100;
        const newBounds = new window.google.maps.LatLngBounds(
          currentBounds.getSouthWest(),
          currentBounds.getNorthEast()
        );
        map.fitBounds(newBounds, padding);
      }
    }
  }, [map, locations, googleMapsLoaded, isMobile]);
  
  // Handle map load
  const onLoad = useCallback((map) => {
    setMap(map);
    setGoogleMapsLoaded(true);
  }, []);
  
  // Fit bounds when locations or map changes
  useEffect(() => {
    if (map && locations.length > 0 && googleMapsLoaded) {
      fitBounds();
    }
  }, [map, locations, fitBounds, googleMapsLoaded]);
  
  // Show loading state if no locations
  if (locations.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p>Location information is not available. The map will be displayed when locations are loaded.</p>
      </div>
    );
  }
  
  // Render map content
  const renderMap = () => {
    // Select map style based on device
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
          {/* Only render when Google Maps is loaded */}
          {googleMapsLoaded && (
            <>
              {/* Draw the route line */}
              {/* {locations.length > 1 && (
                <Polyline
                  path={pathCoordinates}
                  options={polylineOptions}
                />
              )} */}
              
              {/* Info window for selected place */}
              {selectedPlace && (
                <InfoWindow
                  position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-bold text-lg">{selectedPlace.name}</h3>
                    <p className="text-sm mb-2">{selectedPlace.address}</p>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <FiClock className="mr-1" />
                      <span>Duration: {selectedPlace.duration ? `${selectedPlace.duration} min` : 'N/A'}</span>
                    </div>
                    {selectedPlace.tip && (
                      <div className="flex items-start text-sm text-gray-600 mb-2">
                        <FiInfo className="mr-1 mt-1" />
                        <span>{selectedPlace.tip}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {selectedPlace.url && (
                        <a 
                          href={selectedPlace.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 text-sm"
                        >
                          <FiExternalLink className="mr-1" /> Website
                        </a>
                      )}
                      {selectedPlace.googleMapsUrl && (
                        <a 
                          href={selectedPlace.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-green-600 text-sm"
                        >
                          <FiMapPin className="mr-1" /> Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>
        
        {/* Map legend */}
        <div className="bg-white p-3 rounded-lg shadow mt-2 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Cities</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Attractions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Hotels</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Restaurants</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-1 bg-indigo-500 mr-1"></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Recommended Route</span>
          </div>
        </div>
      </>
    );
  };

  // Handle already loaded script or load a new one
  if (scriptLoaded) {
    return renderMap();
  }
  
  return (
    <LoadScriptNext 
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={['marker']} // Add marker library for AdvancedMarkerElement
      onLoad={() => {
        // console.log('Google Maps script loaded successfully');
        setScriptLoaded(true);
      }}
      onError={(error) => console.error('Google Maps script loading error:', error)}
      loadingElement={<div className="p-4 text-center">Loading map...</div>}
    >
      {renderMap()}
    </LoadScriptNext>
  );
};

export default SwissMap;
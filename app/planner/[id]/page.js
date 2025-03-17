// app/planner/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TravelItinerary from './../../components/TravelItinerary';
import SwissMap from './../../components/SwissMap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './../../../lib/firebase';
import { FiLoader, FiArrowLeft, FiClock, FiMapPin, FiUsers, FiCalendar, FiDollarSign } from 'react-icons/fi';
import ChatButtonPortal from './../../components/ChatButtonPortal';

// Loading component
const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin text-blue-600 mb-4">
      <FiLoader size={40} />
    </div>
    <p className="text-gray-600 text-lg">{message}</p>
  </div>
);

// Error component
const ErrorState = ({ error }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h1>
    <p className="text-gray-600">{error}</p>
    <a href="/planner" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Return to Travel Planner
    </a>
  </div>
);

// Not found component
const NotFoundState = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">Travel Plan Not Found</h1>
    <p className="text-gray-600">The requested travel plan does not exist or has expired.</p>
    <a href="/" className="btn btn-primary mt-6 inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Create a New Travel Plan
    </a>
  </div>
);

// Processing state component
const ProcessingState = ({ plan, isMobile, router, formatRelativeTime }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin text-blue-600 mb-4">
        <FiLoader size={40} />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Creating Your Travel Plan...</h2>
      <p className="text-gray-600 text-center mb-6">
        Our AI is crafting your personalized Swiss travel itinerary.<br />
        This may take up to a minute.
      </p>
      
      {/* Plan request preview */}
      {plan?.options && (
        <div className="w-full max-w-md bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
          <h3 className="font-semibold text-blue-800 mb-2">Your Travel Request</h3>
          <div className="grid grid-cols-2 gap-2">
            {plan.options.startingCity && (
              <div className="flex items-center">
                <FiMapPin className="mr-1 text-blue-600" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>Starting: {plan.options.startingCity}</span>
              </div>
            )} 
            {plan.options.duration && (
              <div className="flex items-center">
                <FiClock className="mr-1 text-blue-600" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>Duration: {plan.options.duration} days</span>
              </div>
            )}
            {plan.options.groupType && (    
              <div className="flex items-center">
                <FiUsers className="mr-1 text-blue-600" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>Travelers: {plan.options.groupType}</span>
              </div>
            )}
            {plan.options.budget && (    
              <div className="flex items-center">
                <FiDollarSign className="mr-1 text-blue-600" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>Budget: {plan.options.budget}</span>
              </div>
            )}
            {plan.createdAt && (
              <div className="flex items-center">
                <FiCalendar className="mr-1 text-blue-600" /> 
                <span className={`${isMobile ? 'text-sm' : 'text-base'}`}> 
                  Created: {formatRelativeTime(plan.createdAt)}
                </span>
              </div>
            )}
          </div>
          
          {plan.options.prompt && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-1">Your request:</p>
              <p className="text-sm text-gray-700 italic">"{plan.options.prompt}"</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-center">
            <button 
              onClick={() => router.push('/planner')}
              className={`btn btn-primary mb-4 flex items-center ${isMobile ? 'text-sm' : ''} bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg`}
            >
              <FiArrowLeft className="mr-1" /> Return to Planner
            </button>
          </div>
        </div>
      )}
      
      <p className="text-gray-500 text-sm mt-6">
        You can leave this page - your travel plan will continue generating. Check back later.
      </p>
    </div>
  </div>
);

// Format relative time function
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  // Handle Firestore timestamp object
  const date = timestamp.seconds 
    ? new Date(timestamp.seconds * 1000) 
    : new Date(timestamp);
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} years ago`;
};

export default function TravelPlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id;
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Check travel plan status
  const checkPlanStatus = (planData) => {
    if (!planData) return 'loading';
    
    // Check status field if it exists
    if (planData.status) {
      return planData.status;
    }
    
    // Check if locations array is empty or missing
    if (!planData.locations || !Array.isArray(planData.locations) || planData.locations.length === 0) {
      return 'processing';
    }
    
    // Check if days array is empty or missing
    if (!planData.days || !Array.isArray(planData.days) || planData.days.length === 0) {
      return 'processing';
    }
    
    // Check if title and description exist
    if (!planData.title || !planData.description) {
      return 'processing';
    }
    
    return 'completed';
  };
  
  // Fetch travel plan data
  const fetchTravelPlan = async (isRefreshing = false) => {
    if (!planId) {
      setError('Invalid travel plan ID.');
      setLoading(false);
      return;
    }
    
    try {
      // Only show loading state when first loading (not refreshing)
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Fetch travel plan data from Firestore
      const planDoc = await getDoc(doc(db, 'travelPlans', planId));
      
      if (planDoc.exists()) {
        const planData = planDoc.data();
        setPlan(planData);
        
        // If plan is processing, check again in 5 seconds
        const status = checkPlanStatus(planData);
        
        if (status === 'processing') {
          setTimeout(() => fetchTravelPlan(true), 5000);
        }
      } else {
        setError('Travel plan not found.');
      }
    } catch (err) {
      console.error('Error fetching travel plan:', err);
      setError('Error loading your travel plan. Please try again.');
    } finally {
      // Only update loading state when first loading (not refreshing)
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };
  
  // Fetch data when component mounts or planId changes
  useEffect(() => {
    fetchTravelPlan();
  }, [planId]);
  
  // Check plan status
  const planStatus = plan ? checkPlanStatus(plan) : 'loading';
  const isProcessing = planStatus === 'processing';
  
  // Loading state
  if (loading) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <LoadingState message="Loading your travel plan..." />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <ErrorState error={error} />
      </div>
    );
  }
  
  // Not found state
  if (!plan) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <NotFoundState />
      </div>
    );
  }
  
  // Processing state
  if (isProcessing) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>        
        <ProcessingState 
          plan={plan}
          isMobile={isMobile} 
          router={router}
          formatRelativeTime={formatRelativeTime}
        />
      </div>
    );
  }
  
  // Completed plan display
  return (
    <div className={`max-w-5xl mx-auto ${isMobile ? 'p-0' : 'px-4 py-2'}`}>
      {/* Map section */}
      <section className={isMobile ? "mb-4" : "mb-8"}>
        <SwissMap locations={plan.locations} />
      </section>
      
      {/* Itinerary section */}
      <section className={isMobile ? "mb-4" : "mb-8"}>
        <div className={isMobile ? "" : "bg-white rounded-lg shadow-lg"}>
          <TravelItinerary travelPlan={plan} />
        </div>
      </section>
      
      {/* Optional chat button for follow-up questions */}
      {process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' && <ChatButtonPortal />}
    </div>
  );
}
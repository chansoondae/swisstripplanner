// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlannerForm from './components/PlannerForm';
import ChatButtonPortal from './components/ChatButtonPortal';

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      // Send the form data to our API route
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate travel plan');
      }
      
      const data = await response.json();
      
      // Redirect to the planner detail page
      router.push(`/planner/${data.planId}`);
    } catch (error) {
      console.error('Error generating travel plan:', error);
      alert('Failed to generate your travel plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Swiss Travel Planner</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
          Plan your perfect Swiss adventure. Tell us your preferences, and our AI will create a personalized itinerary 
          for your trip to Switzerland.
        </p>
      </div>
      
      <PlannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      <ChatButtonPortal />
    
    </div>
  );
}
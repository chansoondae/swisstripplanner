// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlannerForm from './components/PlannerForm';

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
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Plan your perfect Swiss adventure. Tell us your preferences, and our AI will create a personalized itinerary 
          for your trip to Switzerland.
        </p>
      </div>
      
      <PlannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      
      {/* <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Why Visit Switzerland?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Stunning Alpine Landscapes</h3>
            <p className="text-sm text-gray-600">Experience breathtaking mountains, pristine lakes, and picturesque valleys.</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Efficient Transportation</h3>
            <p className="text-sm text-gray-600">Navigate easily with one of the world's best public transportation systems.</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Rich Cultural Experiences</h3>
            <p className="text-sm text-gray-600">Discover diverse cultures, languages, and traditions in a compact country.</p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
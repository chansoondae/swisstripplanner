// app/api/generate-plan/route.js
import { NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './../../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { calculateTotalTravelCost } from './../../../utils/calculateCost';


// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


export async function POST(request) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Generate a unique ID for the plan
    const planId = uuidv4();
    
    // Create the prompt for OpenAI based on user input
    const prompt = createPrompt(data);
    
    // Save the initial plan request to Firestore
    await setDoc(doc(db, 'travelPlans', planId), {
      options: {
        prompt: data.prompt,
        duration: data.duration,
        travelStyle: data.travelStyle,
        startingCity: data.startingCity,
        endingCity: data.endingCity,
        travelDate: data.travelDate,
        groupType: data.groupType,
      },
      status: 'processing',
      createdAt: serverTimestamp(),
    });
    
    // Start the OpenAI request in the background
    generateTravelPlan(planId, prompt);
    
    // Return the plan ID immediately
    return NextResponse.json({ planId, status: 'processing' });
  } catch (error) {
    console.error('Error generating travel plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate travel plan' },
      { status: 500 }
    );
  }
}

// Function to create the prompt for OpenAI
function createPrompt(data) {
  const {
    prompt,
    duration,
    travelStyle,
    startingCity,
    endingCity,
    travelDate,
    groupType
  } = data;
  
  let travelDateText = '';
  if (travelDate) {
    const date = new Date(travelDate);
    travelDateText = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  
  // Map travel style values to descriptions
  let travelStyleText;
  switch(travelStyle) {
    case 'nature':
      travelStyleText = 'Nature Lover: I enjoy visiting mountain and lakeside viewpoints for beautiful landscapes.';
      break;
    case 'activity':
      travelStyleText = 'Hiking Mania: I enjoy hiking trails.';
      break;
    case 'balanced':
      travelStyleText = 'Primarily Nature with Some Cultural Stops: I prefer focusing on natural landscapes, but would also enjoy including a couple of city tours and art museum visits during the entire trip.';
      break;
    default:
      travelStyleText = travelStyle;
  }
  
  return `Create a detailed Swiss travel itinerary for a ${duration}-day trip from ${startingCity} to ${endingCity}.

User's request: "${prompt}"

Additional details:
- Starting city: ${startingCity}
- Ending city: ${endingCity}
- Travel style: ${travelStyleText}
${travelDateText ? `- Travel date: ${travelDateText}` : ''}
- Traveling as: ${groupType}

Please provide a comprehensive travel plan that includes:
1. An overview of the trip with a catchy title
2. A day-by-day itinerary with:
   - City to sleep each day
   - Main attractions/activities with brief descriptions
   - Estimated times for activities
3. Practical tips specific to the itinerary

Please only select from the following cities: [Grindelwald, Interlaken, Lauterbrunnen, Wengen, Luzern, Zermatt, Zurich, Basel, Bern, Spiez, Murren, Lausanne, Geneva, Vevey, Montreux, Adelboden, St Moritz, Chur, Lugano]

IMPORTANT: Check if the starting city (${startingCity}) and ending city (${endingCity}) are valid destinations. 
- For starting cities, valid options are: Zurich Flughafen, Geneva Aeroport, Basel SBB, Paris, Milano, Frankfurt
- For ending cities, valid options are: Zurich Flughafen, Geneva Aeroport, Basel SBB, Paris, Milano, Frankfurt
If starting or ending cities are not in the valid lists, please use Zurich Flughafen as default.

While following the user's requests as closely as possible, please consider these additional guidelines:
- Prioritize longer stays (2-3 nights) in Interlaken and Grindelwald
- Luzern and Zermatt are also excellent choices for overnight stays
- User prefer to stay at cities rather than Starting, Ending Cities.
- Instead of changing accommodations daily, aim for stays of 2-3 nights in each location to minimize repacking and provide a more relaxed experience
- For transportation between cities, please use the exact station names as follows:
  * For cities: 'Grindelwald', 'Interlaken Ost', 'Luzern', 'Zermatt', 'Zurich HB', 'Bern', 'Basel SBB', 'Lausanne', 'Lauterbrunnen', 'Wengen', 'Murren', 'St. Moritz', 'Geneva', 'Paris', 'Milano', 'Frankfurt' 

IMPORTANT: Write all descriptions, tips, and explanations in Korean language, but keep all city names, and transportation station names in English.

Format the response as a JSON object with the following structure:
{
  "title": "Catchy title for the trip",
  "description": "Brief overview of the trip in Korean",
  "startingCity": "${startingCity}",
  "endingCity": "${endingCity}",
  "days": [
    {
      "day": 1,
      "title": "Day title in Korean (e.g., '취리히 시내 투어, 그린델발트 숙박')",
      "description": "Brief description of the day in Korean",
      "accommodation": "city name in English", // should select in the list [Grindelwald, Interlaken, Lauterbrunnen, Wengen, Luzern, Zermatt, Zurich, Basel SBB, Bern, Spiez, Murren, Lausanne, Geneva, Vevey, Montreux, Adelboden, St Moritz, Chur, Lugano]
      // last day will be Null
      "activities": [
        {
          "duration": "1h 30m", // in hours and minutes
          "title": "Activity title in Korean",
          "description": "Activity description in Korean",
          "location": "Name of the location in English",
          "lat": 47.3769,
          "lng": 8.5417
        }
      ]
      "recommendations": "Daily recommendations and tips in Korean"
    }
  ],
  
}`;
}

// Asynchronous function to generate the travel plan
async function generateTravelPlan(planId, prompt) {
  try {
    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert travel planner with deep knowledge of European geography, attractions, transportation systems, and culture. Your task is to create detailed, personalized travel itineraries for trips between major European cities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    const travelPlan = JSON.parse(responseContent);

    // In/Out 정보 추가
    if (travelPlan.days && travelPlan.days.length > 0) {
      // 첫째 날: In은 Starting City, Out은 첫날 숙소
      travelPlan.days[0].In = travelPlan.startingCity;
      travelPlan.days[0].Out = travelPlan.days[0].accommodation;
      
      // 중간 날짜들: In은 전날 숙소, Out은 당일 숙소
      for (let i = 1; i < travelPlan.days.length - 1; i++) {
        travelPlan.days[i].In = travelPlan.days[i-1].accommodation;
        travelPlan.days[i].Out = travelPlan.days[i].accommodation;
      }
      
      // 마지막 날: In은 전날 숙소, Out은 Ending City
      const lastIndex = travelPlan.days.length - 1;
      if (lastIndex > 0) {
        travelPlan.days[lastIndex].In = travelPlan.days[lastIndex-1].accommodation;
        travelPlan.days[lastIndex].Out = travelPlan.endingCity;
      }
    }

    // 기존 요금 계산 로직 대신 새로운 함수 사용
    const travelCostInfo = calculateTotalTravelCost(travelPlan.days);
    
    // 예산 정보가 없으면 새로 생성
    if (!travelPlan.budgetBreakdown) {
      travelPlan.budgetBreakdown = {};
    }
    
    // 교통 예산 정보 추가
    travelPlan.budgetBreakdown.transportation = 
      `약 CHF ${travelCostInfo.totalCost} (2등석 기준, ${travelCostInfo.segments}개 구간)`;
    
    // 전체 예산 계산 및 추가
    if (travelPlan.budgetBreakdown.accommodation && travelPlan.budgetBreakdown.food && travelPlan.budgetBreakdown.activities) {
      travelPlan.budgetBreakdown.total = "상세 항목의 합계를 참고하세요";
    }
    
    // 개별 교통 요금 정보 추가
    travelPlan.transportationDetails = travelCostInfo;
    

 
    
    // console.log('Generated Travel Plan:', JSON.stringify(travelPlan, null, 2));
    
    // Update the document in Firestore with the complete travel plan
    await setDoc(doc(db, 'travelPlans', planId), {
      ...travelPlan,
      status: 'completed',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error in generateTravelPlan:', error);
    
    // Update the document with error status
    await setDoc(doc(db, 'travelPlans', planId), {
      status: 'error',
      errorMessage: error.message,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}
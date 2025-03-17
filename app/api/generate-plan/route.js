// app/api/generate-plan/route.js
import { NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './../../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import transportationData from './transportation.json'; // 교통 요금 데이터 임포트


// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 교통 요금 검색 함수
function findTransportationFare(from, to) {
  const route = transportationData.find(r => 
    r.Departure === from && r.Arrival === to
  );
  
  if (route) {
    return {
      firstClassPrice: route['1st Class Price'],
      secondClassPrice: route['2nd Class Price'],
      duration: route.Duration,
      transferCounts: route['Transfer Counts'] || 0,
      via: route.Via || []
    };
  }
  
  return null;
}

// 시간 문자열을 분으로 변환 (HH:MM 형식에서 분으로)
function durationToMinutes(durationStr) {
  if (!durationStr) return 0;
  
  const parts = durationStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  return (hours * 60) + minutes;
}

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
      travelStyleText = 'Scenic Viewpoints and Light Hiking: I enjoy visiting mountain and lakeside viewpoints for beautiful landscapes, and I am comfortable with occasional short, easy hikes.';
      break;
    case 'activity':
      travelStyleText = 'Hiking and Adventure Activities: I enjoy hiking trails and would like the itinerary to include adventure activities like paragliding.';
      break;
    case 'balanced':
      travelStyleText = 'Primarily Nature with Some Cultural Stops: I prefer focusing on natural landscapes, but would also enjoy including a couple of city tours and art museum visits during the entire trip.';
      break;
    default:
      travelStyleText = travelStyle;
  }
  
  return `Create a detailed travel itinerary for a ${duration}-day trip from ${startingCity} to ${endingCity}.

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
   - Cities/locations to visit each day
   - Main attractions/activities with brief descriptions
   - Suggested accommodations
   - Transportation between locations
   - Estimated times for activities
   - Food recommendations
3. Practical tips specific to the itinerary

For accommodations, please only select from the following locations: [Grindelwald, Interlaken, Lauterbrunnen, Wengen, Luzern, Zermatt, Zurich, Basel, Bern, Spiez, Murren, Lausanne, Geneva, Vevey, Montreux, Adelboden, St Moritz, Chur, Lugano]

While following the user's requests as closely as possible, please consider these additional guidelines:
- Prioritize longer stays (2-3 nights) in Interlaken and Grindelwald
- Luzern and Zermatt are also excellent choices for overnight stays
- Airport-adjacent accommodations are acceptable when necessary, but ideally plan to travel to a different destination on the first day
- Instead of changing accommodations daily, aim for stays of 2-3 nights in each location to minimize repacking and provide a more relaxed experience
- For transportation between cities, please use the exact station names as follows:
  * For main cities: 'Zurich HB', 'Bern', 'Luzern', 'Interlaken Ost', 'Basel SBB', 'Lausanne'
  * For town cities: 'Grindelwald', 'Lauterbrunnen', 'Wengen', 'Murren', 'Zermatt', 'St. Moritz'
  * For airport cities: 'Zurich Flughafen', 'Geneva Aeroport'
- Be specific with transportation types: use 'train' for mainline rail services, 'cable car' for mountain transport, 'bus' for road services

IMPORTANT: Write all descriptions, tips, and explanations in Korean language, but keep all location names, hotel names, restaurant names, and transportation station names in English.

Format the response as a JSON object with the following structure:
{
  "title": "Catchy title for the trip",
  "description": "Brief overview of the trip in Korean",
  "totalDuration": "${duration}",
  "startingCity": "${startingCity}",
  "endingCity": "${endingCity}",
  "travelStyle": "${travelStyle}",
  "locations": [
    {
      "name": "Location name in English",
      "type": "city", // city, attraction, restaurant, etc.
      "lat": 46.123, // latitude 
      "lng": 7.456, // longitude
      "description": "Brief description in Korean",
      "address": "Address (keep this in original format)",
      "duration": "120", // in minutes
      "startTime": "09:00", // 24h format
      "tip": "Useful tip for this location in Korean",
      "url": "Official website URL",
      "googleMapsUrl": "Google Maps URL"
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "Day title in Korean (e.g., '취리히 탐험')",
      "description": "Brief description of the day in Korean",
      "accommodation": "Hotel name in English and brief details in Korean",
      "activities": [
        {
          "time": "09:00",
          "duration": 120, // in minutes
          "title": "Activity title in Korean",
          "description": "Activity description in Korean",
          "location": "Name of the location in English"
        }
      ],
      "meals": [
        {
          "type": "breakfast", // breakfast, lunch, dinner
          "suggestion": "Meal suggestion in Korean",
          "location": "Restaurant name in English if applicable"
        }
      ],
      "transportation": [
        {
          "from": "Location A", // 정확한 역 이름을 사용하세요 (예: "Interlaken Ost", "Zurich HB")
          "to": "Location B", // 정확한 역 이름을 사용하세요
          "type": "train", // train, bus, cable car, etc.
          "duration": 60, // in minutes
          "details": "Additional details in Korean"
        }
      ]
    }
  ],
  "recommendations": "General recommendations and tips in Korean"
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

    // 데이터베이스에 저장할 찾을 수 없는 구간 정보
    const missingRoutes = [];

    // 교통 요금 정보 추가
    if (travelPlan.days) {
      travelPlan.days.forEach(day => {
        if (day.transportation) {
          day.transportation = day.transportation.map(transport => {
            // 기차인 경우에만 요금 정보 추가
            if (transport.type.toLowerCase() === 'train') {
              const fareInfo = findTransportationFare(transport.from, transport.to);
              
              if (fareInfo) {
                // transportation.json에서 가져온 duration 값으로 업데이트
                const durationMinutes = durationToMinutes(fareInfo.duration);
                return {
                  ...transport,
                  duration: durationMinutes, // 분 단위로 업데이트
                  fareInfo
                };
              } else {
                // 찾을 수 없는 경로 기록
                missingRoutes.push({
                  day: day.day,
                  from: transport.from,
                  to: transport.to,
                  type: transport.type
                });
              }
            }
            
            return transport;
          });
        }
      });
    }

    // 예산 정보 추가 (개별 요금 정보 포함)
    let totalTransportCost = 0;
    let transportSegments = 0;
    const fareDetails = [];
    
    travelPlan.days.forEach(day => {
      if (day.transportation) {
        day.transportation.forEach(transport => {
          if (transport.fareInfo) {
            totalTransportCost += transport.fareInfo.secondClassPrice;
            transportSegments++;
            
            // 개별 요금 정보 추가
            fareDetails.push({
              day: day.day,
              from: transport.from,
              to: transport.to,
              price: transport.fareInfo.secondClassPrice,
              duration: transport.fareInfo.duration
            });
          }
        });
      }
    });
    
    // 예산 정보가 있으면 교통 비용 추가
    if (!travelPlan.budgetBreakdown) {
      // 예산 정보가 없으면 새로 생성
      travelPlan.budgetBreakdown = {};
    }
    
    // 교통 예산 정보 추가
    travelPlan.budgetBreakdown.transportation = `약 CHF ${totalTransportCost.toFixed(2)} (2등석 기준, ${transportSegments}개 구간)`;
    
    // 전체 예산 계산 및 추가
    if (travelPlan.budgetBreakdown.accommodation && travelPlan.budgetBreakdown.food && travelPlan.budgetBreakdown.activities) {
      travelPlan.budgetBreakdown.total = "상세 항목의 합계를 참고하세요";
    }
    
    // 개별 교통 요금 정보 추가
    travelPlan.transportationDetails = {
      totalCost: totalTransportCost.toFixed(2),
      segments: transportSegments,
      fareDetails: fareDetails,
      missingRoutes: missingRoutes
    };
    
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
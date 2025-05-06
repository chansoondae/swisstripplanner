// app/planner/[id]/page.js
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import TravelPlanClient from './TravelPlanClient';
import LoadingFallback from './LoadingFallback';

// Metadata generation - use await on the entire params object
export async function generateMetadata({ params }) {
  // 전체 params 객체를 await
  const resolvedParams = await params;
  const planId = resolvedParams.id;
  
  // Since we can't use Firebase directly in metadata (it's client-side),
  // we'll use a simpler approach for metadata
  return {
    title: `여행 계획 | ${planId}`,
    description: '스위스 여행 계획 상세 정보',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://swissfrnd.com'),
    openGraph: {
      title: `여행 계획 | ${planId}`,
      description: '맞춤형 스위스 여행 일정과 정보',
      images: [
        {
          url: '/images/travelplan.jpg',
          width: 1200,
          height: 630,
          alt: '스위스 여행 계획',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `여행 계획 | ${planId}`,
      description: '맞춤형 스위스 여행 일정과 정보',
      images: ['/images/travelplan.jpg'],
    },
  };
}

// Create a separate component that will be wrapped in Suspense
function TravelPlanContent({ planId }) {
  if (!planId) {
    return notFound();
  }
  
  return <TravelPlanClient planId={planId} />;
}

// Main page component - use await on the entire params object
export default async function TravelPlanPage({ params }) {
  // 전체 params 객체를 await
  const resolvedParams = await params;
  const planId = resolvedParams.id;
  
  return (
    <Suspense fallback={<LoadingFallback message="여행 계획을 불러오는 중..." />}>
      <TravelPlanContent planId={planId} />
    </Suspense>
  );
}
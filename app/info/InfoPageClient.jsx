'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useAnalytics } from './../hooks/useAnalytics';

// 블로그 카드 컴포넌트 - 클릭 추적 추가
const BlogCard = ({ post, trackEvent }) => {
  const handleClick = () => {
    trackEvent(
      'select_content', 
      'engagement', 
      `블로그 포스트: ${post.title}`,
      post.id
    );
  };

  return (
    <Link 
      href={`/info/${post.slug}`} 
      key={post.id}
      className="block group"
      onClick={handleClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48">
          <Image 
            src={post.coverImage} 
            alt={post.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        </div>
        
        <div className="p-5">
          <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors duration-200">
            {post.title}
          </h2>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center">
            <span>{post.date instanceof Date ? post.date.toLocaleDateString('ko-KR') : new Date(post.date).toLocaleDateString('ko-KR')}</span>
            <span className="mx-2">•</span>
            <span>{post.readingTime}</span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
            {post.excerpt}
          </p>
        </div>
      </div>
    </Link>
  );
};

// 클라이언트 사이드 래퍼 컴포넌트
export default function InfoPageClient({ posts }) {
  const { trackPageView, trackEvent } = useAnalytics();
  
  // 페이지 로드 시 분석 이벤트 발생
  useEffect(() => {
    trackPageView('스위스 여행 정보 목록');
    
    // 컨텐츠 카테고리 인식 (컨텐츠 양 추적)
    trackEvent(
      'view_item_list', 
      'content', 
      '블로그 포스트 목록',
      posts.length
    );
  }, [trackPageView, trackEvent, posts.length]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">스위스 여행 정보</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard 
            key={post.id} 
            post={post} 
            trackEvent={trackEvent}
          />
        ))}
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAnalytics } from './../../hooks/useAnalytics';
import TravelHeader from '../../components/TravelHeader';
import MarkdownContent from '../../components/MarkdownContent';

export default function PostDetailClient({ post }) {
  const { trackPageView, trackEvent } = useAnalytics();
  
  useEffect(() => {
    if (post) {
      // 포스트 상세 페이지 조회 추적
      trackPageView(`블로그 포스트: ${post.title}`);
      
      // 포스트 카테고리 추적 (있는 경우)
      if (post?.categories && post.categories.length) {
        trackEvent('view_content_category', 'content', post.categories.join(', '));
      }
    }
  }, [post, trackPageView, trackEvent]);

  // post가 없거나 undefined인 경우 오류 페이지 표시
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-4">페이지를 찾을 수 없습니다</h1>
          <p className="mb-6">요청하신 블로그 포스트가 존재하지 않습니다.</p>
          <Link href="/info" className="text-blue-600 dark:text-blue-400 hover:underline">
            블로그 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <article className="travel-post-container">
      <TravelHeader 
        title={post.title}
        author={post.author}
        date={post.date instanceof Date ? post.date : new Date(post.date)}
        lastmod={post.lastmod instanceof Date ? post.lastmod : new Date(post.lastmod)}
        readingTime={post.readingTime}
      />
      
      <div className="relative w-full h-[500px] mb-8">
        <Image 
          src={post.coverImage} 
          alt={post.title} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-lg"
          priority
        />
      </div>
      
      <div className="travel-post-content">
        <MarkdownContent content={post.htmlContent} />
      </div>
      
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link 
          href="/info" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => trackEvent('click', 'navigation', '블로그 목록으로 돌아가기')}
        >
          ← 블로그 목록으로 돌아가기
        </Link>
      </div>
    </article>
  );
}
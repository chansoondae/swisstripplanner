// app/info/[slug]/page.js
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlugAdmin, getAllBlogSlugsAdmin } from '../../../lib/firebase-blog-admin';
import PostDetailClient from './PostDetailClient';

// 스타일 불러오기
import './../../../styles/travel-post.css';

// 정적 경로 생성
export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugsAdmin();
    return slugs;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// 페이지 메타데이터 생성
export async function generateMetadata({ params }) {
  // params가 Promise인 경우 await로 처리
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  try {
    const post = await getBlogPostBySlugAdmin(slug);
    
    if (!post) {
      return {
        title: '페이지를 찾을 수 없습니다',
        description: '요청하신 콘텐츠가 존재하지 않습니다.',
      };
    }
    
    return {
      title: post.title,
      description: post.excerpt || `${post.title} - 스위스 여행 정보`,
      openGraph: {
        title: post.title,
        description: post.excerpt || `${post.title} - 스위스 여행 정보`,
        images: post.coverImage ? [
          {
            url: post.coverImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ] : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '오류가 발생했습니다',
      description: '페이지를 로드하는 중 문제가 발생했습니다.',
    };
  }
}

export default async function Post({ params }) {
  try {
    // params가 Promise인 경우 await로 처리
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    if (!slug) {
      console.error('슬러그 파라미터가 없습니다.');
      return notFound();
    }
    
    const post = await getBlogPostBySlugAdmin(slug);
    
    if (!post) {
      console.log(`'${slug}' 슬러그의 블로그 포스트를 찾을 수 없습니다.`);
      return <PostDetailClient post={null} />;
    }
    
    return <PostDetailClient post={post} />;
  } catch (error) {
    console.error('페이지 렌더링 오류:', error);
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
          <p className="mb-6">페이지를 로드하는 중 문제가 발생했습니다.</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {process.env.NODE_ENV === 'development' ? error.message : '잠시 후 다시 시도해 주세요.'}
          </p>
          <Link href="/info" className="text-blue-600 dark:text-blue-400 hover:underline">
            블로그 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }
}
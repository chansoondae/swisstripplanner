// app/info/page.js
import Link from 'next/link';
import Image from 'next/image';
import { getAllBlogPostsAdmin } from '../../lib/firebase-blog-admin';

// 스타일 불러오기
import '../../styles/travel-post.css';

export const metadata = {
  title: '스위스 여행 정보',
  description: '스위스 여행에 관한 다양한 정보와 팁을 제공합니다.',
};

export default async function AboutPage() {
  // Admin SDK를 사용하여 서버에서 직접 블로그 포스트 목록 가져오기
  const posts = await getAllBlogPostsAdmin();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">스위스 여행 정보</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link 
            href={`/info/${post.slug}`} 
            key={post.id}
            className="block group"
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
        ))}
      </div>
    </div>
  );
}
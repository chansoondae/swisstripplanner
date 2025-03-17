import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';

// 스타일 불러오기
import '../../styles/travel-post.css';

// 마크다운 파일 경로
const postsDirectory = path.join(process.cwd(), 'data');

export const metadata = {
  title: '스위스 여행 정보',
  description: '스위스 여행에 관한 다양한 정보와 팁을 제공합니다.',
};

export default function AboutPage() {
  // 마크다운 파일 목록 불러오기
  const fileNames = fs.readdirSync(postsDirectory);
  console.log('Metadata List file path:', postsDirectory);
  
  // 각 파일의 메타데이터 추출
  const posts = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    console.log('file path file path:', filePath);
    return {
      id,
      ...data,
    };
  });
  
  // 날짜 기준으로 정렬
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">스위스 여행 정보</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link 
            href={`/info/${post.id}`} 
            key={post.id}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-200">
                  {post.title}
                </h2>
                
                <div className="text-sm text-gray-500 mb-3 flex items-center">
                  <span>{new Date(post.date).toLocaleDateString('ko-KR')}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readingTime}</span>
                </div>
                
                <p className="text-gray-600 line-clamp-3">
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
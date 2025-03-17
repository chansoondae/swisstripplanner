// app/about/[id]/page.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import Image from 'next/image';
import TravelHeader from '../../components/TravelHeader';
import MarkdownContent from '../../components/MarkdownContent';

// 스타일 불러오기
import './../../../styles/travel-post.css';


// marked 설정
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    headerPrefix: 'heading-',
    mangle: false,
    sanitize: false
  });

// 마크다운 파일 경로
const postsDirectory = path.join(process.cwd(), 'data');

// 마크다운 파일 목록 불러오기
export async function generateStaticParams() {
  try {
    // 디렉토리가 존재하는지 확인
    if (!fs.existsSync(postsDirectory)) {
        console.error(`Data directory does not exist: ${postsDirectory}`);
        fs.mkdirSync(postsDirectory, { recursive: true });
        return [];
    }
          
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames.map((fileName) => ({
      id: fileName.replace(/\.md$/, ''),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// 페이지 메타데이터 생성
export async function generateMetadata({ params }) {
  // params가 Promise인 경우 await 처리
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const filePath = path.join(postsDirectory, `${id}.md`);

    // 디버깅 로그 추가
    console.log('Generating metadata for ID:', id);
    console.log('Metadata file path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
  
  // 파일이 존재하지 않으면 404
  if (!fs.existsSync(filePath)) {
    console.error(`File not found for metadata: ${filePath}`);
    return notFound();
  }
  
  const fileContents = fs.readFileSync(filePath, 'utf8');
  console.log('File contents loaded successfully');

  const { data } = matter(fileContents);
  console.log('Metadata parsed:', data);
  
  return {
    title: data.title,
    description: data.excerpt,
    openGraph: {
      title: data.title,
      description: data.excerpt,
      images: [
        {
          url: data.coverImage,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
    },
  };
}




// 마크다운 내의 이미지 처리를 위한 커스텀 MDX 컴포넌트
const components = {
  img: ({ src, alt }) => (
    <div className="my-6">
      <Image 
        src={src} 
        alt={alt || "여행 이미지"} 
        width={966} 
        height={645} 
        className="rounded-lg w-full" 
        priority={false}
      />
      {alt && <p className="text-sm text-center text-gray-600 mt-2">{alt}</p>}
    </div>
  ),
};

export default async function Post({ params }) {
    try {
      const id = params.id;
      const filePath = path.join(postsDirectory, `${id}.md`);
      
      if (!fs.existsSync(filePath)) {
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
            <p>요청하신 콘텐츠가 존재하지 않습니다.</p>
          </div>
        );
      }
      
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      // 마크다운을 HTML로 변환
      const htmlContent = marked(content);
      
      return (
        <article className="travel-post-container">
          <TravelHeader 
            title={data.title}
            author={data.author}
            date={data.date}
            lastmod={data.lastmod}
            readingTime={data.readingTime}
          />
          
          <div className="relative w-full h-[500px] mb-8">
            <Image 
              src={data.coverImage} 
              alt={data.title} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
              priority
            />
          </div>
          
          <div className="travel-post-content">
            <MarkdownContent content={htmlContent} />
          </div>
        </article>
      );
    } catch (error) {
      console.error('페이지 렌더링 오류:', error);
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold">오류가 발생했습니다</h1>
          <p>페이지를 로드하는 중 문제가 발생했습니다.</p>
        </div>
      );
    }
  }
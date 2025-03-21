// app/info/page.js (서버 컴포넌트)
import { getAllBlogPostsAdmin } from '../../lib/firebase-blog-admin';
import InfoPageClient from './InfoPageClient';

// 스타일 불러오기
import '../../styles/travel-post.css';

export const metadata = {
  title: '스위스 여행 정보',
  description: '스위스 여행에 관한 다양한 정보와 팁을 제공합니다.',
};

export default async function AboutPage() {
  // Admin SDK를 사용하여 서버에서 직접 블로그 포스트 목록 가져오기
  const posts = await getAllBlogPostsAdmin();
  
  // 클라이언트 컴포넌트로 데이터 전달
  return <InfoPageClient posts={posts} />;
}
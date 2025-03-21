// app/api/blogs/route.js
import { NextResponse } from 'next/server';
import { 
  getAllBlogPostsAdmin, 
  getBlogPostBySlugAdmin,
  createBlogPostAdmin,
  updateBlogPostAdmin,
  deleteBlogPostAdmin
} from '../../../lib/firebase-blog-admin';

/**
 * 에러 응답 생성 헬퍼 함수
 */
function errorResponse(message, status = 500) {
  console.error(`API 오류 (${status}): ${message}`);
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * 권한 확인 함수
 */
async function checkAdminAuth(request) {
  // 여기서 실제 인증 확인 로직이 구현되어야 합니다
  // 현재는 개발 단계이므로 모든 요청을 허용합니다
  return true;
  
  // 아래는 실제 권한 확인 로직 예시입니다
  /*
  try {
    const session = await getSession(request);
    const adminEmails = ['your-admin-email@example.com']; // 환경 변수에서 불러오는 것이 더 안전
    
    if (!session || !session.user) {
      return false;
    }
    
    return adminEmails.includes(session.user.email);
  } catch (error) {
    console.error('권한 확인 오류:', error);
    return false;
  }
  */
}

// 모든 블로그 포스트 가져오기
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    // slug가 있으면 특정 포스트만 가져오기
    if (slug) {
      const post = await getBlogPostBySlugAdmin(slug);
      
      if (!post) {
        return errorResponse('블로그 포스트를 찾을 수 없습니다', 404);
      }
      
      return NextResponse.json(post);
    }
    
    // 모든 포스트 가져오기
    const posts = await getAllBlogPostsAdmin();
    return NextResponse.json(posts);
  } catch (error) {
    return errorResponse(
      error.message || '블로그 데이터를 가져오는 중 오류가 발생했습니다'
    );
  }
}

// 블로그 포스트 생성
export async function POST(request) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminAuth(request);
    if (!isAdmin) {
      return errorResponse('인증에 실패했습니다. 관리자 권한이 필요합니다.', 403);
    }
    
    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return errorResponse('요청 본문을 파싱할 수 없습니다', 400);
    }
    
    const { markdownContent, slug } = body;
    
    if (!markdownContent) {
      return errorResponse('마크다운 콘텐츠가 필요합니다', 400);
    }
    
    if (!slug) {
      return errorResponse('포스트 슬러그가 필요합니다', 400);
    }
    
    // 슬러그 형식 검증 (영문, 숫자, 하이픈만 허용)
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return errorResponse('슬러그는 영문, 숫자, 하이픈(-)만 포함할 수 있습니다', 400);
    }
    
    const post = await createBlogPostAdmin(markdownContent, slug);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return errorResponse(
      error.message || '블로그 포스트를 생성하는 중 오류가 발생했습니다'
    );
  }
}

// 블로그 포스트 업데이트
export async function PUT(request) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminAuth(request);
    if (!isAdmin) {
      return errorResponse('인증에 실패했습니다. 관리자 권한이 필요합니다.', 403);
    }
    
    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return errorResponse('요청 본문을 파싱할 수 없습니다', 400);
    }
    
    const { markdownContent, slug } = body;
    
    if (!markdownContent || !slug) {
      return errorResponse('마크다운 콘텐츠와 슬러그가 필요합니다', 400);
    }
    
    const post = await updateBlogPostAdmin(slug, markdownContent);
    return NextResponse.json(post);
  } catch (error) {
    return errorResponse(
      error.message || '블로그 포스트를 업데이트하는 중 오류가 발생했습니다'
    );
  }
}

// 블로그 포스트 삭제
export async function DELETE(request) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminAuth(request);
    if (!isAdmin) {
      return errorResponse('인증에 실패했습니다. 관리자 권한이 필요합니다.', 403);
    }
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return errorResponse('삭제할 포스트의 슬러그가 필요합니다', 400);
    }
    
    const result = await deleteBlogPostAdmin(slug);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(
      error.message || '블로그 포스트를 삭제하는 중 오류가 발생했습니다'
    );
  }
}
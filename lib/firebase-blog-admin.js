// lib/firebase-blog-admin.js
import { adminDb } from './firebaseAdmin';
import { marked } from 'marked';
import matter from 'gray-matter';

// Collection name
const BLOGS_COLLECTION = 'blogs';

/**
 * 모든 블로그 포스트 가져오기 (Admin SDK)
 * @returns {Promise<Array>} 블로그 포스트 배열
 */
export const getAllBlogPostsAdmin = async () => {
  try {
    // Firestore 연결 확인
    if (!adminDb) {
      console.error('Firestore 연결이 설정되지 않았습니다.');
      return [];
    }

    const blogsRef = adminDb.collection(BLOGS_COLLECTION);
    const snapshot = await blogsRef.orderBy('date', 'desc').get();
    
    const posts = [];
    snapshot.forEach((doc) => {
      if (doc.exists) {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          // Firestore Timestamp를 JavaScript Date로 변환
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          lastmod: data.lastmod?.toDate ? data.lastmod.toDate() : new Date(data.lastmod),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        });
      }
    });
    
    return posts;
  } catch (error) {
    console.error('Admin: 블로그 포스트 목록 조회 오류:', error);
    // 오류가 발생해도 빈 배열을 반환하여 애플리케이션이 충돌하지 않도록 함
    return [];
  }
};

/**
 * slug로 특정 블로그 포스트 가져오기 (Admin SDK)
 * @param {string} slug 블로그 포스트 슬러그
 * @returns {Promise<Object|null>} 블로그 포스트 객체 또는 null
 */
export const getBlogPostBySlugAdmin = async (slug) => {
  try {
    // 파라미터 검증
    if (!slug) {
      console.error('Admin: 유효하지 않은 slug 파라미터입니다.');
      return null;
    }

    // Firestore 연결 확인
    if (!adminDb) {
      console.error('Firestore 연결이 설정되지 않았습니다.');
      return null;
    }

    const blogsRef = adminDb.collection(BLOGS_COLLECTION);
    const snapshot = await blogsRef.where('slug', '==', slug).limit(1).get();
    
    if (snapshot.empty) {
      console.log(`Admin: '${slug}' 슬러그를 가진 블로그 포스트를 찾을 수 없습니다.`);
      return null;
    }
    
    const doc = snapshot.docs[0];
    if (!doc.exists) {
      console.log(`Admin: '${slug}' 문서가 존재하지만 데이터가 없습니다.`);
      return null;
    }

    const data = doc.data();
    
    // 필수 필드 확인
    if (!data) {
      console.log(`Admin: '${slug}' 문서 데이터가 비어 있습니다.`);
      return null;
    }
    
    // 날짜 형식 변환 시 안전 처리
    const safeToDate = (dateField) => {
      if (!dateField) return new Date();
      return dateField.toDate ? dateField.toDate() : new Date(dateField);
    };
    
    return {
      id: doc.id,
      ...data,
      // 안전한 날짜 변환
      date: safeToDate(data.date),
      lastmod: safeToDate(data.lastmod),
      createdAt: safeToDate(data.createdAt),
      updatedAt: safeToDate(data.updatedAt),
      // 필수 필드 기본값 제공
      title: data.title || '제목 없음',
      content: data.content || '',
      htmlContent: data.htmlContent || '',
      excerpt: data.excerpt || '',
      author: data.author || '작성자 미상',
      coverImage: data.coverImage || '/images/default-cover.jpg',
      readingTime: data.readingTime || '1분',
    };
  } catch (error) {
    console.error(`Admin: '${slug}' 블로그 포스트 조회 오류:`, error);
    return null; // 오류 발생 시 null 반환
  }
};

/**
 * 블로그 포스트 생성 (Admin SDK)
 * @param {string} markdownContent 마크다운 콘텐츠
 * @param {string} slug 포스트 슬러그
 * @returns {Promise<Object>} 생성된 블로그 포스트
 */
export const createBlogPostAdmin = async (markdownContent, slug) => {
  try {
    // 입력 검증
    if (!markdownContent || !slug) {
      throw new Error('마크다운 콘텐츠와 슬러그는 필수입니다.');
    }

    // Firestore 연결 확인
    if (!adminDb) {
      throw new Error('Firestore 연결이 설정되지 않았습니다.');
    }

    const { data, content } = matter(markdownContent);
    
    // 필수 메타데이터 확인
    if (!data.title) {
      throw new Error('제목(title)은 필수 메타데이터입니다.');
    }
    
    // Firestore에 저장할 데이터 구조
    const blogData = {
      slug: slug,
      title: data.title || '',
      excerpt: data.excerpt || '',
      coverImage: data.coverImage || '',
      author: data.author || '',
      date: data.date ? new Date(data.date) : new Date(),
      lastmod: data.lastmod ? new Date(data.lastmod) : new Date(),
      readingTime: data.readingTime || '',
      content: content, // 마크다운 콘텐츠 본문
      htmlContent: marked(content), // HTML로 변환된 콘텐츠
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const blogsRef = adminDb.collection(BLOGS_COLLECTION);
    
    // 슬러그 중복 체크
    const existingDoc = await blogsRef.where('slug', '==', slug).limit(1).get();
    if (!existingDoc.empty) {
      throw new Error(`'${slug}' 슬러그를 가진 블로그 포스트가 이미 존재합니다.`);
    }
    
    const docRef = await blogsRef.add(blogData);
    return { id: docRef.id, ...blogData };
  } catch (error) {
    console.error('Admin: 블로그 포스트 생성 오류:', error);
    throw error;
  }
};

/**
 * 블로그 포스트 업데이트 (Admin SDK)
 * @param {string} slug 포스트 슬러그
 * @param {string} markdownContent 마크다운 콘텐츠
 * @returns {Promise<Object>} 업데이트된 블로그 포스트
 */
export const updateBlogPostAdmin = async (slug, markdownContent) => {
  try {
    // 입력 검증
    if (!markdownContent || !slug) {
      throw new Error('마크다운 콘텐츠와 슬러그는 필수입니다.');
    }

    // Firestore 연결 확인
    if (!adminDb) {
      throw new Error('Firestore 연결이 설정되지 않았습니다.');
    }

    const { data, content } = matter(markdownContent);
    
    const blogsRef = adminDb.collection(BLOGS_COLLECTION);
    
    // 기존 포스트 찾기
    const snapshot = await blogsRef.where('slug', '==', slug).limit(1).get();
    
    if (snapshot.empty) {
      throw new Error(`'${slug}' 블로그 포스트를 찾을 수 없습니다.`);
    }
    
    const docRef = snapshot.docs[0].ref;
    
    // 업데이트할 데이터
    const blogData = {
      title: data.title || '',
      excerpt: data.excerpt || '',
      coverImage: data.coverImage || '',
      author: data.author || '',
      date: data.date ? new Date(data.date) : new Date(),
      lastmod: data.lastmod ? new Date(data.lastmod) : new Date(),
      readingTime: data.readingTime || '',
      content: content,
      htmlContent: marked(content),
      updatedAt: new Date(),
    };
    
    await docRef.update(blogData);
    return { id: docRef.id, ...blogData };
  } catch (error) {
    console.error(`Admin: '${slug}' 블로그 포스트 업데이트 오류:`, error);
    throw error;
  }
};

/**
 * 블로그 포스트 삭제 (Admin SDK)
 * @param {string} slug 포스트 슬러그
 * @returns {Promise<Object>} 성공 여부
 */
export const deleteBlogPostAdmin = async (slug) => {
  try {
    // 입력 검증
    if (!slug) {
      throw new Error('삭제할 포스트의 슬러그는 필수입니다.');
    }

    // Firestore 연결 확인
    if (!adminDb) {
      throw new Error('Firestore 연결이 설정되지 않았습니다.');
    }

    const blogsRef = adminDb.collection(BLOGS_COLLECTION);
    
    // 포스트 찾기
    const snapshot = await blogsRef.where('slug', '==', slug).limit(1).get();
    
    if (snapshot.empty) {
      throw new Error(`'${slug}' 블로그 포스트를 찾을 수 없습니다.`);
    }
    
    const docRef = snapshot.docs[0].ref;
    await docRef.delete();
    
    return { success: true };
  } catch (error) {
    console.error(`Admin: '${slug}' 블로그 포스트 삭제 오류:`, error);
    throw error;
  }
};

/**
 * 블로그 포스트 슬러그 목록 가져오기 (Admin SDK)
 * @returns {Promise<Array>} 슬러그 배열
 */
export const getAllBlogSlugsAdmin = async () => {
  try {
    // Firestore 연결 확인
    if (!adminDb) {
      console.error('Firestore 연결이 설정되지 않았습니다.');
      return [];
    }

    const blogsRef = adminDb.collection(BLOGS_COLLECTION);
    const snapshot = await blogsRef.get();
    
    const slugs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.slug) {
        slugs.push({ slug: data.slug });
      }
    });
    
    return slugs;
  } catch (error) {
    console.error('Admin: 블로그 슬러그 목록 조회 오류:', error);
    return []; // 오류 발생 시 빈 배열 반환
  }
};
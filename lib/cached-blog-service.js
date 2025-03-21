// lib/cached-blog-service.js
import { cache } from 'react';
import { 
  getAllBlogPostsAdmin, 
  getBlogPostBySlugAdmin, 
  getAllBlogSlugsAdmin 
} from './firebase-blog-admin';

// 블로그 포스트 목록 캐싱 (15분)
export const getCachedBlogPosts = cache(async () => {
  console.log('블로그 포스트 목록 데이터 가져오기');
  return getAllBlogPostsAdmin();
});

// 특정 블로그 포스트 캐싱 (15분)
export const getCachedBlogPostBySlug = cache(async (slug) => {
  console.log(`'${slug}' 블로그 포스트 데이터 가져오기`);
  return getBlogPostBySlugAdmin(slug);
});

// 블로그 슬러그 목록 캐싱 (15분)
export const getCachedBlogSlugs = cache(async () => {
  console.log('블로그 슬러그 목록 데이터 가져오기');
  return getAllBlogSlugsAdmin();
});
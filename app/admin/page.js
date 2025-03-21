// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle, signOutUser } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [slug, setSlug] = useState('');
  const router = useRouter();
  
  // 인증 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // 블로그 포스트 목록 로드
  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);
  
  // 포스트 목록 가져오기 (API 사용)
  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blogs');
      
      if (!response.ok) {
        throw new Error('API 요청 실패');
      }
      
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('블로그 포스트 로드 오류:', error);
      alert('블로그 포스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 로그인 처리
  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };
  
  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      const result = await signOutUser();
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };
  
  // 새 포스트 작성 모드
  const handleNewPost = () => {
    setIsEditing(false);
    setCurrentPost(null);
    setMarkdownContent('---\ntitle: "새 포스트 제목"\nexcerpt: "새 포스트 요약"\ncoverImage: "/images/default-cover.jpg"\nauthor: "작성자"\ndate: "' + new Date().toISOString() + '"\nlastmod: "' + new Date().toISOString() + '"\nreadingTime: "5분"\n---\n\n# 새 포스트\n\n내용을 입력하세요.');
    setSlug('');
  };
  
  // 포스트 편집 모드 (API 사용)
  const handleEditPost = async (post) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blogs?slug=${post.slug}`);
      
      if (!response.ok) {
        throw new Error('포스트 상세 정보를 가져오는데 실패했습니다.');
      }
      
      const postData = await response.json();
      
      setIsEditing(true);
      setCurrentPost(postData);
      setMarkdownContent(
        `---
title: "${postData.title}"
excerpt: "${postData.excerpt}"
coverImage: "${postData.coverImage}"
author: "${postData.author}"
date: "${postData.date instanceof Date ? postData.date.toISOString() : new Date(postData.date).toISOString()}"
lastmod: "${new Date().toISOString()}"
readingTime: "${postData.readingTime}"
---

${postData.content}`
      );
      setSlug(postData.slug);
    } catch (error) {
      console.error('포스트 편집 정보 로드 오류:', error);
      alert('포스트 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 포스트 저장 (API 사용)
  const handleSavePost = async () => {
    try {
      if (!slug) {
        alert('슬러그(URL)를 입력해주세요.');
        return;
      }
      
      setLoading(true);
      
      const requestData = {
        markdownContent,
        slug
      };
      
      let response;
      
      if (isEditing) {
        // PUT 요청으로 업데이트
        response = await fetch('/api/blogs', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
      } else {
        // POST 요청으로 생성
        response = await fetch('/api/blogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '요청 처리 중 오류가 발생했습니다.');
      }
      
      alert(isEditing ? '포스트가 업데이트되었습니다.' : '새 포스트가 생성되었습니다.');
      
      // 목록 다시 로드
      await loadPosts();
      
      // 폼 초기화
      setIsEditing(false);
      setCurrentPost(null);
      setMarkdownContent('');
      setSlug('');
    } catch (error) {
      console.error('포스트 저장 오류:', error);
      alert(error.message || '포스트 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 포스트 삭제 (API 사용)
  const handleDeletePost = async (slug) => {
    if (!window.confirm('정말 이 포스트를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/blogs?slug=${slug}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '삭제 중 오류가 발생했습니다.');
      }
      
      alert('포스트가 삭제되었습니다.');
      await loadPosts();
    } catch (error) {
      console.error('포스트 삭제 오류:', error);
      alert(error.message || '포스트 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 포스트 미리보기
  const handlePreview = (slug) => {
    window.open(`/info/${slug}`, '_blank');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
      </div>
    );
  }
  
  // 로그인 상태가 아니면 로그인 화면 표시
  if (!user) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-6">관리자 로그인</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Google로 로그인
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">블로그 관리자</h1>
        <div className="flex items-center">
          <span className="mr-4">{user.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            로그아웃
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={handleNewPost}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          새 포스트 작성
        </button>
      </div>
      
      {(isEditing || (currentPost === null && markdownContent)) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">{isEditing ? '포스트 편집' : '새 포스트 작성'}</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              슬러그 (URL):
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 border rounded mt-1 dark:bg-gray-700 dark:border-gray-600"
                placeholder="post-url-slug"
              />
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              마크다운 콘텐츠:
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="w-full p-2 border rounded mt-1 font-mono dark:bg-gray-700 dark:border-gray-600"
                rows="20"
              />
            </label>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSavePost}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
            
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentPost(null);
                setMarkdownContent('');
                setSlug('');
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              취소
            </button>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-bold mt-8 mb-4">포스트 목록</h2>
      
      {posts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">등록된 포스트가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="py-2 px-4 text-left">제목</th>
                <th className="py-2 px-4 text-left">작성일</th>
                <th className="py-2 px-4 text-left">작성자</th>
                <th className="py-2 px-4 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t dark:border-gray-700">
                  <td className="py-2 px-4">{post.title}</td>
                  <td className="py-2 px-4">
                    {post.date instanceof Date
                      ? post.date.toLocaleDateString('ko-KR')
                      : new Date(post.date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-2 px-4">{post.author}</td>
                  <td className="py-2 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handlePreview(post.slug)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                      >
                        보기
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.slug)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
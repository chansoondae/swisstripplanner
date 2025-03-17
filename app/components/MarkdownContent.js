// components/MarkdownContent.js (클라이언트 컴포넌트)
'use client'

export default function MarkdownContent({ content }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
}
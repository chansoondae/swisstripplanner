import React from 'react';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

// 날짜 포매팅 함수
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
}

// TravelHeader 컴포넌트
const TravelHeader = ({ title, author, date, lastmod, readingTime }) => {
  return (
    <header className="travel-post-header">
      <h1 className="travel-post-title">{title}</h1>
      
      <div className="travel-post-meta">
        {author && (
          <>
            <div className="travel-post-meta-item">
              <FiUser />
              <span>{author}</span>
            </div>
            <span className="travel-post-separator"></span>
          </>
        )}
        
        {date && (
          <>
            <div className="travel-post-meta-item">
              <FiCalendar />
              <span>{formatDate(date)}</span>
            </div>
            <span className="travel-post-separator"></span>
          </>
        )}
        
        {readingTime && (
          <div className="travel-post-meta-item">
            <FiClock />
            <span>{readingTime}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TravelHeader;
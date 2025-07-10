'use client';

import { useState, useEffect } from 'react';

export default function CityWeatherScreen() {
    const [selectedCity, setSelectedCity] = useState("Grindelwald");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const cities = [
        { name: "Grindelwald", emoji: "🏔️" },
        { name: "Interlaken", emoji: "🏞️" },
        { name: "Luzern", emoji: "🏛️" },
        { name: "Zermatt", emoji: "⛷️" },
        { name: "Bern", emoji: "🏰" },
        { name: "Lausanne", emoji: "🌊" },
    ];

    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                const response = await fetch('/api/blogs?filter=weather');
                if (response.ok) {
                    const posts = await response.json();
                    setBlogPosts(posts);
                } else {
                    console.error('블로그 포스트 로딩 실패');
                }
            } catch (error) {
                console.error('블로그 포스트 로딩 오류:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPosts();
    }, []);

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    
    // 날씨 기반 추천 정보
    const weatherRecommendations = [
        {
            name: '피르스트',
            subtitle: 'Grindelwald First (피르스트)',
            time: '7월 11일 (금요일) 오전',
            image: 'https://images-webcams.windy.com/78/1477612878/current/thumbnail/1477612878.jpg',
            link: '/info/first',
            description: '케이블카 타고 올라야 하는 고지대이므로 맑은 하늘 + 시야 확보가 중요함. 11일 오전은 맑음 + 따뜻함, 날씨 완벽.',
            reason: '10일도 좋지만 오후에 안개 가능성 있음.',
            emoji: '🏞️'
        },
        {
            name: '융프라우요흐',
            subtitle: 'Jungfraujoch (유럽의 지붕)',
            time: '7월 10일 (목요일) 오전 ~ 정오',
            image: 'https://images-webcams.windy.com/97/1232543197/current/thumbnail/1232543197.jpg',
            link: '/info/jungfraujoch',
            description: '일찍 출발하면 유럽 최고봉 전망을 청명한 하늘 아래에서 볼 수 있음.',
            reason: '오후부터 흐림 시작이므로 오전 입장 필수. 융프라우는 고도와 날씨에 매우 민감함.',
            emoji: '🏔️'
        },
        {
            name: '멘리헨',
            subtitle: 'Männlichen (멘리헨 정상)',
            time: '7월 9일 (수요일) 오전',
            image: 'https://images-webcams.windy.com/17/1697035017/current/thumbnail/1697035017.jpg',
            link: '/info/mannlichen',
            description: '멘리헨은 피르스트보다 낮고 트레킹 뷰포인트 중심이라 약간 흐려도 무방',
            reason: '9일 오전은 맑고 선선, 걷기에 좋음. 오후 안개 가능성 있어 오전 하이킹 추천.',
            emoji: '🏞️'
        }
    ];

    // Firebase 블로그 포스트와 날씨 추천 정보 결합
    const recommendedPlaces = blogPosts.length > 0 
        ? blogPosts.map(post => {
            // slug에 따라 해당하는 날씨 추천 정보 찾기
            const weatherInfo = weatherRecommendations.find(rec => {
                if (post.slug === 'first') return rec.name === '피르스트';
                if (post.slug === 'jungfraujoch') return rec.name === '융프라우요흐';
                if (post.slug === 'mannlichen') return rec.name === '멘리헨';
                return false;
            });
            
            // 날씨 추천 정보가 있으면 그것을 사용하고, 없으면 기본 블로그 정보 사용
            if (weatherInfo) {
                return {
                    name: weatherInfo.name,
                    subtitle: weatherInfo.subtitle,
                    time: weatherInfo.time,
                    image: post.coverImage || weatherInfo.image, // Firebase 이미지 우선 사용
                    link: `/info/${post.slug}`,
                    description: weatherInfo.description,
                    reason: weatherInfo.reason,
                    emoji: weatherInfo.emoji
                };
            } else {
                return {
                    name: post.title,
                    subtitle: post.excerpt?.substring(0, 30) + '...' || '스위스 여행 정보',
                    time: '추천 시간', 
                    image: post.coverImage || '/images/default-cover.jpg',
                    link: `/info/${post.slug}`,
                    description: post.excerpt || '스위스 여행에 대한 상세한 정보를 확인해보세요.'
                };
            }
        })
        : weatherRecommendations;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-4 space-y-6">
        {/* 도시 선택 */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">📍 {selectedCity}</h1>
          <div className="relative dropdown-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl px-4 py-2 pr-3 text-sm font-medium text-gray-700 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md min-w-[140px]"
            >
              <span className="flex items-center">
                {cities.find(city => city.name === selectedCity)?.emoji} {selectedCity}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {cities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      setSelectedCity(city.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-150 hover:bg-blue-50 flex items-center ${
                      selectedCity === city.name 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <span className="mr-2">{city.emoji}</span>
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
  
        {/* 오늘의 날씨 요약 */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-gray-700">🌤️ 7월 10일 목요일 | 맑음</div>
          <div className="text-2xl font-bold mt-2">현재 14:00 | 18.3°C</div>
          <div className="text-sm text-gray-500 mt-1">최고 20.8°C / 최저 8.1°C</div>
        </div>
  
        {/* 시간대별 날씨 */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="font-semibold mb-2">시간대별 날씨</div>
          <div className="flex overflow-x-auto gap-4">
            {[
              { hour: '06시', icon: '☀️', temp: '8.1°C' },
              { hour: '09시', icon: '☀️', temp: '12.8°C' },
              { hour: '12시', icon: '☀️', temp: '17.9°C' },
              { hour: '15시', icon: '☁️', temp: '20.6°C' },
              { hour: '18시', icon: '🌫️', temp: '20.2°C' },
            ].map((t) => (
              <div key={t.hour} className="flex flex-col items-center min-w-[60px]">
                <div className="text-lg">{t.icon}</div>
                <div className="text-sm text-gray-600">{t.temp}</div>
                <div className="text-sm text-gray-400">{t.hour}</div>
              </div>
            ))}
          </div>
        </div>
  
        {/* 실시간 웹캠 */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <div className="font-semibold text-lg mb-4">🎥 실시간 웹캠</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { 
                title: 'Grindelwald First', 
                subtitle: '피르스트 산',
                thumbnail: 'https://images-webcams.windy.com/78/1477612878/current/thumbnail/1477612878.jpg', 
                url: 'https://en.swisswebcams.ch/webcam/zoom/1478217733-First-%280-Grindelwald%29_Weather',
                location: 'Grindelwald'
              },
              { 
                title: 'Jungfraujoch', 
                subtitle: '융프라우요흐',
                thumbnail: 'https://images-webcams.windy.com/97/1232543197/current/thumbnail/1232543197.jpg', 
                url: 'https://en.swisswebcams.ch/webcam/1437749556-Jungfraujoch-%280-Lauterbrunnen%29_Weather',
                location: 'Jungfrau'
              },
              { 
                title: 'Grindelwald Panorama', 
                subtitle: '360° 파노라마',
                thumbnail: 'https://images-webcams.windy.com/50/1697037350/current/thumbnail/1697037350.jpg', 
                url: 'https://en.swisswebcams.ch/webcam/1270296188-Hotel-Belvedere-360%C2%B0-Panorama-%280-Grindelwald%29_Weather',
                location: 'Grindelwald'
              },
            ].map((cam) => (
              <a 
                key={cam.title} 
                href={cam.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block group"
              >
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="relative">
                    <img 
                      src={cam.thumbnail} 
                      alt={cam.title} 
                      className="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="font-semibold text-sm">{cam.title}</div>
                      <div className="text-xs opacity-90">{cam.subtitle}</div>
                    </div>
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      LIVE
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{cam.location}</div>
                      <div className="flex items-center text-blue-600 text-xs">
                        <span>보기</span>
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
  
        {/* 추천 명소 */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="font-semibold text-lg mb-4">🏔️ 지금 가면 좋은 명소</div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">추천 명소를 불러오는 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedPlaces.map((place) => (
                <a key={place.name} href={place.link} className="block group">
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-48">
                      <img 
                        src={place.image} 
                        alt={place.name} 
                        className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300" 
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        추천
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors duration-200">
                        {place.name}
                      </h3>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {place.subtitle}
                        </div>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs font-medium">
                          <span className="mr-1">🕓</span>
                          {place.time}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {place.description}
                        </p>
                        {place.reason && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                              💡 추천 이유
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                              {place.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
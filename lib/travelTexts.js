// 도시별 기본 description 템플릿
const descriptionTemplates = [
  '{city}의 주요 명소를 방문합니다',
  '{city}에서 자유로운 여행을 즐깁니다',
  '{city}의 숨겨진 매력을 발견합니다',
  '{city}를 천천히 걸으며 도시의 분위기를 만끽합니다',
  '{city}의 아름다운 풍경을 감상합니다',
  '{city}의 다채로운 볼거리를 탐험합니다',
];

// 도시별 기본 recommendation 템플릿
const recommendationTemplates = [
  '{city}에서 즐길 수 있는 추천 명소와 경험',
  '{city}의 아름다운 자연과 문화를 경험해보세요',
  '{city} 주변의 산책로와 전망대를 방문해보세요',
  '{city}에서 현지 음식과 카페를 즐겨보세요',
  '{city}의 박물관과 역사적 명소를 둘러보세요',
  '{city} 근처의 추천 활동과 볼거리',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomDescription(city) {
  return pickRandom(descriptionTemplates).replace(/\{city\}/g, city);
}

export function getRandomRecommendation(city) {
  return pickRandom(recommendationTemplates).replace(/\{city\}/g, city);
}

// app/planner/[id]/loading.js
import LoadingFallback from './LoadingFallback';

export default function Loading() {
  return <LoadingFallback message="여행 계획을 불러오는 중..." />;
}
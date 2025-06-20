import { Suspense } from 'react';
import CalculatePage from './CalculateClient';

export default function Page() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <CalculatePage />
    </Suspense>
  );
}